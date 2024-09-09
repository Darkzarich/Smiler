import { differenceInMilliseconds, millisecondsToMinutes } from 'date-fns';
import Post from '../../models/Post.js';
import {
  POST_SECTION_TYPES,
  POST_TIME_TO_UPDATE,
} from '../../constants/index.js';
import { NotFoundError, ForbiddenError } from '../../errors/index.js';
import { removeFileByPath } from '../../utils/remove-file-by-path.js';
import { sendSuccess } from '../../utils/responseUtils.js';

export async function deleteById(req, res) {
  const { userId } = req.session;
  const { id } = req.params;

  const targetPost = await Post.findById(id).select({
    author: 1,
    createdAt: 1,
    commentCount: 1,
    sections: 1,
  });

  if (!targetPost) {
    throw new NotFoundError('Post is not found');
  }

  if (targetPost.author.toString() !== userId) {
    throw new ForbiddenError('You can delete only your own posts');
  }

  if (
    differenceInMilliseconds(Date.now(), targetPost.createdAt) >
    POST_TIME_TO_UPDATE
  ) {
    throw new ForbiddenError(
      `You can delete post only within the first ${millisecondsToMinutes(POST_TIME_TO_UPDATE)} min`,
    );
  }

  if (targetPost.commentCount > 0) {
    throw new ForbiddenError('You can not delete post with comments');
  }

  await targetPost.remove();

  sendSuccess(res);

  const filePictureSections = targetPost.sections.filter(
    (sec) => sec.type === POST_SECTION_TYPES.PICTURE && sec.isFile,
  );

  // eslint-disable-next-line no-restricted-syntax
  for (const section of filePictureSections) {
    removeFileByPath(section.url);
  }
}
