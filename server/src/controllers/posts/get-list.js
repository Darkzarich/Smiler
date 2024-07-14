const User = require('../../models/User');
const Post = require('../../models/Post');
const consts = require('../../const/const');
const {
  success,
  asyncErrorHandler,
  generateError,
} = require('../../utils/utils');

exports.getList = asyncErrorHandler(async (req, res, next) => {
  const limit = +req.query.limit || 100;
  const offset = +req.query.offset || 0;
  const author = req.query.author || '';
  const title = req.query.title || '';
  const dateFrom = req.query.dateFrom || '';
  const dateTo = req.query.dateTo || '';
  const ratingFrom = +req.query.ratingFrom || '';
  const ratingTo = +req.query.ratingTo || '';
  const sort = req.query.sort || '-createdAt';
  const tags = req.query.tags || [];
  const { userId } = req.session;

  if (limit > 100) {
    generateError("Limit can't be more than 100", 422, next);
    return;
  }

  try {
    const query = {};

    if (author) {
      const result = await User.findOne({
        login: author,
      });

      if (!result) {
        generateError("User doesn't exist", 404, next);
        return;
      }

      query.author = result.id;
    }

    if (title) {
      if (title.length > consts.POST_TITLE_MAX_LENGTH) {
        generateError('Title is too long', 422, next);
        return;
      }
      query.title = new RegExp(`${title.trim()}`, 'gi');
    }

    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) {
        const dateFromCheck = new Date(dateFrom);
        if (dateFromCheck.toString() === 'Invalid Date') {
          generateError('Invalid date', 422, next);
          return;
        }
        query.createdAt.$gte = dateFromCheck;
      }

      if (dateTo) {
        const dateToCheck = new Date(dateTo);
        if (dateToCheck.toString() === 'Invalid Date') {
          generateError('Invalid date', 422, next);
          return;
        }
        query.createdAt.$lte = dateToCheck;
      }
    }

    if (ratingTo || ratingFrom) {
      query.rating = {};
      if (ratingFrom) {
        query.rating.$gte = ratingFrom;
      }
      if (ratingTo) {
        query.rating.$lte = ratingTo;
      }
    }

    if (tags.length > 0) {
      query.tags = {
        $in: tags,
      };
    }

    Promise.all([
      Post.find(query)
        .sort(sort)
        .populate('author', 'login avatar')
        .limit(limit)
        .skip(offset),
      User.findById(userId).select('rates').populate('rates'),
      Post.countDocuments(query),
    ])
      .then((result) => {
        const posts = result[0];
        const user = result[1];
        const pages = Math.ceil(result[2] / limit);

        const transPosts = posts.map((el) => el.toResponse(user));

        success(req, res, {
          pages,
          posts: transPosts,
        });
      })
      .catch((e) => {
        next(e);
      });
  } catch (e) {
    next(e);
  }
});
