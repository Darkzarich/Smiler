import type { Request, Response } from 'express';
import { subHours } from 'date-fns';
import { POST_BLOWING_RATING_THRESHOLD } from '@constants/index';
import { PaginationRequest } from '@type/pagination';
import {
  respondWithPostList,
  PostListResponse,
} from '../respond-with-post-list';

export async function blowing(
  req: Request<unknown, unknown, unknown, PaginationRequest>,
  res: Response<PostListResponse>,
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
