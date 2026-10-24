import { getCosmosTarget, getReviewRepo } from '../src/config/composition-root';
import { testReviews } from './test-reviews';

async function main(): Promise<void> {
  console.log('Seed target:', JSON.stringify(getCosmosTarget(), null, 2));
  console.log(
    'Reruns overwrite the five sample IDs and retain unrelated records.'
  );
  console.log(
    'Writes are sequential, not transactional; a failure can leave earlier writes saved.'
  );

  const reviewRepo = getReviewRepo();
  for (const review of testReviews) {
    await reviewRepo.save(review);
    console.log(`Seeded review ${review.id}`);
  }

  console.log('Completed seeding reviews.');
}

main().catch((error: unknown) => {
  console.error(
    'Failed to seed reviews:',
    error instanceof Error ? error.message : 'Unexpected seeding failure'
  );
  process.exitCode = 1;
});
