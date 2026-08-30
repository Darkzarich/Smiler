import type { Request, Response } from 'express';
import { RootFilterQuery } from 'mongoose';
import { Post } from '@models/Post';
import { POST_TITLE_MAX_LENGTH } from '@constants/index';
import { ValidationError, ERRORS } from '@errors';
import { PaginationRequest } from '@type/pagination';
import {
  respondWithPostList,
  validatePostPagination,
  PostListResponse,
} from './respond-with-post-list';

interface SearchQuery extends PaginationRequest {
  title?: string;
  dateFrom?: string;
  dateTo?: string;
  ratingFrom?: string;
  ratingTo?: string;
  'tags[]'?: string[];
}

function parseRating(raw: string): number | undefined {
  if (!raw) {
    return undefined;
  }

  const value = Number(raw);

  if (!Number.isFinite(value)) {
    throw new ValidationError(ERRORS.RATING_INVALID);
  }

  return value;
}

export async function search(
  req: Request<unknown, unknown, unknown, SearchQuery>,
  res: Response<PostListResponse>,
) {
  const pagination = validatePostPagination(req.query);

  const {
    title = '',
    dateFrom = '',
    dateTo = '',
    ratingFrom = '',
    ratingTo = '',
  } = req.query;

  // TODO: Fix how frontend sends tags, maybe with QS library
  const tags = req.query['tags[]'] || [];

  const query: RootFilterQuery<Post> = {};

  if (title) {
    if (title.length > POST_TITLE_MAX_LENGTH) {
      throw new ValidationError(ERRORS.POST_TITLE_MAX_LENGTH_EXCEEDED);
    }

    // Dropping punctuation also keeps the words clear of the `$text` operators
    // — `"` around a phrase, a leading `-` for negation.
    const sanitizedTitle = title.trim().replace(/[^0-9A-Za-z\s]/g, '');

    // A title of punctuation alone leaves nothing to match on, and an empty
    // `$search` is an error, so the filter is left off entirely.
    if (sanitizedTitle) {
      query.$text = { $search: sanitizedTitle };
    }
  }

  if (dateFrom || dateTo) {
    query.createdAt = {};

    if (dateFrom) {
      const dateFromCheck = new Date(dateFrom);

      if (dateFromCheck.toString() === 'Invalid Date') {
        throw new ValidationError(ERRORS.POST_SEARCH_INVALID_DATE);
      }

      query.createdAt.$gte = dateFromCheck;
    }

    if (dateTo) {
      const dateToCheck = new Date(dateTo);

      if (dateToCheck.toString() === 'Invalid Date') {
        throw new ValidationError(ERRORS.POST_SEARCH_INVALID_DATE);
      }

      query.createdAt.$lte = dateToCheck;
    }
  }

  if (ratingTo || ratingFrom) {
    const parsedRatingFrom = parseRating(ratingFrom);
    const parsedRatingTo = parseRating(ratingTo);
    query.rating = {};

    if (parsedRatingFrom !== undefined) {
      query.rating.$gte = parsedRatingFrom;
    }
    if (parsedRatingTo !== undefined) {
      query.rating.$lte = parsedRatingTo;
    }
  }

  if (tags.length > 0) {
    query.tags = {
      $in: tags,
    };
  }

  await respondWithPostList(req, res, {
    query,
    sort: { rating: -1 },
    pagination,
  });
}
