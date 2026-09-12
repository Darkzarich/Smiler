import type { Request, Response } from 'express';
import { CommentModel } from '@models/Comment';
import { PostModel } from '@models/Post';
import { NotFoundError, ERRORS } from '@errors';
import { sendSuccess } from '@utils/response-utils';
import type { CommentCreateBody } from '@validators/comments';

export async function create(
  req: Request<unknown, unknown, CommentCreateBody>,
  res: Response,
) {
  const { userId } = req.session;
  const { body, parent, post: postId } = req.body;

  const post = await PostModel.findById(postId).lean();

  if (!post) {
    throw new NotFoundError(ERRORS.POST_NOT_FOUND);
  }

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
