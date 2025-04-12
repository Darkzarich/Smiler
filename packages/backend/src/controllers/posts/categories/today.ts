import type { Request, Response } from 'express';
import { startOfToday } from 'date-fns';
import { UserModel } from '../../../models/User';
import { Post, PostModel } from '../../../models/Post';
import { ValidationError, ERRORS } from '../../../errors/index';
import { sendSuccess } from '../../../utils/response-utils';
import { POST_MAX_LIMIT } from '../../../constants/index';
import {
  PaginationRequest,
  PaginationResponse,
} from '../../../types/pagination';

interface GetTodayResponse extends PaginationResponse {
  // TODO: think of something better
  posts: ReturnType<Post['toResponse']>[];
}

export async function today(
  req: Request<unknown, unknown, unknown, PaginationRequest>,
  res: Response<GetTodayResponse>,
) {
  const limit = +req.query.limit || POST_MAX_LIMIT;
  const offset = +req.query.offset || 0;

  const { userId } = req.session;

  if (limit > POST_MAX_LIMIT) {
    throw new ValidationError(ERRORS.POST_LIMIT_PARAM_EXCEEDED);
  }

  const query = {
    createdAt: {
      $gte: startOfToday(),
    },
  };

  const [posts, user, total] = await Promise.all([
    PostModel.find(query)
      .sort({ rating: -1 })
      .populate('author', 'login avatar')
      .limit(limit)
      .skip(offset),
    UserModel.findById(userId, { rates: 1 }).populate('rates'),
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
