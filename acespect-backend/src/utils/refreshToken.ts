import crypto from 'crypto';
import { env } from '../config/env';

/**
 * Refresh tokens are opaque random strings (not JWTs). We hand the raw value
 * to the client and persist only its SHA-256 hash — so a database leak does
 * not expose usable tokens, and tokens remain individually revocable.
 */
export function generateRefreshToken(): string {
  return crypto.randomBytes(48).toString('hex');
}

export function hashRefreshToken(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

export function refreshTokenExpiry(from: Date = new Date()): Date {
  return new Date(from.getTime() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
}
