const User = require('../../models/User');

const { generateError, success } = require('../../utils/utils');
const { POST_MAX_TAGS, POST_MAX_TAG_LEN } = require('../../constants');

exports.updatePostTemplate = async (req, res, next) => {
  // TODO: validate title, sections just like in posts

  const { sections } = req.body;
  const { tags } = req.body;
  const { title } = req.body;

  if (req.session.userLogin !== req.params.login) {
    generateError('Can save template only for yourself', 403, next);
    return;
  }

  if (tags) {
    if (tags.length > POST_MAX_TAGS) {
      generateError('Too many tags', 422, next);
      return;
    }
    if (tags.find((el) => el.length > POST_MAX_TAG_LEN)) {
      generateError('Exceeded max length of a tag', 422, next);
      return;
    }
  }

  const userTemplate = await User.findById(req.session.userId).select(
    'template',
  );

  userTemplate.template.title = title || userTemplate.template.title;
  userTemplate.template.tags = tags || userTemplate.template.tags;
  userTemplate.template.sections = sections || userTemplate.template.sections;

  try {
    userTemplate.markModified('template');
    await userTemplate.save();
    success(req, res);
  } catch (e) {
    next(e);
  }
};
