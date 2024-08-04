const multer = require('multer');
const Sharp = require('sharp');
const path = require('path');
const fs = require('fs/promises');
const DiskStorage = require('../../libs/DiskStorage');

const User = require('../../models/User');

const {
  POST_SECTIONS_MAX,
  POST_MAX_UPLOAD_IMAGE_SIZE,
} = require('../../constants');
const { ContentTooLargeError, ValidationError } = require('../../errors');
const { success } = require('../../utils/utils');

const postMulter = multer({
  storage: new DiskStorage({
    destination: async (req, file, callback) => {
      callback(
        null,
        path.join(process.cwd(), 'uploads', req.session.userLogin),
      );
    },
    filename: (req, file, callback) => {
      callback(null, `${Date.now()}${path.extname(file.originalname)}`);
    },
    sharp: (req, file, callback) => {
      const resizer = Sharp()
        .resize(640, 360, {
          fit: 'cover',
          withoutEnlargement: true,
        })
        .jpeg({
          quality: 60,
          progressive: true,
        });

      callback(null, resizer);
    },
  }),
  limits: {
    fieldSize: POST_MAX_UPLOAD_IMAGE_SIZE,
    fileSize: POST_MAX_UPLOAD_IMAGE_SIZE,
  },
  fileFilter: (req, file, callback) => {
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
      callback(
        new ValidationError(
          'Invalid file extension. Only jpg, jpeg, png, gif are allowed.',
        ),
      );

      return;
    }

    // Accept the file
    callback(null, true);
  },
}).single('picture'); // frontend form-data name for file

exports.upload = async (req, res, next) => {
  const { userId, userLogin } = req.session;

  const user = await User.findById(userId).select('template');

  if (user.template.sections.length >= POST_SECTIONS_MAX) {
    throw new ContentTooLargeError(
      `Exceed limit of post sections: ${POST_SECTIONS_MAX}`,
    );
  }

  const rootFolder = process.cwd();

  // eslint-disable-next-line security/detect-non-literal-fs-filename
  await fs.mkdir(path.join(rootFolder, 'uploads', userLogin), {
    recursive: true,
  });

  // Initiate the upload with multer middleware but calling it as a function
  postMulter(req, res, async (error) => {
    if (error) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        next(
          new ContentTooLargeError(
            `Uploaded image is too large. Max allowed size is ${POST_MAX_UPLOAD_IMAGE_SIZE / 1024 / 1024}MB`,
          ),
        );

        return;
      }

      // Some unknown error
      next(error);
    }

    // Getting the path that looks like "/uploads/username/file.jpg"
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
};
