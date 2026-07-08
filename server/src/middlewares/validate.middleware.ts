import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { ApiError } from '../utils/ApiError';

/**
 * Validate request body/params/query against a Zod schema.
 * Usage: router.post('/route', validate(mySchema), controller)
 */
export const validate = (schema: ZodSchema, source: 'body' | 'params' | 'query' = 'body') => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      const errors = result.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      throw ApiError.badRequest('Validation failed', errors);
    }

    // Replace with parsed/transformed data
    req[source] = result.data;
    next();
  };
};
