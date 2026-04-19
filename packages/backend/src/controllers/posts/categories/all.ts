import type { Request, Response } from 'express';
import { POST_MAX_LIMIT } from '@constants/index';
import { PostModel, Post } from '@models/Post';
import { RateModel, RateTargetModel } from '@models/Rate';
import { sendSuccess } from '@utils/response-utils';
import { PaginationValidator } from '@validators/PaginationValidator';
import { PaginationRequest, PaginationResponse } from '@type/pagination';

interface GetAllResponse extends PaginationResponse {
  // TODO: think of something better
  posts: ReturnType<Post['toResponse']>[];
}

export async function all(
  req: Request<unknown, unknown, unknown, PaginationRequest>,
  res: Response<GetAllResponse>,
) {
  const { limit, offset } = PaginationValidator.validate(req.query, {
    maxLimit: POST_MAX_LIMIT,
  });

  const { userId } = req.session;

  const [posts, total] = await Promise.all([
    PostModel.find()
      .sort({ rating: -1 })
      .populate('author', 'login avatar')
      .limit(limit)
      .skip(offset),
    PostModel.countDocuments(),
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
