import type { Request, Response } from 'express';
import User from '../../models/User';
import { ForbiddenError, NotFoundError, ERRORS } from '../../errors/index';
import { sendSuccess } from '../../utils/response-utils';

export async function unfollowById(req: Request, res: Response) {
  const { id } = req.params;
  const { userId } = req.session;

  if (id === userId) {
    throw new ForbiddenError(ERRORS.USER_CANT_UNFOLLOW_OWN);
  }

  const [userUnfollowing, userUnfollowed] = await Promise.all([
    User.findById(userId),
    User.findById(id),
  ]);

  if (!userUnfollowed) {
    throw new NotFoundError(ERRORS.USER_NOT_FOUND);
  }

  if (!userUnfollowing.usersFollowed.includes(id)) {
    throw new ForbiddenError(ERRORS.USER_CANT_UNFOLLOW_NOT_FOLLOWED);
  }

  await Promise.all([
    userUnfollowing.updateOne({
      $pull: {
        usersFollowed: id,
      },
    }),
    userUnfollowed.updateOne({
      $inc: {
        followersAmount: -1,
      },
    }),
  ]);

  sendSuccess(res);
}
