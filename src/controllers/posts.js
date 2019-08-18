const slugLib = require('slug');
const multer = require('multer');
const path = require('path');

const Post = require('../models/Post');
const User = require('../models/User');

const { generateError, success } = require('./utils/utils');

const uploader = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, path.join(__dirname, '../..', '/uploads'));
    },
    filename: (req, file, cb) => {
      cb(null, `${Date.now()}${path.extname(file.originalname)}`);
    },
  }),
  limits: {
    fieldSize: 1 * 1024 * 1024,
    fileSize: 1 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
      cb(new Error('Invalid file extention'), false);
    } else {
      cb(null, true);
    }
  },
}).array('attachments', 3);

module.exports = {
  getAll: async (req, res, next) => {
    const limit = +req.query.limit || 100;
    const offset = +req.query.offset || 0;
    const author = req.query.author || '';

    if (limit > 100) { generateError('Limit can\'t be more than 100', 422, next); return; }

    try {
      const query = {};

      if (author) {
        const result = await User.findOne({
          login: author,
        });
        if (!result) {
          generateError('User doesn\'t exist', 404, next);
          return;
        }
        query.author = result.id;
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

    if (!slug) { generateError('Slug is required', 422, next); return; }

    try {
      const post = await Post.findOne({
        slug,
      })
        .populate('author', 'login');

      if (!post) {
        generateError('Post doesn\'t exist', 404, next);
        return;
      }
      success(res, post);
    } catch (e) {
      next(e);
    }
  },
  create: async (req, res, next) => {
    const { userId } = req.session;
    const { title } = req.body;
    const { body } = req.body;

    if (!title) { generateError('Title is required', 422, next); return; }
    if (!body) { generateError('Body is required', 422, next); return; }
    // it's possible to send both form-data and json
    // TODO: every user will have template for post, it's created as soon
    // as image is uploaded or button save as template is used

    const slug = `${slugLib(title)}-${(Math.random() * Math.pow(36, 6) | 0).toString(36)}`;

    try {
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
  upload: (req, res, next) => {
    uploader(req, res, (err) => {
      if (err) {
        generateError(err.message, 413, next);
      }
    });
  },
};
