import type { NextFunction, Request } from 'express';
import multer from 'multer';
import {
  ALLOWED_PICTURE_MIME_TYPES,
  BASE_UPLOAD_FOLDER,
  POST_MAX_UPLOAD_IMAGE_SIZE,
  USER_AVATAR_SIZE,
} from '@constants/index';
import {
  AppError,
  ContentTooLargeError,
  ERRORS,
  NotFoundError,
  ValidationError,
} from '@errors';
import { saveUserImage } from '@libs/save-user-image';
import { UserModel } from '@models/User';
import { removeFileByPath } from '@utils/remove-file-by-path';
import { sendSuccess } from '@utils/response-utils';
import type { ApiResponse } from '@libs/api-router';
import type { avatarResponseSchema } from '@validators/users';

const ALLOWED_UPLOAD_MIME_TYPES = new Set(ALLOWED_PICTURE_MIME_TYPES);

// In memory: `saveUserImage` re-encodes the file anyway, so there is nothing to
// write before it has looked at the bytes.
const avatarMulter = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: POST_MAX_UPLOAD_IMAGE_SIZE,
  },
  fileFilter: (_, file, callback) => {
    if (!ALLOWED_UPLOAD_MIME_TYPES.has(file.mimetype)) {
      callback(new ValidationError(ERRORS.POST_INVALID_ATTACHMENT_EXTENSION));

      return;
    }

    callback(null, true);
  },
}).single('picture');

/** Replaces the current user's avatar with an uploaded picture.
 *
 * The companion of `PUT /users/me/avatar`, which takes a url instead: both end
 * in the same stored square jpeg, and both delete the avatar they replace when
 * this server wrote it.
 */
export async function uploadMyAvatar(
  req: Request,
  res: ApiResponse<typeof avatarResponseSchema>,
  next: NextFunction,
) {
  const { userId } = req.session;
  const user = await UserModel.findById(userId).select('avatar').lean();

  if (!user) {
    throw new NotFoundError(ERRORS.USER_NOT_FOUND);
  }

  avatarMulter(req, res, async (error) => {
    if (error) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        next(
          new ContentTooLargeError(ERRORS.POST_MAX_UPLOAD_IMAGE_SIZE_EXCEEDED),
        );

        return;
      }

      next(error);

      return;
    }

    if (!req.file) {
      next(new AppError());

      return;
    }

    try {
      const avatar = await saveUserImage({
        userId: userId!,
        input: req.file.buffer,
        width: USER_AVATAR_SIZE,
        height: USER_AVATAR_SIZE,
        invalidImageMessage: ERRORS.POST_INVALID_ATTACHMENT_EXTENSION,
      });

      await UserModel.updateOne({ _id: userId }, { $set: { avatar } });

      // Only once the new one is in place, and only for a file this server
      // wrote: avatars set before that endpoint existed are urls somebody else
      // owns.
      if (user.avatar?.startsWith(`${BASE_UPLOAD_FOLDER}/${userId}/`)) {
        await removeFileByPath(user.avatar);
      }

      sendSuccess(res, { avatar });
    } catch (uploadError) {
      next(uploadError);
    }
  });
}
