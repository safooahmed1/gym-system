"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.successResponse = successResponse;
exports.errorResponse = errorResponse;
exports.paginatedResponse = paginatedResponse;
function successResponse(res, data, message, statusCode = 200, meta) {
    return res.status(statusCode).json({
        success: true,
        data,
        message,
        meta,
    });
}
function errorResponse(res, error, statusCode = 400) {
    return res.status(statusCode).json({
        success: false,
        error,
    });
}
function paginatedResponse(res, data, page, limit, total, message) {
    const totalPages = Math.ceil(total / limit);
    return successResponse(res, data, message, 200, {
        page,
        limit,
        total,
        totalPages,
    });
}
//# sourceMappingURL=response.js.map