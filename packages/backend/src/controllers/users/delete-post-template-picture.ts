import type { Request, Response } from 'express';
import { UserModel } from '../../models/User';
import { NotFoundError, BadRequestError, ERRORS } from '../../errors/index';
import { removeFileByPath } from '../../utils/remove-file-by-path';
import { sendSuccess } from '../../utils/response-utils';
import { POST_SECTION_TYPES } from '../../constants/index';
import { PostPictureSection } from '../../models/Post';

export async function deletePostTemplatePicture(req: Request, res: Response) {
  const { hash } = req.params;
  const { userId } = req.session!;

  const userTemplate = await UserModel.findById(userId).select('template');

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

  await removeFileByPath((targetSection as PostPictureSection).url);

  await UserModel.updateOne(
    { _id: userId },
    { $pull: { 'template.sections': { hash } } },
  );

  sendSuccess(res);
}
