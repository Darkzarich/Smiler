import type { Request } from 'express';
import { UserModel } from '@models/User';
import { RateModel, RateTargetModel } from '@models/Rate';
import { CommentModel } from '@models/Comment';
import {
  COMMENT_AUTHOR_RATING_SHARE,
  COMMENT_RATE_VALUE,
} from '@constants/index';
import { ForbiddenError, NotFoundError, ERRORS } from '@errors';
import { sendSuccess } from '@utils/response-utils';
import type { ApiResponse } from '@libs/api-router';
import type {
  storedCommentSchema,
  CommentIdParams,
} from '@validators/comments';

export async function unvoteById(
  req: Request<CommentIdParams>,
  res: ApiResponse<typeof storedCommentSchema>,
) {
  const { userId } = req.session;
  const { id: commentId } = req.params;

  const targetComment = await CommentModel.findOne({
    _id: commentId,
    deleted: { $ne: true },
  })
    .select('author')
    .lean();

  if (!targetComment) {
    throw new NotFoundError(ERRORS.COMMENT_NOT_FOUND);
  }

  const currentUser = await UserModel.exists({ _id: userId });

  if (!currentUser) {
    throw new ForbiddenError(ERRORS.USER_NOT_FOUND);
  }

  const rate = await RateModel.removeForUser({
    userId: userId!,
    targetId: targetComment._id.toString(),
    targetModel: RateTargetModel.COMMENT,
  });

  if (!rate) {
    throw new ForbiddenError(ERRORS.TARGET_IS_NOT_RATED);
  }

  // If the rate was negative increase the rating after removing the rate
  const rateValue = rate.negative ? COMMENT_RATE_VALUE : -COMMENT_RATE_VALUE;

  const [updatedComment] = await Promise.all([
    CommentModel.findByIdAndUpdate(
      targetComment._id,
      { $inc: { rating: rateValue } },
      { new: true, lean: true },
    ),
    UserModel.updateOne(
      { _id: targetComment.author },
      { $inc: { rating: rateValue * COMMENT_AUTHOR_RATING_SHARE } },
    ),
  ]);

  sendSuccess(res, updatedComment!);
}
