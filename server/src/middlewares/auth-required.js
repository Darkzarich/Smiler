const { UnauthorizedError } = require('../errors');

module.exports = (req, res, next) => {
  if (req.session && req.session.userId) {
    next();

    return;
  }

  next(
    new UnauthorizedError(
      'Auth is required for this operation. Please sign in.',
    ),
  );
};
