import { differenceInMilliseconds } from 'date-fns';
import Comment from '../../models/Comment';
import Post from '../../models/Post';
import { COMMENT_TIME_TO_UPDATE } from '../../constants/index';
import { ForbiddenError, NotFoundError, ERRORS } from '../../errors/index';
import { sendSuccess } from '../../utils/response-utils';

export async function deleteById(req, res) {
  const { userId } = req.session;
  const { id } = req.params;

  const comment = await Comment.findById(id).lean();

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
    const updateComment = await Comment.findByIdAndUpdate(comment._id, {
      deleted: true,
    });

    return sendSuccess(res, updateComment);
  }

  await Promise.all([
    Comment.updateOne(
      { _id: comment.parent },
      {
        $pull: {
          children: comment._id,
        },
      },
    ),
    Post.commentCountDec(comment.post),
    // TODO: Remove rates for the comment as well
    Comment.deleteOne({
      _id: comment._id,
    }),
  ]);

  return sendSuccess(res);
}
