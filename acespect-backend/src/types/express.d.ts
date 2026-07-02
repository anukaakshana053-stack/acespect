import 'express';

/** Augments Express's Request with the authenticated principal. */
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: string;
      };
    }
  }
}

export {};
