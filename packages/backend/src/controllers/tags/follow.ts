import type { Request, Response } from 'express';
import { UserModel } from '@models/User';
import { sendSuccess } from '@utils/response-utils';
import type { TagParams } from '@validators/tags';

export async function follow(req: Request<TagParams>, res: Response) {
  const { tag } = req.params;
  const { userId } = req.session;

  await UserModel.findByIdAndUpdate(userId, {
    $addToSet: {
      tagsFollowed: tag,
    },
  });

  sendSuccess(res);
}
