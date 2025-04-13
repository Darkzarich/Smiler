import type { Request, Response } from 'express';
import { UserModel } from '@models/User';
import { Post, PostModel } from '@models/Post';
import { NotFoundError, ERRORS } from '@errors';
import { sendSuccess } from '@utils/response-utils';

interface GetBySlugParams {
  slug: string;
}

// TODO: think of something better
type GetBySlugResponse = ReturnType<Post['toResponse']>;

export async function getBySlug(
  req: Request<GetBySlugParams>,
  res: Response<GetBySlugResponse>,
) {
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
