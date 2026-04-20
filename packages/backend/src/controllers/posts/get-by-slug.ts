import type { Request, Response } from 'express';
import { PostModel, postToResponse, PostResponse } from '@models/Post';
import { RateModel, RateTargetModel } from '@models/Rate';
import { NotFoundError, ERRORS } from '@errors';
import { sendSuccess } from '@utils/response-utils';

interface GetBySlugParams {
  slug: string;
}

type GetBySlugResponse = PostResponse;

export async function getBySlug(
  req: Request<GetBySlugParams>,
  res: Response<GetBySlugResponse>,
) {
  const { userId } = req.session;

  const { slug } = req.params;

  const post = await PostModel.findOne({
    slug,
  })
    .populate('author', 'login avatar')
    .lean();

  if (!post) {
    throw new NotFoundError(ERRORS.POST_NOT_FOUND);
  }

  const ratedTargets = await RateModel.findRatedTargets({
    userId,
    targetIds: [post._id.toString()],
    targetModel: RateTargetModel.POST,
  });

  sendSuccess(res, postToResponse(post, ratedTargets));
}
