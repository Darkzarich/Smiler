const Comment = require('../models/Comment');
const User = require('../models/User');
const { generateError, success } = require('./utils/utils');

module.exports = {
  getComment: async (req, res, next) => {
    const { post } = req.query;
    const limit = +req.query.limit || 10;
    const offset = +req.query.offset || 0;
    const { author } = req.query;
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
      const comments = await Comment.find(query)
        .sort('-createdAt')
        .skip(offset)
        .limit(limit)
        .exists('parent', false);

      success(res, comments);
    } catch (e) {
      next(e);
    }
  },
  createComment: async (req, res, next) => {
    const { body } = req.body;
    const { parent } = req.body;
    const { post } = req.body;
    const { userId } = req.session;

    if (!body) { generateError('Body must be filled', 422, next); return; }
    if (!post) { generateError('Comment must be assigned to a post', 422, next); return; }

    try {
      if (!parent) {
        const comment = await Comment.create({
          post,
          body,
          author: userId,
        });

        success(res, comment);
      } else {
        const parentCommentary = await Comment.findOne({
          _id: parent,
          post,
        });

        if (!parentCommentary) { generateError('Parent commentary is not found', 404, next); return; }

        const comment = await Comment.create({
          post,
          body,
          parent,
          author: userId,
        });

        const { children } = parentCommentary;
        children.push(comment.id);
        parentCommentary.children = children;
        await parentCommentary.save();
        success(res);
      }
    } catch (e) {
      next(e);
    }
  },
  editComment: async (req, res, next) => {
    // TODO: finish this
    success(res);
  },
  deleteComment: async (req, res, next) => {
    // TODO: finish this
    success(res);
  },
};
