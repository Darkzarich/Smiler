import type { Request, Response } from 'express';
import sanitizeHtml from '@libs/sanitize-html';
import { Comment, CommentModel } from '@models/Comment';
import { PostModel } from '@models/Post';

import { ValidationError, NotFoundError, ERRORS } from '@errors';
import { sendSuccess } from '@utils/response-utils';

interface CreateBody {
  body: string;
  parent?: string;
  post: string;
}

type CreateResponse = Comment;

export async function create(
  req: Request<unknown, unknown, CreateBody>,
  res: Response<CreateResponse>,
) {
  const { userId } = req.session;
  const { body, parent, post: postId } = req.body;

  if (!body) {
    throw new ValidationError(ERRORS.COMMENT_SHOULD_NOT_BE_EMPTY);
  }

  if (!postId) {
    throw new ValidationError(ERRORS.POST_ID_REQUIRED);
  }

  const post = await PostModel.findById(postId);

  if (!post) {
    throw new NotFoundError(ERRORS.POST_NOT_FOUND);
  }

  const sanitizedBody = sanitizeHtml(body);

  if (!parent) {
    const [comment] = await Promise.all([
      CommentModel.create({
        post: postId,
        body: sanitizedBody,
        author: userId,
      }),
      PostModel.increaseCommentCount(postId),
    ]);

    sendSuccess(res, comment.toJSON());

    return;
  }

  const parentCommentary = await CommentModel.findOne({
    _id: parent,
    post: postId,
  });

  if (!parentCommentary) {
    throw new NotFoundError(ERRORS.COMMENT_PARENT_COMMENT_NOT_FOUND);
  }

  const comment = await CommentModel.create({
    post: postId,
    body: sanitizedBody,
    parent,
    author: userId,
  });

  await Promise.all([
    CommentModel.updateOne(
      { _id: parent },
      { $push: { children: comment.id.toString() } },
    ),
    PostModel.increaseCommentCount(postId),
  ]);

  sendSuccess(res, comment.toJSON());
}
