/** A vote on a comment gives its author half a point, so a user's rating can
 * end in .5. Shown rounded away from zero: 0.5 → 1, −1.5 → −2. */
export function formatRating(rating: number) {
  return Math.sign(rating) * Math.round(Math.abs(rating));
}
