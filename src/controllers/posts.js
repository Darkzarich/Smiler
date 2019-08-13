const slugLib = require('slug');
const Post = require('../models/Post');

module.exports = {
  getAll: async (req, res, next) => {
    const limit = +req.query.limit || 100;
    const offset = +req.query.offset || 0;

    if (limit > 100) {
      next(Error('Limit can\'t be more than 100'));
    }

    try {
      const posts = await Post.find({})
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
        error: new Error('Bad Request'),
      });
    }

    try {
      const post = await Post.findOne({
        slug,
      });

      if (!post) {
        next({
          status: 404,
          error: new Error('Not Found'),
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
