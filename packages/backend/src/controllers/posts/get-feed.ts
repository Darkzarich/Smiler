import type { Request, Response } from 'express';
import { UserModel } from '../../models/User';
import { Post, PostModel } from '../../models/Post';
import { UnauthorizedError, ValidationError, ERRORS } from '../../errors/index';
import { POST_MAX_LIMIT } from '../../constants/index';
import { sendSuccess } from '../../utils/response-utils';
import {
  PaginationRequest as PaginationQuery,
  PaginationResponse,
} from '../../types/pagination';

interface GetFeedResponse extends PaginationResponse {
  // TODO: think of something better
  posts: ReturnType<Post['toResponse']>[];
}

export async function getFeed(
  req: Request<unknown, unknown, unknown, PaginationQuery>,
  res: Response<GetFeedResponse>,
) {
  const limit = Number(req.query.limit) || POST_MAX_LIMIT;
  const offset = Number(req.query.offset) || 0;
  const { userId } = req.session;

  if (limit > POST_MAX_LIMIT) {
    throw new ValidationError(ERRORS.POST_LIMIT_PARAM_EXCEEDED);
  }

  const user = await UserModel.findById(userId).populate('rates');

  if (!user) {
    throw new UnauthorizedError(ERRORS.UNAUTHORIZED);
  }

  const query = {
    $and: [
      {
        $or: [
          {
            tags: {
              $in: user.tagsFollowed,
            },
          },
          {
            author: {
              $in: user.usersFollowed,
            },
          },
        ],
      },
      {
        author: {
          $ne: userId,
        },
      },
    ],
  };

  const [posts, total] = await Promise.all([
    PostModel.find(query)
      .sort('-createdAt')
      .populate('author', 'login avatar')
      .limit(limit)
      .skip(offset),
    PostModel.countDocuments(query),
  ]);

  const transPosts = posts.map((post) => post.toResponse(user));

  sendSuccess(res, {
    posts: transPosts,
    total,
    pages: Math.ceil(total / limit),
    hasNextPage: offset + limit < total,
  });
}
