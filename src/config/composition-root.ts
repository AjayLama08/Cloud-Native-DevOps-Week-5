import { CosmosReviewRepo } from '../infra/cosmos-review-repo';
import type { CosmosReviewRepoOptions } from '../infra/cosmos-review-repo';

import type { AddReviewDeps } from '../app/add-review';
import type { ListReviewsDeps } from '../app/list-reviews';
import type { ReviewRepo } from '../domain/review-repo';

// These non-secret values remain hard-coded for the Part C student exercise.
const COSMOS_OPTIONS: Omit<CosmosReviewRepoOptions, 'key'> = {
  endpoint: 'https://reviews-lab-ab47-cosmos-uksouth.documents.azure.com:443/',
  databaseId: 'reviews-db',
  containerId: 'reviews',
};

// Keep command-line target summaries free from credentials.
export const getCosmosTarget = () => ({ ...COSMOS_OPTIONS });

let cachedReviewRepo: ReviewRepo | null = null;

// Importing the composition root must not require configuration or create a client.
export function getReviewRepo(): ReviewRepo {
  if (!cachedReviewRepo) {
    const key = process.env.COSMOS_KEY;
    if (!key || key.trim() === '') {
      throw new Error(
        'COSMOS_KEY must be set to a non-empty Cosmos DB account key.'
      );
    }

    cachedReviewRepo = new CosmosReviewRepo({ ...COSMOS_OPTIONS, key });
  }
  return cachedReviewRepo;
}

export function createAddReviewDeps(): AddReviewDeps {
  return {
    reviewRepo: getReviewRepo(),
    generateId: () => crypto.randomUUID(),
    now: () => new Date(),
  };
}

export function createListReviewsDeps(): ListReviewsDeps {
  return {
    reviewRepo: getReviewRepo(),
  };
}
