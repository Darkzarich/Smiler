import { ValidationError, ERRORS } from '@errors';
import { decodeCursor, PageCursor } from '@utils/pagination';

export interface PaginationParams {
  limit: number;
  offset: number;
  cursor?: PageCursor;
}

interface PaginationOptions {
  maxLimit: number;
  defaultLimit?: number;
  maxLimitError?: string;
  /** Whether the list being paginated can be walked by cursor. Only lists
   * sorted by `createdAt` descending can be — see `respondWithPostList`. */
  supportsCursor?: boolean;
}

function isFiniteInteger(value: number): boolean {
  return Number.isFinite(value) && Number.isInteger(value);
}

export class PaginationValidator {
  static validate(
    query: { limit?: unknown; offset?: unknown; cursor?: unknown },
    options: PaginationOptions,
  ): PaginationParams {
    const {
      maxLimit,
      defaultLimit = maxLimit,
      maxLimitError = ERRORS.POST_LIMIT_PARAM_EXCEEDED,
      supportsCursor = false,
    } = options;

    const limitProvided = query.limit !== undefined && query.limit !== '';
    const offsetProvided = query.offset !== undefined && query.offset !== '';
    const cursorProvided = query.cursor !== undefined && query.cursor !== '';

    const limit = limitProvided ? Number(query.limit) : defaultLimit;
    const offset = offsetProvided ? Number(query.offset) : 0;

    if (limitProvided && (!isFiniteInteger(limit) || limit < 1)) {
      throw new ValidationError(ERRORS.PAGINATION_INVALID_LIMIT);
    }

    if (limit > maxLimit) {
      throw new ValidationError(maxLimitError);
    }

    if (offsetProvided && (!isFiniteInteger(offset) || offset < 0)) {
      throw new ValidationError(ERRORS.PAGINATION_INVALID_OFFSET);
    }

    if (!cursorProvided) {
      return { limit, offset };
    }

    if (!supportsCursor) {
      throw new ValidationError(ERRORS.PAGINATION_CURSOR_NOT_SUPPORTED);
    }

    if (offsetProvided) {
      throw new ValidationError(ERRORS.PAGINATION_CURSOR_WITH_OFFSET);
    }

    const cursor =
      typeof query.cursor === 'string' ? decodeCursor(query.cursor) : null;

    if (!cursor) {
      throw new ValidationError(ERRORS.PAGINATION_INVALID_CURSOR);
    }

    return { limit, offset, cursor };
  }
}
