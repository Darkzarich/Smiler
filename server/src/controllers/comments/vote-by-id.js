const User = require('../../models/User');
const Rate = require('../../models/Rate');
const Comment = require('../../models/Comment');
const { COMMENT_RATE_VALUE } = require('../../constants');
const { success, generateError } = require('../../utils/utils');

exports.voteById = async (req, res, next) => {
  const { userId } = req.session;
  const { id } = req.params;
  const { negative } = req.body;

  const foundComment = await Comment.findById(id);

  if (foundComment) {
    if (foundComment.author._id.toString() === userId) {
      generateError("Can't rate your own comment", 405, next);
      return;
    }

    const user = await User.findById(userId).populate('rates');
    const rated = user.isRated(foundComment.id);

    if (!rated.result) {
      foundComment.rating += negative
        ? -COMMENT_RATE_VALUE
        : COMMENT_RATE_VALUE;

      Promise.all([
        Rate.create({
          target: foundComment.id,
          targetModel: 'Comment',
          negative,
        }),
        foundComment.save(),
        User.findById(foundComment.author),
      ])
        .then((result) => {
          const newRate = result[0];
          const commentAuthor = result[2];

          user.rates.push(newRate._id);
          commentAuthor.rating += negative
            ? -COMMENT_RATE_VALUE
            : COMMENT_RATE_VALUE;

          user.save();
          commentAuthor.save();

          success(req, res);
        })
        .catch((e) => {
          next(e);
        });
    } else {
      generateError("Can't rate comment you already rated", 405, next);
    }
  } else {
    generateError("Comment doesn't exist", 404, next);
  }
};
