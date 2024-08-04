const User = require('../../models/User');
const Post = require('../../models/Post');
const { ValidationError } = require('../../errors');
const { success } = require('../../utils/utils');

exports.getFeed = async (req, res) => {
  const limit = +req.query.limit || 100;
  const offset = +req.query.offset || 0;
  const { userId } = req.session;

  if (limit > 100) {
    throw new ValidationError("Limit can't be more than 100");
  }

  const user = await User.findById(userId).populate('rates');

  const query = {
    $and: [
      {
        $or: [
          {
            tags: {
              $in: user.tagsFollowed,
            },
          },
          {
            author: {
              $in: user.usersFollowed,
            },
          },
        ],
      },
      {
        author: {
          $ne: userId,
        },
      },
    ],
  };

  const [posts, count] = await Promise.all([
    Post.find(query)
      .sort('-createdAt')
      .populate('author', 'login avatar')
      .limit(limit)
      .skip(offset),
    Post.countDocuments(query),
  ]);

  const transPosts = posts.map((post) => post.toResponse(user));

  success(req, res, {
    pages: Math.ceil(count / limit),
    posts: transPosts,
  });
};
