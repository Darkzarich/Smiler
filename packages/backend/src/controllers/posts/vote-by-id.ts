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

  const currentUser = await UserModel.findById(userId)
    .select({ rates: 1 })
    .populate('rates');

  if (!currentUser) {
    throw new ForbiddenError(ERRORS.USER_NOT_FOUND);
  }

  const {
    rated: rateDoc,
    negative: currentRate,
    result: isRated,
  } = currentUser.isRated(targetPost.id);

  // If is already rated and rated for the same direction
  if (isRated && currentRate === shouldRateNegative) {
    throw new ForbiddenError(ERRORS.POST_CANT_RATE_ALREADY_RATED);
  }

  const directionValue = shouldRateNegative
    ? -POST_RATE_VALUE
    : POST_RATE_VALUE;
  // If is already rated that rate value to the other direction should be doubled
  const rateValue = isRated ? directionValue * 2 : directionValue;

  // TODO: Use transaction here
  const promises: Promise<any>[] = [
    PostModel.findByIdAndUpdate(
      targetPost.id,
      { $inc: { rating: rateValue } },
      { new: true, lean: true },
    ),
    UserModel.updateOne(
      { _id: targetPost.author },
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
      target: targetPost.id,
      targetModel: RateTargetModel.POST,
      negative: shouldRateNegative,
    });

    promises.push(
      UserModel.updateOne(
        { _id: currentUser.id },
        { $push: { rates: newRate.id } },
      ),
    );
  }

  const [updatedPost] = await Promise.all(promises);

  sendSuccess(res, updatedPost! as Post);
}
