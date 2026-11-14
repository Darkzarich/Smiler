import type { Request } from 'express';
import { subHours } from 'date-fns';
import { respondWithPostList } from '../respond-with-post-list';
import type { ApiResponse } from '@libs/api-router';
import type { cursorPostListSchema, PostFeedQuery } from '@validators/posts';

export async function recent(
  req: Request<unknown, unknown, unknown, PostFeedQuery>,
  res: ApiResponse<typeof cursorPostListSchema>,
) {
  await respondWithPostList(req, res, {
    query: {
      createdAt: {
        $gte: subHours(Date.now(), 2),
      },
    },
    sort: { createdAt: -1 },
    supportsCursor: true,
  });
}
