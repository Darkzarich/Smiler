const multer = require('multer');
const Sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const DiskStorage = require('../../utils/DiskStorage');

const User = require('../../models/User');
const consts = require('../../const/const');

const { success, generateError } = require('../../utils/utils');

const uploader = multer({
  storage: new DiskStorage({
    destination: async (req, file, cb) => {
      cb(null, path.join(process.cwd(), 'uploads', req.session.userLogin));
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
    fieldSize: 3 * 1024 * 1024, // 3MB
    fileSize: 3 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
      cb(new Error('Invalid file extension'), false);
    } else {
      cb(null, true);
    }
  },
}).single('picture'); // frontend form-data name for file

function startUpload(user, req, res, next) {
  uploader(req, res, async (err) => {
    if (err) {
      generateError(err.message, 413, next);

      return;
    }

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
  });
}

exports.upload = async (req, res, next) => {
  try {
    const user = await User.findById(req.session.userId).select('template');

    if (user.template.sections.length >= consts.POST_SECTIONS_MAX) {
      generateError(
        `Exceed limit of post sections: ${consts.POST_SECTIONS_MAX}`,
        409,
        next,
      );
      return;
    }

    const rootFolder = process.cwd();

    await !fs.access(
      path.join(rootFolder, 'uploads', req.session.userLogin),
      async (accessErr) => {
        if (accessErr) {
          // eslint-disable-next-line security/detect-non-literal-fs-filename
          await fs.mkdir(
            path.join(rootFolder, 'uploads', req.session.userLogin),
            (err) => {
              if (err) {
                next(new Error(`Something went wrong while uploading: ${err}`));
              } else {
                startUpload(user, req, res, next);
              }
            },
          );

          return;
        }

        startUpload(user, req, res, next);
      },
    );
  } catch (e) {
    next(e);
  }
};
