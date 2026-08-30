import type { Request, Response } from 'express';
import type { RootFilterQuery, SortOrder } from 'mongoose';
import { POST_MAX_LIMIT } from '@constants/index';
import { Post, PostModel, postToResponse, PostResponse } from '@models/Post';
import { RateModel, RateTargetModel } from '@models/Rate';
import { sendSuccess } from '@utils/response-utils';
import {
  PaginationValidator,
  PaginationParams,
} from '@validators/PaginationValidator';
import { PaginationRequest, PaginationResponse } from '@type/pagination';
import { PAGE_LOOKAHEAD, toPage } from '@utils/pagination';

export interface PostListResponse extends PaginationResponse {
  posts: PostResponse[];
}

export function validatePostPagination(query: PaginationRequest) {
  return PaginationValidator.validate(query, { maxLimit: POST_MAX_LIMIT });
}

interface PostListOptions {
  query?: RootFilterQuery<Post>;
  sort: Record<string, SortOrder>;
  /** Already validated pagination, for controllers that have to reject a bad
   * `limit`/`offset` before running lookups of their own. */
  pagination?: PaginationParams;
}

/** Fetches one page of posts matching `query`, marks the ones the current user
 * has rated and responds with them. */
export async function respondWithPostList<Query extends PaginationRequest>(
  req: Request<unknown, unknown, unknown, Query>,
  res: Response<PostListResponse>,
  { query = {}, sort, pagination }: PostListOptions,
) {
  const { limit, offset } = pagination ?? validatePostPagination(req.query);

  const { userId } = req.session;

  const foundPosts = await PostModel.find(query)
    .sort(sort)
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

  sendSuccess(res, {
    posts: posts.map((post) => postToResponse(post, ratedTargets)),
    hasNextPage,
  });
}
