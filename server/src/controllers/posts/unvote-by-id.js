const User = require('../../models/User');
const Post = require('../../models/Post');
const Rate = require('../../models/Rate');
const { POST_RATE_VALUE } = require('../../constants');
const { NotFoundError, ForbiddenError } = require('../../errors');
const { sendSuccess } = require('../../utils/responseUtils');

exports.unvoteById = async (req, res) => {
  const { userId } = req.session;
  const { id: postId } = req.params;

  const targetPost = await Post.findById(postId).select({ author: 1 });

  if (!targetPost) {
    throw new NotFoundError('Post does not exist');
  }

  const currentUser = await User.findById(userId)
    .select({ rates: 1 })
    .populate('rates');

  const ratedForCurrentUser = currentUser.isRated(targetPost.id);

  if (!ratedForCurrentUser.result) {
    throw new ForbiddenError('Target post is not rated by the current user');
  }

  const rateValue = ratedForCurrentUser.negative
    ? POST_RATE_VALUE
    : -POST_RATE_VALUE;

  const [updatedPost] = await Promise.all([
    Post.findByIdAndUpdate(
      targetPost.id,
      { $inc: { rating: rateValue } },
      { new: true, lean: true },
    ),
    User.updateOne({ _id: targetPost.author }, { $inc: { rating: rateValue } }),
    User.updateOne(
      { _id: currentUser.id },
      { $pull: { rates: ratedForCurrentUser.rated._id } },
    ),
    Rate.deleteOne({ target: targetPost.id }),
  ]);

  sendSuccess(res, updatedPost);
};
