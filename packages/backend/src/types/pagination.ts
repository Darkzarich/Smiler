export interface PaginationRequest {
  limit: number;
  offset: number;
}

/** Lists sorted by `createdAt` descending accept a `cursor` as well as an
 * `offset` — the two are mutually exclusive. */
export interface CursorPaginationRequest extends PaginationRequest {
  cursor?: string;
}

export interface PaginationResponse {
  hasNextPage: boolean;
}
