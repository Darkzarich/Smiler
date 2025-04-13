import type { Request, Response } from 'express';
import { UserModel, UserTemplate } from '@models/User';
import { ForbiddenError, NotFoundError, ERRORS } from '@errors/index';
import { sendSuccess } from '@utils/response-utils';

type GetPostTemplateResponse = UserTemplate;

export async function getPostTemplate(
  req: Request,
  res: Response<GetPostTemplateResponse>,
) {
  if (req.session.userId !== req.params.id) {
    throw new ForbiddenError(ERRORS.TEMPLATE_CANT_SEE_NOT_OWN);
  }

  const template = await UserModel.findById(req.session.userId)
    .select('template')
    .lean();

  if (!template) {
    throw new NotFoundError(ERRORS.USER_NOT_FOUND);
  }

  sendSuccess(res, template.template);
}
