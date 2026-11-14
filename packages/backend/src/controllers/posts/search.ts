import type { Request } from 'express';
import { RootFilterQuery } from 'mongoose';
import { Post } from '@models/Post';
import { respondWithPostList } from './respond-with-post-list';
import type { ApiResponse } from '@libs/api-router';
import type { cursorPostListSchema, PostIndexQuery } from '@validators/posts';

export async function search(
  req: Request<unknown, unknown, unknown, PostIndexQuery>,
  res: ApiResponse<typeof cursorPostListSchema>,
) {
  const { title, dateFrom, dateTo, ratingFrom, ratingTo } = req.query;
  const tags = req.query['tags[]'];

  const query: RootFilterQuery<Post> = {};

  if (title) {
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
    query.createdAt = {
      ...(dateFrom && { $gte: dateFrom }),
      ...(dateTo && { $lte: dateTo }),
    };
  }

  if (ratingFrom !== undefined || ratingTo !== undefined) {
    query.rating = {
      ...(ratingFrom !== undefined && { $gte: ratingFrom }),
      ...(ratingTo !== undefined && { $lte: ratingTo }),
    };
  }

  if (tags.length > 0) {
    query.tags = { $in: tags };
  }

  await respondWithPostList(req, res, { query, sort: { rating: -1 } });
}
