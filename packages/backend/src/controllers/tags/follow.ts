import type { Request, Response } from 'express';
import User from '../../models/User';
import { ValidationError, ERRORS } from '../../errors/index';
import { POST_MAX_TAG_LEN } from '../../constants/index';
import { sendSuccess } from '../../utils/response-utils';

export async function follow(req: Request, res: Response) {
  const { tag } = req.params;
  const { userId } = req.session;

  if (tag.length > POST_MAX_TAG_LEN) {
    throw new ValidationError(ERRORS.POST_TAG_MAX_LEN_EXCEEDED);
  }

  await User.findByIdAndUpdate(userId, {
    $addToSet: {
      tagsFollowed: tag,
    },
  });

  sendSuccess(res);
}
