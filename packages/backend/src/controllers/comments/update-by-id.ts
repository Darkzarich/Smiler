import type { Request, Response } from 'express';
import { differenceInMilliseconds } from 'date-fns';
import sanitizeHtml from '@libs/sanitize-html';
import { Comment, CommentModel } from '@models/Comment';
import { COMMENT_TIME_TO_UPDATE } from '@constants/index';
import {
  ForbiddenError,
  NotFoundError,
  BadRequestError,
  ERRORS,
} from '@errors';
import { sendSuccess } from '@utils/response-utils';

interface UpdateByIdParams {
  id: string;
}

interface UpdateByIdBody {
  body: string;
}

type UpdateByIdResponse = Comment;

export async function updateById(
  req: Request<UpdateByIdParams, unknown, UpdateByIdBody>,
  res: Response<UpdateByIdResponse>,
) {
  const { userId } = req.session;
  const { id } = req.params;
  const { body } = req.body;

  const comment = await CommentModel.findOne({
    _id: id,
    deleted: false,
  }).lean();

  if (!comment) {
    throw new NotFoundError(ERRORS.COMMENT_NOT_FOUND);
  }

  if (comment.author.toString() !== userId) {
    throw new ForbiddenError(ERRORS.COMMENT_CANT_EDIT_NOT_OWN);
  }

  if (comment.children.length > 0) {
    throw new BadRequestError(ERRORS.COMMENT_CANT_EDIT_WITH_REPLIES);
  }

  if (
    differenceInMilliseconds(Date.now(), comment.createdAt) >
    COMMENT_TIME_TO_UPDATE
  ) {
    throw new ForbiddenError(ERRORS.COMMENT_CAN_EDIT_WITHIN_TIME);
  }

  const updatedComment = await CommentModel.findByIdAndUpdate(
    comment._id,
    {
      $set: {
        body: sanitizeHtml(body),
      },
    },
    {
      // lean: true,
      populate: { path: 'author', select: { login: 1, avatar: 1 } },
      new: true,
    },
  );

  if (!updatedComment) {
    throw new NotFoundError(ERRORS.COMMENT_NOT_FOUND);
  }

  sendSuccess(res, updatedComment.toJSON());
}
