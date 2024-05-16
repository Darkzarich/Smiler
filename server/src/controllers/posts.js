/* eslint-disable no-underscore-dangle */
const slugLib = require('slug');
const multer = require('multer');
const Sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const Post = require('../models/Post');
const User = require('../models/User');
const Rate = require('../models/Rate');

const { generateError, success, asyncErrorHandler } = require('./utils/utils');
const diskStorage = require('./utils/DiskStorage');
const consts = require('../const/const');

const uploader = multer({
  storage: diskStorage({
    destination: async (req, file, cb) => {
      cb(null, path.join(process.cwd(), '/uploads', req.session.userLogin));
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
          quality: 60,
          progressive: true,
        });

      cb(null, resizer);
    },
  }),
  limits: {
    fieldSize: 3 * 1024 * 1024,
    fileSize: 3 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
      cb(new Error('Invalid file extension'), false);
    } else {
      cb(null, true);
    }
  },
}).single('picture');

function startUpload(req, res, next) {
  uploader(req, res, async (err) => {
    if (err) {
      generateError(err.message, 413, next);
    } else {
      const user = await User.findById(req.session.userId).select('template');
      // /uploads/username/file.jpg
      const fileRelativePath = req.file.path.replace(process.cwd(), '');

      const newSection = {
        type: 'pic',
        url: fileRelativePath,
        hash: (Math.random() * Math.random()).toString(36),
        isFile: true,
      };

      user.template.sections.push(newSection);

      user.markModified('template');

      await user.save();

      success(req, res, newSection);
    }
  });
}

