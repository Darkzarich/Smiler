import type { Request, Response } from 'express';
import { UserModel } from '@models/User';
import { ForbiddenError, NotFoundError, ERRORS } from '@errors';
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
    UserModel.findById(userId).select('usersFollowed').lean(),
    UserModel.findById(id).lean(),
  ]);

  if (!userUnfollowed || !userUnfollowing) {
    throw new NotFoundError(ERRORS.USER_NOT_FOUND);
  }

  if (!userUnfollowing.usersFollowed.some((el) => el.toString() === id)) {
    throw new ForbiddenError(ERRORS.USER_CANT_UNFOLLOW_NOT_FOLLOWED);
  }

  await Promise.all([
    UserModel.updateOne(
      { _id: userId },
      {
        $pull: {
          usersFollowed: id,
        },
      },
    ),
    UserModel.updateOne(
      { _id: id },
      {
        $inc: {
          followersAmount: -1,
        },
      },
    ),
  ]);

  sendSuccess(res);
}
