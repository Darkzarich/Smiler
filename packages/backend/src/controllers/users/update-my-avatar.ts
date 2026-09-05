import type { Request, Response } from 'express';
import { USER_AVATAR_SIZE, BASE_UPLOAD_FOLDER } from '@constants/index';
import { NotFoundError, ValidationError, ERRORS } from '@errors';
import { fetchExternalImage } from '@libs/fetch-external-image';
import { saveUserImage } from '@libs/save-user-image';
import { UserModel } from '@models/User';
import { removeFileByPath } from '@utils/remove-file-by-path';
import { sendSuccess } from '@utils/response-utils';

interface UpdateMyAvatarBody {
  url?: unknown;
}

interface UpdateMyAvatarResponse {
  avatar: string;
}

/** Replaces the current user's avatar with a picture downloaded from a url.
 *
 * An avatar is drawn next to every post and every comment its owner wrote, so
 * a hotlinked one was the widest reaching way to collect the IP address of
 * anybody reading the site. Storing a re-encoded copy ends that, and bounds
 * what the picture costs a reader to load.
 */
export async function updateMyAvatar(
  req: Request<unknown, unknown, UpdateMyAvatarBody>,
  res: Response<UpdateMyAvatarResponse>,
) {
  const { userId } = req.session!;
  const { url } = req.body;

  if (typeof url !== 'string' || !url.trim()) {
    throw new ValidationError(ERRORS.USER_AVATAR_URL_REQUIRED);
  }

  const user = await UserModel.findById(userId).select('avatar').lean();

  if (!user) {
    throw new NotFoundError(ERRORS.USER_NOT_FOUND);
  }

  const downloaded = await fetchExternalImage(url.trim());

  const avatar = await saveUserImage({
    userId: userId!,
    input: downloaded,
    width: USER_AVATAR_SIZE,
    height: USER_AVATAR_SIZE,
    invalidImageMessage: ERRORS.EXTERNAL_IMAGE_NOT_AN_IMAGE,
  });

  await UserModel.updateOne({ _id: userId }, { $set: { avatar } });

  // Only after the new one is in place, and only for a file this server wrote:
  // avatars set before this endpoint existed are urls somebody else owns.
  if (user.avatar?.startsWith(`${BASE_UPLOAD_FOLDER}/${userId}/`)) {
    await removeFileByPath(user.avatar);
  }

  sendSuccess(res, { avatar });
}
