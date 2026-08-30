import type { Request, Response } from 'express';
import { startOfToday } from 'date-fns';
import { PaginationRequest } from '@type/pagination';
import {
  respondWithPostList,
  PostListResponse,
} from '../respond-with-post-list';

export async function today(
  req: Request<unknown, unknown, unknown, PaginationRequest>,
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
