import { NextFunction, Request, Response } from 'express';
import { ZodSchema } from 'zod';
import { ApiError } from '../utils/ApiError';

type Part = 'body' | 'query' | 'params';

/**
 * Validates and *replaces* the given request part with the parsed (typed,
 * stripped) data. Invalid input becomes a 400 with field-level details.
 */
export function validate(schema: ZodSchema, part: Part = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[part]);
    if (!result.success) {
      throw ApiError.badRequest('Validation failed', result.error.flatten().fieldErrors);
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (req as any)[part] = result.data;
    next();
  };
}