module.exports = {
  // TODO: fix counting pages for pages, with author filter counts for all pages
  getAll: asyncErrorHandler(async (req, res, next) => {
    const limit = +req.query.limit || 100;
    const offset = +req.query.offset || 0;
    const author = req.query.author || '';
    const title = req.query.title || '';
    const dateFrom = req.query.dateFrom || '';
    const dateTo = req.query.dateTo || '';
    const ratingFrom = +req.query.ratingFrom || '';
    const ratingTo = +req.query.ratingTo || '';
    const sort = req.query.sort || '-createdAt';
    const tags = req.query.tags || [];
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

      if (title) {
        if (title.length > consts.POST_TITLE_MAX_LENGTH) {
          generateError('Title is too long', 422, next);
          return;
        }
        query.title = new RegExp(`${title.trim()}`, 'gi');
      }

      if (dateFrom || dateTo) {
        query.createdAt = {};
        if (dateFrom) {
          const dateFromCheck = new Date(dateFrom);
          if (dateFromCheck.toString() === 'Invalid Date') {
            generateError('Invalid date', 422, next); return;
          }
          query.createdAt.$gte = dateFromCheck;
        }

        if (dateTo) {
          const dateToCheck = new Date(dateTo);
          if (dateToCheck.toString() === 'Invalid Date') {
            generateError('Invalid date', 422, next); return;
          }
          query.createdAt.$lte = dateToCheck;
        }
      }

      if (ratingTo || ratingFrom) {
        query.rating = {};
        if (ratingFrom) {
          query.rating.$gte = ratingFrom;
        }
        if (ratingTo) {
          query.rating.$lte = ratingTo;
        }
      }

      if (tags.length > 0) {
        query.tags = {
          $in: tags,
        };
      }

      Promise.all([
        Post.find(query)
          .sort(sort)
          .populate('author', 'login avatar')
          .limit(limit)
          .skip(offset),
        User.findById(userId).select('rates').populate('rates'),
        Post.countDocuments(query),
      ]).then((result) => {
        const posts = result[0];
        const user = result[1];
        const pages = Math.ceil(result[2] / limit);

        const transPosts = posts.map(el => el.toResponse(user));

        success(req, res, {
          pages,
          posts: transPosts,
        });
      }).catch((e) => {
        next(e);
      });
    } catch (e) {
      next(e);
    }
  }),
  getFeed: asyncErrorHandler(async (req, res, next) => {
    const limit = +req.query.limit || 100;
    const offset = +req.query.offset || 0;
    const { userId } = req.session;

    if (limit > 100) { generateError('Limit can\'t be more than 100', 422, next); return; }

    try {
      const query = {};

      const user = await User.findById(userId).populate('rates');

      query.$and = [
        {
          $or: [
            {
              tags: {
                $in: user.tagsFollowed,
              },
            },
            {
              author: {
                $in: user.usersFollowed,
              },
            },
          ],
        },
        {
          author: {
            $ne: userId,
          },
        },
      ];

      Promise.all([
        Post.find(query)
          .sort('-createdAt')
          .populate('author', 'login avatar')
          .limit(limit)
          .skip(offset),
        Post.countDocuments(query),
      ]).then((result) => {
        const posts = result[0];
        const pages = Math.ceil(result[1] / limit);

        const transPosts = posts.map(el => el.toResponse(user));

        success(req, res, {
          pages,
          posts: transPosts,
        });
      }).catch((e) => {
        next(e);
      });
    } catch (e) {
      next(e);
    }
  }),
  getBySlug: asyncErrorHandler(async (req, res, next) => {
    const { slug } = req.params;
    const { userId } = req.session;

    // TODO: predownload using params

    if (!slug) { generateError('slug is required', 422, next); return; }

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
          success(req, res, post.toResponse(user));
        }
      }).catch((e) => {
        next(e);
      });
    } catch (e) {
      next(e);
    }
  }),
  create: asyncErrorHandler(async (req, res, next) => {
    // TODO: rework this | move validation and validate allowed tags, cut attributes

    const { userId } = req.session;
    const { title } = req.body;
    const { tags } = req.body;
    const { sections } = req.body;

    if (!title) { generateError('Title is required', 422, next); return; }
    if (!sections || sections.length < 1) { generateError('At least one section is required', 422, next); return; }
    if (sections.length > consts.POST_SECTIONS_MAX) { generateError('Exceeded max amount of sections', 422, next); return; }
    if (title.length > consts.POST_TITLE_MAX_LENGTH) { generateError('Exceeded max length of title', 422, next); return; }

    if (tags) {
      if (tags.length > consts.POST_MAX_TAGS) { generateError('Too many tags', 422, next); return; }
      if (tags.find(el => el.length > consts.POST_MAX_TAG_LEN)) { generateError('Exceeded max length of a tag', 422, next); return; }
    }

    const textSections = sections.filter(sec => sec.type === consts.POST_SECTION_TYPES.TEXT);
    let typeError = false;
    const textSectionsSumLength = textSections.reduce((acc, el) => {
      // while we go through array we could save some time validating one more thing along the way
      if (!Object.values(consts.POST_SECTION_TYPES).includes(el.type)) {
        typeError = true;
      }

      return acc + el.content.length;
    }, 0);

    if (textSectionsSumLength > consts.POST_SECTIONS_MAX_LENGTH) {
      generateError(`Text sections sum length exceeded max allowed length of ${consts.POST_SECTIONS_MAX_LENGTH} symbols`, 422, next);
      return;
    }

    if (typeError) {
      generateError(`One of sections has unsupported type. Supported types: ${consts.POST_SECTION_TYPES}`, 422, next);
      return;
    }

    const slug = `${slugLib(title)}-${new Date().getTime().toString(36)}`;

    const user = await User.findById(userId).select('template');

    try {
      const post = await Post.create({
        title,
        sections,
        tags,
        slug,
        author: userId,
      });

      user.template.title = '';
      user.template.sections = [];
      user.template.tags = [];

      user.markModified('template');
      await user.save();

      success(req, res, post);
    } catch (e) {
      next(e);
    }
  }),
  update: asyncErrorHandler(async (req, res, next) => {
    // TODO: validate sections on update by type and other stuff the same as when creating post

    const { userId } = req.session;
    const { id } = req.params;
    const { title } = req.body;
    const { tags } = req.body;
    const { sections } = req.body;

    const foundPost = await Post.findById(id);

    if (foundPost) {
      if (foundPost.author.toString() !== userId) { generateError('The post is not yours', 403, next); return; }

      const curDate = new Date().getTime();
      const postDate = new Date(foundPost.createdAt.toString()).getTime();

      if (curDate - postDate > consts.POST_TIME_TO_UPDATE) {
        generateError(`You can edit post only within first ${consts.POST_TIME_TO_UPDATE / 1000 / 60} min`, 405, next);
      } else {
        const toDelete = [];

        if (tags) {
          if (tags.length > consts.POST_MAX_TAGS) { generateError('Too many tags', 422, next); return; }
          if (tags.find(el => el.length > consts.POST_MAX_TAG_LEN)) { generateError('Exceeded max length of a tag', 422, next); return; }
        }

        if (sections) {
          foundPost.sections = sections;

          // Searching for pics that got removed from post
          foundPost.sections.forEach((rowSec) => {
            if (rowSec.type === consts.POST_SECTION_TYPES.PICTURE && rowSec.isFile) {
              const item = sections.find(el => (el.url === rowSec.url));
              if (!item) {
                toDelete.push(rowSec.url);
              }
            }
          });
        }


        foundPost.title = title || foundPost.title;
        foundPost.tags = tags || foundPost.tags;

        if (toDelete && toDelete instanceof Array && toDelete.length > 0) {
          toDelete.forEach((el) => {
            const absolutePath = path.join(process.cwd(), el);

            fs.exists(absolutePath, (exist) => {
              if (exist) {
                fs.unlink(absolutePath, (err) => {
                  if (err) {
                    generateError(err, 500, next);
                  }
                });
              }
            });
          });
        }
        await foundPost.save();
        success(req, res);
      }
    } else {
      generateError('Post doesn\'t exist', 404, next);
    }
  }),
  delete: asyncErrorHandler(async (req, res, next) => {
    const { userId } = req.session;
    const { id } = req.params;

    const foundPost = await Post.findById(id);

    if (foundPost) {
      if (foundPost.author.toString() !== userId) { generateError('The post is not yours', 403, next); return; }

      const curDate = new Date().getTime();
      const postDate = new Date(foundPost.createdAt.toString()).getTime();

      if (curDate - postDate > consts.POST_TIME_TO_UPDATE) {
        generateError(`You can delete post only within first ${consts.POST_TIME_TO_UPDATE / 1000 / 60} min`, 405, next);
      } else {
        const { sections } = foundPost;

        /**
         * TODO: need to somehow check if post has comments or no and then don't allow to delete or
         * delete related comments
        */

        await foundPost.remove();

        const filePicSections = sections.filter(
          sec => sec.type === consts.POST_SECTION_TYPES.PICTURE && sec.isFile,
        );

        filePicSections.forEach((sec) => {
          const absolutePath = path.join(process.cwd(), sec.url);

          fs.exists(absolutePath, (exists) => {
            if (exists) {
              fs.unlink(absolutePath, (err) => {
                if (err) {
                  generateError(err, 500, next);
                }
              });
            }
          });
        });

        success(req, res);
      }
    } else {
      generateError('Post doesn\'t exist', 404, next);
    }
  }),
  upload: asyncErrorHandler(async (req, res, next) => {
    try {
      const user = await User.findById(req.session.userId).select('template');

      if (user.template.sections.length === consts.POST_SECTIONS_MAX) {
        generateError(`Exceed limit of post sections: ${consts.POST_SECTIONS_MAX}`, 409, next);
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
  }),
  vote: asyncErrorHandler(async (req, res, next) => {
    const { userId } = req.session;
    const { id } = req.params;
    const { negative } = req.body;

    const foundPost = await Post.findById(id);

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

          success(req, res);
        }).catch((e) => {
          next(e);
        });
      } else {
        generateError('Can\'t rate post you already rated', 405, next);
      }
    } else {
      generateError('Post doesn\'t exist', 404, next);
    }
  }),
  unvote: asyncErrorHandler(async (req, res, next) => {
    const { userId } = req.session;
    const { id } = req.params;

    const foundPost = await Post.findById(id);

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

          success(req, res);
        }).catch((e) => {
          next(e);
        });
      } else {
        generateError('You didn\'t rate this post', 405, next);
      }
    } else {
      generateError('Post doesn\'t exist', 404, next);
    }
  }),
};
