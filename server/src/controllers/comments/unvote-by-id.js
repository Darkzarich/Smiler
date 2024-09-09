import User from '../../models/User.js';
import Rate from '../../models/Rate.js';
import Comment from '../../models/Comment.js';
import { COMMENT_RATE_VALUE } from '../../constants/index.js';
import { ForbiddenError, NotFoundError } from '../../errors/index.js';
import { sendSuccess } from '../../utils/responseUtils.js';

export async function unvoteById(req, res) {
  const { userId } = req.session;
  const { id: commentId } = req.params;

  const targetComment = await Comment.findOne({
    _id: commentId,
    deleted: false,
  }).select('author');

  if (!targetComment) {
    throw new NotFoundError('Comment does not exist');
  }

  const currentUser = await User.findById(userId)
    .select({ rates: 1 })
    .populate('rates');

  const ratedForCurrentUser = currentUser.isRated(targetComment.id);

  if (!ratedForCurrentUser.result) {
    throw new ForbiddenError('Target comment is not rated by the current user');
  }

  // If the rate was negative increase the rating after removing the rate
  const rateValue = ratedForCurrentUser.negative
    ? COMMENT_RATE_VALUE
    : -COMMENT_RATE_VALUE;

  const [updatedComment] = await Promise.all([
    Comment.findByIdAndUpdate(
      targetComment.id,
      { $inc: { rating: rateValue } },
      { new: true, lean: true },
    ),
    User.updateOne(
      { _id: targetComment.author },
      { $inc: { rating: rateValue } },
    ),
    Rate.deleteOne({ target: targetComment.id }),
    User.updateOne(
      { _id: targetComment.author },
      { $pull: { rates: ratedForCurrentUser.rated._id } },
    ),
  ]);

  sendSuccess(res, updatedComment);
}
