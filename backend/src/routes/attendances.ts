import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validate } from '../middleware/validate.js';
import { authenticateToken, AuthenticatedRequest, requireAnyRole } from '../middleware/auth.js';
import { db } from '../db/index.js';
import { attendances, members, subscriptions } from '../db/schema.js';
import { eq, desc, and, count, gte, lte, sql } from 'drizzle-orm';
import { AppError } from '../utils/errors.js';
import { successResponse, errorResponse, paginatedResponse } from '../utils/response.js';

const router = Router();

router.use(authenticateToken);
router.use(requireAnyRole);

// Validation schemas
const checkInSchema = z.object({
  body: z.object({
    accountId: z.string().length(5, 'Account ID must be 5 digits').regex(/^\d{5}$/, 'Account ID must be 5 digits'),
  }),
});

const attendanceParamsSchema = z.object({
  params: z.object({
    id: z.string().transform(Number),
  }),
});

const listAttendancesSchema = z.object({
  query: z.object({
    page: z.string().transform(Number).default('1'),
    limit: z.string().transform(Number).default('50'),
    memberId: z.string().transform(Number).optional(),
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
  }),
});

const memberAttendancesSchema = z.object({
  params: z.object({
    memberId: z.string().transform(Number),
  }),
  query: z.object({
    page: z.string().transform(Number).default('1'),
    limit: z.string().transform(Number).default('50'),
  }),
});

// POST /api/attendances/check-in - Record check-in
router.post(
  '/check-in',
  validate(checkInSchema),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { accountId } = req.body;

    // Find member by account ID
    const [member] = await db
      .select({
        id: members.id,
        name: members.name,
        status: members.status,
        accountId: members.accountId,
      })
      .from(members)
      .where(eq(members.accountId, accountId))
      .limit(1);

    if (!member) {
      throw AppError.notFound('Member not found');
    }

    if (member.status !== 'active') {
      throw AppError.forbidden('Member is not active');
    }

    // Find active subscription for this member
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const [subscription] = await db
      .select({
        id: subscriptions.id,
        endDate: subscriptions.endDate,
        status: subscriptions.status,
      })
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.memberId, member.id),
          eq(subscriptions.status, 'active'),
          gte(subscriptions.endDate, today.toISOString().split('T')[0])
        )
      )
      .orderBy(desc(subscriptions.endDate))
      .limit(1);

    if (!subscription) {
      throw AppError.forbidden('الاشتراك منتهي، يرجى التجديد');
    }

    // Check if already checked in today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const [existingAttendance] = await db
      .select({ id: attendances.id })
      .from(attendances)
      .where(
        and(
          eq(attendances.memberId, member.id),
          gte(attendances.checkInAt, todayStart),
          lte(attendances.checkInAt, todayEnd)
        )
      )
      .limit(1);

    if (existingAttendance) {
      return successResponse(res, { 
        member: { id: member.id, name: member.name, accountId: member.accountId },
        message: 'Already checked in today',
        alreadyCheckedIn: true
      }, 'Member already checked in today');
    }

    // Record attendance
    const [attendance] = await db
      .insert(attendances)
      .values({
        memberId: member.id,
        subscriptionId: subscription.id,
        checkInAt: new Date(),
      })
      .returning();

    return successResponse(res, {
      member: { id: member.id, name: member.name, accountId: member.accountId },
      attendance: { id: attendance.id, checkInAt: attendance.checkInAt },
      alreadyCheckedIn: false
    }, 'Check-in successful', 201);
  })
);

// GET /api/attendances - List attendances with filters
router.get(
  '/',
  validate(listAttendancesSchema),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { page, limit, memberId, dateFrom, dateTo } = req.query as any;
    const offset = (page - 1) * limit;

    const conditions = [];
    if (memberId) conditions.push(eq(attendances.memberId, memberId));
    if (dateFrom) conditions.push(gte(attendances.checkInAt, new Date(dateFrom)));
    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      conditions.push(lte(attendances.checkInAt, toDate));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [data, totalResult] = await Promise.all([
      db
        .select({
          id: attendances.id,
          memberId: attendances.memberId,
          subscriptionId: attendances.subscriptionId,
          checkInAt: attendances.checkInAt,
          memberName: members.name,
          memberAccountId: members.accountId,
        })
        .from(attendances)
        .leftJoin(members, eq(attendances.memberId, members.id))
        .where(whereClause)
        .orderBy(desc(attendances.checkInAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: count() })
        .from(attendances)
        .where(whereClause),
    ]);

    return paginatedResponse(res, data, page, limit, totalResult[0].count);
  })
);

// GET /api/attendances/member/:memberId - Get attendances for a member
router.get(
  '/member/:memberId',
  validate(memberAttendancesSchema),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { memberId } = req.params as any;
    const { page, limit } = req.query as any;
    const offset = (page - 1) * limit;

    const [data, totalResult] = await Promise.all([
      db
        .select()
        .from(attendances)
        .where(eq(attendances.memberId, memberId))
        .orderBy(desc(attendances.checkInAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: count() })
        .from(attendances)
        .where(eq(attendances.memberId, memberId)),
    ]);

    return paginatedResponse(res, data, page, limit, totalResult[0].count);
  })
);

// GET /api/attendances/stats - Get attendance statistics
router.get(
  '/stats',
  validate(z.object({
    query: z.object({
      dateFrom: z.string().optional(),
      dateTo: z.string().optional(),
    }),
  })),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { dateFrom, dateTo } = req.query as any;

    const conditions = [];
    if (dateFrom) conditions.push(gte(attendances.checkInAt, new Date(dateFrom)));
    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      conditions.push(lte(attendances.checkInAt, toDate));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Daily stats for the last 30 days
    const dailyStats = await db.execute(sql`
      SELECT 
        DATE(check_in_at) as date,
        COUNT(*) as count
      FROM attendances
      ${whereClause ? sql`WHERE ${whereClause}` : sql``}
      GROUP BY DATE(check_in_at)
      ORDER BY date DESC
      LIMIT 30
    `);

    // Total count
    const [totalResult] = await db
      .select({ count: count() })
      .from(attendances)
      .where(whereClause);

    // Unique members today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const [todayUnique] = await db
      .select({ count: count(sql`DISTINCT ${attendances.memberId}`) })
      .from(attendances)
      .where(and(gte(attendances.checkInAt, today), lte(attendances.checkInAt, todayEnd)));

    return successResponse(res, {
      total: totalResult.count,
      todayUnique: todayUnique.count,
      dailyStats: dailyStats.rows,
    });
  })
);

export default router;