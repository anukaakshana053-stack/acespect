import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;

/** Hash a plaintext password (bcrypt, cost 12). */
export const hashPassword = (plain: string): Promise<string> =>
  bcrypt.hash(plain, SALT_ROUNDS);

/** Constant-time compare of a plaintext password against a stored hash. */
export const verifyPassword = (plain: string, hash: string): Promise<boolean> =>
  bcrypt.compare(plain, hash);
