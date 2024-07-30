/**
 * Wrapper for controller-wide error handling.
 * It catches any error and passes the error to the next middleware
 */
module.exports.asyncControllerErrorHandler = (fn) => (req, res, next) => {
  fn(req, res, next).catch((e) => next(e));
};
