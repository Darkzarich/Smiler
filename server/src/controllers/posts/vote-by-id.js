const User = require('../../models/User');
const Post = require('../../models/Post');
const Rate = require('../../models/Rate');
const { POST_RATE_VALUE } = require('../../constants');
const { NotFoundError, ForbiddenError } = require('../../errors');
const { sendSuccess } = require('../../utils/responseUtils');

exports.voteById = async (req, res) => {
  const { userId } = req.session;
  const { id: postId } = req.params;
  const { negative } = req.body;

  const targetPost = await Post.findById(postId).select({ author: 1 });

  if (!targetPost) {
    throw new NotFoundError("Post doesn't exist");
  }

  if (targetPost.author.toString() === userId) {
    throw new ForbiddenError("Can't rate your own post");
  }

  const currentUser = await User.findById(userId)
    .select({ rates: 1 })
    .populate('rates');

  const ratedForCurrentUser = currentUser.isRated(targetPost.id);

  if (ratedForCurrentUser.result) {
    throw new ForbiddenError("Can't rate a post you have already rated");
  }

  const rateValue = negative ? -POST_RATE_VALUE : POST_RATE_VALUE;

  const newRate = await Rate.create({
    target: targetPost.id,
    targetModel: 'Post',
    negative,
  });

  const [updatedPost] = await Promise.all([
    Post.findByIdAndUpdate(
      targetPost.id,
      { $inc: { rating: rateValue } },
      { new: true, lean: true },
    ),
    User.updateOne({ _id: targetPost.author }, { $inc: { rating: rateValue } }),
    User.updateOne({ _id: currentUser.id }, { $push: { rates: newRate.id } }),
  ]);

  sendSuccess(res, updatedPost);
};
