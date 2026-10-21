import { describe, it, expect } from 'vitest';
import { formatRating } from './format-rating';

describe('formatRating', () => {
  it.each([
    [0, 0],
    [3, 3],
    [0.5, 1],
    [1.5, 2],
    [121.5, 122],
    [-0.5, -1],
    [-1.5, -2],
    [-3, -3],
  ])('shows %s as %s', (rating, shown) => {
    expect(formatRating(rating)).toBe(shown);
  });
});
