import type { Review } from './review';

/**
 * Persistence contract for reviews. Save is an unconditional upsert;
 * concurrency protection is not part of this teaching example.
 */
export interface ReviewRepo {
  getById(id: string): Promise<Review | null>;
  list(): Promise<readonly Review[]>;
  save(review: Review): Promise<Review>;
}
