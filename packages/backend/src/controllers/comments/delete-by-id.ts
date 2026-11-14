import type { Request } from 'express';
import { differenceInMilliseconds } from 'date-fns';
import { CommentModel } from '@models/Comment';
import { PostModel } from '@models/Post';
import {
  COMMENT_AUTHOR_RATING_SHARE,
  COMMENT_TIME_TO_UPDATE,
} from '@constants/index';
import { ForbiddenError, NotFoundError, ERRORS } from '@errors';
import { sendSuccess } from '@utils/response-utils';
import { UserModel } from '@models/User';
import { RateModel } from '@models/Rate';
import type { ApiResponse } from '@libs/api-router';
import type {
  commentDeleteResultSchema,
  CommentIdParams,
} from '@validators/comments';

export async function deleteById(
  req: Request<CommentIdParams>,
  res: ApiResponse<typeof commentDeleteResultSchema>,
) {
  const { userId } = req.session;
  const { id } = req.params;

  const comment = await CommentModel.findById(id).lean();

  if (!comment || comment.deleted) {
    throw new NotFoundError(ERRORS.COMMENT_NOT_FOUND);
  }

  if (comment.author.toString() !== userId) {
    throw new ForbiddenError(ERRORS.COMMENT_CANT_DELETE_NOT_OWN);
  }

  if (
    differenceInMilliseconds(Date.now(), comment.createdAt) >
    COMMENT_TIME_TO_UPDATE
  ) {
    throw new ForbiddenError(ERRORS.COMMENT_CAN_DELETE_WITHIN_TIME);
  }

  // If comment has replies we cannot delete it completely
  // instead we mark it as deleted with a flag
  if (await CommentModel.hasReplies(comment._id)) {
    await Promise.all([
      CommentModel.updateOne({ _id: comment._id }, { deleted: true }),
      UserModel.updateOne(
        { _id: comment.author },
        { $inc: { rating: -comment.rating * COMMENT_AUTHOR_RATING_SHARE } },
      ),
      RateModel.deleteMany({ target: id }),
    ]);

    return sendSuccess(res, {
      _id: comment._id,
      deleted: true,
      parent: comment.parent?.toString(),
      createdAt: comment.createdAt,
    });
  }

  await Promise.all([
    PostModel.decreaseCommentCount(comment.post.toString()),
    CommentModel.deleteOne({
      _id: comment._id,
    }),
    UserModel.updateOne(
      { _id: comment.author },
      { $inc: { rating: -comment.rating * COMMENT_AUTHOR_RATING_SHARE } },
    ),
    RateModel.deleteMany({ target: id }),
  ]);

  return sendSuccess(res);
}
