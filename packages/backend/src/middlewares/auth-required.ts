import type { Request, Response, NextFunction } from 'express';
import { UnauthorizedError, ERRORS } from '@errors/index';

export default (req: Request, res: Response, next: NextFunction) => {
  if (req.session && req.session.userId) {
    next();

    return;
  }

  next(new UnauthorizedError(ERRORS.UNAUTHORIZED));
};
