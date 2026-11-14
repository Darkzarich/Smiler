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
import type { VoteBody } from '@validators/common';

export async function voteById(
  req: Request<CommentIdParams, unknown, VoteBody>,
  res: ApiResponse<typeof storedCommentSchema>,
) {
  const { userId } = req.session;
  const { id: commentId } = req.params;
  const { negative: shouldRateNegative } = req.body;

  const targetComment = await CommentModel.findOne({
    _id: commentId,
    deleted: { $ne: true },
  })
    .select({ author: 1 })
    .lean();

  if (!targetComment) {
    throw new NotFoundError(ERRORS.COMMENT_NOT_FOUND);
  }

  if (targetComment.author.toString() === userId) {
    throw new ForbiddenError(ERRORS.COMMENT_CANT_RATE_OWN);
  }

  const currentUser = await UserModel.exists({ _id: userId });

  if (!currentUser) {
    throw new ForbiddenError(ERRORS.USER_NOT_FOUND);
  }

  const directionValue = shouldRateNegative
    ? -COMMENT_RATE_VALUE
    : COMMENT_RATE_VALUE;

  const rateChange = await RateModel.applyChange({
    userId: userId!,
    targetId: targetComment._id.toString(),
    targetModel: RateTargetModel.COMMENT,
    negative: shouldRateNegative,
    rateValue: directionValue,
  });

  if (rateChange.alreadyRated) {
    throw new ForbiddenError(ERRORS.COMMENT_CANT_RATE_ALREADY_RATED);
  }

  const [updatedComment] = await Promise.all([
    CommentModel.findByIdAndUpdate(
      targetComment._id,
      { $inc: { rating: rateChange.ratingDelta } },
      { new: true, lean: true },
    ),
    UserModel.updateOne(
      { _id: targetComment.author },
      {
        $inc: {
          rating: rateChange.ratingDelta * COMMENT_AUTHOR_RATING_SHARE,
        },
      },
    ),
  ]);

  sendSuccess(res, updatedComment!);
}
