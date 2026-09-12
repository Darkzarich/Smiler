import type { Request, Response } from 'express';
import { UserModel } from '@models/User';
import { UnauthorizedError, ERRORS } from '@errors';
import type { PostFeedQuery } from '@validators/posts';
import {
  respondWithPostList,
  PostListResponse,
} from './respond-with-post-list';

export async function getFeed(
  req: Request<unknown, unknown, unknown, PostFeedQuery>,
  res: Response<PostListResponse>,
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
