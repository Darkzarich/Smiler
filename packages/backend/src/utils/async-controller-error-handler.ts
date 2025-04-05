/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NextFunction, Request, Response } from 'express';

/**
 * Wrapper for controller-wide error handling.
 * It catches any error and passes the error to the next middleware
 */
export function asyncControllerErrorHandler(
  fn: (
    req: Request<any, any, any, any>,
    res: Response,
    next: NextFunction,
  ) => Promise<void>,
) {
  return (
    req: Request<any, any, any, any>,
    res: Response,
    next: NextFunction,
  ) => {
    // TODO: After updating to Express 5, body-parser was also updated and now by default
    // gives undefined body if it was not passed in the request - this is a workaround
    if (!req.body) {
      req.body = {};
    }

    fn(req, res, next).catch((e: Error) => next(e));
  };
}
