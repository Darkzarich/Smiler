const Comment = require('../../models/Comment');
const User = require('../../models/User');
const { success, asyncErrorHandler, generateError } = require('../../utils/utils');

exports.getList = asyncErrorHandler(async (req, res, next) => {
  const { userId } = req.session;
  const { post } = req.query;
  const { author } = req.query;

  const limit = +req.query.limit || 10;
  const offset = +req.query.offset || 0;

  const query = {};

  if (limit > 30) { generateError('Limit can\'t be more than 30', 422, next); return; }
  if (!post) { generateError('Can\'t get comments without set post', 422, next); return; }

  if (author) {
    const foundAuthor = await User.findOne({
      login: author,
    });
    if (!foundAuthor) { generateError('User is not found', 404, next); return; }

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
    ]).then((result) => {
      const comments = result[0];
      const user = result[1];
      const pages = Math.ceil(result[2] / limit);

      function formRecursive(array) {
        const newArray = [];
        function deep(nestedArray) {
          if (nestedArray.children.length > 0) {
            nestedArray = nestedArray.children.map((el) => {
              const el2 = el.toResponse(user);
              el2.children = deep(el);
              return el2;
            });

            return nestedArray;
          }
          return [];
        }

        array.forEach((el) => {
          const el2 = el.toResponse(user);
          if (el2.children.length > 0) {
            el2.children = deep(el2);
          }
          newArray.push(el2);
        });

        return newArray;
      }

      const transComments = formRecursive(comments);

      success(req, res, {
        comments: transComments,
        pages,
      });
    }).catch((e) => {
      next(e);
    });
  } catch (e) {
    next(e);
  }
});
