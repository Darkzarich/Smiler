const User = require('../../models/User');
const Rate = require('../../models/Rate');
const Comment = require('../../models/Comment');
const { COMMENT_RATE_VALUE } = require('../../constants');
const { ForbiddenError, NotFoundError } = require('../../errors');
const { sendSuccess } = require('../../utils/responseUtils');

exports.unvoteById = async (req, res) => {
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

  await Promise.all([
    User.updateOne(
      { _id: targetComment.author },
      { $inc: { rating: rateValue } },
    ),
    Comment.updateOne(
      { _id: targetComment.id },
      { $inc: { rating: rateValue } },
    ),
    Rate.deleteOne({ target: targetComment.id }),
    User.updateOne(
      { _id: targetComment.author },
      { $pull: { rates: ratedForCurrentUser.rated._id } },
    ),
  ]);

  sendSuccess(res);
};
