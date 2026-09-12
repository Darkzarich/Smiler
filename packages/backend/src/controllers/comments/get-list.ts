import type { Request, Response } from 'express';
import {
  CommentModel,
  LeanComment,
  commentToResponse,
  CommentResponse,
} from '@models/Comment';
import { UserModel } from '@models/User';
import { RateModel, RateTargetModel, type RatedTargets } from '@models/Rate';
import { NotFoundError, ERRORS } from '@errors';
import { sendSuccess } from '@utils/response-utils';
import { PaginationResponse } from '@type/pagination';
import { PAGE_LOOKAHEAD, toPage } from '@utils/pagination';
import type { CommentListQuery } from '@validators/comments';

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
  req: Request<unknown, unknown, unknown, CommentListQuery>,
  res: Response<GetListResponse>,
) {
  const { userId } = req.session;
  const { post, author, limit, offset } = req.query;

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

  const foundComments = await CommentModel.find(query)
    .sort({ rating: -1 })
    .skip(offset)
    .limit(limit + PAGE_LOOKAHEAD)
    .lean({ autopopulate: true });

  const { items: comments, hasNextPage } = toPage(foundComments, limit);

  const leanComments = comments as LeanComment[];

  const ratedTargets = await RateModel.findRatedTargets({
    userId,
    targetIds: collectCommentIds(leanComments),
    targetModel: RateTargetModel.COMMENT,
  });

  sendSuccess(res, {
    comments: fillWithRatedRecursive({ comments: leanComments, ratedTargets }),
    hasNextPage,
  });
}
