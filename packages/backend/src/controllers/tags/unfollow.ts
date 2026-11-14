import type { Request } from 'express';
import { UserModel } from '@models/User';
import { sendSuccess } from '@utils/response-utils';
import type { ApiResponse } from '@libs/api-router';
import type { okResponseSchema } from '@validators/common';
import type { TagParams } from '@validators/tags';

export async function unfollow(
  req: Request<TagParams>,
  res: ApiResponse<typeof okResponseSchema>,
) {
  const { tag } = req.params;
  const { userId } = req.session;

  await UserModel.findByIdAndUpdate(userId, {
    $pull: {
      tagsFollowed: tag,
    },
  });

  sendSuccess(res);
}
