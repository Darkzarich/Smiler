import type { Request, Response } from 'express';
import { UserModel } from '../../models/User';
import { ValidationError, ERRORS } from '../../errors/index';
import { POST_MAX_TAG_LEN } from '../../constants/index';
import { sendSuccess } from '../../utils/response-utils';

interface UnfollowParams {
  tag: string;
}

export async function unfollow(req: Request<UnfollowParams>, res: Response) {
  const { tag } = req.params;
  const { userId } = req.session;

  if (tag.length > POST_MAX_TAG_LEN) {
    throw new ValidationError(ERRORS.POST_TAG_MAX_LEN_EXCEEDED);
  }

  await UserModel.findByIdAndUpdate(userId, {
    $pull: {
      tagsFollowed: tag,
    },
  });

  sendSuccess(res);
}
