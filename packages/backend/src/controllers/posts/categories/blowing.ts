import type { Request, Response } from 'express';
import { subHours } from 'date-fns';
import { Post, PostModel } from '@models/Post';
import { RateModel, RateTargetModel } from '@models/Rate';
import {
  POST_BLOWING_RATING_THRESHOLD,
  POST_MAX_LIMIT,
} from '@constants/index';
import { sendSuccess } from '@utils/response-utils';
import { PaginationValidator } from '@validators/PaginationValidator';
import { PaginationRequest, PaginationResponse } from '@type/pagination';

interface GetBlowingResponse extends PaginationResponse {
  // TODO: think of something better
  posts: ReturnType<Post['toResponse']>[];
}

export async function blowing(
  req: Request<unknown, unknown, unknown, PaginationRequest>,
  res: Response<GetBlowingResponse>,
) {
  const { limit, offset } = PaginationValidator.validate(req.query, {
    maxLimit: POST_MAX_LIMIT,
  });

  const { userId } = req.session;

  const query = {
    rating: {
      $gte: POST_BLOWING_RATING_THRESHOLD,
    },
    createdAt: {
      $gte: subHours(Date.now(), 1),
    },
  };

  const [posts, total] = await Promise.all([
    PostModel.find(query)
      .sort({ rating: -1 })
      .populate('author', 'login avatar')
      .limit(limit)
      .skip(offset),
    PostModel.countDocuments(query),
  ]);

  const ratedTargets = await RateModel.findRatedTargets({
    userId,
    targetIds: posts.map((post) => post.id),
    targetModel: RateTargetModel.POST,
  });

  const postsWithRated = posts.map((post) => post.toResponse(ratedTargets));

  sendSuccess(res, {
    posts: postsWithRated,
    total,
    pages: Math.ceil(total / limit),
    hasNextPage: offset + limit < total,
  });
}
