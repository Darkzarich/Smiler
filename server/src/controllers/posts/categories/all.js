const User = require('../../../models/User');
const Post = require('../../../models/Post');
const { success, generateError } = require('../../../utils/utils');

exports.all = async (req, res, next) => {
  const limit = +req.query.limit || 100;
  const offset = +req.query.offset || 0;

  const { userId } = req.session;

  if (limit > 100) {
    return generateError("Limit can't be more than 100", 422, next);
  }

  const [posts, user, count] = await Promise.all([
    Post.find()
      .sort({ rating: -1 })
      .populate('author', 'login avatar')
      .limit(limit)
      .skip(offset),
    User.findById(userId).select('rates').populate('rates'),
    Post.countDocuments(),
  ]);

  const postsWithRated = posts.map((post) => post.toResponse(user));

  success(req, res, {
    pages: Math.ceil(count / limit),
    posts: postsWithRated,
  });
};
