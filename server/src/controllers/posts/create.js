const slugLib = require('slug');

const User = require('../../models/User');
const Post = require('../../models/Post');
const consts = require('../../const/const');
const { success, asyncErrorHandler, generateError } = require('../../utils/utils');

exports.create = asyncErrorHandler(async (req, res, next) => {
  // TODO: rework this | move validation and validate allowed tags, cut attributes

  const { userId } = req.session;
  const { title } = req.body;
  const { tags } = req.body;
  const { sections } = req.body;

  if (!title) { generateError('Title is required', 422, next); return; }
  if (!sections || sections.length < 1) { generateError('At least one section is required', 422, next); return; }
  if (sections.length > consts.POST_SECTIONS_MAX) { generateError('Exceeded max amount of sections', 422, next); return; }
  if (title.length > consts.POST_TITLE_MAX_LENGTH) { generateError('Exceeded max length of title', 422, next); return; }

  if (tags) {
    if (tags.length > consts.POST_MAX_TAGS) { generateError('Too many tags', 422, next); return; }
    if (tags.find(el => el.length > consts.POST_MAX_TAG_LEN)) { generateError('Exceeded max length of a tag', 422, next); return; }
  }

  const textSections = sections.filter(sec => sec.type === consts.POST_SECTION_TYPES.TEXT);
  let typeError = false;
  const textSectionsSumLength = textSections.reduce((acc, el) => {
    // while we go through array we could save some time validating one more thing along the way
    if (!Object.values(consts.POST_SECTION_TYPES).includes(el.type)) {
      typeError = true;
    }

    return acc + el.content.length;
  }, 0);

  if (textSectionsSumLength > consts.POST_SECTIONS_MAX_LENGTH) {
    generateError(`Text sections sum length exceeded max allowed length of ${consts.POST_SECTIONS_MAX_LENGTH} symbols`, 422, next);
    return;
  }

  if (typeError) {
    generateError(`One of sections has unsupported type. Supported types: ${consts.POST_SECTION_TYPES}`, 422, next);
    return;
  }

  const slug = `${slugLib(title)}-${new Date().getTime().toString(36)}`;

  const user = await User.findById(userId).select('template');

  try {
    const post = await Post.create({
      title,
      sections,
      tags,
      slug,
      author: userId,
    });

    user.template.title = '';
    user.template.sections = [];
    user.template.tags = [];

    user.markModified('template');
    await user.save();

    success(req, res, post);
  } catch (e) {
    next(e);
  }
});
