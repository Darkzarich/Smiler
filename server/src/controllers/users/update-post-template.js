import User from '../../models/User.js';

import { ForbiddenError, ValidationError, ERRORS } from '../../errors/index.js';
import { sendSuccess } from '../../utils/responseUtils.js';
import { POST_MAX_TAGS, POST_MAX_TAG_LEN } from '../../constants/index.js';

export async function updatePostTemplate(req, res) {
  // TODO: validate title, sections just like in posts

  const { sections } = req.body;
  const { tags } = req.body;
  const { title } = req.body;

  if (req.session.userId !== req.params.id) {
    throw new ForbiddenError(ERRORS.TEMPLATE_CANT_SAVE_NOT_OWN);
  }

  if (tags) {
    if (tags.length > POST_MAX_TAGS) {
      throw new ValidationError(ERRORS.POST_MAX_TAGS_EXCEEDED);
    }

    if (tags.some((el) => el.length > POST_MAX_TAG_LEN)) {
      throw new ValidationError(ERRORS.POST_TAG_MAX_LEN_EXCEEDED);
    }
  }

  const userTemplate = await User.findById(req.session.userId).select(
    'template',
  );

  userTemplate.template = {
    title: title || userTemplate.template.title,
    tags: tags || userTemplate.template.tags,
    sections: sections || userTemplate.template.sections,
  };

  userTemplate.markModified('template');

  await userTemplate.save();

  sendSuccess(res, userTemplate.template);
}
