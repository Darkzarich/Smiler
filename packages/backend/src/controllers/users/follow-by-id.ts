import type { Request, Response } from 'express';
import { UserModel } from '@models/User';
import { ForbiddenError, NotFoundError, ERRORS } from '@errors';
import { sendSuccess } from '@utils/response-utils';

interface FollowByIdParams {
  id: string;
}

export async function followById(
  req: Request<FollowByIdParams>,
  res: Response,
) {
  const { id } = req.params;
  const { userId } = req.session!;

  if (id === userId) {
    throw new ForbiddenError(ERRORS.USER_CANT_FOLLOW_OWN);
  }

  const [userFollowing, userFollowed] = await Promise.all([
    UserModel.findById(userId).select('usersFollowed').lean(),
    UserModel.findById(id).lean(),
  ]);

  if (!userFollowed || !userFollowing) {
    throw new NotFoundError(ERRORS.USER_NOT_FOUND);
  }

  if (userFollowing.usersFollowed.some((el) => el.toString() === id)) {
    throw new ForbiddenError(ERRORS.USER_CANT_FOLLOW_ALREADY_FOLLOWED);
  }

  await Promise.all([
    UserModel.updateOne({ _id: userId }, { $push: { usersFollowed: id } }),
    UserModel.updateOne({ _id: id }, { $inc: { followersAmount: 1 } }),
  ]);

  sendSuccess(res);
}
