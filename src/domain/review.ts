/**
 * A review is valid only when all of its identity, content and timestamp fields
 * satisfy the domain rules below.
 */
export type Review = {
  readonly id: string;
  // productId would be the partition key in a production application.
  readonly rating: number;
  readonly title: string;
  readonly comment: string;
  readonly createdAt: Date;
};

export type ReviewContent = {
  readonly rating: number;
  readonly title: string;
  readonly comment: string;
};

export type CreateReviewParams = ReviewContent & {
  readonly id: string;
  readonly createdAt: Date;
};

export type ReviewValidationIssue = {
  readonly field: keyof CreateReviewParams;
  readonly message: string;
};

export type CreateReviewResult =
  | { readonly success: true; readonly data: Review }
  | {
      readonly success: false;
      readonly issues: readonly ReviewValidationIssue[];
    };

const RATING_MIN = 1;
const RATING_MAX = 5;
const TITLE_MAX_LENGTH = 200;
const COMMENT_MAX_LENGTH = 5000;

/**
 * Creates a review through the single domain validation flow. Runtime checks
 * remain necessary because values can enter the application outside TypeScript.
 */
export function createReview(params: CreateReviewParams): CreateReviewResult {
  const issues: ReviewValidationIssue[] = [];

  if (typeof params.id !== 'string' || params.id.trim().length === 0) {
    issues.push({
      field: 'id',
      message: 'ID is required and cannot be empty',
    });
  }

  if (
    typeof params.rating !== 'number' ||
    !Number.isFinite(params.rating) ||
    !Number.isInteger(params.rating) ||
    params.rating < RATING_MIN ||
    params.rating > RATING_MAX
  ) {
    issues.push({
      field: 'rating',
      message: `Rating must be an integer between ${RATING_MIN} and ${RATING_MAX}`,
    });
  }

  if (
    typeof params.title !== 'string' ||
    params.title.trim().length === 0 ||
    params.title.length > TITLE_MAX_LENGTH
  ) {
    issues.push({
      field: 'title',
      message: `Title must be between 1 and ${TITLE_MAX_LENGTH} characters`,
    });
  }

  if (
    typeof params.comment !== 'string' ||
    params.comment.trim().length === 0 ||
    params.comment.length > COMMENT_MAX_LENGTH
  ) {
    issues.push({
      field: 'comment',
      message: `Comment must be between 1 and ${COMMENT_MAX_LENGTH} characters`,
    });
  }

  if (
    !(params.createdAt instanceof Date) ||
    !Number.isFinite(params.createdAt.getTime())
  ) {
    issues.push({
      field: 'createdAt',
      message: 'Created date must be a valid Date',
    });
  }

  if (issues.length > 0) {
    return { success: false, issues };
  }

  return {
    success: true,
    data: {
      id: params.id,
      rating: params.rating,
      title: params.title,
      comment: params.comment,
      createdAt: params.createdAt,
    },
  };
}
