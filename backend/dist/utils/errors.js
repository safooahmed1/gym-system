"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppError = void 0;
exports.isAppError = isAppError;
class AppError extends Error {
    statusCode;
    isOperational;
    code;
    details;
    constructor(message, statusCode, code, details) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        this.code = code;
        this.details = details;
        Object.setPrototypeOf(this, AppError.prototype);
    }
    static badRequest(message, details) {
        return new AppError(message, 400, 'BAD_REQUEST', details);
    }
    static unauthorized(message = 'Unauthorized') {
        return new AppError(message, 401, 'UNAUTHORIZED');
    }
    static forbidden(message = 'Forbidden') {
        return new AppError(message, 403, 'FORBIDDEN');
    }
    static notFound(message = 'Resource not found') {
        return new AppError(message, 404, 'NOT_FOUND');
    }
    static conflict(message, details) {
        return new AppError(message, 409, 'CONFLICT', details);
    }
    static validationError(message, details) {
        return new AppError(message, 422, 'VALIDATION_ERROR', details);
    }
    static internal(message = 'Internal server error') {
        return new AppError(message, 500, 'INTERNAL_ERROR');
    }
}
exports.AppError = AppError;
function isAppError(error) {
    return error instanceof AppError;
}
//# sourceMappingURL=errors.js.map