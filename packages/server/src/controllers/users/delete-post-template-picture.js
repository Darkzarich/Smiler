import User from '../../models/User.js';

import {
  ValidationError,
  NotFoundError,
  BadRequestError,
  ERRORS,
} from '../../errors/index.js';
import { removeFileByPath } from '../../utils/remove-file-by-path.js';
import { sendSuccess } from '../../utils/responseUtils.js';

import { POST_SECTION_TYPES } from '../../constants/index.js';

export async function deletePostTemplatePicture(req, res) {
  const { hash } = req.params;
  const { userId } = req.session;

  if (!hash) {
    throw new ValidationError(ERRORS.HASH_REQUIRED);
  }

  const userTemplate = await User.findById(userId).select('template');

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
    !targetSection.isFile ||
    targetSection.type !== POST_SECTION_TYPES.PICTURE
  ) {
    throw new BadRequestError(ERRORS.SECTION_NOT_FILE);
  }

  // Delete the file and update the user's template

  await removeFileByPath(targetSection.url);

  await User.updateOne(
    { _id: userId },
    { $pull: { 'template.sections': { hash } } },
  );

  sendSuccess(res);
}
