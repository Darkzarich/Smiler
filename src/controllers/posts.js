const slugLib = require('slug');
const Post = require('../models/Post');
const User = require('../models/User');
const { generateError, success } = require('./utils/utils');

module.exports = {
  getAll: async (req, res, next) => {
    const limit = +req.query.limit || 100;
    const offset = +req.query.offset || 0;
    const author = req.query.author || '';

    if (limit > 100) {
      generateError('Limit can\'t be more than 100', 422, next);
    }

    try {
      const query = {};

      if (author) {
        const result = await User.findOne({
          login: author,
        });
        if (!result) {
          generateError('User doesn\'t exist', 404, next);
        } else {
          query.author = result.id;
        }
      }

      const posts = await Post.find(query)
        .sort('-createdAt')
        .populate('author', 'login')
        .limit(limit)
        .skip(offset);

      const pages = Math.ceil(await Post.countDocuments() / limit);

      success(res, {
        pages,
        posts,
      });
    } catch (e) {
      next(e);
    }
  },
  getBySlug: async (req, res, next) => {
    const slug = req.params.slug.trim();

    if (!slug) {
      generateError('Slug is required', 422, next);
    }

    try {
      const post = await Post.findOne({
        slug,
      })
        .populate('author', 'login');

      if (!post) {
        generateError('Post doesn\'t exist', 404, next);
      } else {
        success(res, post);
      }
    } catch (e) {
      next(e);
    }
  },
  create: async (req, res, next) => {
    try {
      const { userId } = req.session;

      const { title } = req.body;
      const { body } = req.body;
      const slug = `${slugLib(title)}-${(Math.random() * Math.pow(36, 6) | 0).toString(36)}`;

      const post = await Post.create({
        title,
        body,
        slug,
        author: userId,
      });

      success(res, req.body);
    } catch (e) {
      next(e);
    }
  },
};
