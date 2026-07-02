import { User } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { ApiError } from '../../utils/ApiError';
import { hashPassword, verifyPassword } from '../../utils/password';
import { signAccessToken } from '../../utils/jwt';
import {
  generateRefreshToken,
  hashRefreshToken,
  refreshTokenExpiry,
} from '../../utils/refreshToken';
import { verifyGoogleIdToken } from '../../utils/google';
import { LoginInput, RegisterInput } from './auth.schemas';

/** Public user shape — never leaks the password hash. */
export interface PublicUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
  createdAt: Date;
}

export interface AuthResult {
  user: PublicUser;
  accessToken: string;
  refreshToken: string;
}

function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    createdAt: user.createdAt,
  };
}

/** Mint an access token + a persisted (hashed) refresh token for a user. */
async function issueTokens(user: User): Promise<AuthResult> {
  const accessToken = signAccessToken({ sub: user.id, role: user.role });
  const refreshToken = generateRefreshToken();

  await prisma.refreshToken.create({
    data: {
      tokenHash: hashRefreshToken(refreshToken),
      userId: user.id,
      expiresAt: refreshTokenExpiry(),
    },
  });

  return { user: toPublicUser(user), accessToken, refreshToken };
}

export const authService = {
  async register(input: RegisterInput): Promise<AuthResult> {
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) {
      throw ApiError.conflict('An account with this email already exists', 'EMAIL_TAKEN');
    }

    const user = await prisma.user.create({
      data: {
        email: input.email,
        passwordHash: await hashPassword(input.password),
        name: input.name ?? null,
        phone: input.phone ?? null,
        // role defaults to INSPECTOR
      },
    });

    return issueTokens(user);
  },

  async login(input: LoginInput): Promise<AuthResult> {
    const user = await prisma.user.findUnique({ where: { email: input.email } });

    // Always run a bcrypt compare (even with no/Google-only user) so response
    // timing doesn't leak whether an email exists or has a password.
    const hashToCheck =
      user?.passwordHash ?? '$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinv';
    const ok = await verifyPassword(input.password, hashToCheck);

    if (!user || !user.passwordHash || !ok) {
      throw ApiError.unauthorized('Invalid email or password', 'INVALID_CREDENTIALS');
    }
    if (!user.isActive) {
      throw ApiError.forbidden('This account has been deactivated');
    }

    return issueTokens(user);
  },

  /**
   * Sign in (or sign up) with a verified Google ID token.
   * Find-or-link-or-create: match by googleId, else link Google to an existing
   * same-email account, else create a fresh inspector with no local password.
   */
  async loginWithGoogle(idToken: string): Promise<AuthResult> {
    const profile = await verifyGoogleIdToken(idToken);

    let user = await prisma.user.findUnique({ where: { googleId: profile.googleId } });

    if (!user) {
      const byEmail = await prisma.user.findUnique({ where: { email: profile.email } });
      user = byEmail
        ? await prisma.user.update({
            where: { id: byEmail.id },
            data: {
              googleId: profile.googleId,
              avatarUrl: byEmail.avatarUrl ?? profile.avatarUrl ?? null,
              name: byEmail.name ?? profile.name ?? null,
            },
          })
        : await prisma.user.create({
            data: {
              email: profile.email,
              googleId: profile.googleId,
              name: profile.name ?? null,
              avatarUrl: profile.avatarUrl ?? null,
              // no passwordHash — this is a Google-only account
            },
          });
    }

    if (!user.isActive) {
      throw ApiError.forbidden('This account has been deactivated');
    }

    return issueTokens(user);
  },

  /** Rotate a refresh token: validate, revoke the old, issue a fresh pair. */
  async refresh(rawToken: string): Promise<AuthResult> {
    const tokenHash = hashRefreshToken(rawToken);
    const stored = await prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw ApiError.unauthorized('Invalid or expired refresh token', 'INVALID_REFRESH_TOKEN');
    }

    // Revoke the presented token (rotation) then mint a new pair.
    await prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    return issueTokens(stored.user);
  },

  /** Idempotent logout — revoke the presented refresh token if it exists. */
  async logout(rawToken: string): Promise<void> {
    await prisma.refreshToken.updateMany({
      where: { tokenHash: hashRefreshToken(rawToken), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  },

  async getById(userId: string): Promise<PublicUser> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw ApiError.notFound('User not found');
    return toPublicUser(user);
  },
};
