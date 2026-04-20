import type { Request, Response } from 'express';
import { UserModel } from '@models/User';
import { PostModel, postToResponse, PostResponse } from '@models/Post';
import { RateModel, RateTargetModel } from '@models/Rate';
import { UnauthorizedError, ERRORS } from '@errors';
import { POST_MAX_LIMIT } from '@constants/index';
import { sendSuccess } from '@utils/response-utils';
import { PaginationValidator } from '@validators/PaginationValidator';
import {
  PaginationRequest as PaginationQuery,
  PaginationResponse,
} from '@type/pagination';

interface GetFeedResponse extends PaginationResponse {
  posts: PostResponse[];
}

export async function getFeed(
  req: Request<unknown, unknown, unknown, PaginationQuery>,
  res: Response<GetFeedResponse>,
) {
  const { limit, offset } = PaginationValidator.validate(req.query, {
    maxLimit: POST_MAX_LIMIT,
  });
  const { userId } = req.session;

  const user = await UserModel.findById(userId).lean();

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
      .skip(offset)
      .lean(),
    PostModel.countDocuments(query),
  ]);

  const ratedTargets = await RateModel.findRatedTargets({
    userId,
    targetIds: posts.map((post) => post._id.toString()),
    targetModel: RateTargetModel.POST,
  });

  const transPosts = posts.map((post) => postToResponse(post, ratedTargets));

  sendSuccess(res, {
    posts: transPosts,
    total,
    pages: Math.ceil(total / limit),
    hasNextPage: offset + limit < total,
  });
}
