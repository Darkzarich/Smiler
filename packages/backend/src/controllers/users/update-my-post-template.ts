import type { Request, Response } from 'express';
import { isUndefined, omitBy } from 'lodash';
import { UserModel, UserTemplate } from '@models/User';
import { ValidationError, ERRORS } from '@errors';
import { sendSuccess } from '@utils/response-utils';
import {
  assertOwnUploadedPictures,
  type PostTemplateBody,
} from '@validators/posts';

type UpdateMyPostTemplateResponse = UserTemplate;

export async function updateMyPostTemplate(
  req: Request<unknown, unknown, PostTemplateBody>,
  res: Response<UpdateMyPostTemplateResponse>,
) {
  const { userId } = req.session;
  const { title, sections, tags } = req.body;

  if (sections) {
    assertOwnUploadedPictures(sections, userId!);
  }

  const updatedUser = await UserModel.findByIdAndUpdate(
    userId,
    {
      // A field the request left out keeps the value it already had: the editor
      // saves whichever part of the draft changed, not the whole of it.
      $set: omitBy(
        {
          'template.title': title,
          'template.tags': tags,
          'template.sections': sections,
        },
        isUndefined,
      ),
    },
    { new: true, lean: true },
  );

  if (!updatedUser) {
    throw new ValidationError(ERRORS.USER_NOT_FOUND);
  }

  sendSuccess(res, updatedUser.template);
}
