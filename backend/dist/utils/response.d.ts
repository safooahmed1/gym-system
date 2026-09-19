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
export declare function successResponse<T>(res: Response, data: T, message?: string, statusCode?: number, meta?: ApiResponse['meta']): Response<any, Record<string, any>>;
export declare function errorResponse(res: Response, error: {
    code: string;
    message: string;
    details?: unknown;
}, statusCode?: number): Response<any, Record<string, any>>;
export declare function paginatedResponse<T>(res: Response, data: T[], page: number, limit: number, total: number, message?: string): Response<any, Record<string, any>>;
//# sourceMappingURL=response.d.ts.map