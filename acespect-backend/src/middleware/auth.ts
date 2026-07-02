import { NextFunction, Request, Response } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { ApiError } from '../utils/ApiError';

/** Requires a valid `Authorization: Bearer <accessToken>`; sets req.user. */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    throw ApiError.unauthorized('Missing or malformed Authorization header', 'NO_TOKEN');
  }
  const token = header.slice('Bearer '.length).trim();
  const payload = verifyAccessToken(token);
  req.user = { id: payload.sub, role: payload.role };
  next();
}

/**
 * Restricts a route to the given roles. Must run after `requireAuth`.
 * v1 only has INSPECTOR, but this is wired now so adding ADMIN/REVIEWER/CLIENT
 * routes later is a one-liner, not a refactor.
 */
export function requireRole(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) throw ApiError.unauthorized();
    if (!roles.includes(req.user.role)) {
      throw ApiError.forbidden('You do not have access to this resource');
    }
    next();
  };
}
