"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const asyncHandler_js_1 = require("../utils/asyncHandler.js");
const validate_js_1 = require("../middleware/validate.js");
const auth_js_1 = require("../middleware/auth.js");
const index_js_1 = require("../db/index.js");
const schema_js_1 = require("../db/schema.js");
const drizzle_orm_1 = require("drizzle-orm");
const password_js_1 = require("../utils/password.js");
const jwt_js_1 = require("../utils/jwt.js");
const errors_js_1 = require("../utils/errors.js");
const response_js_1 = require("../utils/response.js");
const router = (0, express_1.Router)();
// Validation schemas
const registerSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email('Invalid email format'),
        password: zod_1.z.string().min(8, 'Password must be at least 8 characters'),
        name: zod_1.z.string().min(2, 'Name must be at least 2 characters'),
        role: zod_1.z.enum(['admin', 'reception']).default('reception'),
    }),
});
const loginSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email('Invalid email format'),
        password: zod_1.z.string().min(1, 'Password is required'),
    }),
});
const refreshSchema = zod_1.z.object({
    body: zod_1.z.object({
        refreshToken: zod_1.z.string().min(1, 'Refresh token is required'),
    }),
});
// POST /api/auth/register
router.post('/register', auth_js_1.requireAdmin, (0, validate_js_1.validate)(registerSchema), (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
    const { email, password, name, role } = req.body;
    // Check if email exists
    const existing = await index_js_1.db
        .select({ id: schema_js_1.users.id })
        .from(schema_js_1.users)
        .where((0, drizzle_orm_1.eq)(schema_js_1.users.email, email))
        .limit(1);
    if (existing.length > 0) {
        throw errors_js_1.AppError.conflict('Email already registered');
    }
    const passwordHash = await (0, password_js_1.hashPassword)(password);
    const [user] = await index_js_1.db
        .insert(schema_js_1.users)
        .values({ email, passwordHash, name, role })
        .returning({ id: schema_js_1.users.id, email: schema_js_1.users.email, name: schema_js_1.users.name, role: schema_js_1.users.role });
    const tokens = (0, jwt_js_1.generateTokens)({ userId: user.id, email: user.email, role: user.role });
    // Set refresh token as HttpOnly cookie
    res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    return (0, response_js_1.successResponse)(res, {
        user: { id: user.id, email: user.email, name: user.name, role: user.role },
        accessToken: tokens.accessToken,
    }, 'Account created successfully', 201);
}));
// POST /api/auth/login
router.post('/login', (0, validate_js_1.validate)(loginSchema), (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
    const { email, password } = req.body;
    const [user] = await index_js_1.db
        .select()
        .from(schema_js_1.users)
        .where((0, drizzle_orm_1.eq)(schema_js_1.users.email, email))
        .limit(1);
    if (!user || !user.isActive) {
        throw errors_js_1.AppError.unauthorized('Invalid credentials');
    }
    const isValid = await (0, password_js_1.verifyPassword)(password, user.passwordHash);
    if (!isValid) {
        throw errors_js_1.AppError.unauthorized('Invalid credentials');
    }
    // Update last login
    await index_js_1.db
        .update(schema_js_1.users)
        .set({ lastLoginAt: new Date() })
        .where((0, drizzle_orm_1.eq)(schema_js_1.users.id, user.id));
    const tokens = (0, jwt_js_1.generateTokens)({ userId: user.id, email: user.email, role: user.role });
    // Set refresh token as HttpOnly cookie
    res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return (0, response_js_1.successResponse)(res, {
        user: { id: user.id, email: user.email, name: user.name, role: user.role },
        accessToken: tokens.accessToken,
    }, 'Login successful');
}));
// POST /api/auth/refresh
router.post('/refresh', (0, validate_js_1.validate)(refreshSchema), (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
    const refreshToken = req.body.refreshToken || req.cookies?.refreshToken;
    if (!refreshToken) {
        throw errors_js_1.AppError.unauthorized('Refresh token required');
    }
    // Verify refresh token (we'll use the same secret for now, but in production use separate)
    const jwt = await import('jsonwebtoken');
    const { env } = await import('../config/env.js');
    let decoded;
    try {
        decoded = jwt.default.verify(refreshToken, env.JWT_REFRESH_SECRET);
    }
    catch {
        throw errors_js_1.AppError.unauthorized('Invalid refresh token');
    }
    if (decoded.type !== 'refresh') {
        throw errors_js_1.AppError.unauthorized('Invalid token type');
    }
    // Verify user still exists
    const [user] = await index_js_1.db
        .select({ id: schema_js_1.users.id, email: schema_js_1.users.email, role: schema_js_1.users.role, isActive: schema_js_1.users.isActive })
        .from(schema_js_1.users)
        .where((0, drizzle_orm_1.eq)(schema_js_1.users.id, decoded.userId))
        .limit(1);
    if (!user || !user.isActive) {
        throw errors_js_1.AppError.unauthorized('User not found or inactive');
    }
    const tokens = (0, jwt_js_1.generateTokens)({ userId: user.id, email: user.email, role: user.role });
    // Set new refresh token
    res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return (0, response_js_1.successResponse)(res, { accessToken: tokens.accessToken }, 'Token refreshed');
}));
// POST /api/auth/logout
router.post('/logout', auth_js_1.authenticateToken, (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
    res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
    });
    return (0, response_js_1.successResponse)(res, null, 'Logged out successfully');
}));
// GET /api/auth/me
router.get('/me', auth_js_1.authenticateToken, (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
    const [user] = await index_js_1.db
        .select({ id: schema_js_1.users.id, email: schema_js_1.users.email, name: schema_js_1.users.name, role: schema_js_1.users.role, lastLoginAt: schema_js_1.users.lastLoginAt, createdAt: schema_js_1.users.createdAt })
        .from(schema_js_1.users)
        .where((0, drizzle_orm_1.eq)(schema_js_1.users.id, req.user.userId))
        .limit(1);
    if (!user) {
        throw errors_js_1.AppError.notFound('User not found');
    }
    return (0, response_js_1.successResponse)(res, user);
}));
exports.default = router;
//# sourceMappingURL=auth.js.map