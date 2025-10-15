import { addReview } from '../src/app/add-review';
import { listReviews } from '../src/app/list-reviews';
import type { Review } from '../src/domain/review';
import type { ReviewRepo } from '../src/domain/review-repo';
import { FakeReviewRepo } from '../src/infra/fake-review-repo';

const fixedId = 'demo-review-1';
const fixedDate = new Date('2026-01-02T03:04:05.000Z');
const fakeReviewRepo = new FakeReviewRepo();

// The marker makes it visible that addReview returns the value from save().
const reviewRepo: ReviewRepo = {
  getById: (id) => fakeReviewRepo.getById(id),
  list: () => fakeReviewRepo.list(),
  save: (review) =>
    fakeReviewRepo.save({
      ...review,
      title: `${review.title} (persisted)`,
    }),
};

async function main(): Promise<void> {
  const added = await addReview(
    {
      reviewRepo,
      generateId: () => fixedId,
      now: () => new Date(fixedDate.getTime()),
    },
    {
      rating: 5,
      title: 'Explicit dependencies',
      comment: 'This demonstration does not connect to Cosmos DB.',
    }
  );

  if (!added.success) {
    throw new Error('The add review demonstration unexpectedly failed.');
  }

  console.log('Add returned persisted review:');
  console.log(JSON.stringify(toDto(added.data), null, 2));

  const listed = await listReviews({ reviewRepo });
  console.log(`\nList returned ${listed.data.length} review:`);
  console.log(JSON.stringify(listed.data.map(toDto), null, 2));

  const found = await reviewRepo.getById(fixedId);
  const missing = await reviewRepo.getById('missing');
  console.log(`\ngetById found: ${found?.id ?? 'null'}`);
  console.log(`getById missing returns null: ${missing === null}`);

  if (!found) {
    throw new Error('The saved review could not be read from the fake.');
  }
  found.createdAt.setUTCFullYear(2000);

  const readAgain = await reviewRepo.getById(fixedId);
  if (!readAgain) {
    throw new Error('The saved review disappeared from the fake.');
  }
  console.log(
    `Stored date after returned Date mutation: ${readAgain.createdAt.toISOString()}`
  );
}

function toDto(review: Review) {
  return {
    id: review.id,
    rating: review.rating,
    title: review.title,
    comment: review.comment,
    createdAt: review.createdAt.toISOString(),
  };
}

main().catch((error: unknown) => {
  console.error(
    error instanceof Error ? error.message : 'The review demonstration failed.'
  );
  process.exitCode = 1;
});
