const User = require('../../models/User');

const {
  ValidationError,
  NotFoundError,
  BadRequestError,
} = require('../../errors');
const { success, removeFileByPath } = require('../../utils/utils');
const { POST_SECTION_TYPES } = require('../../constants');

exports.deletePostTemplatePicture = async (req, res) => {
  const { hash } = req.params;
  const { userId } = req.session;

  if (!hash) {
    throw new ValidationError('Hash is required for this operation');
  }

  const userTemplate = await User.findById(userId).select('template');

  if (!userTemplate) {
    throw new NotFoundError('User is not found');
  }

  const targetSection = userTemplate.template.sections.find(
    (section) => section.hash === hash,
  );

  if (!targetSection) {
    throw new NotFoundError('Section with given hash is not found');
  }

  if (
    !targetSection.isFile ||
    targetSection.type !== POST_SECTION_TYPES.PICTURE
  ) {
    throw new BadRequestError(
      'This operation cannot be done because this section is not type of picture or not file',
    );
  }

  // Delete the file and update the user's template

  await removeFileByPath(targetSection.url);

  await User.updateOne(
    { _id: userId },
    { $pull: { 'template.sections': { hash } } },
  );

  success(req, res);
};
