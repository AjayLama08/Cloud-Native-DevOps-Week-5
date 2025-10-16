import { app } from '@azure/functions';
import type {
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from '@azure/functions';
import { addReview } from '../app/add-review';
import type { AddReviewCommand } from '../app/add-review';
import type { Review } from '../domain/review';
import { createAddReviewDeps } from '../config/composition-root';

type RequestIssue = {
  readonly field: 'body' | 'rating' | 'title' | 'comment';
  readonly message: string;
};

type ParseCommandResult =
  | { readonly success: true; readonly data: AddReviewCommand }
  | { readonly success: false; readonly issues: readonly RequestIssue[] };

type ReviewDto = {
  readonly id: string;
  readonly rating: number;
  readonly title: string;
  readonly comment: string;
  readonly createdAt: string;
};

type AddReviewStage =
  | 'request-parsing'
  | 'dependency-construction'
  | 'use-case-execution'
  | 'response-mapping';

async function addReviewHttp(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  let stage: AddReviewStage = 'request-parsing';

  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return badRequest([
        { field: 'body', message: 'Request body must contain valid JSON' },
      ]);
    }

    const parsed = parseCommand(body);
    if (!parsed.success) return badRequest(parsed.issues);

    stage = 'dependency-construction';
    const deps = createAddReviewDeps();

    stage = 'use-case-execution';
    const result = await addReview(deps, parsed.data);
    if (!result.success) return badRequest(result.issues);

    stage = 'response-mapping';
    return {
      status: 201,
      jsonBody: { review: toReviewDto(result.data) },
    };
  } catch {
    context.error('Review API request failed', {
      operation: 'add-review',
      stage,
      category: 'unexpected',
    });
    return internalServerError();
  }
}

function parseCommand(body: unknown): ParseCommandResult {
  if (!isRecord(body)) {
    return {
      success: false,
      issues: [{ field: 'body', message: 'Request body must be a JSON object' }],
    };
  }

  const issues: RequestIssue[] = [];
  let rating: number | undefined;
  let title: string | undefined;
  let comment: string | undefined;

  if (typeof body.rating === 'number') {
    rating = body.rating;
  } else {
    issues.push({ field: 'rating', message: 'Rating must be a number' });
  }

  if (typeof body.title === 'string') {
    title = body.title;
  } else {
    issues.push({ field: 'title', message: 'Title must be a string' });
  }

  if (typeof body.comment === 'string') {
    comment = body.comment;
  } else {
    issues.push({ field: 'comment', message: 'Comment must be a string' });
  }

  if (rating === undefined || title === undefined || comment === undefined) {
    return { success: false, issues };
  }

  return { success: true, data: { rating, title, comment } };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toReviewDto(review: Review): ReviewDto {
  return {
    id: review.id,
    rating: review.rating,
    title: review.title,
    comment: review.comment,
    createdAt: review.createdAt.toISOString(),
  };
}

function badRequest(
  issues: readonly { readonly field: string; readonly message: string }[]
): HttpResponseInit {
  return { status: 400, jsonBody: { issues } };
}

function internalServerError(): HttpResponseInit {
  return { status: 500, jsonBody: { error: 'Internal server error' } };
}

app.http('addReviewHttp', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'reviews',
  handler: addReviewHttp,
});
