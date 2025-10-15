import type { Review } from '../domain/review';
import type { ReviewRepo } from '../domain/review-repo';

export class FakeReviewRepo implements ReviewRepo {
  private readonly reviews = new Map<string, Review>();

  constructor(initialReviews: readonly Review[] = []) {
    for (const review of initialReviews) {
      this.reviews.set(review.id, cloneReview(review));
    }
  }

  async getById(id: string): Promise<Review | null> {
    const review = this.reviews.get(id);
    return review === undefined ? null : cloneReview(review);
  }

  async list(): Promise<readonly Review[]> {
    return [...this.reviews.values()].map(cloneReview);
  }

  async save(review: Review): Promise<Review> {
    const stored = cloneReview(review);
    this.reviews.set(stored.id, stored);
    return cloneReview(stored);
  }
}

function cloneReview(review: Review): Review {
  return {
    ...review,
    createdAt: new Date(review.createdAt.getTime()),
  };
}
