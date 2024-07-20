const logger = require('../config/logger');

module.exports = {
  /**
   * wrapper for global catch handling
   */
  asyncErrorHandler: (fn) => (req, res, next) => {
    fn(req, res, next).catch((e) => next(e));
  },
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
  isDuplicateKeyError: (error) =>
    error.name === 'MongoError' && error.code === 11000,
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
