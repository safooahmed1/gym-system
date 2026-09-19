import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validate } from '../middleware/validate.js';
import { authenticateToken, AuthenticatedRequest, requireAnyRole } from '../middleware/auth.js';
import { db } from '../db/index.js';
import { payments, subscriptions, members } from '../db/schema.js';
import { eq, desc, and, count, sql, gte, lte } from 'drizzle-orm';
import { AppError } from '../utils/errors.js';
import { successResponse, paginatedResponse } from '../utils/response.js';

const router = Router();

router.use(authenticateToken);
router.use(requireAnyRole);

// Validation schemas
const createPaymentSchema = z.object({
  body: z.object({
    subscriptionId: z.number().int().positive(),
    method: z.enum(['cash', 'electronic']),
    referenceNumber: z.string().optional(),
  }),
});

const paymentParamsSchema = z.object({
  params: z.object({
    id: z.string().transform(Number),
  }),
});

const listPaymentsSchema = z.object({
  query: z.object({
    page: z.string().transform(Number).default('1'),
    limit: z.string().transform(Number).default('20'),
    memberId: z.string().transform(Number).optional(),
    subscriptionId: z.string().transform(Number).optional(),
    method: z.enum(['cash', 'electronic']).optional(),
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
  }),
});

// POST /api/payments - Record payment
router.post(
  '/',
  validate(createPaymentSchema),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { subscriptionId, method, referenceNumber } = req.body;

    // Get subscription with plan price
    const [subscription] = await db
      .select({
        id: subscriptions.id,
        memberId: subscriptions.memberId,
        finalPrice: subscriptions.finalPrice,
        status: subscriptions.status,
      })
      .from(subscriptions)
      .where(eq(subscriptions.id, subscriptionId))
      .limit(1);

    if (!subscription) {
      throw AppError.notFound('Subscription not found');
    }

    // Verify payment amount matches final price (no partial payments)
    const amount = subscription.finalPrice;

    // Create payment record
    const [payment] = await db
      .insert(payments)
      .values({
        subscriptionId,
        memberId: subscription.memberId,
        amount,
        method,
        referenceNumber,
        receivedBy: req.user!.userId,
      })
      .returning();

    // Update subscription status to active if it was expiring/expired
    if (subscription.status !== 'active') {
      await db
        .update(subscriptions)
        .set({ status: 'active', updatedAt: new Date() })
        .where(eq(subscriptions.id, subscriptionId));
    }

    // Update member status to active
    await db
      .update(members)
      .set({ status: 'active', updatedAt: new Date() })
      .where(eq(members.id, subscription.memberId));

    return successResponse(res, payment, 'Payment recorded successfully', 201);
  })
);

// GET /api/payments - List payments with filters
router.get(
  '/',
  validate(listPaymentsSchema),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { page, limit, memberId, subscriptionId, method, dateFrom, dateTo } = req.query as any;
    const offset = (page - 1) * limit;

    const conditions = [];
    if (memberId) conditions.push(eq(payments.memberId, memberId));
    if (subscriptionId) conditions.push(eq(payments.subscriptionId, subscriptionId));
    if (method) conditions.push(eq(payments.method, method));
    if (dateFrom) conditions.push(gte(payments.createdAt, new Date(dateFrom)));
    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      conditions.push(lte(payments.createdAt, toDate));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [data, totalResult] = await Promise.all([
      db
        .select({
          id: payments.id,
          subscriptionId: payments.subscriptionId,
          memberId: payments.memberId,
          amount: payments.amount,
          method: payments.method,
          referenceNumber: payments.referenceNumber,
          receivedBy: payments.receivedBy,
          createdAt: payments.createdAt,
          memberName: members.name,
          memberAccountId: members.accountId,
        })
        .from(payments)
        .leftJoin(members, eq(payments.memberId, members.id))
        .where(whereClause)
        .orderBy(desc(payments.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: count() })
        .from(payments)
        .where(whereClause),
    ]);

    return paginatedResponse(res, data, page, limit, totalResult[0].count);
  })
);

// GET /api/payments/:id - Get payment details
router.get(
  '/:id',
  validate(paymentParamsSchema),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { id } = req.params as any;

    const [payment] = await db
      .select({
        id: payments.id,
        subscriptionId: payments.subscriptionId,
        memberId: payments.memberId,
        amount: payments.amount,
        method: payments.method,
        referenceNumber: payments.referenceNumber,
        receivedBy: payments.receivedBy,
        createdAt: payments.createdAt,
        memberName: members.name,
        memberPhone: members.phone,
        memberAccountId: members.accountId,
      })
      .from(payments)
      .leftJoin(members, eq(payments.memberId, members.id))
      .where(eq(payments.id, id))
      .limit(1);

    if (!payment) {
      throw AppError.notFound('Payment not found');
    }

    return successResponse(res, payment);
  })
);

// GET /api/payments/member/:memberId - Get payments for a member
router.get(
  '/member/:memberId',
  validate(z.object({
    params: z.object({ memberId: z.string().transform(Number) }),
    query: z.object({
      page: z.string().transform(Number).default('1'),
      limit: z.string().transform(Number).default('20'),
    }),
  })),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { memberId } = req.params as any;
    const { page, limit } = req.query as any;
    const offset = (page - 1) * limit;

    const [data, totalResult] = await Promise.all([
      db
        .select()
        .from(payments)
        .where(eq(payments.memberId, memberId))
        .orderBy(desc(payments.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: count() })
        .from(payments)
        .where(eq(payments.memberId, memberId)),
    ]);

    return paginatedResponse(res, data, page, limit, totalResult[0].count);
  })
);

export default router;