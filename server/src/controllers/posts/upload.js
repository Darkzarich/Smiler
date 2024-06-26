const multer = require('multer');
const Sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const diskStorage = require('../../utils/DiskStorage');

const User = require('../../models/User');
const consts = require('../../const/const');

const { success, asyncErrorHandler, generateError } = require('../../utils/utils');

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

exports.upload = asyncErrorHandler(async (req, res, next) => {
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
});
