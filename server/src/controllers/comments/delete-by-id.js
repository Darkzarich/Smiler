const { differenceInMilliseconds } = require('date-fns');
const Comment = require('../../models/Comment');
const { COMMENT_TIME_TO_UPDATE } = require('../../constants');
const { ForbiddenError, NotFoundError } = require('../../errors');
const { success } = require('../../utils/utils');

exports.deleteById = async (req, res) => {
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
    comment.deleted = true;

    await comment.save();

    success(req, res);

    return;
  }

  await comment.remove();

  success(req, res);
};
