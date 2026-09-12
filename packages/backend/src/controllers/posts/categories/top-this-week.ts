import type { Request, Response } from 'express';
import { startOfWeek } from 'date-fns';
import type { PostListQuery } from '@validators/posts';
import {
  respondWithPostList,
  PostListResponse,
} from '../respond-with-post-list';

export async function topThisWeek(
  req: Request<unknown, unknown, unknown, PostListQuery>,
  res: Response<PostListResponse>,
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
