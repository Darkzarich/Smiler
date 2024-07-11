const sanitizeHtml = require('../../utils/sanitize-html');
const Comment = require('../../models/Comment');
const consts = require('../../const/const');
const {
  success,
  asyncErrorHandler,
  generateError,
} = require('../../utils/utils');

exports.updateById = asyncErrorHandler(async (req, res, next) => {
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

  const commentCreatedAt = new Date(comment.createdAt.toString()).getTime();
  const { now } = new Date();

  if (now - commentCreatedAt > consts.COMMENT_TIME_TO_UPDATE) {
    return generateError(
      `You can update comment only within first ${consts.COMMENT_TIME_TO_UPDATE / 1000 / 60} min`,
      405,
      next,
    );
  }

  comment.body = sanitizeHtml(body);

  await comment.save();

  success(req, res);
});
