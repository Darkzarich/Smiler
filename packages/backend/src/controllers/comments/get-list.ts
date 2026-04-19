import type { Request, Response } from 'express';
import { CommentModel, CommentDocument, Comment } from '@models/Comment';
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
  // TODO: think of something better
  comments: ReturnType<Comment['toResponse']>[];
}

// TODO: Rewrite from recursion to iteration
function fillWithRatedRecursive({
  comments,
  ratedTargets,
}: {
  comments: CommentDocument[];
  ratedTargets?: RatedTargets;
}) {
  if (!comments) {
    return [];
  }

  return comments.map((comment) => {
    const commentWithUser = comment.toResponse(ratedTargets);

    if (commentWithUser.children && commentWithUser.children.length > 0) {
      commentWithUser.children = fillWithRatedRecursive({
        comments: comment.children as CommentDocument[],
        ratedTargets,
      }) as unknown as CommentDocument[];
    }

    return commentWithUser;
  });
}

function collectCommentIds(comments: CommentDocument[]): string[] {
  return comments.flatMap((comment) => [
    comment.id,
    ...collectCommentIds(comment.children as CommentDocument[]),
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
    CommentModel.find(query).sort({ rating: -1 }).skip(offset).limit(limit),
    CommentModel.countDocuments(query),
  ]);

  const ratedTargets = await RateModel.findRatedTargets({
    userId,
    targetIds: collectCommentIds(comments),
    targetModel: RateTargetModel.COMMENT,
  });

  sendSuccess(res, {
    comments: fillWithRatedRecursive({ comments, ratedTargets }),
    total,
    pages: Math.ceil(total / limit),
    hasNextPage: offset + limit < total,
  });
}
