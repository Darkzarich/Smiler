import type { Request } from 'express';
import { UserModel } from '@models/User';
import { sendSuccess } from '@utils/response-utils';
import { NotFoundError } from '@errors';
import type { ApiResponse } from '@libs/api-router';
import type { authStateSchema } from '@validators/auth';

export async function current(
  req: Request,
  res: ApiResponse<typeof authStateSchema>,
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
    _id: user._id.toString(),
    login: user.login,
    isAuth: true,
    rating: user.rating || 0,
    avatar: user.avatar || '',
    email: user.email || '',
    tagsFollowed: user.tagsFollowed || [],
    followersAmount: user.followersAmount,
  });
}
