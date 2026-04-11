import type { Request, Response } from 'express';
import { Post, PostModel } from '@models/Post';
import { RateModel, RateTargetModel } from '@models/Rate';
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

  const post = await PostModel.findOne({
    slug,
  }).populate('author', 'login avatar');

  if (!post) {
    throw new NotFoundError(ERRORS.POST_NOT_FOUND);
  }

  const ratedTargets = await RateModel.findRatedTargets({
    userId,
    targetIds: [post.id],
    targetModel: RateTargetModel.POST,
  });

  sendSuccess(res, post.toResponse(ratedTargets));
}
