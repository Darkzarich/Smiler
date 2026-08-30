/** Fetching one document more than the page holds is what tells the client
 * whether there is a next page. It replaces a `countDocuments` over the whole
 * filter on every list request, which only gets more expensive as collections grow.
 */
export const PAGE_LOOKAHEAD = 1;

export function toPage<T>(documents: T[], limit: number) {
  return {
    items: documents.slice(0, limit),
    hasNextPage: documents.length > limit,
  };
}
