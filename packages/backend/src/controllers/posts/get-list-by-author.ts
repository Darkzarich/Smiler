import type { Request, Response } from 'express';
import { UserModel } from '@models/User';
import { Post, PostModel } from '@models/Post';
import { ValidationError, NotFoundError, ERRORS } from '@errors';
import { sendSuccess } from '@utils/response-utils';
import { POST_MAX_LIMIT } from '@constants/index';
import { PaginationRequest, PaginationResponse } from '@type/pagination';

interface GetListByAuthorQuery extends PaginationRequest {
  author: string;
}

interface GetListByAuthorResponse extends PaginationResponse {
  // TODO: think of something better
  posts: ReturnType<Post['toResponse']>[];
}

export async function getListByAuthor(
  req: Request<unknown, unknown, unknown, GetListByAuthorQuery>,
  res: Response<GetListByAuthorResponse>,
) {
  const { userId } = req.session;

  const limit = Number(req.query.limit) || POST_MAX_LIMIT;
  const offset = Number(req.query.offset) || 0;
  const author = req.query.author || '';

  if (limit > POST_MAX_LIMIT) {
    throw new ValidationError(ERRORS.POST_LIMIT_PARAM_EXCEEDED);
  }

  const foundAuthor = await UserModel.findOne({
    login: author,
  });

  if (!foundAuthor) {
    throw new NotFoundError(ERRORS.AUTHOR_NOT_FOUND);
  }

  const query = {
    author: foundAuthor.id,
  };

  const [posts, user, total] = await Promise.all([
    PostModel.find(query)
      .sort({ createdAt: -1 })
      .populate('author', 'login avatar')
      .limit(limit)
      .skip(offset),
    UserModel.findById(userId).select('rates').populate('rates'),
    PostModel.countDocuments(query),
  ]);

  const postsWithRated = posts.map((post) => post.toResponse(user));

  sendSuccess(res, {
    posts: postsWithRated,
    total,
    pages: Math.ceil(total / limit),
    hasNextPage: offset + limit < total,
  });
}
