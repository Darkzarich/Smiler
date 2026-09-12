import type { Request, Response } from 'express';
import { startOfToday } from 'date-fns';
import type { PostListQuery } from '@validators/posts';
import {
  respondWithPostList,
  PostListResponse,
} from '../respond-with-post-list';

export async function today(
  req: Request<unknown, unknown, unknown, PostListQuery>,
  res: Response<PostListResponse>,
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
