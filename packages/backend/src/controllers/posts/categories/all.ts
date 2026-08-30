import type { Request, Response } from 'express';
import { POST_MAX_LIMIT } from '@constants/index';
import { PostModel, postToResponse, PostResponse } from '@models/Post';
import { RateModel, RateTargetModel } from '@models/Rate';
import { sendSuccess } from '@utils/response-utils';
import { PaginationValidator } from '@validators/PaginationValidator';
import { PaginationRequest, PaginationResponse } from '@type/pagination';
import { PAGE_LOOKAHEAD, toPage } from '@utils/pagination';

interface GetAllResponse extends PaginationResponse {
  posts: PostResponse[];
}

export async function all(
  req: Request<unknown, unknown, unknown, PaginationRequest>,
  res: Response<GetAllResponse>,
) {
  const { limit, offset } = PaginationValidator.validate(req.query, {
    maxLimit: POST_MAX_LIMIT,
  });

  const { userId } = req.session;

  const foundPosts = await PostModel.find()
    .sort({ rating: -1 })
    .populate('author', 'login avatar')
    .limit(limit + PAGE_LOOKAHEAD)
    .skip(offset)
    .lean();

  const { items: posts, hasNextPage } = toPage(foundPosts, limit);

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
    hasNextPage,
  });
}
