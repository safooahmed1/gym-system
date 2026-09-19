import { Response } from 'express';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export function successResponse<T>(res: Response, data: T, message?: string, statusCode: number = 200, meta?: ApiResponse['meta']) {
  return res.status(statusCode).json({
    success: true,
    data,
    message,
    meta,
  });
}

export function errorResponse(res: Response, error: { code: string; message: string; details?: unknown }, statusCode: number = 400) {
  return res.status(statusCode).json({
    success: false,
    error,
  });
}

export function paginatedResponse<T>(res: Response, data: T[], page: number, limit: number, total: number, message?: string) {
  const totalPages = Math.ceil(total / limit);
  return successResponse(res, data, message, 200, {
    page,
    limit,
    total,
    totalPages,
  });
}