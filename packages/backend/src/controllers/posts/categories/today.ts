import type { Request } from 'express';
import { startOfToday } from 'date-fns';
import { respondWithPostList } from '../respond-with-post-list';
import type { ApiResponse } from '@libs/api-router';
import type { postListSchema, PostListQuery } from '@validators/posts';

export async function today(
  req: Request<unknown, unknown, unknown, PostListQuery>,
  res: ApiResponse<typeof postListSchema>,
) {
  await respondWithPostList(req, res, {
    query: {
      createdAt: {
        $gte: startOfToday(),
      },
    },
    sort: { rating: -1 },
  });
}
