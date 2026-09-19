import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { AppError } from '../utils/errors.js';

export function validate(schema: AnyZodObject) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details = error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        return next(AppError.validationError('Validation failed', details));
      }
      next(error);
    }
  };
}