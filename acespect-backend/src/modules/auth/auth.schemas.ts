import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email('A valid email is required'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password is too long'),
  name: z.string().trim().min(1).max(120).optional(),
  phone: z
    .string()
    .trim()
    .min(6, 'Enter a valid phone number')
    .max(20)
    .optional(),
});

export const googleSchema = z.object({
  idToken: z.string().min(1, 'idToken is required'),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('A valid email is required'),
  password: z.string().min(1, 'Password is required'),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'refreshToken is required'),
});

export const logoutSchema = refreshSchema;

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
export type GoogleInput = z.infer<typeof googleSchema>;
