import type { Request } from 'express';
import { UserModel } from '@models/User';
import { NotFoundError, ERRORS } from '@errors';
import { sendSuccess } from '@utils/response-utils';
import type { ApiResponse } from '@libs/api-router';
import type { postTemplateSchema } from '@validators/users';

export async function getMyPostTemplate(
  req: Request,
  res: ApiResponse<typeof postTemplateSchema>,
) {
  const template = await UserModel.findById(req.session.userId)
    .select('template')
    .lean();

  if (!template) {
    throw new NotFoundError(ERRORS.USER_NOT_FOUND);
  }

  sendSuccess(res, template.template);
}
