import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, JWTPayload } from '../utils/jwt.js';
import { AppError, isAppError } from '../utils/errors.js';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { eq } from 'drizzle-orm';

export interface AuthenticatedRequest extends Request {
  user?: JWTPayload;
}

export async function authenticateToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      throw AppError.unauthorized('Access token required');
    }

    const decoded = verifyAccessToken(token);
    if (!decoded || decoded.type !== 'access') {
      throw AppError.unauthorized('Invalid or expired access token');
    }

    // Verify user still exists and is active
    const user = await db
      .select({ id: users.id, email: users.email, role: users.role, isActive: users.isActive })
      .from(users)
      .where(eq(users.id, decoded.userId))
      .limit(1);

    if (user.length === 0 || !user[0].isActive) {
      throw AppError.unauthorized('User not found or inactive');
    }

    req.user = decoded;
    next();
  } catch (error) {
    if (isAppError(error)) {
      return res.status(error.statusCode).json({
        success: false,
        error: { code: error.code, message: error.message },
      });
    }
    next(error);
  }
}

export function requireRole(...allowedRoles: ('admin' | 'reception')[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
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

export const requireAdmin = requireRole('admin');
export const requireReception = requireRole('reception');
export const requireAnyRole = requireRole('admin', 'reception');