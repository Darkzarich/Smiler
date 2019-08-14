const slugLib = require('slug');
const Post = require('../models/Post');
const User = require('../models/User');

module.exports = {
  getAll: async (req, res, next) => {
    const limit = +req.query.limit || 100;
    const offset = +req.query.offset || 0;
    const author = req.query.author || '';

    if (limit > 100) {
      next(Error('Limit can\'t be more than 100'));
    }

    try {
      const query = {};

      if (author) {
        const result = await User.findOne({
          login: author,
        });
        if (!result) {
          next({
            status: 404,
            error: new Error('User doesn\'t exist'),
          });
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

      res.status(200).json({
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
      next({
        status: 400,
        error: new Error('Slug is required'),
      });
    }

    try {
      const post = await Post.findOne({
        slug,
      })
        .populate('author', 'login');

      if (!post) {
        next({
          status: 404,
          error: new Error('Post doesn\'t exist'),
        });
      } else {
        res.status(200).json(post);
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

      res.status(200).json(req.body);
    } catch (e) {
      next(e);
    }
  },
};
