const User = require('../../models/User');
const Post = require('../../models/Post');
const { success, generateError } = require('../../utils/utils');

exports.getBySlug = async (req, res, next) => {
  const { userId } = req.session;

  const { slug } = req.params;

  const [post, user] = await Promise.all([
    Post.findOne({
      slug,
    }).populate('author', 'login avatar'),
    User.findById(userId).select('rates').populate('rates'),
  ]);

  if (!post) {
    return generateError("Post doesn't exist", 404, next);
  }

  success(req, res, post.toResponse(user));
};
