const User = require('../../models/User');
const Post = require('../../models/Post');
const { ValidationError, NotFoundError } = require('../../errors');
const { sendSuccess } = require('../../utils/responseUtils');

exports.getListByAuthor = async (req, res) => {
  const { userId } = req.session;

  const limit = +req.query.limit || 15;
  const offset = +req.query.offset || 0;
  const author = req.query.author || '';

  if (limit > 15) {
    throw new ValidationError("Limit can't be more than 15");
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

  sendSuccess(res, {
    pages: Math.ceil(count / limit),
    posts: postsWithRated,
  });
};
