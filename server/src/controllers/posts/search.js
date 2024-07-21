const User = require('../../models/User');
const Post = require('../../models/Post');
const consts = require('../../const/const');
const {
  success,
  asyncErrorHandler,
  generateError,
} = require('../../utils/utils');

exports.search = asyncErrorHandler(async (req, res, next) => {
  const { userId } = req.session;

  const {
    limit = 100,
    offset = 0,
    title = '',
    dateFrom = '',
    dateTo = '',
    ratingFrom = '',
    ratingTo = '',
    tags = [],
  } = req.query;

  if (+limit > 100) {
    return generateError("Limit can't be more than 100", 422, next);
  }

  const query = {};

  if (title) {
    if (title.length > consts.POST_TITLE_MAX_LENGTH) {
      return generateError('Title is too long', 422, next);
    }

    const sanitizedTitle = title.trim().replace(/[^0-9A-Za-z\s]/g, '');

    // eslint-disable-next-line security/detect-non-literal-regexp
    query.title = new RegExp(sanitizedTitle, 'gi');
  }

  if (dateFrom || dateTo) {
    query.createdAt = {};

    if (dateFrom) {
      const dateFromCheck = new Date(dateFrom);

      if (dateFromCheck.toString() === 'Invalid Date') {
        return generateError('Invalid date', 422, next);
      }

      query.createdAt.$gte = dateFromCheck;
    }

    if (dateTo) {
      const dateToCheck = new Date(dateTo);

      if (dateToCheck.toString() === 'Invalid Date') {
        return generateError('Invalid date', 422, next);
      }

      query.createdAt.$lte = dateToCheck;
    }
  }

  if (ratingTo || ratingFrom) {
    query.rating = {};

    if (ratingFrom) {
      query.rating.$gte = +ratingFrom;
    }
    if (ratingTo) {
      query.rating.$lte = +ratingTo;
    }
  }

  if (tags.length > 0) {
    query.tags = {
      $in: tags,
    };
  }

  const [posts, user, count] = await Promise.all([
    Post.find(query)
      .sort({ rating: -1 })
      .populate('author', 'login avatar')
      .limit(+limit)
      .skip(+offset),
    User.findById(userId).select('rates').populate('rates'),
    Post.countDocuments(query),
  ]);

  const postsWithRated = posts.map((post) => post.toResponse(user));

  success(req, res, {
    pages: Math.ceil(count / +limit),
    posts: postsWithRated,
  });
});
