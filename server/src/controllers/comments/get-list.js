const Comment = require('../../models/Comment');
const User = require('../../models/User');
const { success, generateError } = require('../../utils/utils');

function fillWithUserRecursive({ comments, user }) {
  if (!comments) {
    return [];
  }

  return comments.map((comment) => {
    const commentWithUser = comment.toResponse(user);

    if (commentWithUser.children && commentWithUser.children.length > 0) {
      commentWithUser.children = fillWithUserRecursive({
        comments: comment.children,
        user,
      });
    }

    return commentWithUser;
  });
}

exports.getList = async (req, res, next) => {
  const { userId } = req.session;
  const { post } = req.query;
  const { author } = req.query;

  const limit = +req.query.limit || 10;
  const offset = +req.query.offset || 0;

  const query = {};

  if (limit > 30) {
    generateError("Limit can't be more than 30", 422, next);
    return;
  }
  if (!post) {
    generateError("Can't get comments without set post", 422, next);
    return;
  }

  if (author) {
    const foundAuthor = await User.findOne({
      login: author,
    });
    if (!foundAuthor) {
      generateError('User is not found', 404, next);
      return;
    }

    query.author = foundAuthor.id;
  }

  query.post = post;

  try {
    Promise.all([
      Comment.find(query)
        .sort('-rating')
        .skip(offset)
        .limit(limit)
        .exists('parent', false),
      User.findById(userId).select('rates').populate('rates'),
      Comment.countDocuments(query).exists('parent', false),
    ])
      .then((result) => {
        const comments = result[0];
        const user = result[1];
        const pages = Math.ceil(result[2] / limit);

        success(req, res, {
          comments: fillWithUserRecursive({ comments, user }),
          pages,
        });
      })
      .catch((e) => {
        next(e);
      });
  } catch (e) {
    next(e);
  }
};
