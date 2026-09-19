export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly code?: string;
  public readonly details?: unknown;

  constructor(message: string, statusCode: number, code?: string, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.code = code;
    this.details = details;

    Object.setPrototypeOf(this, AppError.prototype);
  }

  static badRequest(message: string, details?: unknown) {
    return new AppError(message, 400, 'BAD_REQUEST', details);
  }

  static unauthorized(message: string = 'Unauthorized') {
    return new AppError(message, 401, 'UNAUTHORIZED');
  }

  static forbidden(message: string = 'Forbidden') {
    return new AppError(message, 403, 'FORBIDDEN');
  }

  static notFound(message: string = 'Resource not found') {
    return new AppError(message, 404, 'NOT_FOUND');
  }

  static conflict(message: string, details?: unknown) {
    return new AppError(message, 409, 'CONFLICT', details);
  }

  static validationError(message: string, details?: unknown) {
    return new AppError(message, 422, 'VALIDATION_ERROR', details);
  }

  static internal(message: string = 'Internal server error') {
    return new AppError(message, 500, 'INTERNAL_ERROR');
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}