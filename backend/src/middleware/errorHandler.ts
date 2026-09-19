import { Request, Response, NextFunction } from 'express';
import { AppError, isAppError } from '../utils/errors.js';
import { env } from '../config/env.js';

export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error('Error:', {
    message: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
  });

  if (isAppError(error)) {
    return res.status(error.statusCode).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
    });
  }

  // Handle specific known errors
  if (error.name === 'ZodError') {
    return res.status(422).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: error,
      },
    });
  }

  // PostgreSQL unique constraint violation
  if (error.message.includes('duplicate key value violates unique constraint')) {
    const constraintMatch = error.message.match(/Key \((.*?)\)=\((.*?)\)/);
    const field = constraintMatch ? constraintMatch[1] : 'field';
    const value = constraintMatch ? constraintMatch[2] : '';
    
    let message = 'Duplicate value';
    if (field === 'national_id') {
      message = 'الرقم القومي مسجل مسبقاً';
    } else if (field === 'email') {
      message = 'البريد الإلكتروني مستخدم مسبقاً';
    } else if (field === 'account_id') {
      message = 'معرف الحساب مستخدم مسبقاً';
    }
    
    return res.status(409).json({
      success: false,
      error: {
        code: 'CONFLICT',
        message,
        details: { field, value },
      },
    });
  }

  // Default internal server error
  const message = env.NODE_ENV === 'production' 
    ? 'Internal server error' 
    : error.message;

  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message,
    },
  });
}

export function notFoundHandler(req: Request, res: Response) {
  return res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
    },
  });
}