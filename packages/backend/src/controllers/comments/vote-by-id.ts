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

  const currentUser = await UserModel.findById(userId).populate('rates');

  if (!currentUser) {
    throw new ForbiddenError(ERRORS.USER_NOT_FOUND);
  }

  const {
    rated: rateDoc,
    negative: currentRate,
    result: isRated,
  } = currentUser.isRated(targetComment._id.toString());

  // If is already rated and rated for the same direction
  if (isRated && currentRate === shouldRateNegative) {
    throw new ForbiddenError(ERRORS.COMMENT_CANT_RATE_ALREADY_RATED);
  }

  const directionValue = shouldRateNegative
    ? -COMMENT_RATE_VALUE
    : COMMENT_RATE_VALUE;
  // If is already rated that rate value to the other direction should be doubled
  const rateValue = isRated ? directionValue * 2 : directionValue;

  // TODO: Use transaction here
  const promises: Promise<any>[] = [
    CommentModel.findByIdAndUpdate(
      targetComment._id,
      { $inc: { rating: rateValue } },
      { new: true, lean: true },
    ),
    UserModel.updateOne(
      { _id: targetComment.author },
      { $inc: { rating: rateValue } },
    ),
  ];

  if (isRated) {
    promises.push(
      RateModel.updateOne(
        { _id: rateDoc!._id },
        {
          $set: { negative: shouldRateNegative },
        },
      ),
    );
  } else {
    const newRate = await RateModel.create({
      target: targetComment._id,
      targetModel: RateTargetModel.COMMENT,
      negative: shouldRateNegative,
    });

    promises.push(
      UserModel.updateOne(
        { _id: currentUser.id },
        { $push: { rates: newRate.id } },
      ),
    );
  }

  const [updatedComment] = await Promise.all(promises);

  sendSuccess(res, updatedComment! as Comment);
}
