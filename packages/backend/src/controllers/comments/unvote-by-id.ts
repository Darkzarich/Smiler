import type { Request, Response } from 'express';
import { UserModel } from '@models/User';
import { RateModel } from '@models/Rate';
import { Comment, CommentModel } from '@models/Comment';
import { COMMENT_RATE_VALUE } from '@constants/index';
import { ForbiddenError, NotFoundError, ERRORS } from '@errors';
import { sendSuccess } from '@utils/response-utils';

interface UnvoteByIdParams {
  id: string;
}

type UnvoteByIdResponse = Comment;

export async function unvoteById(
  req: Request<UnvoteByIdParams>,
  res: Response<UnvoteByIdResponse>,
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

  const currentUser = await UserModel.findById(userId)
    .select({ rates: 1 })
    .populate('rates');

  if (!currentUser) {
    throw new ForbiddenError(ERRORS.USER_NOT_FOUND);
  }

  const ratedForCurrentUser = currentUser.isRated(targetComment._id.toString());

  if (!ratedForCurrentUser.result) {
    throw new ForbiddenError(ERRORS.TARGET_IS_NOT_RATED);
  }

  // If the rate was negative increase the rating after removing the rate
  const rateValue = ratedForCurrentUser.negative
    ? COMMENT_RATE_VALUE
    : -COMMENT_RATE_VALUE;

  // TODO: Use transaction here
  const [updatedComment] = await Promise.all([
    CommentModel.findByIdAndUpdate(
      targetComment._id,
      { $inc: { rating: rateValue } },
      { new: true, lean: true },
    ),
    UserModel.updateOne(
      { _id: targetComment.author },
      { $inc: { rating: rateValue } },
    ),
    RateModel.deleteOne({ target: targetComment._id }),
    UserModel.updateOne(
      { _id: targetComment.author },
      { $pull: { rates: ratedForCurrentUser.rated!._id } },
    ),
  ]);

  sendSuccess(res, updatedComment!);
}
