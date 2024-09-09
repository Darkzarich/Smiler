import { differenceInMilliseconds } from 'date-fns';
import Comment from '../../models/Comment.js';
import { COMMENT_TIME_TO_UPDATE } from '../../constants/index.js';
import { ForbiddenError, NotFoundError } from '../../errors/index.js';
import { sendSuccess } from '../../utils/responseUtils.js';

export async function deleteById(req, res) {
  const { userId } = req.session;
  const { id } = req.params;

  const comment = await Comment.findById(id);

  if (!comment) {
    throw new NotFoundError('Comment is not found');
  }

  if (comment.author.id.toString() !== userId) {
    throw new ForbiddenError('You can delete only your own comments');
  }

  if (
    differenceInMilliseconds(Date.now(), comment.createdAt) >
    COMMENT_TIME_TO_UPDATE
  ) {
    throw new ForbiddenError(
      `You can delete comment only within the first ${COMMENT_TIME_TO_UPDATE} min`,
    );
  }

  // If comment has replies we cannot delete it completely
  // instead we mark it as deleted with a flag
  if (comment.children.length > 0) {
    await comment.remove();

    return sendSuccess(res);
  }

  comment.deleted = true;

  await comment.save();

  sendSuccess(res, comment);
}
