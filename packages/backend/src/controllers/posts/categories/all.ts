import type { Request, Response } from 'express';
import { PaginationRequest } from '@type/pagination';
import {
  respondWithPostList,
  PostListResponse,
} from '../respond-with-post-list';

export async function all(
  req: Request<unknown, unknown, unknown, PaginationRequest>,
  res: Response<PostListResponse>,
) {
  await respondWithPostList(req, res, { sort: { rating: -1 } });
}
