import express from 'express';
import type { NextFunction, Request, Response } from 'express';
import {
  AppError,
  NotFoundError,
  ValidationError,
  ConflictError,
  AbstractError,
} from '@errors';
import { asyncControllerErrorHandler } from '@utils/async-controller-error-handler';
import Config from '@config/index';
import { logger } from '@libs/logger';
import {
  isDuplicateKeyError,
  isCastError,
  isValidationError,
} from '@utils/check-mongo-db-error';
import usersRouter from '@routes/api/users';
import authRouter from '@routes/api/auth';
import postsRouter from '@routes/api/posts';
import commentsRouter from '@routes/api/comments';
import tagsRouter from '@routes/api/tags';

const router = express.Router();

router.use('/users', usersRouter);
router.use('/auth', authRouter);
router.use('/posts', postsRouter);
router.use('/comments', commentsRouter);
router.use('/tags', tagsRouter);

// Special endpoint to test global error handling middleware in Jest environment
if (Config.IS_JEST) {
  router.get(
    '/error-endpoint',
    asyncControllerErrorHandler(() => {
      throw new Error('Some error');
    }),
  );
}

router.all(/(.*)/, (_, __, next) => {
  next(new NotFoundError());
});

function handleSendError(error: AbstractError, res: Response) {
  const { code, status, message } = error;

  const response = {
    error: {
      code,
      message,
    },
  };

  // "response" is needed for morgan middleware for logging
  res.response = response;
  res.status(status).json(response);
}

// ! Specifying four parameters is a must for global error handling
router.use(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  (error: AbstractError, req: Request, res: Response, next: NextFunction) => {
    // Handle errors from user's input such as ValidationError etc
    // these are "operational" errors and should be handled by the client
    if (error.status && error.isOperational) {
      handleSendError(error, res);

      return;
    }

    logger.error(error.message, {
      requestId: req.id,
    });

    // Handle MongoDB errors
    if (isCastError(error) || isValidationError(error)) {
      handleSendError(new ValidationError(error.message), res);

      return;
    }

    console.log('error', error);

    // Handle MongoDB duplicate document error, when unique index is violated
    if (isDuplicateKeyError(error)) {
      handleSendError(new ConflictError(error.message), res);

      return;
    }

    handleSendError(new AppError(), res);
  },
);

export default router;
