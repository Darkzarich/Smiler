import express from 'express';
import {
  AppError,
  NotFoundError,
  ValidationError,
  ConflictError,
} from '../../errors/index';
import { asyncControllerErrorHandler } from '../../utils/async-controller-error-handler';
import Config from '../../config/index';
import { logger } from '../../libs/logger';
import {
  isDuplicateKeyError,
  isCastError,
  isValidationError,
} from '../../utils/check-mongo-db-error';

const router = express.Router();

router.use('/users', (await import('./users')).default);
router.use('/auth', (await import('./auth')).default);
router.use('/posts', (await import('./posts')).default);
router.use('/comments', (await import('./comments')).default);
router.use('/tags', (await import('./tags')).default);

// Special endpoint to test global error handling middleware in Jest environment
if (Config.IS_JEST) {
  router.get(
    '/error-endpoint',
    asyncControllerErrorHandler(() => {
      throw new Error('Some error');
    }),
  );
}

// eslint-disable-next-line no-unused-vars
router.all('*', (req, res, next) => {
  next(new NotFoundError());
});

function handleSendError(error, res) {
  const { code, status, message } = error;

  const response = {
    error: {
      code,
    },
  };

  // "response" is needed for morgan middleware for logging
  res.response = response;
  res.status(status).json(response);
}

// Specifying four parameters is a must for global error handling
// eslint-disable-next-line no-unused-vars
router.use((error, req, res, next) => {
  // Handle errors from user's input such as ValidationError etc
  // these are operational errors and should be handled by the client
  if (error.status && error.isOperational) {
    handleSendError(error, res);

    return;
  }

  logger.error(error, {
    requestId: req.id,
  });

  // Handle MongoDB errors
  if (isCastError(error) || isValidationError(error)) {
    handleSendError(new ValidationError(error.message), res);

    return;
  }

  // Handle MongoDB duplicate document error, when unique index is violated
  if (isDuplicateKeyError(error)) {
    handleSendError(new ConflictError(error.message), res);

    return;
  }

  handleSendError(new AppError(), res);
});

export default router;
