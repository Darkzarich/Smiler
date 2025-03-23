import type { Request, Response } from 'express';
import { UserModel } from '../../models/User';
import { PostModel } from '../../models/Post';
import { RateModel } from '../../models/Rate';
import { POST_RATE_VALUE } from '../../constants/index';
import { NotFoundError, ForbiddenError, ERRORS } from '../../errors/index';
import { sendSuccess } from '../../utils/response-utils';

export async function unvoteById(req: Request, res: Response) {
  const { userId } = req.session;
  const { id: postId } = req.params;

  const targetPost = await PostModel.findById(postId).select({ author: 1 });

  if (!targetPost) {
    throw new NotFoundError(ERRORS.POST_NOT_FOUND);
  }

  const currentUser = await UserModel.findById(userId)
    .select({ rates: 1 })
    .populate('rates');

  if (!currentUser) {
    throw new NotFoundError(ERRORS.USER_NOT_FOUND);
  }

  const ratedForCurrentUser = currentUser.isRated(targetPost.id);

  if (!ratedForCurrentUser.result) {
    throw new ForbiddenError(ERRORS.TARGET_IS_NOT_RATED);
  }

  const rateValue = ratedForCurrentUser.negative
    ? POST_RATE_VALUE
    : -POST_RATE_VALUE;

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
      { $pull: { rates: ratedForCurrentUser.rated?._id } },
    ),
    RateModel.deleteOne({ target: targetPost.id }),
  ]);

  if (!updatedPost) {
    throw new NotFoundError(ERRORS.POST_NOT_FOUND);
  }

  sendSuccess(res, updatedPost);
}
