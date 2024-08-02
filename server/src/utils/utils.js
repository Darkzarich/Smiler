module.exports = {
  generateError: (errorMessage, status, next) => {
    if (!status) {
      next({
        error: new Error(errorMessage),
      });

      return;
    }

    next({
      status,
      error: new Error(errorMessage),
    });
  },
  /** Checks if the error is a MongoDB error with code 11000 (Duplicate key) */
  isDuplicateKeyError: (error) =>
    error.name === 'MongoError' && error.code === 11000,
  /** Checks if the error is a MongoDB cast error */
  isCastError: (error) => error.name === 'CastError',
  /** Checks if the error is a MongoDB validation error */
  isValidationError: (error) => error.name === 'ValidationError',
  success: (req, res, payload = undefined) => {
    res.status(200);

    if (!payload) {
      const response = {
        ok: true,
      };

      res.json(response);
      res.response = response;

      return;
    }

    res.json(payload);
    res.response = payload;
  },
};
