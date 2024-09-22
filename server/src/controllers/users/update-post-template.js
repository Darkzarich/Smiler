import User from '../../models/User.js';

import { ForbiddenError, ValidationError } from '../../errors/index.js';
import { sendSuccess } from '../../utils/responseUtils.js';
import { POST_MAX_TAGS, POST_MAX_TAG_LEN } from '../../constants/index.js';

export async function updatePostTemplate(req, res) {
  // TODO: validate title, sections just like in posts

  const { sections } = req.body;
  const { tags } = req.body;
  const { title } = req.body;

  if (req.session.userId !== req.params.id) {
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

  userTemplate.template = {
    title: title || userTemplate.template.title,
    tags: tags || userTemplate.template.tags,
    sections: sections || userTemplate.template.sections,
  };

  userTemplate.markModified('template');

  await userTemplate.save();

  sendSuccess(res, userTemplate.template);
}
