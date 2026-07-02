import { NextFunction, Request, Response, RequestHandler } from 'express';

/**
 * Wraps an async route handler so a rejected promise is forwarded to Express's
 * error middleware instead of crashing the process with an unhandled rejection.
 */
export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);
