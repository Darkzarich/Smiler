import { ValidationError, ERRORS } from '@errors';

export interface PaginationParams {
  limit: number;
  offset: number;
}

interface PaginationOptions {
  maxLimit: number;
  defaultLimit?: number;
  maxLimitError?: string;
}

function isFiniteInteger(value: number): boolean {
  return Number.isFinite(value) && Number.isInteger(value);
}

export class PaginationValidator {
  static validate(
    query: { limit?: unknown; offset?: unknown },
    options: PaginationOptions,
  ): PaginationParams {
    const {
      maxLimit,
      defaultLimit = maxLimit,
      maxLimitError = ERRORS.POST_LIMIT_PARAM_EXCEEDED,
    } = options;

    const limitProvided = query.limit !== undefined && query.limit !== '';
    const offsetProvided = query.offset !== undefined && query.offset !== '';

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

    return { limit, offset };
  }
}
