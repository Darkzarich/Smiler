import type { Request, Response } from 'express';
import { nanoid } from 'nanoid';
import {
  POST_SECTIONS_MAX,
  POST_MAX_IMAGE_HEIGHT,
  POST_MAX_IMAGE_WIDTH,
} from '@constants/index';
import { ContentTooLargeError, NotFoundError, ERRORS } from '@errors';
import { fetchExternalImage } from '@libs/fetch-external-image';
import { saveUserImage } from '@libs/save-user-image';
import { POST_SECTION_TYPES, PostPictureSection } from '@models/Post';
import { UserModel } from '@models/User';
import { sendSuccess } from '@utils/response-utils';
import type { ExternalImageBody } from '@validators/posts';

type UploadByUrlResponse = PostPictureSection;

/** Adds a picture to the user's post template from a url instead of a file.
 *
 * The url is only ever a source: the picture is downloaded, re-encoded and
 * stored alongside the multipart uploads, and the section that comes back
 * points at this server. Nothing hands the third party host to a reader.
 */
export async function uploadByUrl(
  req: Request<unknown, unknown, ExternalImageBody>,
  res: Response<UploadByUrlResponse>,
) {
  const { userId } = req.session;
  const { url } = req.body;

  const user = await UserModel.findById(userId).select('template').lean();

  if (!user) {
    throw new NotFoundError(ERRORS.USER_NOT_FOUND);
  }

  if (user.template.sections.length >= POST_SECTIONS_MAX) {
    throw new ContentTooLargeError(ERRORS.POST_SECTIONS_MAX_EXCEEDED);
  }

  const downloaded = await fetchExternalImage(url);

  const storedUrl = await saveUserImage({
    userId: userId!,
    input: downloaded,
    width: POST_MAX_IMAGE_WIDTH,
    height: POST_MAX_IMAGE_HEIGHT,
    invalidImageMessage: ERRORS.EXTERNAL_IMAGE_NOT_AN_IMAGE,
  });

  const newSection = {
    type: POST_SECTION_TYPES.PICTURE as const,
    url: storedUrl,
    hash: nanoid(4),
    isFile: true,
  };

  await UserModel.updateOne(
    { _id: userId },
    { $push: { 'template.sections': newSection } },
  );

  sendSuccess(res, newSection);
}
