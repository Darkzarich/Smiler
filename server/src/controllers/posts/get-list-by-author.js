const User = require('../../models/User');
const Post = require('../../models/Post');
const { ValidationError, NotFoundError } = require('../../errors');
const { success } = require('../../utils/utils');

exports.getListByAuthor = async (req, res) => {
  const { userId } = req.session;

  const limit = +req.query.limit || 100;
  const offset = +req.query.offset || 0;
  const author = req.query.author || '';

  if (limit > 100) {
    throw new ValidationError("Limit can't be more than 100");
  }

  const foundAuthor = await User.findOne({
    login: author,
  });

  if (!foundAuthor) {
    throw new NotFoundError("Author doesn't exist");
  }

  const query = {
    author: foundAuthor.id,
  };

  const [posts, user, count] = await Promise.all([
    Post.find(query)
      .sort({ createdAt: -1 })
      .populate('author', 'login avatar')
      .limit(limit)
      .skip(offset),
    User.findById(userId).select('rates').populate('rates'),
    Post.countDocuments(query),
  ]);

  const postsWithRated = posts.map((post) => post.toResponse(user));

  success(req, res, {
    pages: Math.ceil(count / limit),
    posts: postsWithRated,
  });
};
