/* eslint-disable no-underscore-dangle */
const Comment = require('../models/Comment');
const User = require('../models/User');
const Rate = require('../models/Rate');
const { generateError, success, asyncErrorHandler } = require('./utils/utils');
const consts = require('../const/const');

module.exports = {
  getComment: asyncErrorHandler(async (req, res, next) => {
    const { userId } = req.session;
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
  }),
  createComment: asyncErrorHandler(async (req, res, next) => {
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

        success(req, res, comment);
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
        success(req, res, comment);
      }
    } catch (e) {
      next(e);
    }
  }),
  editComment: asyncErrorHandler(async (req, res, next) => {
    const { userId } = req.session;
    const { id } = req.params;
    const { body } = req.body;

    const comFound = await Comment.findById(id);

    if (comFound) {
      if (comFound.author.id.toString() !== userId) {
        generateError('You can edit only your own comments', 403, next);
      } else if (comFound.children.length > 0) {
        generateError('You can\'t edit a comment if someone already answered it', 405, next);
      } else {
        const comFoundDate = new Date(comFound.createdAt.toString()).getTime();
        const dateNow = new Date().getTime();

        if (dateNow - comFoundDate > consts.COMMENT_TIME_TO_UPDATE) {
          generateError(`You can update comment only within first ${consts.COMMENT_TIME_TO_UPDATE / 1000 / 60} min`, 405, next);
        } else {
          comFound.body = body;
          await comFound.save();

          success(req, res);
        }
      }
    } else {
      generateError('Comment is not found', 404, next);
    }
  }),
  deleteComment: asyncErrorHandler(async (req, res, next) => {
    const { userId } = req.session;
    const { id } = req.params;

    const comFound = await Comment.findById(id);

    if (comFound) {
      if (comFound.author.id.toString() !== userId) {
        generateError('You can delete only your own comments', 403, next);
      } else {
        const comFoundDate = new Date(comFound.createdAt.toString()).getTime();
        const dateNow = new Date().getTime();

        if (dateNow - comFoundDate > consts.COMMENT_TIME_TO_UPDATE) {
          generateError(`You can delete comment only within first ${consts.COMMENT_TIME_TO_UPDATE / 1000 / 60} min`, 405, next);
        } else if (comFound.children.length > 0) {
          comFound.deleted = true;
          await comFound.save();
          success(req, res);
        } else {
          await comFound.remove();
          success(req, res);
        }
      }
    } else {
      generateError('Comment is not found', 404, next);
    }
  }),
  vote: asyncErrorHandler(async (req, res, next) => {
    const { userId } = req.session;
    const { id } = req.params;
    const { negative } = req.body;

    const foundComment = await Comment.findById(id);

    if (foundComment) {
      if (foundComment.author._id.toString() === userId) {
        generateError('Can\'t rate your own comment', 405, next);
        return;
      }

      const user = await User.findById(userId).populate('rates');
      const rated = user.isRated(foundComment.id);

      if (!rated.result) {
        foundComment.rating += negative ? -consts.COMMENT_RATE_VALUE : consts.COMMENT_RATE_VALUE;

        Promise.all([
          Rate.create({
            target: foundComment.id,
            targetModel: 'Comment',
            negative,
          }),
          foundComment.save(),
          User.findById(foundComment.author),
        ]).then((result) => {
          const newRate = result[0];
          const commentAuthor = result[2];

          user.rates.push(newRate._id);
          commentAuthor.rating += negative ? -consts.COMMENT_RATE_VALUE : consts.COMMENT_RATE_VALUE;

          user.save();
          commentAuthor.save();

          success(req, res);
        }).catch((e) => {
          next(e);
        });
      } else {
        generateError('Can\'t rate comment you already rated', 405, next);
      }
    } else {
      generateError('Comment doesn\'t exist', 404, next);
    }
  }),
  unvote: asyncErrorHandler(async (req, res, next) => {
    const { userId } = req.session;
    const { id } = req.params;

    const foundComment = await Comment.findById(id);

    if (foundComment) {
      const user = await User.findById(userId).populate('rates');
      const rated = user.isRated(foundComment.id);

      if (rated.result) {
        foundComment.rating += rated.negative ? consts.COMMENT_RATE_VALUE : -consts.COMMENT_RATE_VALUE;

        Promise.all([
          Rate.deleteOne({
            target: foundComment.id,
          }),
          foundComment.save(),
          User.findById(foundComment.author),
        ]).then((result) => {
          const commentAuthor = result[2];

          user.rates.remove(rated.rated);
          commentAuthor.rating += rated.negative ? consts.COMMENT_RATE_VALUE : -consts.COMMENT_RATE_VALUE;

          user.save();
          commentAuthor.save();

          success(req, res);
        }).catch((e) => {
          next(e);
        });
      } else {
        generateError('You didn\'t rate this comment', 405, next);
      }
    } else {
      generateError('Comment doesn\'t exist', 404, next);
    }
  }),
};
