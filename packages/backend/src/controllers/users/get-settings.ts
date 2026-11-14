import type { Request } from 'express';
import { UserModel, type PopulatedAuthor } from '@models/User';
import { NotFoundError, ERRORS } from '@errors';
import { sendSuccess } from '@utils/response-utils';
import type { ApiResponse } from '@libs/api-router';
import type { userSettingsSchema } from '@validators/users';

export async function getSettings(
  req: Request,
  res: ApiResponse<typeof userSettingsSchema>,
) {
  const { userId } = req.session;

  const user = await UserModel.findById(userId)
    .populate('usersFollowed', 'login avatar')
    .lean();

  if (!user) {
    throw new NotFoundError(ERRORS.USER_NOT_FOUND);
  }

  sendSuccess(res, {
    authors: user.usersFollowed as PopulatedAuthor[],
    tags: user.tagsFollowed,
    bio: user.bio,
    avatar: user.avatar,
  });
}
