import type { Request } from 'express';
import { UserModel, normalizeLogin } from '@models/User';
import { NotFoundError, ERRORS } from '@errors';
import { respondWithPostList } from './respond-with-post-list';
import type { ApiResponse } from '@libs/api-router';
import type { cursorPostListSchema, PostIndexQuery } from '@validators/posts';

export async function getListByAuthor(
  req: Request<unknown, unknown, unknown, PostIndexQuery>,
  res: ApiResponse<typeof cursorPostListSchema>,
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
