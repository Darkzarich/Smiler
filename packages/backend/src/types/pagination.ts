import type { PageCursor } from '@utils/pagination';

/** A list query once its schema has parsed it: the numbers are numbers, and
 * the defaults have been filled in. */
interface PaginationQuery {
  limit: number;
  offset: number;
}

/** Lists sorted by `createdAt` descending accept a `cursor` as well as an
 * `offset` — the two are mutually exclusive. */
export interface CursorPaginationQuery extends PaginationQuery {
  cursor?: PageCursor;
}

export interface PaginationResponse {
  hasNextPage: boolean;
}
