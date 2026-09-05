import type { Request, Response } from 'express';
import { BASE_UPLOAD_FOLDER } from '@constants/index';
import { NotFoundError, ERRORS } from '@errors';
import { UserModel } from '@models/User';
import { removeFileByPath } from '@utils/remove-file-by-path';
import { sendSuccess } from '@utils/response-utils';

/** Clears the current user's avatar, falling back to the default one.
 *
 * Setting an avatar stores a file, so there has to be a way to get rid of it
 * that does not require uploading another picture first.
 */
export async function deleteMyAvatar(req: Request, res: Response) {
  const { userId } = req.session!;

  const user = await UserModel.findById(userId).select('avatar').lean();

  if (!user) {
    throw new NotFoundError(ERRORS.USER_NOT_FOUND);
  }

  await UserModel.updateOne({ _id: userId }, { $set: { avatar: '' } });

  if (user.avatar?.startsWith(`${BASE_UPLOAD_FOLDER}/${userId}/`)) {
    await removeFileByPath(user.avatar);
  }

  sendSuccess(res);
}
