const slugLib = require('slug');
const crypto = require('crypto');
const sanitizeHtml = require('../../utils/sanitize-html');

const User = require('../../models/User');
const Post = require('../../models/Post');
const consts = require('../../const/const');
const { success, asyncErrorHandler, generateError } = require('../../utils/utils');

const allowedSectionTypes = Object.values(consts.POST_SECTION_TYPES);

exports.create = asyncErrorHandler(async (req, res, next) => {
  // TODO: rework this | move validation

  const { userId } = req.session;
  const { title } = req.body;
  const { tags } = req.body;
  const { sections } = req.body;

  if (!title) {
    return generateError('Title is required', 422, next);
  }

  if (!sections || sections.length < 1) {
    return generateError('At least one section is required', 422, next);
  }

  if (sections.length > consts.POST_SECTIONS_MAX) {
    return generateError('Exceeded max amount of sections', 422, next);
  }

  if (title.length > consts.POST_TITLE_MAX_LENGTH) {
    return generateError('Exceeded max length of title', 422, next);
  }

  if (tags) {
    if (tags.length > consts.POST_MAX_TAGS) {
      return generateError('Too many tags', 422, next);
    }

    if (tags.some(tag => tag.length > consts.POST_MAX_TAG_LEN)) {
      return generateError('Exceeded max length of a tag', 422, next);
    }
  }

  // eslint-disable-next-line no-restricted-syntax
  for (const section of sections) {
    if (!allowedSectionTypes.includes(section.type)) {
      return generateError(`Unsupported section type: ${section.type}`, 422, next);
    }

    let textContentSumLength = 0;

    if (section.type === consts.POST_SECTION_TYPES.TEXT) {
      textContentSumLength += section.content.length;
      section.content = sanitizeHtml(section.content);
    }

    if (textContentSumLength > consts.POST_SECTIONS_MAX_LENGTH) {
      return generateError(`Text sections sum length exceeded max allowed length of ${consts.POST_SECTIONS_MAX_LENGTH} symbols`, 422, next);
    }
  }

  const post = await Post.create({
    title,
    sections,
    tags,
    slug: `${slugLib(title)}-${crypto.randomUUID()}`,
    author: userId,
  });

  const user = await User.findById(userId).select('template');

  user.template.title = '';
  user.template.sections = [];
  user.template.tags = [];
  user.markModified('template');

  await user.save();

  success(req, res, post);
});
