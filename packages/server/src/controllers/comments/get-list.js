import Comment from '../../models/Comment.js';
import User from '../../models/User.js';
import { NotFoundError, ValidationError, ERRORS } from '../../errors/index.js';
import { sendSuccess } from '../../utils/response-utils.js';
import { COMMENT_MAX_LIMIT } from '../../constants/index.js';

function fillWithRatedRecursive({ comments, user }) {
  if (!comments) {
    return [];
  }

  return comments.map((comment) => {
    const commentWithUser = comment.toResponse(user);

    if (commentWithUser.children && commentWithUser.children.length > 0) {
      commentWithUser.children = fillWithRatedRecursive({
        comments: comment.children,
        user,
      });
    }

    return commentWithUser;
  });
}

export async function getList(req, res) {
  const { userId } = req.session;
  const { post } = req.query;
  const { author } = req.query;

  const limit = +req.query.limit || 10;
  const offset = +req.query.offset || 0;

  const query = {
    parent: { $exists: false },
  };

  if (limit > COMMENT_MAX_LIMIT) {
    throw new ValidationError(ERRORS.COMMENT_LIMIT_PARAM_EXCEEDED);
  }
  if (!post) {
    throw new ValidationError(ERRORS.POST_ID_REQUIRED);
  }

  query.post = post;

  if (author) {
    const foundAuthor = await User.findById(author).lean();

    if (!foundAuthor) {
      throw new NotFoundError(ERRORS.AUTHOR_NOT_FOUND);
    }

    query.author = foundAuthor._id;
  }

  const [comments, currentUser, total] = await Promise.all([
    Comment.find(query).sort({ rating: -1 }).skip(offset).limit(limit),
    User.findById(userId).select('rates').populate('rates'),
    Comment.countDocuments(query),
  ]);

  sendSuccess(res, {
    comments: fillWithRatedRecursive({ comments, user: currentUser }),
    total,
    pages: Math.ceil(total / limit),
    hasNextPage: offset + limit < total,
  });
}
