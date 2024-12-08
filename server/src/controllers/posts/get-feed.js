import User from '../../models/User.js';
import Post from '../../models/Post.js';
import {
  UnauthorizedError,
  ValidationError,
  ERRORS,
} from '../../errors/index.js';
import { sendSuccess } from '../../utils/responseUtils.js';

export async function getFeed(req, res) {
  const limit = +req.query.limit || 15;
  const offset = +req.query.offset || 0;
  const { userId } = req.session;

  if (limit > 15) {
    throw new ValidationError(ERRORS.POST_LIMIT_PARAM_EXCEEDED);
  }

  const user = await User.findById(userId).populate('rates');

  if (!user) {
    throw new UnauthorizedError(ERRORS.UNAUTHORIZED);
  }

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

  const [posts, total] = await Promise.all([
    Post.find(query)
      .sort('-createdAt')
      .populate('author', 'login avatar')
      .limit(limit)
      .skip(offset),
    Post.countDocuments(query),
  ]);

  const transPosts = posts.map((post) => post.toResponse(user));

  sendSuccess(res, {
    posts: transPosts,
    total,
    pages: Math.ceil(total / limit),
    hasNextPage: offset + limit < total,
  });
}
