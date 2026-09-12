import type { Request, Response } from 'express';
import type { PostListQuery } from '@validators/posts';
import {
  respondWithPostList,
  PostListResponse,
} from '../respond-with-post-list';

export async function all(
  req: Request<unknown, unknown, unknown, PostListQuery>,
  res: Response<PostListResponse>,
) {
  await respondWithPostList(req, res, { sort: { rating: -1 } });
}
