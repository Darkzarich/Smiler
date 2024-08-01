const User = require('../../models/User');
const Post = require('../../models/Post');
const Rate = require('../../models/Rate');
const { POST_RATE_VALUE } = require('../../constants');
const { success, generateError } = require('../../utils/utils');

exports.unvoteById = async (req, res, next) => {
  const { userId } = req.session;
  const { id } = req.params;

  const foundPost = await Post.findById(id);

  if (foundPost) {
    const user = await User.findById(userId).populate('rates');
    const rated = user.isRated(foundPost.id);

    if (rated.result) {
      foundPost.rating += rated.negative ? POST_RATE_VALUE : -POST_RATE_VALUE;

      Promise.all([
        Rate.deleteOne({
          target: foundPost.id,
        }),
        foundPost.save(),
        User.findById(foundPost.author),
      ])
        .then((result) => {
          const postAuthor = result[2];

          user.rates.remove(rated.rated);
          postAuthor.rating += rated.negative
            ? POST_RATE_VALUE
            : -POST_RATE_VALUE;

          user.save();
          postAuthor.save();

          success(req, res);
        })
        .catch((e) => {
          next(e);
        });
    } else {
      generateError("You didn't rate this post", 405, next);
    }
  } else {
    generateError("Post doesn't exist", 404, next);
  }
};
