import type { NextFunction, Request, Response } from 'express';

/**
 * Wrapper for controller-wide error handling.
 * It catches any error and passes the error to the next middleware
 */
export function asyncControllerErrorHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch((e: Error) => next(e));
  };
}
