import sanitizeHtml from '../../libs/sanitize-html.js';
import Comment from '../../models/Comment.js';

import { ValidationError, NotFoundError } from '../../errors/index.js';
import { sendSuccess } from '../../utils/responseUtils.js';

export async function create(req, res) {
  const { body } = req.body;
  const { parent } = req.body;
  const { post } = req.body;
  const { userId } = req.session;

  if (!body) {
    throw new ValidationError('Commentary should not be empty');
  }

  if (!post) {
    throw new ValidationError('Post id for commentary must be specified');
  }

  const sanitizedBody = sanitizeHtml(body);

  if (!parent) {
    const comment = await create({
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
    throw new NotFoundError('Parent commentary is not found');
  }

  const comment = await create({
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
