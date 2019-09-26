/* eslint-disable no-underscore-dangle */
const slugLib = require('slug');
const multer = require('multer');
const Sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const Post = require('../models/Post');
const User = require('../models/User');
const Rate = require('../models/Rate');

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
    const { userId } = req.session;

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

      Promise.all([
        Post.find(query)
          .sort('-createdAt')
          .populate('author', 'login avatar')
          .limit(limit)
          .skip(offset),
        User.findById(userId).select('rates').populate('rates'),
        Post.countDocuments(),
      ]).then((result) => {
        const posts = result[0];
        const user = result[1];
        const pages = Math.ceil(result[2] / limit);

        const transPosts = posts.map(el => el.toResponse(user));

        success(res, {
          pages,
          posts: transPosts,
        });
      });
    } catch (e) {
      next(e);
    }
  },
  getBySlug: async (req, res, next) => {
    const slug = req.params.slug.trim();
    const { userId } = req.session;

    // TODO: predownload using params, redo slug to id because vue route can send id and use slug as link

    if (!slug) { generateError('Slug is required', 422, next); return; }

    try {
      Promise.all([
        Post.findOne({
          slug,
        }).populate('author', 'login avatar'),
        User.findById(userId).select('rates').populate('rates'),
      ]).then((result) => {
        const post = result[0];
        const user = result[1];

        if (!post) {
          generateError('Post doesn\'t exist', 404, next);
        } else {
          success(res, post.toResponse(user));
        }
      });
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

    const slug = `${slugLib(title)}-${new Date().getTime().toString(36)}`;

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

      success(res, post);
    } catch (e) {
      next(e);
    }
  },
  update: async (req, res, next) => {
    const { userId } = req.session;
    const { slug } = req.params;
    const { title } = req.body;
    const { body } = req.body;
    const { toDelete } = req.body;

    const foundPost = await Post.findOne({
      slug,
    });

    if (foundPost) {
      if (foundPost.author.toString() !== userId) { generateError('The post is not yours', 403, next); return; }

      const curDate = new Date().getTime();
      const postDate = new Date(foundPost.createdAt.toString()).getTime();


      if (curDate - postDate > consts.POST_TIME_TO_UPDATE) {
        generateError(`You can edit post only within first ${consts.POST_TIME_TO_UPDATE / 1000 / 60} min`, 405, next);
      } else {
        foundPost.body = body || foundPost.body;
        foundPost.title = title || foundPost.title;

        if (toDelete && toDelete instanceof Array && toDelete.length > 0) {
          toDelete.forEach((el) => {
            fs.exists(el, (exist) => {
              if (exist) {
                fs.unlink(el, (err) => {
                  if (err) {
                    generateError(err, 500, next);
                  }
                });
              }
            });
          });

          await foundPost.updateOne({
            $pull: {
              uploads: {
                $in: toDelete,
              },
            },
          });

          await foundPost.save();
          success(res);
        }
      }
    } else {
      generateError('Post doesn\'t exist', 404, next);
    }
  },
  delete: async (req, res, next) => {
    const { userId } = req.session;
    const { slug } = req.params;

    const foundPost = await Post.findOne({
      slug,
    });

    if (foundPost) {
      if (foundPost.author.toString() !== userId) { generateError('The post is not yours', 403, next); return; }

      const curDate = new Date().getTime();
      const postDate = new Date(foundPost.createdAt.toString()).getTime();

      if (curDate - postDate > consts.POST_TIME_TO_UPDATE) {
        generateError(`You can delete post only within first ${consts.POST_TIME_TO_UPDATE / 1000 / 60} min`, 405, next);
      } else {
        const { uploads } = foundPost;

        await foundPost.remove();

        uploads.forEach((el) => {
          fs.exists(el, (exists) => {
            if (exists) {
              fs.unlink(el, (err) => {
                if (err) {
                  generateError(err, 500, next);
                }
              });
            }
          });
        });

        success(res);
      }
    } else {
      generateError('Post doesn\'t exist', 404, next);
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
  rate: async (req, res, next) => {
    const { userId } = req.session;
    const { slug } = req.params;
    const { negative } = req.body;

    const foundPost = await Post.findOne({
      slug,
    });

    if (foundPost) {
      if (foundPost.author.toString() === userId) {
        generateError('Can\'t rate your own post', 405, next);
        return;
      }
      const user = await User.findById(userId).populate('rates');
      const rated = user.isRated(foundPost.id);

      if (!rated.result) {
        foundPost.rating += negative ? -consts.POST_RATE_VALUE : consts.POST_RATE_VALUE;

        Promise.all([
          Rate.create({
            target: foundPost.id,
            targetModel: 'Post',
            negative,
          }),
          foundPost.save(),
          User.findById(foundPost.author),
        ]).then((result) => {
          const newRate = result[0];
          const postAuthor = result[2];

          user.rates.push(newRate._id);
          postAuthor.rating += negative ? -consts.POST_RATE_VALUE : consts.POST_RATE_VALUE;

          user.save();
          postAuthor.save();

          success(res);
        });
      } else {
        generateError('Can\'t rate post you already rated', 405, next);
      }
    } else {
      generateError('Post doesn\'t exist', 404, next);
    }
  },
  unrate: async (req, res, next) => {
    const { userId } = req.session;
    const { slug } = req.params;

    const foundPost = await Post.findOne({
      slug,
    });

    if (foundPost) {
      const user = await User.findById(userId).populate('rates');
      const rated = user.isRated(foundPost.id);

      if (rated.result) {
        foundPost.rating += rated.negative ? consts.POST_RATE_VALUE : -consts.POST_RATE_VALUE;

        Promise.all([
          Rate.deleteOne({
            target: foundPost.id,
          }),
          foundPost.save(),
          User.findById(foundPost.author),
        ]).then((result) => {
          const postAuthor = result[2];

          user.rates.remove(rated.rated);
          postAuthor.rating += rated.negative ? consts.POST_RATE_VALUE : -consts.POST_RATE_VALUE;

          user.save();
          postAuthor.save();

          success(res);
        });
      } else {
        generateError('You didn\'t rate this post', 405, next);
      }
    } else {
      generateError('Post doesn\'t exist', 404, next);
    }
  },
};
