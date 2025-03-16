import type { Request, Response } from 'express';
import User from '../../models/User';
import { NotFoundError, ERRORS } from '../../errors/index';
import { sendSuccess } from '../../utils/response-utils';

export async function getSettings(req: Request, res: Response) {
  const { userId } = req.session;

  const user = await User.findById(userId)
    .populate('usersFollowed', 'login avatar')
    .lean();

  if (!user) {
    throw new NotFoundError(ERRORS.USER_NOT_FOUND);
  }

  const following = {
    authors: user.usersFollowed,
    tags: user.tagsFollowed,
    bio: user.bio,
    avatar: user.avatar,
  };

  sendSuccess(res, following);
}
