import type { Request, Response } from 'express';
import { subHours } from 'date-fns';
import { CursorPaginationRequest } from '@type/pagination';
import {
  respondWithPostList,
  PostListResponse,
} from '../respond-with-post-list';

export async function recent(
  req: Request<unknown, unknown, unknown, CursorPaginationRequest>,
  res: Response<PostListResponse>,
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
