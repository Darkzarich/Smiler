import type { Request, Response } from 'express';
import { UserModel, normalizeLogin } from '@models/User';
import { NotFoundError, ERRORS } from '@errors';
import type { PostIndexQuery } from '@validators/posts';
import {
  respondWithPostList,
  PostListResponse,
} from './respond-with-post-list';

export async function getListByAuthor(
  req: Request<unknown, unknown, unknown, PostIndexQuery>,
  res: Response<PostListResponse>,
) {
  const foundAuthor = await UserModel.findOne({
    login: normalizeLogin(req.query.author ?? ''),
  }).lean();

  if (!foundAuthor) {
    throw new NotFoundError(ERRORS.AUTHOR_NOT_FOUND);
  }

  await respondWithPostList(req, res, {
    query: {
      author: foundAuthor._id,
    },
    sort: { createdAt: -1 },
    supportsCursor: true,
  });
}
