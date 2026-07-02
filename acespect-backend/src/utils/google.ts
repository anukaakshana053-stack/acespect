import { OAuth2Client } from 'google-auth-library';
import { env } from '../config/env';
import { ApiError } from './ApiError';

const allowedAudiences = env.GOOGLE_CLIENT_IDS.split(',')
  .map((s) => s.trim())
  .filter(Boolean);

export const isGoogleConfigured = allowedAudiences.length > 0;

const client = new OAuth2Client();

export interface GoogleProfile {
  googleId: string;
  email: string;
  emailVerified: boolean;
  name?: string;
  avatarUrl?: string;
}

/**
 * Verify a Google ID token (signature, expiry, issuer, and audience against
 * our allowed client IDs) and extract the profile. Throwing here means the
 * token is untrusted — never create a session from an unverified token.
 */
export async function verifyGoogleIdToken(idToken: string): Promise<GoogleProfile> {
  if (!isGoogleConfigured) {
    throw new ApiError(501, 'Google sign-in is not configured on the server', 'GOOGLE_NOT_CONFIGURED');
  }

  let payload;
  try {
    const ticket = await client.verifyIdToken({ idToken, audience: allowedAudiences });
    payload = ticket.getPayload();
  } catch {
    throw ApiError.unauthorized('Invalid Google token', 'INVALID_GOOGLE_TOKEN');
  }

  if (!payload?.sub || !payload.email) {
    throw ApiError.unauthorized('Invalid Google token', 'INVALID_GOOGLE_TOKEN');
  }
  if (payload.email_verified === false) {
    throw ApiError.forbidden('Your Google email is not verified');
  }

  return {
    googleId: payload.sub,
    email: payload.email.toLowerCase(),
    emailVerified: payload.email_verified ?? false,
    name: payload.name,
    avatarUrl: payload.picture,
  };
}
