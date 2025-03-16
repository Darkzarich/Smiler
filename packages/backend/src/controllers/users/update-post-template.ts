import type { Request, Response } from 'express';
import { identity, pickBy } from 'lodash-es';
import User from '../../models/User';

import { ValidationError, ERRORS } from '../../errors/index';
import { sendSuccess } from '../../utils/response-utils';
import {
  POST_MAX_TAGS,
  POST_MAX_TAG_LEN,
  POST_TITLE_MAX_LENGTH,
  POST_SECTIONS_MAX,
} from '../../constants/index';

export async function updatePostTemplate(req: Request, res: Response) {
  // TODO: validate title, sections just like in posts

  const { userId } = req.session;
  const { sections } = req.body;
  const { tags } = req.body;
  const { title } = req.body;

  if (title && title.length > POST_TITLE_MAX_LENGTH) {
    throw new ValidationError(ERRORS.POST_TITLE_MAX_LENGTH_EXCEEDED);
  }

  if (tags) {
    if (tags.length > POST_MAX_TAGS) {
      throw new ValidationError(ERRORS.POST_MAX_TAGS_EXCEEDED);
    }

    if (tags.some((el) => el.length > POST_MAX_TAG_LEN)) {
      throw new ValidationError(ERRORS.POST_TAG_MAX_LEN_EXCEEDED);
    }
  }

  if (sections && sections.length > POST_SECTIONS_MAX) {
    throw new ValidationError(ERRORS.POST_SECTIONS_MAX_EXCEEDED);
  }

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    {
      $set: pickBy(
        {
          'template.title': title,
          'template.tags': tags,
          'template.sections': sections,
        },
        identity,
      ),
    },
    { new: true, lean: true },
  );

  sendSuccess(res, updatedUser.template);
}
