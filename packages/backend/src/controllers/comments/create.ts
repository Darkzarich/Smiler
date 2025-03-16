import sanitizeHtml from '../../libs/sanitize-html';
import Comment from '../../models/Comment';
import Post from '../../models/Post';

import { ValidationError, NotFoundError, ERRORS } from '../../errors/index';
import { sendSuccess } from '../../utils/response-utils';

export async function create(req, res) {
  const { userId } = req.session;
  const { body, parent, post: postId } = req.body;

  if (!body) {
    throw new ValidationError(ERRORS.COMMENT_SHOULD_NOT_BE_EMPTY);
  }

  if (!postId) {
    throw new ValidationError(ERRORS.POST_ID_REQUIRED);
  }

  const post = await Post.findById(postId);

  if (!post) {
    throw new NotFoundError(ERRORS.POST_NOT_FOUND);
  }

  const sanitizedBody = sanitizeHtml(body);

  if (!parent) {
    const [comment] = await Promise.all([
      Comment.create({
        post: postId,
        body: sanitizedBody,
        author: userId,
      }),
      Post.commentCountInc(postId),
    ]);

    sendSuccess(res, comment);

    return;
  }

  const parentCommentary = await Comment.findOne({
    _id: parent,
    post: postId,
  });

  if (!parentCommentary) {
    throw new NotFoundError(ERRORS.COMMENT_PARENT_COMMENT_NOT_FOUND);
  }

  const comment = await Comment.create({
    post: postId,
    body: sanitizedBody,
    parent,
    author: userId,
  });

  await Promise.all([
    Comment.updateOne(
      { _id: parent },
      { $push: { children: comment.id.toString() } },
    ),
    Post.commentCountInc(postId),
  ]);

  sendSuccess(res, comment);
}
