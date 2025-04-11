import type { Request, Response } from 'express';
import { subHours } from 'date-fns';
import { UserModel } from '../../../models/User';
import { PostModel } from '../../../models/Post';
import { ValidationError, ERRORS } from '../../../errors/index';
import { sendSuccess } from '../../../utils/response-utils';
import { POST_MAX_LIMIT } from '../../../constants/index';
import { PaginationRequest } from '../../../types/pagination';

export async function recent(
  req: Request<unknown, unknown, unknown, PaginationRequest>,
  res: Response,
) {
  const limit = +req.query.limit || POST_MAX_LIMIT;
  const offset = +req.query.offset || 0;

  const { userId } = req.session;

  if (limit > POST_MAX_LIMIT) {
    throw new ValidationError(ERRORS.POST_LIMIT_PARAM_EXCEEDED);
  }

  const query = {
    createdAt: {
      $gte: subHours(Date.now(), 2),
    },
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
