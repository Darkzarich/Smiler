const { differenceInMilliseconds } = require('date-fns');
const sanitizeHtml = require('../../libs/sanitize-html');
const Comment = require('../../models/Comment');
const { COMMENT_TIME_TO_UPDATE } = require('../../const/const');
const { success, generateError } = require('../../utils/utils');

exports.updateById = async (req, res, next) => {
  const { userId } = req.session;
  const { id } = req.params;
  const { body } = req.body;

  const comment = await Comment.findById(id);

  if (!comment) {
    return generateError('Comment is not found', 404, next);
  }

  if (comment.author.id.toString() !== userId) {
    return generateError('You can edit only your own comments', 403, next);
  }

  if (comment.children.length > 0) {
    return generateError(
      "You can't edit a comment if someone already answered it",
      405,
      next,
    );
  }

  if (
    differenceInMilliseconds(Date.now(), comment.createdAt) >
    COMMENT_TIME_TO_UPDATE
  ) {
    return generateError(
      `You can update comment only within first ${COMMENT_TIME_TO_UPDATE} min`,
      405,
      next,
    );
  }

  comment.body = sanitizeHtml(body);

  await comment.save();

  success(req, res);
};
