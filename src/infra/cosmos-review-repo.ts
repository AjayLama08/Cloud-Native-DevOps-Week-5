import { CosmosClient } from '@azure/cosmos';
import type { Container } from '@azure/cosmos';
import { createReview } from '../domain/review';
import type { Review } from '../domain/review';
import type { ReviewRepo } from '../domain/review-repo';

export type CosmosReviewRepoOptions = {
  readonly endpoint: string;
  readonly key: string;
  readonly databaseId: string;
  readonly containerId: string;
};

/**
 * Cosmos stores dates as ISO strings and uses /id as the partition key for
 * this teaching example. SDK generic types do not validate returned data.
 */
export type CosmosReviewDocument = {
  readonly id: string;
  readonly rating: number;
  readonly title: string;
  readonly comment: string;
  readonly createdAt: string;
};

const optionNames = [
  'endpoint',
  'key',
  'databaseId',
  'containerId',
] as const;

export class CosmosReviewRepo implements ReviewRepo {
  private readonly container: Container;

  constructor(options: CosmosReviewRepoOptions) {
    validateOptions(options);

    const client = new CosmosClient({
      endpoint: options.endpoint,
      key: options.key,
    });
    this.container = client
      .database(options.databaseId)
      .container(options.containerId);
  }

  async getById(id: string): Promise<Review | null> {
    try {
      const response = await this.container.item(id, id).read();
      const resource: unknown = response.resource;
      return resource === undefined ? null : fromDocument(resource);
    } catch (error: unknown) {
      if (isNotFound(error)) return null;
      throw operationError('Failed to read review from Cosmos DB', error);
    }
  }

  /**
   * Loads the complete small teaching collection. Results have no ordering or
   * pagination guarantee.
   */
  async list(): Promise<readonly Review[]> {
    try {
      const response = await this.container.items
        .readAll<CosmosReviewDocument>()
        .fetchAll();
      const resources: readonly unknown[] = response.resources;
      return resources.map(fromDocument);
    } catch (error: unknown) {
      throw operationError('Failed to list reviews from Cosmos DB', error);
    }
  }

  async save(review: Review): Promise<Review> {
    try {
      const document = toDocument(review);
      const response = await this.container.items.upsert(document);
      const resource: unknown = response.resource;

      if (resource === undefined) {
        throw new Error('Cosmos DB upsert returned no review resource');
      }

      return fromDocument(resource);
    } catch (error: unknown) {
      throw operationError('Failed to save review to Cosmos DB', error);
    }
  }
}

function validateOptions(options: CosmosReviewRepoOptions): void {
  if (typeof options !== 'object' || options === null || Array.isArray(options)) {
    throw new Error('CosmosReviewRepo requires an options object');
  }

  const invalidOptions = optionNames.filter(
    (name) =>
      typeof options[name] !== 'string' || options[name].trim().length === 0
  );

  if (invalidOptions.length > 0) {
    throw new Error(
      `CosmosReviewRepo requires non-empty options: ${invalidOptions.join(', ')}`
    );
  }
}

function isNotFound(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;

  const code = 'code' in error ? error.code : undefined;
  const statusCode = 'statusCode' in error ? error.statusCode : undefined;
  return code === 404 || statusCode === 404;
}

function operationError(message: string, cause: unknown): Error {
  return new Error(message, { cause });
}

function toDocument(review: Review): CosmosReviewDocument {
  const result = createReview(review);
  if (!result.success) {
    const fields = result.issues.map((issue) => issue.field).join(', ');
    throw new Error(`Cannot persist invalid review fields: ${fields}`);
  }

  return {
    id: result.data.id,
    rating: result.data.rating,
    title: result.data.title,
    comment: result.data.comment,
    createdAt: result.data.createdAt.toISOString(),
  };
}

function fromDocument(document: unknown): Review {
  if (
    typeof document !== 'object' ||
    document === null ||
    Array.isArray(document)
  ) {
    throw new Error('Cosmos DB returned an invalid review document');
  }

  if (
    !('id' in document) ||
    typeof document.id !== 'string' ||
    !('rating' in document) ||
    typeof document.rating !== 'number' ||
    !('title' in document) ||
    typeof document.title !== 'string' ||
    !('comment' in document) ||
    typeof document.comment !== 'string' ||
    !('createdAt' in document) ||
    typeof document.createdAt !== 'string'
  ) {
    throw new Error('Cosmos DB returned invalid review field types');
  }

  const result = createReview({
    id: document.id,
    rating: document.rating,
    title: document.title,
    comment: document.comment,
    createdAt: new Date(document.createdAt),
  });

  if (!result.success) {
    const fields = result.issues.map((issue) => issue.field).join(', ');
    throw new Error(`Cosmos DB returned invalid review fields: ${fields}`);
  }

  return result.data;
}
