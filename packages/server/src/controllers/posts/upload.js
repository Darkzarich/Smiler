import multer from 'multer';
import Sharp from 'sharp';
import { join, extname } from 'path';
import { mkdir } from 'fs/promises';
import DiskStorage from '../../libs/DiskStorage.js';
import User from '../../models/User.js';
import {
  POST_SECTIONS_MAX,
  POST_MAX_UPLOAD_IMAGE_SIZE,
} from '../../constants/index.js';
import {
  ContentTooLargeError,
  ValidationError,
  ERRORS,
} from '../../errors/index.js';
import { sendSuccess } from '../../utils/responseUtils.js';

const postMulter = multer({
  storage: new DiskStorage({
    destination: async (req, file, callback) => {
      callback(null, join(process.cwd(), 'uploads', req.session.userId));
    },
    filename: (req, file, callback) => {
      callback(null, `${Date.now()}${extname(file.originalname)}`);
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
      callback(new ValidationError(ERRORS.POST_INVALID_ATTACHMENT_EXTENSION));

      return;
    }

    // Accept the file
    callback(null, true);
  },
}).single('picture'); // frontend form-data name for file

export async function upload(req, res, next) {
  const { userId } = req.session;

  const user = await User.findById(userId).select('template');

  if (user.template.sections.length >= POST_SECTIONS_MAX) {
    throw new ContentTooLargeError(ERRORS.POST_SECTIONS_MAX_EXCEEDED);
  }

  const rootFolder = process.cwd();

  // eslint-disable-next-line security/detect-non-literal-fs-filename
  await mkdir(join(rootFolder, 'uploads', userId), {
    recursive: true,
  });

  // Initiate the upload with multer middleware but calling it as a function
  postMulter(req, res, async (error) => {
    if (error) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        next(
          new ContentTooLargeError(ERRORS.POST_MAX_UPLOAD_IMAGE_SIZE_EXCEEDED),
        );

        return;
      }

      // Some unknown error
      next(error);

      return;
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

    sendSuccess(res, newSection);
  });
}