import { createReview } from '../domain/review';
import type {
  Review,
  ReviewContent,
  ReviewValidationIssue,
} from '../domain/review';
import type { ReviewRepo } from '../domain/review-repo';

export type AddReviewCommand = ReviewContent;

export type AddReviewResult =
  | { readonly success: true; readonly data: Review }
  | {
      readonly success: false;
      readonly issues: readonly ReviewValidationIssue[];
    };

export type AddReviewDeps = {
  readonly reviewRepo: ReviewRepo;
  readonly generateId: () => string;
  readonly now: () => Date;
};

export async function addReview(
  deps: AddReviewDeps,
  command: AddReviewCommand
): Promise<AddReviewResult> {
  const { rating, title, comment } = command;

  const id = deps.generateId();
  const createdAt = deps.now();
  const creation = createReview({ id, rating, title, comment, createdAt });

  if (!creation.success) {
    // Generated values are operational failures, not client validation issues.
    const invalidGeneratedValue = creation.issues.find(
      (issue) => issue.field === 'id' || issue.field === 'createdAt'
    );

    if (invalidGeneratedValue) {
      throw new Error(
        `Generated review ${invalidGeneratedValue.field} is invalid`
      );
    }

    return { success: false, issues: creation.issues };
  }

  const saved = await deps.reviewRepo.save(creation.data);

  return { success: true, data: saved };
}
