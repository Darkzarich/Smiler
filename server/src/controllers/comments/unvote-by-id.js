const User = require('../../models/User');
const Rate = require('../../models/Rate');
const Comment = require('../../models/Comment');
const { COMMENT_RATE_VALUE } = require('../../constants');
const { ForbiddenError, NotFoundError } = require('../../errors');
const { success } = require('../../utils/utils');

exports.unvoteById = async (req, res) => {
  const { userId } = req.session;
  const { id } = req.params;

  const targetComment = await Comment.findById(id).select('author');

  if (!targetComment) {
    throw new NotFoundError('Comment does not exist');
  }

  const currentUser = await User.findById(userId).populate('rates');

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
      // Passing Rate model populated object
      { $pull: { rates: ratedForCurrentUser.rated.id } },
    ),
  ]);

  success(req, res);
};
