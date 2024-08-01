const User = require('../../models/User');
const Rate = require('../../models/Rate');
const Comment = require('../../models/Comment');
const { COMMENT_RATE_VALUE } = require('../../constants');
const { success, generateError } = require('../../utils/utils');

exports.unvoteById = async (req, res, next) => {
  const { userId } = req.session;
  const { id } = req.params;

  const foundComment = await Comment.findById(id);

  if (foundComment) {
    const user = await User.findById(userId).populate('rates');
    const rated = user.isRated(foundComment.id);

    if (rated.result) {
      foundComment.rating += rated.negative
        ? COMMENT_RATE_VALUE
        : -COMMENT_RATE_VALUE;

      Promise.all([
        Rate.deleteOne({
          target: foundComment.id,
        }),
        foundComment.save(),
        User.findById(foundComment.author),
      ])
        .then((result) => {
          const commentAuthor = result[2];

          user.rates.remove(rated.rated);
          commentAuthor.rating += rated.negative
            ? COMMENT_RATE_VALUE
            : -COMMENT_RATE_VALUE;

          user.save();
          commentAuthor.save();

          success(req, res);
        })
        .catch((e) => {
          next(e);
        });
    } else {
      generateError("You didn't rate this comment", 405, next);
    }
  } else {
    generateError("Comment doesn't exist", 404, next);
  }
};
