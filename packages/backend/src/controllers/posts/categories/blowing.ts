import type { Request } from 'express';
import { subHours } from 'date-fns';
import { POST_BLOWING_RATING_THRESHOLD } from '@constants/index';
import { respondWithPostList } from '../respond-with-post-list';
import type { ApiResponse } from '@libs/api-router';
import type { postListSchema, PostListQuery } from '@validators/posts';

export async function blowing(
  req: Request<unknown, unknown, unknown, PostListQuery>,
  res: ApiResponse<typeof postListSchema>,
) {
  await respondWithPostList(req, res, {
    query: {
      rating: {
        $gte: POST_BLOWING_RATING_THRESHOLD,
      },
      createdAt: {
        $gte: subHours(Date.now(), 1),
      },
    },
    sort: { rating: -1 },
  });
}
