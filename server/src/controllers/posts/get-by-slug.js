const User = require('../../models/User');
const Post = require('../../models/Post');
const { success, asyncErrorHandler, generateError } = require('../../utils/utils');

exports.getBySlug = asyncErrorHandler(async (req, res, next) => {
  const { slug } = req.params;
  const { userId } = req.session;

  // TODO: predownload using params

  if (!slug) { generateError('slug is required', 422, next); return; }

  try {
    Promise.all([
      Post.findOne({
        slug,
      }).populate('author', 'login avatar'),
      User.findById(userId).select('rates').populate('rates'),
    ]).then((result) => {
      const post = result[0];
      const user = result[1];

      if (!post) {
        generateError('Post doesn\'t exist', 404, next);
      } else {
        success(req, res, post.toResponse(user));
      }
    }).catch((e) => {
      next(e);
    });
  } catch (e) {
    next(e);
  }
});
