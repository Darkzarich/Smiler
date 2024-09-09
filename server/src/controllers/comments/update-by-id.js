import { differenceInMilliseconds, millisecondsToMinutes } from 'date-fns';
import sanitizeHtml from '../../libs/sanitize-html.js';
import Comment from '../../models/Comment.js';
import { COMMENT_TIME_TO_UPDATE } from '../../constants/index.js';
import {
  ForbiddenError,
  NotFoundError,
  BadRequestError,
} from '../../errors/index.js';
import { sendSuccess } from '../../utils/responseUtils.js';

export async function updateById(req, res) {
  const { userId } = req.session;
  const { id } = req.params;
  const { body } = req.body;

  const comment = await Comment.findOne({
    _id: id,
    deleted: false,
  });

  if (!comment) {
    throw new NotFoundError('Comment is not found');
  }

  if (comment.author.id.toString() !== userId) {
    throw new ForbiddenError('You can edit only your own comments');
  }

  if (comment.children.length > 0) {
    return new BadRequestError(
      'You cannot edit a comment if someone already replied to it',
    );
  }

  if (
    differenceInMilliseconds(Date.now(), comment.createdAt) >
    COMMENT_TIME_TO_UPDATE
  ) {
    throw new ForbiddenError(
      `You can update comment only within first ${millisecondsToMinutes(COMMENT_TIME_TO_UPDATE)} min`,
    );
  }

  comment.body = sanitizeHtml(body);

  await comment.save();

  sendSuccess(res, comment);
}
