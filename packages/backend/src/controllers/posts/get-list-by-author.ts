import type { Request, Response } from 'express';
import { UserModel, normalizeLogin } from '@models/User';
import { NotFoundError, ERRORS } from '@errors';
import { PaginationRequest } from '@type/pagination';
import {
  respondWithPostList,
  validatePostPagination,
  PostListResponse,
} from './respond-with-post-list';

interface GetListByAuthorQuery extends PaginationRequest {
  author: string;
}

export async function getListByAuthor(
  req: Request<unknown, unknown, unknown, GetListByAuthorQuery>,
  res: Response<PostListResponse>,
) {
  const pagination = validatePostPagination(req.query);
  const author = req.query.author || '';

  const foundAuthor = await UserModel.findOne({
    login: normalizeLogin(author),
  }).lean();

  if (!foundAuthor) {
    throw new NotFoundError(ERRORS.AUTHOR_NOT_FOUND);
  }

  await respondWithPostList(req, res, {
    query: {
      author: foundAuthor._id,
    },
    sort: { createdAt: -1 },
    pagination,
  });
}
