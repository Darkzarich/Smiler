import type { Request, Response } from 'express';
import { User, UserModel } from '@models/User';
import { NotFoundError, ERRORS } from '@errors';
import { sendSuccess } from '@utils/response-utils';
import type { UserUpdateBody } from '@validators/users';

interface UpdateMeResponse
  extends Pick<
    User,
    'login' | 'rating' | 'bio' | 'avatar' | 'createdAt' | 'followersAmount'
  > {
  _id: string;
}

export async function updateMe(
  req: Request<unknown, unknown, UserUpdateBody>,
  res: Response<UpdateMeResponse>,
) {
  const { userId } = req.session!;
  // Named rather than passed through, so that adding a field to the schema
  // cannot quietly make it settable here.
  const { bio } = req.body;

  const updatedUser = await UserModel.findByIdAndUpdate(
    userId,
    { $set: { bio } },
    {
      runValidators: true,
      new: true,
      lean: true,
    },
  ).select({
    login: 1,
    rating: 1,
    bio: 1,
    avatar: 1,
    createdAt: 1,
    followersAmount: 1,
  });

  if (!updatedUser) {
    throw new NotFoundError(ERRORS.USER_NOT_FOUND);
  }

  sendSuccess(res, {
    _id: updatedUser._id.toString(),
    login: updatedUser.login,
    rating: updatedUser.rating,
    bio: updatedUser.bio,
    avatar: updatedUser.avatar,
    createdAt: updatedUser.createdAt,
    followersAmount: updatedUser.followersAmount,
  });
}
