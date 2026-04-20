import type { Request, Response } from 'express';
import { startOfToday } from 'date-fns';
import { PostModel, postToResponse, PostResponse } from '@models/Post';
import { RateModel, RateTargetModel } from '@models/Rate';
import { sendSuccess } from '@utils/response-utils';
import { POST_MAX_LIMIT } from '@constants/index';
import { PaginationValidator } from '@validators/PaginationValidator';
import { PaginationRequest, PaginationResponse } from '@type/pagination';

interface GetTodayResponse extends PaginationResponse {
  posts: PostResponse[];
}

export async function today(
  req: Request<unknown, unknown, unknown, PaginationRequest>,
  res: Response<GetTodayResponse>,
) {
  const { limit, offset } = PaginationValidator.validate(req.query, {
    maxLimit: POST_MAX_LIMIT,
  });

  const { userId } = req.session;

  const query = {
    createdAt: {
      $gte: startOfToday(),
    },
  };

  const [posts, total] = await Promise.all([
    PostModel.find(query)
      .sort({ rating: -1 })
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

  const postsWithRated = posts.map((post) =>
    postToResponse(post, ratedTargets),
  );

  sendSuccess(res, {
    posts: postsWithRated,
    total,
    pages: Math.ceil(total / limit),
    hasNextPage: offset + limit < total,
  });
}
