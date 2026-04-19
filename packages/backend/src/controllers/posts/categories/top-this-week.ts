import type { Request, Response } from 'express';
import { startOfWeek } from 'date-fns';
import { Post, PostModel } from '@models/Post';
import { RateModel, RateTargetModel } from '@models/Rate';
import { sendSuccess } from '@utils/response-utils';
import { POST_MAX_LIMIT } from '@constants/index';
import { PaginationValidator } from '@validators/PaginationValidator';
import { PaginationRequest, PaginationResponse } from '@type/pagination';

interface GetTopThisWeekResponse extends PaginationResponse {
  // TODO: think of something better
  posts: ReturnType<Post['toResponse']>[];
}

export async function topThisWeek(
  req: Request<unknown, unknown, unknown, PaginationRequest>,
  res: Response<GetTopThisWeekResponse>,
) {
  const { limit, offset } = PaginationValidator.validate(req.query, {
    maxLimit: POST_MAX_LIMIT,
  });

  const { userId } = req.session;

  const query = {
    createdAt: {
      $gte: startOfWeek(Date.now()),
    },
  };

  const [posts, total] = await Promise.all([
    PostModel.find(query)
      .sort({ createdAt: -1 })
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
