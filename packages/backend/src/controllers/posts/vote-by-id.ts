import type { Request, Response } from 'express';
import { UserModel } from '../../models/User';
import { PostModel } from '../../models/Post';
import { RateModel } from '../../models/Rate';
import { POST_RATE_VALUE } from '../../constants/index';
import { NotFoundError, ForbiddenError, ERRORS } from '../../errors/index';
import { sendSuccess } from '../../utils/response-utils';

export async function voteById(req: Request, res: Response) {
  const { userId } = req.session;
  const { id: postId } = req.params;
  const { negative } = req.body;

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

  const ratedForCurrentUser = currentUser.isRated(targetPost.id);

  if (ratedForCurrentUser.result) {
    throw new ForbiddenError(ERRORS.POST_CANT_RATE_ALREADY_RATED);
  }

  const rateValue = negative ? -POST_RATE_VALUE : POST_RATE_VALUE;

  const newRate = await RateModel.create({
    target: targetPost.id,
    targetModel: 'Post',
    negative,
  });

  const [updatedPost] = await Promise.all([
    PostModel.findByIdAndUpdate(
      targetPost.id,
      { $inc: { rating: rateValue } },
      { new: true, lean: true },
    ),
    UserModel.updateOne(
      { _id: targetPost.author },
      { $inc: { rating: rateValue } },
    ),
    UserModel.updateOne(
      { _id: currentUser.id },
      { $push: { rates: newRate.id } },
    ),
  ]);

  sendSuccess(res, updatedPost);
}
