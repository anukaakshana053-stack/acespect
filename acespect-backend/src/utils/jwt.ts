import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { ApiError } from './ApiError';

export interface AccessTokenPayload {
  sub: string; // user id
  role: string;
}

/** Sign a short-lived stateless access token (JWT). */
export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.ACCESS_TOKEN_TTL_MIN * 60, // seconds
  });
}

/** Verify an access token; throws 401 on invalid/expired. */
export function verifyAccessToken(token: string): AccessTokenPayload {
  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
    if (typeof decoded === 'string' || !decoded.sub) {
      throw ApiError.unauthorized('Invalid token', 'INVALID_TOKEN');
    }
    return { sub: String(decoded.sub), role: String((decoded as jwt.JwtPayload).role) };
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if (err instanceof jwt.TokenExpiredError) {
      throw ApiError.unauthorized('Access token expired', 'TOKEN_EXPIRED');
    }
    throw ApiError.unauthorized('Invalid token', 'INVALID_TOKEN');
  }
}
