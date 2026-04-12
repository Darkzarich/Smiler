import type { Request, Response } from 'express';
import { isUndefined, omitBy } from 'lodash';
import { UserModel, UserTemplate } from '@models/User';
import { ValidationError, ERRORS } from '@errors';
import { sendSuccess } from '@utils/response-utils';
import { PostValidator } from '@validators/PostValidator';

type UpdateMyPostTemplateBody = Partial<UserTemplate>;

type UpdateMyPostTemplateResponse = UserTemplate;

export async function updateMyPostTemplate(
  req: Request<unknown, unknown, UpdateMyPostTemplateBody>,
  res: Response<UpdateMyPostTemplateResponse>,
) {
  const { userId } = req.session;
  const { title, sections, tags } = PostValidator.validateTemplate(req.body);

  const updatedUser = await UserModel.findByIdAndUpdate(
    userId,
    {
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
