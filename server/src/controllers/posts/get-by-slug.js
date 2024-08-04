const User = require('../../models/User');
const Post = require('../../models/Post');
const { NotFoundError } = require('../../errors');
const { success } = require('../../utils/utils');

exports.getBySlug = async (req, res) => {
  const { userId } = req.session;

  const { slug } = req.params;

  const [post, user] = await Promise.all([
    Post.findOne({
      slug,
    }).populate('author', 'login avatar'),
    User.findById(userId).select('rates').populate('rates'),
  ]);

  if (!post) {
    throw new NotFoundError("Post doesn't exist");
  }

  success(req, res, post.toResponse(user));
};
