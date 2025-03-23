import type { Request, Response } from 'express';
import { UserModel } from '../../models/User';
import { ForbiddenError, ERRORS } from '../../errors/index';
import { sendSuccess } from '../../utils/response-utils';

export async function getPostTemplate(req: Request, res: Response) {
  if (req.session.userId !== req.params.id) {
    throw new ForbiddenError(ERRORS.TEMPLATE_CANT_SEE_NOT_OWN);
  }

  const template = await UserModel.findById(req.session.userId)
    .select('template')
    .lean();

  sendSuccess(res, template.template);
}
