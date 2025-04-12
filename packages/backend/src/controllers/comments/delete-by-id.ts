import type { Request, Response } from 'express';
import { differenceInMilliseconds } from 'date-fns';
import { CommentModel } from '../../models/Comment';
import { PostModel } from '../../models/Post';
import { COMMENT_TIME_TO_UPDATE } from '../../constants/index';
import { ForbiddenError, NotFoundError, ERRORS } from '../../errors/index';
import { sendSuccess } from '../../utils/response-utils';

interface DeleteByIdParams {
  id: string;
}

export async function deleteById(req: Request<DeleteByIdParams>, res: Response) {
  const { userId } = req.session;
  const { id } = req.params;

  const comment = await CommentModel.findById(id).lean();

  if (!comment) {
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
  if (comment.children.length > 0) {
    const updateComment = await CommentModel.findByIdAndUpdate(comment._id, {
      deleted: true,
    });

    return sendSuccess(res, updateComment?.toJSON());
  }

  await Promise.all([
    CommentModel.updateOne(
      { _id: comment.parent },
      {
        $pull: {
          children: comment._id,
        },
      },
    ),
    PostModel.decreaseCommentCount(comment.post.toString()),
    // TODO: Remove rates for the comment as well
    CommentModel.deleteOne({
      _id: comment._id,
    }),
  ]);

  return sendSuccess(res);
}
