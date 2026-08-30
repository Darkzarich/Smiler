export interface PaginationRequest {
  limit: number;
  offset: number;
}

/** Lists sorted by the date of creation are walked by cursor: pass back the
 * `nextCursor` of the page before, or nothing for the first page. */
export interface CursorPaginationRequest {
  limit: number;
  cursor?: string;
}

export interface PaginationResponse {
  hasNextPage: boolean;
}

export interface CursorPaginationResponse extends PaginationResponse {
  nextCursor: string | null;
}
