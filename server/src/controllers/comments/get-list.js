import Comment from '../../models/Comment.js';
import User from '../../models/User.js';
import { NotFoundError, ValidationError } from '../../errors/index.js';
import { sendSuccess } from '../../utils/responseUtils.js';

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

  if (limit > 30) {
    throw new ValidationError("Limit can't be more than 30");
  }
  if (!post) {
    throw new ValidationError('Post id for comments must be specified');
  }

  query.post = post;

  if (author) {
    // TODO: change to user id
    const foundAuthor = await User.findOne({
      login: author,
    });

    if (!foundAuthor) {
      throw new NotFoundError('Author is not found');
    }

    query.author = foundAuthor.id;
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
