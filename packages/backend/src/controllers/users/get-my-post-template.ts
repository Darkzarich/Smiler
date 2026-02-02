import type { Request, Response } from 'express';
import { UserModel, UserTemplate } from '@models/User';
import { NotFoundError, ERRORS } from '@errors';
import { sendSuccess } from '@utils/response-utils';

type GetMyPostTemplateResponse = UserTemplate;

export async function getMyPostTemplate(
  req: Request,
  res: Response<GetMyPostTemplateResponse>,
) {
  const template = await UserModel.findById(req.session.userId)
    .select('template')
    .lean();

  if (!template) {
    throw new NotFoundError(ERRORS.USER_NOT_FOUND);
  }

  sendSuccess(res, template.template);
}
