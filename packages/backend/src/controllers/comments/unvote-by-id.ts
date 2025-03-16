import User from '../../models/User';
import Rate from '../../models/Rate';
import Comment from '../../models/Comment';
import { COMMENT_RATE_VALUE } from '../../constants/index';
import { ForbiddenError, NotFoundError, ERRORS } from '../../errors/index';
import { sendSuccess } from '../../utils/response-utils';

export async function unvoteById(req, res) {
  const { userId } = req.session;
  const { id: commentId } = req.params;

  const targetComment = await Comment.findOne({
    _id: commentId,
    deleted: false,
  })
    .select('author')
    .lean();

  if (!targetComment) {
    throw new NotFoundError(ERRORS.COMMENT_NOT_FOUND);
  }

  const currentUser = await User.findById(userId)
    .select({ rates: 1 })
    .populate('rates');

  const ratedForCurrentUser = currentUser.isRated(targetComment._id.toString());

  if (!ratedForCurrentUser.result) {
    throw new ForbiddenError(ERRORS.TARGET_IS_NOT_RATED);
  }

  // If the rate was negative increase the rating after removing the rate
  const rateValue = ratedForCurrentUser.negative
    ? COMMENT_RATE_VALUE
    : -COMMENT_RATE_VALUE;

  const [updatedComment] = await Promise.all([
    Comment.findByIdAndUpdate(
      targetComment._id,
      { $inc: { rating: rateValue } },
      { new: true, lean: true },
    ),
    User.updateOne(
      { _id: targetComment.author },
      { $inc: { rating: rateValue } },
    ),
    Rate.deleteOne({ target: targetComment._id }),
    User.updateOne(
      { _id: targetComment.author },
      { $pull: { rates: ratedForCurrentUser.rated._id } },
    ),
  ]);

  sendSuccess(res, updatedComment);
}
