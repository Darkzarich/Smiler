import express from 'express';
import mongoose from 'mongoose';
import type { NextFunction, Request, Response } from 'express';
import {
  AppError,
  NotFoundError,
  ValidationError,
  ConflictError,
  AbstractError,
  ERRORS,
} from '@errors';
import { asyncControllerErrorHandler } from '@utils/async-controller-error-handler';
import Config from '@config/index';
import { logger } from '@libs/logger';
import {
  isDuplicateKeyError,
  isCastError,
  isValidationError,
} from '@utils/check-mongo-db-error';
import { csrfProtectionMiddleware } from '@middlewares/csrf';
import usersRouter from '@routes/api/users';
import authRouter from '@routes/api/auth';
import postsRouter from '@routes/api/posts';
import commentsRouter from '@routes/api/comments';
import tagsRouter from '@routes/api/tags';

const router = express.Router();

router.use(csrfProtectionMiddleware);

router.use('/users', usersRouter);
router.use('/auth', authRouter);
router.use('/posts', postsRouter);
router.use('/comments', commentsRouter);
router.use('/tags', tagsRouter);

// Special endpoints to test global error handling middleware in Jest environment
if (Config.IS_JEST) {
  router.get(
    '/error-endpoint',
    asyncControllerErrorHandler(() => {
      throw new Error('Some error');
    }),
  );

  router.get(
    '/cast-error-endpoint',
    asyncControllerErrorHandler(() => {
      throw new mongoose.Error.CastError('ObjectId', 'not-an-id', '_id');
    }),
  );

  router.get(
    '/duplicate-key-error-endpoint',
    asyncControllerErrorHandler(() => {
      throw Object.assign(
        new Error(
          'E11000 duplicate key error collection: smiler.users index: email_1 dup key: { email: "taken@example.com" }',
        ),
        { name: 'MongoServerError', code: 11000 },
      );
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

function logHandledError(error: AbstractError, req: Request) {
  logger.warn('handled_request_error', {
    requestId: req.id,
    method: req.method,
    path: req.route ? `${req.baseUrl}${req.route.path}` : '[unmatched]',
    status: error.status,
    code: error.code,
    error_message: error.message,
  });
}

// ! Specifying four parameters is a must for global error handling
router.use(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  (error: AbstractError, req: Request, res: Response, next: NextFunction) => {
    // Handle errors from user's input such as ValidationError etc
    // these are "operational" errors and should be handled by the client
    if (error.status && error.isOperational) {
      logHandledError(error, req);
      handleSendError(error, res);

      return;
    }

    logger.error(error.message, {
      requestId: req.id,
    });

    // Handle MongoDB errors. The driver messages name collections, indexes and
    // the offending values, so only a generic message goes to the client — the
    // original one is already in the log line above.
    if (isCastError(error) || isValidationError(error)) {
      handleSendError(new ValidationError(ERRORS.INVALID_REQUEST_DATA), res);

      return;
    }

    // Handle MongoDB duplicate document error, when unique index is violated
    if (isDuplicateKeyError(error)) {
      handleSendError(new ConflictError(ERRORS.RESOURCE_CONFLICT), res);

      return;
    }

    handleSendError(new AppError(), res);
  },
);

export default router;
