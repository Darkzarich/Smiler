const router = require('express').Router();
const {
  AppError,
  NotFoundError,
  ValidationError,
  ConflictError,
} = require('../../errors');
const {
  asyncControllerErrorHandler,
} = require('../../utils/async-controller-error-handler');
const { IS_JEST } = require('../../config/config');
const { logger } = require('../../libs/logger');
const {
  isCastError,
  isValidationError,
  isDuplicateKeyError,
} = require('../../utils/utils');

router.use('/users', require('./users'));
router.use('/auth', require('./auth'));
router.use('/posts', require('./posts'));
router.use('/comments', require('./comments'));
router.use('/tags', require('./tags'));

// Special endpoint to test global error handling middleware in Jest environment
if (IS_JEST) {
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
      message,
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

module.exports = router;
