import type { Request, Response } from 'express';
import { UserModel, User } from '@models/User';
import { sendSuccess } from '@utils/response-utils';
import { NotFoundError } from '@errors/index';

interface CurrentUser
  extends Pick<
    User,
    'login' | 'rating' | 'followersAmount' | 'tagsFollowed' | 'avatar' | 'email'
  > {
  id: string;
  isAuth: boolean;
}

interface NotLoggedInUser {
  isAuth: false;
}

export type CurrentUserResponse = CurrentUser | NotLoggedInUser;

export async function current(
  req: Request,
  res: Response<CurrentUserResponse>,
) {
  const { userId } = req.session;

  if (!userId) {
    return sendSuccess(res, {
      isAuth: false,
    });
  }

  const user = await UserModel.findById(userId).lean();

  if (!user) {
    throw new NotFoundError();
  }

  return sendSuccess(res, {
    id: user._id.toString(),
    login: user.login,
    isAuth: true,
    rating: user.rating || 0,
    avatar: user.avatar || '',
    email: user.email || '',
    tagsFollowed: user.tagsFollowed || [],
    followersAmount: user.followersAmount,
  });
}
