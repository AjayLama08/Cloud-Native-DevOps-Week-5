import type { Review } from '../domain/review';
import type { ReviewRepo } from '../domain/review-repo';

export type ListReviewsResult = {
  readonly success: true;
  readonly data: readonly Review[];
};

export type ListReviewsDeps = {
  readonly reviewRepo: ReviewRepo;
};

export async function listReviews(
  deps: ListReviewsDeps
): Promise<ListReviewsResult> {
  const reviews = await deps.reviewRepo.list();
  return { success: true, data: reviews };
}
