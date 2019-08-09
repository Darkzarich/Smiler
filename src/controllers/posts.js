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
      const post = await Post.create({
        ...req.body,
      });
      global.console.log(post);
      res.status(200).json(JSON.stringify(req.body));
    } catch (e) {
      next(e);
    }
  },
};
