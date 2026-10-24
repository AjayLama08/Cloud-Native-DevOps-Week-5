import type { Review } from '../src/domain/review';

export const testReviews: readonly Review[] = [
  {
    id: '1',
    rating: 5,
    title: 'Excellent service',
    comment: 'Everything was perfect. Highly recommended!',
    createdAt: new Date('2025-10-01T10:00:00Z'),
  },
  {
    id: '2',
    rating: 4,
    title: 'Very good',
    comment: 'Good experience overall, but room for improvement.',
    createdAt: new Date('2025-10-02T12:30:00Z'),
  },
  {
    id: '3',
    rating: 2,
    title: 'Not satisfied',
    comment: 'Service was slow and the staff was not friendly.',
    createdAt: new Date('2025-10-03T15:45:00Z'),
  },
  {
    id: '4',
    rating: 3,
    title: 'Average',
    comment: 'It was okay, nothing special.',
    createdAt: new Date('2025-10-04T09:20:00Z'),
  },
  {
    id: '5',
    rating: 5,
    title: 'Outstanding!',
    comment: 'Best experience I have ever had.',
    createdAt: new Date('2025-10-05T18:00:00Z'),
  },
];
