import { differenceInMilliseconds, millisecondsToMinutes } from 'date-fns';
import sanitizeHtml from '../../libs/sanitize-html.js';
import Comment from '../../models/Comment.js';
import { COMMENT_TIME_TO_UPDATE } from '../../constants/index.js';
import {
  ForbiddenError,
  NotFoundError,
  BadRequestError,
  ERRORS,
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
    throw new NotFoundError(ERRORS.COMMENT_NOT_FOUND);
  }

  if (comment.author.id.toString() !== userId) {
    throw new ForbiddenError(ERRORS.COMMENT_CANT_EDIT_NOT_OWN);
  }

  if (comment.children.length > 0) {
    throw new BadRequestError(ERRORS.COMMENT_CANT_EDIT_WITH_REPLIES);
  }

  if (
    differenceInMilliseconds(Date.now(), comment.createdAt) >
    COMMENT_TIME_TO_UPDATE
  ) {
    throw new ForbiddenError(ERRORS.COMMENT_CAN_EDIT_WITHIN_TIME);
  }

  comment.body = sanitizeHtml(body);

  await comment.save();

  sendSuccess(res, comment);
}
