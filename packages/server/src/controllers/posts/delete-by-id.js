import { differenceInMilliseconds } from 'date-fns';
import Post from '../../models/Post.js';
import {
  POST_SECTION_TYPES,
  POST_TIME_TO_UPDATE,
} from '../../constants/index.js';
import { NotFoundError, ForbiddenError, ERRORS } from '../../errors/index.js';
import { removeFileByPath } from '../../utils/remove-file-by-path.js';
import { sendSuccess } from '../../utils/response-utils.js';

export async function deleteById(req, res) {
  const { userId } = req.session;
  const { id } = req.params;

  const targetPost = await Post.findById(id)
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
  await Post.deleteOne({ _id: id });

  sendSuccess(res);

  const filePictureSections = targetPost.sections.filter(
    (sec) => sec.type === POST_SECTION_TYPES.PICTURE && sec.isFile,
  );

  // eslint-disable-next-line no-restricted-syntax
  for (const section of filePictureSections) {
    removeFileByPath(section.url);
  }
}
