import type { Request, Response } from 'express';
import { UserModel } from '@models/User';
import { Post, PostModel } from '@models/Post';
import { RateModel, RateTargetModel } from '@models/Rate';
import { POST_RATE_VALUE } from '@constants/index';
import { NotFoundError, ForbiddenError, ERRORS } from '@errors';
import { sendSuccess } from '@utils/response-utils';

interface VoteByIdParams {
  id: string;
}

interface VoteByIdBody {
  negative: boolean;
}

type VoteByIdResponse = Post;

export async function voteById(
  req: Request<VoteByIdParams, unknown, VoteByIdBody>,
  res: Response<VoteByIdResponse>,
) {
  const { userId } = req.session;
  const { id: postId } = req.params;
  const { negative: shouldRateNegative } = req.body;

  const targetPost = await PostModel.findById(postId).select({ author: 1 });

  if (!targetPost) {
    throw new NotFoundError(ERRORS.POST_NOT_FOUND);
  }

  if (targetPost.author.toString() === userId) {
    throw new ForbiddenError(ERRORS.POST_CANT_RATE_OWN);
  }

  const currentUser = await UserModel.exists({ _id: userId });

  if (!currentUser) {
    throw new ForbiddenError(ERRORS.USER_NOT_FOUND);
  }

  const directionValue = shouldRateNegative
    ? -POST_RATE_VALUE
    : POST_RATE_VALUE;

  const rateChange = await RateModel.applyChange({
    userId: userId!,
    targetId: targetPost.id,
    targetModel: RateTargetModel.POST,
    negative: shouldRateNegative,
    rateValue: directionValue,
  });

  if (rateChange.alreadyRated) {
    throw new ForbiddenError(ERRORS.POST_CANT_RATE_ALREADY_RATED);
  }

  const [updatedPost] = await Promise.all([
    PostModel.findByIdAndUpdate(
      targetPost.id,
      { $inc: { rating: rateChange.ratingDelta } },
      { new: true, lean: true },
    ),
    UserModel.updateOne(
      { _id: targetPost.author },
      { $inc: { rating: rateChange.ratingDelta } },
    ),
  ]);

  sendSuccess(res, updatedPost! as Post);
}
