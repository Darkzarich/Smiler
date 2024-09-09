import { UnauthorizedError } from '../errors/index.js';

export default (req, res, next) => {
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
