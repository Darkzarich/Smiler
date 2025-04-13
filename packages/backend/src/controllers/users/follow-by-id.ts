import type { Request, Response } from 'express';
import { isRefTypeArray, mongoose } from '@typegoose/typegoose';
import { UserModel } from '@models/User';
import { ForbiddenError, NotFoundError, AppError, ERRORS } from '@errors';
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
    UserModel.findById(userId),
    UserModel.findById(id),
  ]);

  if (!userFollowed || !userFollowing) {
    throw new NotFoundError(ERRORS.USER_NOT_FOUND);
  }

  if (!isRefTypeArray(userFollowing.usersFollowed, mongoose.Types.ObjectId)) {
    throw new AppError();
  }

  if (userFollowing.usersFollowed.some((el) => el.toString() === id)) {
    throw new ForbiddenError(ERRORS.USER_CANT_FOLLOW_ALREADY_FOLLOWED);
  }

  await Promise.all([
    userFollowing.updateOne({ $push: { usersFollowed: id } }),
    userFollowed.updateOne({ $inc: { followersAmount: 1 } }),
  ]);

  sendSuccess(res);
}
