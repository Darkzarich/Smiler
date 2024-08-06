const { differenceInMilliseconds, millisecondsToMinutes } = require('date-fns');
const sanitizeHtml = require('../../libs/sanitize-html');
const Comment = require('../../models/Comment');

const { COMMENT_TIME_TO_UPDATE } = require('../../constants');
const {
  ForbiddenError,
  NotFoundError,
  BadRequestError,
} = require('../../errors');
const { sendSuccess } = require('../../utils/responseUtils');

exports.updateById = async (req, res) => {
  const { userId } = req.session;
  const { id } = req.params;
  const { body } = req.body;

  const comment = await Comment.findById(id);

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

  sendSuccess(res);
};
