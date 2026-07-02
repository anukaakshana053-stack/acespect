import { Router } from 'express';
import { authController } from './auth.controller';
import { validate } from '../../middleware/validate';
import { requireAuth } from '../../middleware/auth';
import { authLimiter } from '../../middleware/rateLimit';
import {
  googleSchema,
  loginSchema,
  logoutSchema,
  refreshSchema,
  registerSchema,
} from './auth.schemas';

const router = Router();

// Credential endpoints are rate-limited.
router.post('/register', authLimiter, validate(registerSchema), authController.register);
router.post('/login', authLimiter, validate(loginSchema), authController.login);
router.post('/google', authLimiter, validate(googleSchema), authController.google);
router.post('/refresh', authLimiter, validate(refreshSchema), authController.refresh);
router.post('/logout', validate(logoutSchema), authController.logout);

// Protected.
router.get('/me', requireAuth, authController.me);

export const authRouter = router;
