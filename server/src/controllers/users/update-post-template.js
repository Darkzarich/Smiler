const User = require('../../models/User');

const { ForbiddenError, ValidationError } = require('../../errors');
const { success } = require('../../utils/utils');
const { POST_MAX_TAGS, POST_MAX_TAG_LEN } = require('../../constants');

exports.updatePostTemplate = async (req, res) => {
  // TODO: validate title, sections just like in posts

  const { sections } = req.body;
  const { tags } = req.body;
  const { title } = req.body;

  // TODO: Replace with id of the user
  if (req.session.userLogin !== req.params.login) {
    throw new ForbiddenError('Can save template only for yourself');
  }

  if (tags) {
    if (tags.length > POST_MAX_TAGS) {
      throw new ValidationError('Too many tags');
    }

    if (tags.some((el) => el.length > POST_MAX_TAG_LEN)) {
      throw new ValidationError('Exceeded max length of a tag');
    }
  }

  const userTemplate = await User.findById(req.session.userId).select(
    'template',
  );

  userTemplate.template.title = title || userTemplate.template.title;
  userTemplate.template.tags = tags || userTemplate.template.tags;
  userTemplate.template.sections = sections || userTemplate.template.sections;

  userTemplate.markModified('template');

  await userTemplate.save();

  success(req, res);
};
