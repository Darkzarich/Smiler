const sanitizeHtml = require('../../utils/sanitize-html');
const Comment = require('../../models/Comment');
const { success, asyncErrorHandler, generateError } = require('../../utils/utils');

exports.create = asyncErrorHandler(async (req, res, next) => {
  const { body } = req.body;
  const { parent } = req.body;
  const { post } = req.body;
  const { userId } = req.session;

  if (!body) { generateError('Commentary should not be empty', 422, next); return; }
  if (!post) { generateError('Comment must be assigned to a post', 422, next); return; }

  const sanitizedBody = sanitizeHtml(body);

  // TODO: asyncErrorHandler catches everything anyone don't need try..catch here
  try {
    if (!parent) {
      const comment = await Comment.create({
        post,
        body: sanitizedBody,
        author: userId,
      });

      success(req, res, comment);
    } else {
      const parentCommentary = await Comment.findOne({
        _id: parent,
        post,
      });

      if (!parentCommentary) { generateError('Parent commentary is not found', 404, next); return; }

      const comment = await Comment.create({
        post,
        body: sanitizedBody,
        parent,
        author: userId,
      });

      const { children } = parentCommentary;
      children.push(comment.id);
      parentCommentary.children = children;
      await parentCommentary.save();
      success(req, res, comment);
    }
  } catch (e) {
    next(e);
  }
});
