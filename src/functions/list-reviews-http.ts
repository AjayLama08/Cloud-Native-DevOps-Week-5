import { app } from '@azure/functions';
import type {
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from '@azure/functions';
import { listReviews } from '../app/list-reviews';
import type { Review } from '../domain/review';
import { createListReviewsDeps } from '../config/composition-root';

type ReviewDto = {
  readonly id: string;
  readonly rating: number;
  readonly title: string;
  readonly comment: string;
  readonly createdAt: string;
};

type ListReviewsStage =
  | 'dependency-construction'
  | 'use-case-execution'
  | 'response-mapping';

async function listReviewsHttp(
  _request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  let stage: ListReviewsStage = 'dependency-construction';

  try {
    const deps = createListReviewsDeps();

    stage = 'use-case-execution';
    const result = await listReviews(deps);

    stage = 'response-mapping';
    const reviews = result.data.map(toReviewDto);
    return {
      status: 200,
      jsonBody: { reviews, totalCount: reviews.length },
    };
  } catch {
    context.error('Review API request failed', {
      operation: 'list-reviews',
      stage,
      category: 'unexpected',
    });
    return { status: 500, jsonBody: { error: 'Internal server error' } };
  }
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

app.http('listReviewsHttp', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'reviews',
  handler: listReviewsHttp,
});
