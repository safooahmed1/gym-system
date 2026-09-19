"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAnyRole = exports.requireReception = exports.requireAdmin = void 0;
exports.authenticateToken = authenticateToken;
exports.requireRole = requireRole;
const jwt_js_1 = require("../utils/jwt.js");
const errors_js_1 = require("../utils/errors.js");
const index_js_1 = require("../db/index.js");
const schema_js_1 = require("../db/schema.js");
const drizzle_orm_1 = require("drizzle-orm");
async function authenticateToken(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader?.split(' ')[1]; // Bearer TOKEN
        if (!token) {
            throw errors_js_1.AppError.unauthorized('Access token required');
        }
        const decoded = (0, jwt_js_1.verifyAccessToken)(token);
        if (!decoded || decoded.type !== 'access') {
            throw errors_js_1.AppError.unauthorized('Invalid or expired access token');
        }
        // Verify user still exists and is active
        const user = await index_js_1.db
            .select({ id: schema_js_1.users.id, email: schema_js_1.users.email, role: schema_js_1.users.role, isActive: schema_js_1.users.isActive })
            .from(schema_js_1.users)
            .where((0, drizzle_orm_1.eq)(schema_js_1.users.id, decoded.userId))
            .limit(1);
        if (user.length === 0 || !user[0].isActive) {
            throw errors_js_1.AppError.unauthorized('User not found or inactive');
        }
        req.user = decoded;
        next();
    }
    catch (error) {
        if ((0, errors_js_1.isAppError)(error)) {
            return res.status(error.statusCode).json({
                success: false,
                error: { code: error.code, message: error.message },
            });
        }
        next(error);
    }
}
function requireRole(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
            });
        }
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                error: { code: 'FORBIDDEN', message: 'Insufficient permissions' },
            });
        }
        next();
    };
}
exports.requireAdmin = requireRole('admin');
exports.requireReception = requireRole('reception');
exports.requireAnyRole = requireRole('admin', 'reception');
//# sourceMappingURL=auth.js.map