const User = require('../../models/User');
const Rate = require('../../models/Rate');
const Comment = require('../../models/Comment');
const { COMMENT_RATE_VALUE } = require('../../constants');
const { ForbiddenError, NotFoundError } = require('../../errors');
const { sendSuccess } = require('../../utils/responseUtils');

exports.voteById = async (req, res) => {
  const { userId } = req.session;
  const { id: commentId } = req.params;
  const { negative } = req.body;

  const targetComment = await Comment.findOne({
    _id: commentId,
    deleted: false,
  }).select('author');

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

  const [updatedComment] = await Promise.all([
    Comment.findOneAndUpdate(
      { _id: targetComment.id },
      { $inc: { rating: rateValue } },
      { new: true },
    ),
    User.updateOne({ _id: currentUser.id }, { $push: { rates: newRate.id } }),
    User.updateOne(
      { _id: targetComment.author },
      { $inc: { rating: rateValue } },
    ),
  ]);

  sendSuccess(res, updatedComment);
};
