import type { Request, Response } from 'express';
import {
  CommentModel,
  LeanComment,
  commentToResponse,
  CommentResponse,
} from '@models/Comment';
import { UserModel } from '@models/User';
import { RateModel, RateTargetModel, type RatedTargets } from '@models/Rate';
import { NotFoundError, ValidationError, ERRORS } from '@errors';
import { sendSuccess } from '@utils/response-utils';
import { COMMENT_MAX_LIMIT } from '@constants/index';
import { PaginationValidator } from '@validators/PaginationValidator';
import { PaginationRequest, PaginationResponse } from '@type/pagination';

interface GetListQuery extends PaginationRequest {
  post: string;
  author?: string;
}

interface GetListResponse extends PaginationResponse {
  comments: CommentResponse[];
}

function fillWithRatedRecursive({
  comments,
  ratedTargets,
}: {
  comments: LeanComment[];
  ratedTargets?: RatedTargets;
}) {
  if (!comments) {
    return [];
  }

  return comments.map((comment) => {
    const commentWithUser = commentToResponse(comment, ratedTargets);

    if (commentWithUser.children && commentWithUser.children.length > 0) {
      commentWithUser.children = fillWithRatedRecursive({
        comments: comment.children ?? [],
        ratedTargets,
      }) as unknown as typeof commentWithUser.children;
    }

    return commentWithUser;
  });
}

function collectCommentIds(comments: LeanComment[]): string[] {
  return comments.flatMap((comment) => [
    comment._id.toString(),
    ...collectCommentIds(comment.children ?? []),
  ]);
}

export async function getList(
  req: Request<unknown, unknown, unknown, GetListQuery>,
  res: Response<GetListResponse>,
) {
  const { userId } = req.session;
  const { post } = req.query;
  const { author } = req.query;

  const { limit, offset } = PaginationValidator.validate(req.query, {
    maxLimit: COMMENT_MAX_LIMIT,
    defaultLimit: 10,
    maxLimitError: ERRORS.COMMENT_LIMIT_PARAM_EXCEEDED,
  });
  if (!post) {
    throw new ValidationError(ERRORS.POST_ID_REQUIRED);
  }

  const query: {
    parent: { $exists: false };
    post: string;
    author?: string;
  } = {
    parent: { $exists: false },
    post,
  };

  if (author) {
    const foundAuthor = await UserModel.findById(author).lean();

    if (!foundAuthor) {
      throw new NotFoundError(ERRORS.AUTHOR_NOT_FOUND);
    }

    query.author = foundAuthor._id.toString();
  }

  const [comments, total] = await Promise.all([
    CommentModel.find(query)
      .sort({ rating: -1 })
      .skip(offset)
      .limit(limit)
      .lean({ autopopulate: true }),
    CommentModel.countDocuments(query),
  ]);

  const leanComments = comments as LeanComment[];

  const ratedTargets = await RateModel.findRatedTargets({
    userId,
    targetIds: collectCommentIds(leanComments),
    targetModel: RateTargetModel.COMMENT,
  });

  sendSuccess(res, {
    comments: fillWithRatedRecursive({ comments: leanComments, ratedTargets }),
    total,
    pages: Math.ceil(total / limit),
    hasNextPage: offset + limit < total,
  });
}
