const User = require('../../models/User');
const Rate = require('../../models/Rate');
const Comment = require('../../models/Comment');
const { COMMENT_RATE_VALUE } = require('../../constants');
const { ForbiddenError, NotFoundError } = require('../../errors');
const { success } = require('../../utils/utils');

exports.voteById = async (req, res) => {
  const { userId } = req.session;
  const { id } = req.params;
  const { negative } = req.body;

  const targetComment = await Comment.findById(id);

  if (!targetComment) {
    throw new NotFoundError('Comment does not exist');
  }

  if (targetComment.author._id.toString() === userId) {
    throw new ForbiddenError('Cannot rate your own comment');
  }

  const currentUser = await User.findById(userId).populate('rates');

  const ratedForCurrentUser = currentUser.isRated(targetComment.id);

  if (ratedForCurrentUser.result) {
    throw new ForbiddenError('Cannot rate a comment you have already rated');
  }

  const rateValue = negative ? -COMMENT_RATE_VALUE : COMMENT_RATE_VALUE;

  const newRate = await Rate.create({
    target: targetComment.id,
    targetModel: 'Comment',
    negative,
  });

  await Promise.all([
    User.updateOne({ _id: currentUser.id }, { $push: { rates: newRate.id } }),
    User.updateOne(
      { _id: targetComment.author },
      { $inc: { rating: rateValue } },
    ),
    Comment.updateOne(
      { _id: targetComment.id },
      { $inc: { rating: rateValue } },
    ),
  ]);

  success(req, res);
};
