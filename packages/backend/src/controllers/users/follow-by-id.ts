import type { Request, Response } from 'express';
import { UserModel } from '../../models/User';
import { ForbiddenError, NotFoundError, ERRORS } from '../../errors/index';
import { sendSuccess } from '../../utils/response-utils';

export async function followById(req: Request, res: Response) {
  const { id } = req.params;
  const { userId } = req.session!;

  if (id === userId) {
    throw new ForbiddenError(ERRORS.USER_CANT_FOLLOW_OWN);
  }

  const [userFollowing, userFollowed] = await Promise.all([
    UserModel.findById(userId),
    UserModel.findById(id),
  ]);

  if (!userFollowed) {
    throw new NotFoundError(ERRORS.USER_NOT_FOUND);
  }

  if (userFollowing.usersFollowed.includes(id)) {
    throw new ForbiddenError(ERRORS.USER_CANT_FOLLOW_ALREADY_FOLLOWED);
  }

  await Promise.all([
    userFollowing.updateOne({ $push: { usersFollowed: id } }),
    userFollowed.updateOne({ $inc: { followersAmount: 1 } }),
  ]);

  sendSuccess(res);
}
