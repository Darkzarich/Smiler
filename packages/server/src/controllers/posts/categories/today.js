import { startOfToday } from 'date-fns';
import User from '../../../models/User.js';
import Post from '../../../models/Post.js';
import { ValidationError, ERRORS } from '../../../errors/index.js';
import { sendSuccess } from '../../../utils/response-utils.js';
import { POST_MAX_LIMIT } from '../../../constants/index.js';

export async function today(req, res) {
  const limit = +req.query.limit || POST_MAX_LIMIT;
  const offset = +req.query.offset || 0;

  const { userId } = req.session;

  if (limit > POST_MAX_LIMIT) {
    throw new ValidationError(ERRORS.POST_LIMIT_PARAM_EXCEEDED);
  }

  const query = {
    createdAt: {
      $gte: startOfToday(),
    },
  };

  const [posts, user, total] = await Promise.all([
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
    posts: postsWithRated,
    total,
    pages: Math.ceil(total / limit),
    hasNextPage: offset + limit < total,
  });
}
