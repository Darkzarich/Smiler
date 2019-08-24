const slugLib = require('slug');
const multer = require('multer');
const Sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const Post = require('../models/Post');
const User = require('../models/User');

const { generateError, success } = require('./utils/utils');
const diskStorage = require('./utils/DiskStorage');
const consts = require('../const/const');

const uploader = multer({
  storage: diskStorage({
    destination: async (req, file, cb) => {
      cb(null, path.join(__dirname, '../..', '/uploads', req.session.userLogin));
    },
    filename: (req, file, cb) => {
      cb(null, `${Date.now()}${path.extname(file.originalname)}`);
    },
    sharp: (req, file, cb) => {
      const resizer = Sharp()
        .resize(640, 360, {
          fit: 'cover',
          withoutEnlargement: true,
        })
        .jpeg({
          quality: 40,
          progressive: true,
        });

      cb(null, resizer);
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
}).array('attachments', consts.POST_ATTACHMENTS_LIMIT);

function startUpload(req, res, next) {
  uploader(req, res, async (err) => {
    if (err) {
      generateError(err.message, 413, next);
    } else {
      const user = await User.findById(req.session.userId).select('template');

      req.files.forEach((file) => {
        user.template.attachments.push(file.path);
      });

      user.markModified('template');
      await user.save();

      success(res, {
        files: user.template.attachments,
      });
    }
  });
}

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
    // TODO: rework this

    const { userId } = req.session;
    const { title } = req.body;
    const { body } = req.body;

    if (!title) { generateError('Title is required', 422, next); return; }
    if (!body) { generateError('Body is required', 422, next); return; }

    const slug = `${slugLib(title)}-${(Math.random() * Math.pow(36, 6) | 0).toString(36)}`;

    const user = await User.findById(userId).select('template');

    try {
      const post = await Post.create({
        title,
        body,
        slug,
        uploads: user.template.attachments,
        author: userId,
      });

      user.template.title = '';
      user.template.body = '';
      user.template.attachments = [];

      user.markModified('template');
      await user.save();

      success(res, req.body);
    } catch (e) {
      next(e);
    }
  },
  upload: async (req, res, next) => {
    try {
      const user = await User.findById(req.session.userId).select('template');

      if (user.template.attachments.length === consts.POST_ATTACHMENTS_LIMIT) {
        generateError(`Exceed limit of post attachments: ${consts.POST_ATTACHMENTS_LIMIT}`, 409, next);
        return;
      }

      await !fs.exists(path.join(__dirname, '../..', '/uploads', req.session.userLogin), async (exists) => {
        if (!exists) {
          await fs.mkdir(path.join(__dirname, '../..', '/uploads', req.session.userLogin), (err) => {
            if (err) {
              next(new Error(`Something went wrong while uploading... : ${err}`));
            } else {
              startUpload(req, res, next);
            }
          });
        } else {
          startUpload(req, res, next);
        }
      });
    } catch (e) {
      next(e);
    }
  },
};
