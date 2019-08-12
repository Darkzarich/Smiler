const slugLib = require('slug');
const Post = require('../models/Post');

module.exports = {
  getAll: async (req, res, next) => {
    try {
      const posts = await Post.find({});
      res.status(200).json(posts);
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
