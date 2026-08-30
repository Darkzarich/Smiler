import type { Request, Response } from 'express';
import { startOfWeek } from 'date-fns';
import { PaginationRequest } from '@type/pagination';
import {
  respondWithPostList,
  PostListResponse,
} from '../respond-with-post-list';

export async function topThisWeek(
  req: Request<unknown, unknown, unknown, PaginationRequest>,
  res: Response<PostListResponse>,
) {
  await respondWithPostList(req, res, {
    query: {
      createdAt: {
        $gte: startOfWeek(Date.now()),
      },
    },
    sort: { createdAt: -1 },
  });
}
