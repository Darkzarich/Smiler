import User from '../../models/User.js';
import Rate from '../../models/Rate.js';
import Comment from '../../models/Comment.js';
import { COMMENT_RATE_VALUE } from '../../constants/index.js';
import { ForbiddenError, NotFoundError, ERRORS } from '../../errors/index.js';
import { sendSuccess } from '../../utils/responseUtils.js';

export async function voteById(req, res) {
  const { userId } = req.session;
  const { id: commentId } = req.params;
  const { negative } = req.body;

  const targetComment = await Comment.findOne({
    _id: commentId,
    deleted: false,
  }).select('author');

  if (!targetComment) {
    throw new NotFoundError(ERRORS.COMMENT_NOT_FOUND);
  }

  if (targetComment.author._id.toString() === userId) {
    throw new ForbiddenError(ERRORS.COMMENT_CANT_RATE_OWN);
  }

  const currentUser = await User.findById(userId).populate('rates');

  const ratedForCurrentUser = currentUser.isRated(targetComment.id);

  if (ratedForCurrentUser.result) {
    throw new ForbiddenError(ERRORS.COMMENT_CANT_RATE_ALREADY_RATED);
  }

  const rateValue = negative ? -COMMENT_RATE_VALUE : COMMENT_RATE_VALUE;

  const newRate = await Rate.create({
    target: targetComment.id,
    targetModel: 'Comment',
    negative,
  });

  const [updatedComment] = await Promise.all([
    Comment.findByIdAndUpdate(
      targetComment.id,
      { $inc: { rating: rateValue } },
      { new: true, lean: true },
    ),
    User.updateOne({ _id: currentUser.id }, { $push: { rates: newRate.id } }),
    User.updateOne(
      { _id: targetComment.author },
      { $inc: { rating: rateValue } },
    ),
  ]);

  sendSuccess(res, updatedComment);
}
