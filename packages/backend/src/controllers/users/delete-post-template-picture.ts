import type { Request } from 'express';
import { UserModel } from '@models/User';
import { NotFoundError, BadRequestError, ERRORS } from '@errors';
import { removeFileByPath } from '@utils/remove-file-by-path';
import { sendSuccess } from '@utils/response-utils';
import { PostPictureSection, POST_SECTION_TYPES } from '@models/Post';
import type { ApiResponse } from '@libs/api-router';
import type { okResponseSchema } from '@validators/common';
import type { TemplateSectionParams } from '@validators/users';

export async function deletePostTemplatePicture(
  req: Request<TemplateSectionParams>,
  res: ApiResponse<typeof okResponseSchema>,
) {
  const { hash } = req.params;
  const { userId } = req.session!;

  const userTemplate = await UserModel.findById(userId)
    .select('template')
    .lean();

  if (!userTemplate) {
    throw new NotFoundError(ERRORS.USER_NOT_FOUND);
  }

  const targetSection = userTemplate.template.sections.find(
    (section) => section.hash === hash,
  );

  if (!targetSection) {
    throw new NotFoundError(ERRORS.SECTION_NOT_FOUND);
  }

  if (
    !(targetSection as PostPictureSection).isFile ||
    targetSection.type !== POST_SECTION_TYPES.PICTURE
  ) {
    throw new BadRequestError(ERRORS.SECTION_NOT_FILE);
  }

  // Delete the file and update the user's template

  const fileUrl = (targetSection as PostPictureSection).url;

  if (fileUrl.startsWith(`/uploads/${userId}/`)) {
    await removeFileByPath(fileUrl);
  }

  await UserModel.updateOne(
    { _id: userId },
    {
      $pull: { 'template.sections': { hash } },
      $set: { 'template.updatedAt': new Date() },
    },
  );

  sendSuccess(res);
}
