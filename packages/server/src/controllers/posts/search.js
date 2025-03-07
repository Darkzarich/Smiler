import User from '../../models/User.js';
import Post from '../../models/Post.js';
import {
  POST_TITLE_MAX_LENGTH,
  POST_MAX_LIMIT,
} from '../../constants/index.js';
import { ValidationError, ERRORS } from '../../errors/index.js';
import { sendSuccess } from '../../utils/response-utils.js';

export async function search(req, res) {
  const { userId } = req.session;
  const limit = +req.query.limit || POST_MAX_LIMIT;
  const offset = +req.query.offset || 0;

  const {
    title = '',
    dateFrom = '',
    dateTo = '',
    ratingFrom = '',
    ratingTo = '',
    tags = [],
  } = req.query;

  if (limit > POST_MAX_LIMIT) {
    throw new ValidationError(ERRORS.POST_LIMIT_PARAM_EXCEEDED);
  }

  const query = {};

  if (title) {
    if (title.length > POST_TITLE_MAX_LENGTH) {
      throw new ValidationError(ERRORS.POST_TITLE_MAX_LENGTH_EXCEEDED);
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
        throw new ValidationError(ERRORS.POST_SEARCH_INVALID_DATE);
      }

      query.createdAt.$gte = dateFromCheck;
    }

    if (dateTo) {
      const dateToCheck = new Date(dateTo);

      if (dateToCheck.toString() === 'Invalid Date') {
        throw new ValidationError(ERRORS.POST_SEARCH_INVALID_DATE);
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

  const [posts, user, total] = await Promise.all([
    Post.find(query)
      .sort({ rating: -1 })
      .populate('author', 'login avatar')
      .limit(limit)
      .skip(offset),
    User.findById(userId).select('rates').populate('rates'),
    Post.countDocuments(query),
  ]);

  const postsWithRated = posts.map((post) => post.toResponse(user));

  sendSuccess(res, {
    posts: postsWithRated,
    total,
    pages: Math.ceil(total / limit),
    hasNextPage: offset + limit < total,
  });
}
