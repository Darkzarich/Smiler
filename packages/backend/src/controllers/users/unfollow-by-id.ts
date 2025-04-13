import type { Request, Response } from 'express';
import { isRefTypeArray, mongoose } from '@typegoose/typegoose';
import { UserModel } from '@models/User';
import { ForbiddenError, NotFoundError, AppError, ERRORS } from '@errors/index';
import { sendSuccess } from '@utils/response-utils';

interface Params {
  id: string;
}

export async function unfollowById(req: Request<Params>, res: Response) {
  const { id } = req.params;
  const { userId } = req.session;

  if (id === userId) {
    throw new ForbiddenError(ERRORS.USER_CANT_UNFOLLOW_OWN);
  }

  const [userUnfollowing, userUnfollowed] = await Promise.all([
    UserModel.findById(userId),
    UserModel.findById(id),
  ]);

  if (!userUnfollowed || !userUnfollowing) {
    throw new NotFoundError(ERRORS.USER_NOT_FOUND);
  }

  if (!isRefTypeArray(userUnfollowing.usersFollowed, mongoose.Types.ObjectId)) {
    throw new AppError();
  }

  if (!userUnfollowing.usersFollowed.some((el) => el.toString() === id)) {
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
