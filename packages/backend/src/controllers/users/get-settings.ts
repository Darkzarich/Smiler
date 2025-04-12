import type { Request, Response } from 'express';
import { User, UserModel } from '../../models/User';
import { NotFoundError, ERRORS } from '../../errors/index';
import { sendSuccess } from '../../utils/response-utils';

interface GetSettingsResponse {
  authors: User[];
  tags: string[];
  bio: string;
  avatar: string;
}

export async function getSettings(
  req: Request,
  res: Response<GetSettingsResponse>,
) {
  const { userId } = req.session;

  const user = await UserModel.findById(userId)
    .populate('usersFollowed', 'login avatar')
    .lean();

  if (!user) {
    throw new NotFoundError(ERRORS.USER_NOT_FOUND);
  }

  sendSuccess(res, {
    authors: user.usersFollowed as User[],
    tags: user.tagsFollowed,
    bio: user.bio,
    avatar: user.avatar,
  });
}
