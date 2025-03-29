import type { Request, Response } from 'express';
import { CommentModel, CommentDocument } from '../../models/Comment';
import { UserModel, UserDocument } from '../../models/User';
import { NotFoundError, ValidationError, ERRORS } from '../../errors/index';
import { sendSuccess } from '../../utils/response-utils';
import { COMMENT_MAX_LIMIT } from '../../constants/index';

interface Query {
  post: string;
  author?: string;
  limit?: number;
  offset?: number;
}

// TODO: Rewrite from recursion to iteration
function fillWithRatedRecursive({
  comments,
  user,
}: {
  comments: CommentDocument[];
  user?: UserDocument;
}) {
  if (!comments) {
    return [];
  }

  return comments.map((comment) => {
    const commentWithUser = comment.toResponse(user);

    if (commentWithUser.children && commentWithUser.children.length > 0) {
      commentWithUser.children = fillWithRatedRecursive({
        comments: comment.children as CommentDocument[],
        user,
      }) as unknown as CommentDocument[];
    }

    return commentWithUser;
  });
}

export async function getList(
  req: Request<never, never, never, Query>,
  res: Response,
) {
  const { userId } = req.session;
  const { post } = req.query;
  const { author } = req.query;

  const limit = Number(req.query.limit) || 10;
  const offset = Number(req.query.offset) || 0;

  if (limit > COMMENT_MAX_LIMIT) {
    throw new ValidationError(ERRORS.COMMENT_LIMIT_PARAM_EXCEEDED);
  }
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

  const [comments, currentUser, total] = await Promise.all([
    CommentModel.find(query).sort({ rating: -1 }).skip(offset).limit(limit),
    UserModel.findById(userId).select('rates').populate('rates'),
    CommentModel.countDocuments(query),
  ]);

  sendSuccess(res, {
    comments: fillWithRatedRecursive({ comments, user: currentUser! }),
    total,
    pages: Math.ceil(total / limit),
    hasNextPage: offset + limit < total,
  });
}
