import type { Request, Response } from 'express';
import { CommentModel } from '@models/Comment';
import { PostModel } from '@models/Post';
import { CommentValidator } from '@validators/CommentValidator';

import { ValidationError, NotFoundError, ERRORS } from '@errors';
import { sendSuccess } from '@utils/response-utils';

interface CreateBody {
  body: string;
  parent?: string;
  post: string;
}

export async function create(
  req: Request<unknown, unknown, CreateBody>,
  res: Response,
) {
  const { userId } = req.session;
  const { parent, post: postId } = req.body;
  let { body } = req.body;

  if (!postId) {
    throw new ValidationError(ERRORS.POST_ID_REQUIRED);
  }

  const post = await PostModel.findById(postId).lean();

  if (!post) {
    throw new NotFoundError(ERRORS.POST_NOT_FOUND);
  }

  body = CommentValidator.validateAndPrepareBody(body);

  if (!parent) {
    const [comment] = await Promise.all([
      CommentModel.create({
        post: postId,
        body,
        author: userId,
      }),
      PostModel.increaseCommentCount(postId),
    ]);

    sendSuccess(res, comment.toObject({ versionKey: false }));

    return;
  }

  const parentCommentary = await CommentModel.findOne({
    _id: parent,
    post: postId,
  }).lean();

  if (!parentCommentary) {
    throw new NotFoundError(ERRORS.COMMENT_PARENT_COMMENT_NOT_FOUND);
  }

  const comment = await CommentModel.create({
    post: postId,
    body,
    parent,
    author: userId,
  });

  await Promise.all([
    CommentModel.updateOne(
      { _id: parent },
      { $push: { children: comment._id.toString() } },
    ),
    PostModel.increaseCommentCount(postId),
  ]);

  sendSuccess(res, comment.toObject({ versionKey: false }));
}
