const User = require('../../models/User');
const Post = require('../../models/Post');
const Rate = require('../../models/Rate');
const consts = require('../../const/const');
const { success, asyncErrorHandler, generateError } = require('../../utils/utils');

exports.voteById = asyncErrorHandler(async (req, res, next) => {
  const { userId } = req.session;
  const { id } = req.params;
  const { negative } = req.body;

  const foundPost = await Post.findById(id);

  if (foundPost) {
    if (foundPost.author.toString() === userId) {
      generateError('Can\'t rate your own post', 405, next);
      return;
    }
    const user = await User.findById(userId).populate('rates');
    const rated = user.isRated(foundPost.id);

    if (!rated.result) {
      foundPost.rating += negative ? -consts.POST_RATE_VALUE : consts.POST_RATE_VALUE;

      Promise.all([
        Rate.create({
          target: foundPost.id,
          targetModel: 'Post',
          negative,
        }),
        foundPost.save(),
        User.findById(foundPost.author),
      ]).then((result) => {
        const newRate = result[0];
        const postAuthor = result[2];

        user.rates.push(newRate._id);
        postAuthor.rating += negative ? -consts.POST_RATE_VALUE : consts.POST_RATE_VALUE;

        user.save();
        postAuthor.save();

        success(req, res);
      }).catch((e) => {
        next(e);
      });
    } else {
      generateError('Can\'t rate post you already rated', 405, next);
    }
  } else {
    generateError('Post doesn\'t exist', 404, next);
  }
});
