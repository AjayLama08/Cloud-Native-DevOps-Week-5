import { createReview } from '../src/domain/review';
import type { Review } from '../src/domain/review';

const valid = createReview({
  id: 'demo-review-1',
  rating: 5,
  title: 'Clear architecture',
  comment: 'The domain factory returns a validated review.',
  createdAt: new Date('2026-01-02T03:04:05.000Z'),
});

if (!valid.success) {
  throw new Error('The valid domain demonstration unexpectedly failed.');
}

console.log('Valid review:');
console.log(JSON.stringify(toDto(valid.data), null, 2));

const invalid = createReview({
  id: ' ',
  rating: 2.5,
  title: ' ',
  comment: '',
  createdAt: new Date('invalid'),
});

if (invalid.success) {
  throw new Error('The invalid domain demonstration unexpectedly succeeded.');
}

console.log('\nInvalid review issues:');
for (const issue of invalid.issues) {
  console.log(`- ${issue.field}: ${issue.message}`);
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
