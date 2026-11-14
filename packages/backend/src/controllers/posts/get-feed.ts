import type { Request } from 'express';
import { UserModel } from '@models/User';
import { UnauthorizedError, ERRORS } from '@errors';
import { respondWithPostList } from './respond-with-post-list';
import type { ApiResponse } from '@libs/api-router';
import type { cursorPostListSchema, PostFeedQuery } from '@validators/posts';

export async function getFeed(
  req: Request<unknown, unknown, unknown, PostFeedQuery>,
  res: ApiResponse<typeof cursorPostListSchema>,
) {
  const { userId } = req.session;

  const user = await UserModel.findById(userId).lean();

  if (!user) {
    throw new UnauthorizedError(ERRORS.UNAUTHORIZED);
  }

  await respondWithPostList(req, res, {
    query: {
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
    },
    sort: { createdAt: -1 },
    supportsCursor: true,
  });
}
