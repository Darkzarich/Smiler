const Comment = require('../../models/Comment');
const User = require('../../models/User');

const { NotFoundError, ValidationError } = require('../../errors');
const { success } = require('../../utils/utils');

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

exports.getList = async (req, res) => {
  const { userId } = req.session;
  const { post } = req.query;
  const { author } = req.query;

  const limit = +req.query.limit || 10;
  const offset = +req.query.offset || 0;

  const query = {};

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

  const [comments, currentUser, count] = await Promise.all([
    Comment.find(query)
      .sort('-rating')
      .skip(offset)
      .limit(limit)
      .exists('parent', false),
    User.findById(userId).select('rates').populate('rates'),
    Comment.countDocuments(query),
  ]);

  success(req, res, {
    comments: fillWithRatedRecursive({ comments, user: currentUser }),
    pages: Math.ceil(count / limit),
  });
};
