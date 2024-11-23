import User from '../../models/User.js';
import Post from '../../models/Post.js';
import { NotFoundError } from '../../errors/index.js';
import { sendSuccess } from '../../utils/responseUtils.js';

export async function getBySlug(req, res) {
  const { userId } = req.session;

  const { slug } = req.params;

  const [post, user] = await Promise.all([
    Post.findOne({
      slug,
    }).populate('author', 'login avatar'),
    userId ? User.findById(userId).select('rates').populate('rates') : null,
  ]);

  if (!post) {
    throw new NotFoundError("Post doesn't exist");
  }

  sendSuccess(res, post.toResponse(user));
}
