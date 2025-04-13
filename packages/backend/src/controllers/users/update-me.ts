import type { Request, Response } from 'express';
import { User, UserModel } from '@models/User';
import { NotFoundError, ERRORS } from '@errors';
import { sendSuccess } from '@utils/response-utils';

type UpdateMeBody = Partial<Omit<User, 'isFollowed' | '_id' | 'hash'>>;

type UpdateMeResponse = Omit<User, 'isFollowed' | '_id' | 'hash'>;

export async function updateMe(
  req: Request<unknown, unknown, UpdateMeBody>,
  res: Response<UpdateMeResponse>,
) {
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
