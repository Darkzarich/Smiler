import type { Request } from 'express';
import { PostModel, postToResponse } from '@models/Post';
import { RateModel, RateTargetModel } from '@models/Rate';
import { NotFoundError, ERRORS } from '@errors';
import { sendSuccess } from '@utils/response-utils';
import type { ApiResponse } from '@libs/api-router';
import type { postSchema, PostSlugParams } from '@validators/posts';

export async function getBySlug(
  req: Request<PostSlugParams>,
  res: ApiResponse<typeof postSchema>,
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
