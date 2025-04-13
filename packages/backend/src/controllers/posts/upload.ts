import type { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import Sharp from 'sharp';
import { join, extname } from 'path';
import { mkdir } from 'fs/promises';
import DiskStorage from '@libs/DiskStorage';
import { UserModel } from '@models/User';
import { POST_SECTION_TYPES, PostPictureSection } from '@models/Post';
import {
  POST_SECTIONS_MAX,
  POST_MAX_UPLOAD_IMAGE_SIZE,
  POST_MAX_IMAGE_HEIGHT,
  POST_MAX_IMAGE_WIDTH,
  BASE_UPLOAD_FOLDER,
} from '@constants/index';
import {
  ContentTooLargeError,
  ValidationError,
  AppError,
  NotFoundError,
  ERRORS,
} from '@errors/index';
import { sendSuccess } from '@utils/response-utils';

type UploadResponse = PostPictureSection;

const postMulter = multer({
  storage: new DiskStorage({
    destination(req) {
      return {
        error: null,
        value: join(process.cwd(), BASE_UPLOAD_FOLDER, req.session.userId!),
      };
    },
    filename(req, file) {
      return {
        error: null,
        value: `${Date.now()}${extname(file.originalname)}`,
      };
    },
    sharp() {
      const resizer = Sharp()
        .resize(POST_MAX_IMAGE_WIDTH, POST_MAX_IMAGE_HEIGHT, {
          fit: 'cover',
          withoutEnlargement: true,
        })
        .jpeg({
          quality: 60,
          progressive: true,
        });

      return {
        error: null,
        value: resizer,
      };
    },
  }),
  limits: {
    fieldSize: POST_MAX_UPLOAD_IMAGE_SIZE,
    fileSize: POST_MAX_UPLOAD_IMAGE_SIZE,
  },
  fileFilter: (_, file, callback) => {
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
      callback(new ValidationError(ERRORS.POST_INVALID_ATTACHMENT_EXTENSION));

      return;
    }

    // Accept the file
    callback(null, true);
  },
}).single('picture'); // frontend form-data name for file

export async function upload(
  req: Request,
  res: Response<UploadResponse>,
  next: NextFunction,
) {
  const { userId } = req.session;

  const user = await UserModel.findById(userId).select('template');

  if (!user) {
    throw new NotFoundError(ERRORS.USER_NOT_FOUND);
  }

  if (user.template.sections.length >= POST_SECTIONS_MAX) {
    throw new ContentTooLargeError(ERRORS.POST_SECTIONS_MAX_EXCEEDED);
  }

  const rootFolder = process.cwd();

  // eslint-disable-next-line security/detect-non-literal-fs-filename
  await mkdir(join(rootFolder, BASE_UPLOAD_FOLDER, userId!), {
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

    if (!req.file) {
      next(new AppError());

      return;
    }

    // Getting the path that looks like "/uploads/username/file.jpg"
    const fileRelativePath = req.file.path.replace(process.cwd(), '');

    const newSection = {
      type: POST_SECTION_TYPES.PICTURE as const,
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
