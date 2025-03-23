import type { Request, Response } from 'express';
import { UserModel } from '../../models/User';
import { PostModel } from '../../models/Post';
import { ValidationError, NotFoundError, ERRORS } from '../../errors/index';
import { sendSuccess } from '../../utils/response-utils';
import { POST_MAX_LIMIT } from '../../constants/index';

export async function getListByAuthor(req: Request, res: Response) {
  const { userId } = req.session;

  const limit = +req.query.limit || POST_MAX_LIMIT;
  const offset = +req.query.offset || 0;
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
