import type { Request, Response } from 'express';
import { UserModel } from '@models/User';
import { RateModel, RateTargetModel } from '@models/Rate';
import { CommentModel, Comment } from '@models/Comment';
import { COMMENT_RATE_VALUE } from '@constants/index';
import { ForbiddenError, NotFoundError, ERRORS } from '@errors';
import { sendSuccess } from '@utils/response-utils';

interface VoteByIdParams {
  id: string;
}

interface VoteByIdBody {
  negative: boolean;
}

type VoteByIdResponse = Comment;

export async function voteById(
  req: Request<VoteByIdParams, unknown, VoteByIdBody>,
  res: Response<VoteByIdResponse>,
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
      { $inc: { rating: rateChange.ratingDelta } },
    ),
    UserModel.updateOne(
      { _id: userId },
      { $addToSet: { rates: rateChange.rate._id } },
    ),
  ]);

  sendSuccess(res, updatedComment! as Comment);
}
