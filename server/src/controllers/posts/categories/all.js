import User from '../../../models/User.js';
import Post from '../../../models/Post.js';
import { ValidationError } from '../../../errors/index.js';
import { sendSuccess } from '../../../utils/responseUtils.js';

export async function all(req, res) {
  const limit = +req.query.limit || 15;
  const offset = +req.query.offset || 0;

  const { userId } = req.session;

  if (limit > 15) {
    throw new ValidationError('Limit cannot be more than 15');
  }

  const [posts, user, total] = await Promise.all([
    Post.find()
      .sort({ rating: -1 })
      .populate('author', 'login avatar')
      .limit(limit)
      .skip(offset),
    User.findById(userId).select('rates').populate('rates'),
    Post.countDocuments(),
  ]);

  const postsWithRated = posts.map((post) => post.toResponse(user));

  sendSuccess(res, {
    posts: postsWithRated,
    total,
    pages: Math.ceil(total / limit),
    hasNextPage: offset + limit < total,
  });
}
