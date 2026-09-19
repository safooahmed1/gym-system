import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validate } from '../middleware/validate.js';
import { authenticateToken, AuthenticatedRequest, requireAnyRole } from '../middleware/auth.js';
import { db } from '../db/index.js';
import { members, subscriptions } from '../db/schema.js';
import { eq, desc, and, or, ilike, count, sql } from 'drizzle-orm';
import { AppError } from '../utils/errors.js';
import { successResponse, errorResponse, paginatedResponse } from '../utils/response.js';
import { generateUniqueAccountId } from '../utils/accountId.js';

const router = Router();

// All routes require authentication
router.use(authenticateToken);
router.use(requireAnyRole);

// Validation schemas
const createMemberSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    phone: z.string().min(10, 'Phone number is required'),
    nationalId: z.string().length(14, 'National ID must be 14 digits'),
  }),
});

const updateMemberSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    phone: z.string().min(10).optional(),
  }),
  params: z.object({
    id: z.string().transform(Number),
  }),
});

const memberParamsSchema = z.object({
  params: z.object({
    id: z.string().transform(Number),
  }),
});

const listMembersSchema = z.object({
  query: z.object({
    page: z.string().transform(Number).default('1'),
    limit: z.string().transform(Number).default('20'),
    search: z.string().optional(),
    status: z.enum(['active', 'inactive', 'expired', 'expiring_soon']).optional(),
  }),
});

// GET /api/members - List members with pagination, search, filters
router.get(
  '/',
  validate(listMembersSchema),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { page, limit, search, status } = req.query as any;
    const offset = (page - 1) * limit;

    const conditions = [];
    
    if (search) {
      conditions.push(
        or(
          ilike(members.name, `%${search}%`),
          ilike(members.phone, `%${search}%`),
          ilike(members.accountId, `%${search}%`),
          ilike(members.nationalId, `%${search}%`)
        )
      );
    }
    
    if (status) {
      conditions.push(eq(members.status, status));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [data, totalResult] = await Promise.all([
      db
        .select({
          id: members.id,
          accountId: members.accountId,
          name: members.name,
          phone: members.phone,
          nationalId: members.nationalId,
          status: members.status,
          createdAt: members.createdAt,
        })
        .from(members)
        .where(whereClause)
        .orderBy(desc(members.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: count() })
        .from(members)
        .where(whereClause),
    ]);

    return paginatedResponse(res, data, page, limit, totalResult[0].count);
  })
);

// GET /api/members/:id - Get member details with history
router.get(
  '/:id',
  validate(memberParamsSchema),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { id } = req.params as any;

    const [member] = await db
      .select()
      .from(members)
      .where(eq(members.id, id))
      .limit(1);

    if (!member) {
      throw AppError.notFound('Member not found');
    }

    // Get subscriptions
    const memberSubscriptions = await db
      .select({
        id: subscriptions.id,
        planName: sql<string>`${subscriptions.planId}`.as('plan_name'),
        startDate: subscriptions.startDate,
        endDate: subscriptions.endDate,
        status: subscriptions.status,
        finalPrice: subscriptions.finalPrice,
        createdAt: subscriptions.createdAt,
      })
      .from(subscriptions)
      .where(eq(subscriptions.memberId, id))
      .orderBy(desc(subscriptions.createdAt));

    return successResponse(res, {
      ...member,
      subscriptions: memberSubscriptions,
    });
  })
);

// POST /api/members - Create new member
router.post(
  '/',
  validate(createMemberSchema),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { name, phone, nationalId } = req.body;

    // Check national ID uniqueness
    const existingNationalId = await db
      .select({ id: members.id })
      .from(members)
      .where(eq(members.nationalId, nationalId))
      .limit(1);

    if (existingNationalId.length > 0) {
      throw AppError.conflict('الرقم القومي مسجل مسبقاً');
    }

    const accountId = await generateUniqueAccountId();

    const [member] = await db
      .insert(members)
      .values({ name, phone, nationalId, accountId, status: 'active' })
      .returning();

    return successResponse(res, member, 'Member created successfully', 201);
  })
);

// PATCH /api/members/:id - Update member
router.patch(
  '/:id',
  validate(updateMemberSchema),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { id } = req.params as any;
    const { name, phone } = req.body;

    const [member] = await db
      .select()
      .from(members)
      .where(eq(members.id, id))
      .limit(1);

    if (!member) {
      throw AppError.notFound('Member not found');
    }

    const updateData: any = { updatedAt: new Date() };
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;

    const [updated] = await db
      .update(members)
      .set(updateData)
      .where(eq(members.id, id))
      .returning();

    return successResponse(res, updated, 'Member updated successfully');
  })
);

// DELETE /api/members/:id - Soft delete member
router.delete(
  '/:id',
  validate(memberParamsSchema),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { id } = req.params as any;

    const [member] = await db
      .select()
      .from(members)
      .where(eq(members.id, id))
      .limit(1);

    if (!member) {
      throw AppError.notFound('Member not found');
    }

    if (member.status === 'inactive') {
      throw AppError.badRequest('Member is already inactive');
    }

    await db
      .update(members)
      .set({ status: 'inactive', deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(members.id, id));

    return successResponse(res, null, 'Member deactivated successfully (soft delete)');
  })
);

export default router;