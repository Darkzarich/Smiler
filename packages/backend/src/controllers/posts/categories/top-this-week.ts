import type { Request } from 'express';
import { startOfWeek } from 'date-fns';
import { respondWithPostList } from '../respond-with-post-list';
import type { ApiResponse } from '@libs/api-router';
import type { postListSchema, PostListQuery } from '@validators/posts';

export async function topThisWeek(
  req: Request<unknown, unknown, unknown, PostListQuery>,
  res: ApiResponse<typeof postListSchema>,
) {
  await respondWithPostList(req, res, {
    query: {
      createdAt: {
        $gte: startOfWeek(Date.now()),
      },
    },
    sort: { rating: -1 },
  });
}
