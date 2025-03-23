import type { Request, Response } from 'express';
import { UserModel } from '../../models/User';
import { PostModel } from '../../models/Post';
import { NotFoundError, ERRORS } from '../../errors/index';
import { sendSuccess } from '../../utils/response-utils';

export async function getBySlug(req: Request, res: Response) {
  const { userId } = req.session;

  const { slug } = req.params;

  const [post, user] = await Promise.all([
    PostModel.findOne({
      slug,
    }).populate('author', 'login avatar'),
    userId
      ? UserModel.findById(userId).select('rates').populate('rates')
      : null,
  ]);

  if (!post) {
    throw new NotFoundError(ERRORS.POST_NOT_FOUND);
  }

  sendSuccess(res, post.toResponse(user));
}
