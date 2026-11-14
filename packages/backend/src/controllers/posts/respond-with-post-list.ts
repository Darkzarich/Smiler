import type { Request } from 'express';
import type { RootFilterQuery, SortOrder } from 'mongoose';
import { Post, PostModel, postToResponse } from '@models/Post';
import { RateModel, RateTargetModel } from '@models/Rate';
import { sendSuccess } from '@utils/response-utils';
import { CursorPaginationQuery } from '@type/pagination';
import {
  PAGE_LOOKAHEAD,
  toPage,
  toCursorFilter,
  toNextCursor,
} from '@utils/pagination';
import type { ApiResponse } from '@libs/api-router';
import type { cursorPostListSchema } from '@validators/posts';

interface PostListOptions {
  query?: RootFilterQuery<Post>;
  sort: Record<string, SortOrder>;
  /** Serves the list by `cursor` on top of `offset` and hands back the cursor
   * of the next page. Only for lists sorted by `createdAt` descending: a cursor
   * over a mutable key such as `rating` would skip or repeat posts as votes
   * land between two page requests. */
  supportsCursor?: boolean;
}

/** Fetches one page of posts matching `query`, marks the ones the current user
 * has rated and responds with them. */
export async function respondWithPostList<Query extends CursorPaginationQuery>(
  req: Request<unknown, unknown, unknown, Query>,
  res: ApiResponse<typeof cursorPostListSchema>,
  { query = {}, sort, supportsCursor = false }: PostListOptions,
) {
  const { limit, offset, cursor } = req.query;

  const { userId } = req.session;

  const foundPosts = await PostModel.find(
    cursor ? { $and: [query, toCursorFilter(cursor)] } : query,
  )
    // The `_id` tiebreak keeps the order total, which is what makes a cursor
    // over `createdAt` land on exactly one boundary.
    .sort(supportsCursor ? { ...sort, _id: -1 } : sort)
    .populate('author', 'login avatar')
    .limit(limit + PAGE_LOOKAHEAD)
    .skip(cursor ? 0 : offset)
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
    ...(supportsCursor && { nextCursor: toNextCursor(posts, hasNextPage) }),
  });
}
