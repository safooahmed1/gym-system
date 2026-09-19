import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validate } from '../middleware/validate.js';
import { authenticateToken, AuthenticatedRequest, requireAdmin } from '../middleware/auth.js';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { hashPassword, verifyPassword } from '../utils/password.js';
import { generateTokens } from '../utils/jwt.js';
import { AppError } from '../utils/errors.js';
import { successResponse, errorResponse } from '../utils/response.js';

const router = Router();

// Validation schemas
const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    name: z.string().min(2, 'Name must be at least 2 characters'),
    role: z.enum(['admin', 'reception']).default('reception'),
  }),
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required'),
  }),
});

const refreshSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
  }),
});

// POST /api/auth/register
router.post(
  '/register',
  requireAdmin,
  validate(registerSchema),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { email, password, name, role } = req.body;

    // Check if email exists
    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existing.length > 0) {
      throw AppError.conflict('Email already registered');
    }

    const passwordHash = await hashPassword(password);

    const [user] = await db
      .insert(users)
      .values({ email, passwordHash, name, role })
      .returning({ id: users.id, email: users.email, name: users.name, role: users.role });

    const tokens = generateTokens({ userId: user.id, email: user.email, role: user.role });

    // Set refresh token as HttpOnly cookie
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return successResponse(res, {
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      accessToken: tokens.accessToken,
    }, 'Account created successfully', 201);
  })
);

// POST /api/auth/login
router.post(
  '/login',
  validate(loginSchema),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { email, password } = req.body;

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user || !user.isActive) {
      throw AppError.unauthorized('Invalid credentials');
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      throw AppError.unauthorized('Invalid credentials');
    }

    // Update last login
    await db
      .update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.id, user.id));

    const tokens = generateTokens({ userId: user.id, email: user.email, role: user.role });

    // Set refresh token as HttpOnly cookie
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return successResponse(res, {
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      accessToken: tokens.accessToken,
    }, 'Login successful');
  })
);

// POST /api/auth/refresh
router.post(
  '/refresh',
  validate(refreshSchema),
  asyncHandler(async (req, res) => {
    const refreshToken = req.body.refreshToken || req.cookies?.refreshToken;
    
    if (!refreshToken) {
      throw AppError.unauthorized('Refresh token required');
    }

    // Verify refresh token (we'll use the same secret for now, but in production use separate)
    const jwt = await import('jsonwebtoken');
    const { env } = await import('../config/env.js');
    
    let decoded;
    try {
      decoded = jwt.default.verify(refreshToken, env.JWT_REFRESH_SECRET) as { userId: number; email: string; role: 'admin' | 'reception'; type: string };
    } catch {
      throw AppError.unauthorized('Invalid refresh token');
    }

    if (decoded.type !== 'refresh') {
      throw AppError.unauthorized('Invalid token type');
    }

    // Verify user still exists
    const [user] = await db
      .select({ id: users.id, email: users.email, role: users.role, isActive: users.isActive })
      .from(users)
      .where(eq(users.id, decoded.userId))
      .limit(1);

    if (!user || !user.isActive) {
      throw AppError.unauthorized('User not found or inactive');
    }

    const tokens = generateTokens({ userId: user.id, email: user.email, role: user.role });

    // Set new refresh token
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return successResponse(res, { accessToken: tokens.accessToken }, 'Token refreshed');
  })
);

// POST /api/auth/logout
router.post(
  '/logout',
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });
    return successResponse(res, null, 'Logged out successfully');
  })
);

// GET /api/auth/me
router.get(
  '/me',
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const [user] = await db
      .select({ id: users.id, email: users.email, name: users.name, role: users.role, lastLoginAt: users.lastLoginAt, createdAt: users.createdAt })
      .from(users)
      .where(eq(users.id, req.user!.userId))
      .limit(1);

    if (!user) {
      throw AppError.notFound('User not found');
    }

    return successResponse(res, user);
  })
);

export default router;