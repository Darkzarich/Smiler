const { subHours } = require('date-fns');

const User = require('../../../models/User');
const Post = require('../../../models/Post');
const { ValidationError } = require('../../../errors');
const { sendSuccess } = require('../../../utils/responseUtils');

exports.blowing = async (req, res) => {
  const limit = +req.query.limit || 15;
  const offset = +req.query.offset || 0;

  const { userId } = req.session;

  if (limit > 15) {
    throw new ValidationError('Limit cannot be more than 15');
  }

  const query = {
    rating: {
      $gte: 50,
    },
    createdAt: {
      $gte: subHours(Date.now(), 1),
    },
  };

  const [posts, user, count] = await Promise.all([
    Post.find(query)
      .sort({ rating: -1 })
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
