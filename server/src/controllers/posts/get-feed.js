const User = require('../../models/User');
const Post = require('../../models/Post');
const { success, asyncErrorHandler, generateError } = require('../../utils/utils');

exports.getFeed = asyncErrorHandler(async (req, res, next) => {
  const limit = +req.query.limit || 100;
  const offset = +req.query.offset || 0;
  const { userId } = req.session;

  if (limit > 100) { generateError('Limit can\'t be more than 100', 422, next); return; }

  try {
    const query = {};

    const user = await User.findById(userId).populate('rates');

    query.$and = [
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
    ];

    Promise.all([
      Post.find(query)
        .sort('-createdAt')
        .populate('author', 'login avatar')
        .limit(limit)
        .skip(offset),
      Post.countDocuments(query),
    ]).then((result) => {
      const posts = result[0];
      const pages = Math.ceil(result[1] / limit);

      const transPosts = posts.map(el => el.toResponse(user));

      success(req, res, {
        pages,
        posts: transPosts,
      });
    }).catch((e) => {
      next(e);
    });
  } catch (e) {
    next(e);
  }
});
