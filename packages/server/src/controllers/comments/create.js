import sanitizeHtml from '../../libs/sanitize-html.js';
import Comment from '../../models/Comment.js';

import { ValidationError, NotFoundError, ERRORS } from '../../errors/index.js';
import { sendSuccess } from '../../utils/responseUtils.js';

export async function create(req, res) {
  const { userId } = req.session;
  const { body, parent, post } = req.body;

  if (!body) {
    throw new ValidationError(ERRORS.COMMENT_SHOULD_NOT_BE_EMPTY);
  }

  if (!post) {
    throw new ValidationError(ERRORS.POST_ID_REQUIRED);
  }

  const sanitizedBody = sanitizeHtml(body);

  if (!parent) {
    const comment = await Comment.create({
      post,
      body: sanitizedBody,
      author: userId,
    });

    sendSuccess(res, comment);

    return;
  }

  const parentCommentary = await Comment.findOne({
    _id: parent,
    post,
  });

  if (!parentCommentary) {
    throw new NotFoundError(ERRORS.COMMENT_PARENT_COMMENT_NOT_FOUND);
  }

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

  sendSuccess(res, comment);
}
