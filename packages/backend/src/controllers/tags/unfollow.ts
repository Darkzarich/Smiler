import type { Request, Response } from 'express';
import { UserModel } from '@models/User';
import { sendSuccess } from '@utils/response-utils';
import type { TagParams } from '@validators/tags';

export async function unfollow(req: Request<TagParams>, res: Response) {
  const { tag } = req.params;
  const { userId } = req.session;

  await UserModel.findByIdAndUpdate(userId, {
    $pull: {
      tagsFollowed: tag,
    },
  });

  sendSuccess(res);
}
