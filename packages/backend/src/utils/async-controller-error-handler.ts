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
  ) => Promise<void> | void,
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

    // Wrapped rather than called directly: a handler with nothing to await is
    // written as a plain function and has no `catch` of its own.
    Promise.resolve(fn(req, res, next)).catch((e: Error) => next(e));
  };
}
