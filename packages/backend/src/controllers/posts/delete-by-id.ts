import type { Request, Response } from 'express';
import { differenceInMilliseconds } from 'date-fns';
import { PostModel } from '../../models/Post';
import { POST_SECTION_TYPES, POST_TIME_TO_UPDATE } from '../../constants/index';
import { NotFoundError, ForbiddenError, ERRORS } from '../../errors/index';
import { removeFileByPath } from '../../utils/remove-file-by-path';
import { sendSuccess } from '../../utils/response-utils';

export async function deleteById(req: Request, res: Response) {
  const { userId } = req.session;
  const { id } = req.params;

  const targetPost = await PostModel.findById(id)
    .select({
      author: 1,
      createdAt: 1,
      commentCount: 1,
      sections: 1,
    })
    .lean();

  if (!targetPost) {
    throw new NotFoundError(ERRORS.POST_NOT_FOUND);
  }

  if (targetPost.author.toString() !== userId) {
    throw new ForbiddenError(ERRORS.POST_CANT_DELETE_NOT_OWN_POST);
  }

  if (
    differenceInMilliseconds(Date.now(), targetPost.createdAt) >
    POST_TIME_TO_UPDATE
  ) {
    throw new ForbiddenError(ERRORS.POST_CAN_DELETE_WITHIN_TIME);
  }

  if (targetPost.commentCount > 0) {
    throw new ForbiddenError(ERRORS.POST_CANT_DELETE_WITH_COMMENTS);
  }

  // TODO: Remove rates for the post as well
  await PostModel.deleteOne({ _id: id });

  sendSuccess(res);

  const filePictureSections = targetPost.sections.filter(
    (sec) => sec.type === POST_SECTION_TYPES.PICTURE && sec.isFile,
  );

  // eslint-disable-next-line no-restricted-syntax
  for (const section of filePictureSections) {
    removeFileByPath(section.url);
  }
}
