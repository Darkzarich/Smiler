import { UnauthorizedError, ERRORS } from '../errors/index';

export default (req, res, next) => {
  if (req.session && req.session.userId) {
    next();

    return;
  }

  next(new UnauthorizedError(ERRORS.UNAUTHORIZED));
};
