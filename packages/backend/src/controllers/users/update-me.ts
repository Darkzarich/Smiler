import type { Request, Response } from 'express';
import { UserModel } from '../../models/User';
import { NotFoundError, ERRORS } from '../../errors/index';
import { sendSuccess } from '../../utils/response-utils';

export async function updateMe(req: Request, res: Response) {
  const { userId } = req.session!;
  const update = req.body;

  const updatedUser = await UserModel.findByIdAndUpdate(userId, update, {
    runValidators: true,
    new: true,
    lean: true,
  });

  if (!updatedUser) {
    throw new NotFoundError(ERRORS.USER_NOT_FOUND);
  }

  sendSuccess(res, updatedUser);
}
