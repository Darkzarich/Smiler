import type { Request } from 'express';
import { isUndefined, omitBy } from 'lodash';
import { UserModel } from '@models/User';
import { ValidationError, ERRORS } from '@errors';
import { sendSuccess } from '@utils/response-utils';
import type { ApiResponse } from '@libs/api-router';
import type { postTemplateSchema } from '@validators/users';
import {
  assertOwnUploadedPictures,
  type PostTemplateBody,
} from '@validators/posts';

export async function updateMyPostTemplate(
  req: Request<unknown, unknown, PostTemplateBody>,
  res: ApiResponse<typeof postTemplateSchema>,
) {
  const { userId } = req.session;
  const { title, sections, tags } = req.body;

  if (sections) {
    assertOwnUploadedPictures(sections, userId!);
  }

  const updatedUser = await UserModel.findByIdAndUpdate(
    userId,
    {
      $set: {
        // A field the request left out keeps the value it already had: the
        // editor saves whichever part of the draft changed, not the whole of it.
        ...omitBy(
          {
            'template.title': title,
            'template.tags': tags,
            'template.sections': sections,
          },
          isUndefined,
        ),
        // Stamped on every write, including one that changed nothing: the
        // client compares it against the draft it keeps locally.
        'template.updatedAt': new Date(),
      },
    },
    { new: true, lean: true },
  );

  if (!updatedUser) {
    throw new ValidationError(ERRORS.USER_NOT_FOUND);
  }

  sendSuccess(res, updatedUser.template);
}
