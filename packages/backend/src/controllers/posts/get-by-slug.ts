import User from '../../models/User';
import Post from '../../models/Post';
import { NotFoundError, ERRORS } from '../../errors/index';
import { sendSuccess } from '../../utils/response-utils';

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
    throw new NotFoundError(ERRORS.POST_NOT_FOUND);
  }

  sendSuccess(res, post.toResponse(user));
}
