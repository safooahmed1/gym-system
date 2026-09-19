import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validate } from '../middleware/validate.js';
import { authenticateToken, AuthenticatedRequest, requireAdmin, requireAnyRole } from '../middleware/auth.js';
import { db } from '../db/index.js';
import { subscriptionPlans } from '../db/schema.js';
import { eq, desc, count } from 'drizzle-orm';
import { AppError } from '../utils/errors.js';
import { successResponse, paginatedResponse } from '../utils/response.js';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Validation schemas
const planSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Plan name must be at least 2 characters'),
    durationMonths: z.number().int().positive('Duration must be a positive integer'),
    price: z.number().positive('Price must be positive'),
    description: z.string().optional(),
  }),
});

const planParamsSchema = z.object({
  params: z.object({
    id: z.string().transform(Number),
  }),
});

const listPlansSchema = z.object({
  query: z.object({
    page: z.string().transform(Number).default('1'),
    limit: z.string().transform(Number).default('20'),
    isActive: z.string().transform(val => val === 'true').optional(),
  }),
});

// GET /api/plans - List all plans (accessible by all roles)
router.get(
  '/',
  requireAnyRole,
  validate(listPlansSchema),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { page, limit, isActive } = req.query as any;
    const offset = (page - 1) * limit;

    const conditions = [];
    if (isActive !== undefined) {
      conditions.push(eq(subscriptionPlans.isActive, isActive));
    }

    const whereClause = conditions.length > 0 ? conditions[0] : undefined;

    const [data, totalResult] = await Promise.all([
      db
        .select()
        .from(subscriptionPlans)
        .where(whereClause)
        .orderBy(desc(subscriptionPlans.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: count() })
        .from(subscriptionPlans)
        .where(whereClause),
    ]);

    return paginatedResponse(res, data, page, limit, totalResult[0].count);
  })
);

// GET /api/plans/:id - Get single plan
router.get(
  '/:id',
  requireAnyRole,
  validate(planParamsSchema),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { id } = req.params as any;

    const [plan] = await db
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.id, id))
      .limit(1);

    if (!plan) {
      throw AppError.notFound('Plan not found');
    }

    return successResponse(res, plan);
  })
);

// POST /api/plans - Create plan (Admin only)
router.post(
  '/',
  requireAdmin,
  validate(planSchema),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { name, durationMonths, price, description } = req.body;

    const [plan] = await db
      .insert(subscriptionPlans)
      .values({ name, durationMonths, price, description })
      .returning();

    return successResponse(res, plan, 'Plan created successfully', 201);
  })
);

// PATCH /api/plans/:id - Update plan (Admin only)
router.patch(
  '/:id',
  requireAdmin,
  validate(planSchema.merge(planParamsSchema)),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { id } = req.params as any;
    const { name, durationMonths, price, description, isActive } = req.body;

    const [plan] = await db
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.id, id))
      .limit(1);

    if (!plan) {
      throw AppError.notFound('Plan not found');
    }

    const updateData: any = { updatedAt: new Date() };
    if (name) updateData.name = name;
    if (durationMonths) updateData.durationMonths = durationMonths;
    if (price) updateData.price = price;
    if (description !== undefined) updateData.description = description;
    if (isActive !== undefined) updateData.isActive = isActive;

    const [updated] = await db
      .update(subscriptionPlans)
      .set(updateData)
      .where(eq(subscriptionPlans.id, id))
      .returning();

    return successResponse(res, updated, 'Plan updated successfully');
  })
);

// DELETE /api/plans/:id - Delete plan (Admin only)
router.delete(
  '/:id',
  requireAdmin,
  validate(planParamsSchema),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { id } = req.params as any;

    const [plan] = await db
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.id, id))
      .limit(1);

    if (!plan) {
      throw AppError.notFound('Plan not found');
    }

    await db
      .delete(subscriptionPlans)
      .where(eq(subscriptionPlans.id, id));

    return successResponse(res, null, 'Plan deleted successfully');
  })
);

export default router;