import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validate } from '../middleware/validate.js';
import { authenticateToken, AuthenticatedRequest, requireAnyRole } from '../middleware/auth.js';
import { db } from '../db/index.js';
import { members, subscriptions, subscriptionPlans, payments } from '../db/schema.js';
import { eq, desc, and, count, sql, gte, lte } from 'drizzle-orm';
import { AppError } from '../utils/errors.js';
import { successResponse, errorResponse, paginatedResponse } from '../utils/response.js';

const router = Router();

router.use(authenticateToken);
router.use(requireAnyRole);

// Validation schemas
const createSubscriptionSchema = z.object({
  body: z.object({
    memberId: z.number().int().positive(),
    planId: z.number().int().positive(),
    discountType: z.enum(['percentage', 'fixed']).optional(),
    discountValue: z.number().positive().optional(),
  }),
});

const renewSubscriptionSchema = z.object({
  body: z.object({
    planId: z.number().int().positive(),
    discountType: z.enum(['percentage', 'fixed']).optional(),
    discountValue: z.number().positive().optional(),
  }),
  params: z.object({
    id: z.string().transform(Number),
  }),
});

const subscriptionParamsSchema = z.object({
  params: z.object({
    id: z.string().transform(Number),
  }),
});

const listSubscriptionsSchema = z.object({
  query: z.object({
    page: z.string().transform(Number).default('1'),
    limit: z.string().transform(Number).default('20'),
    memberId: z.string().transform(Number).optional(),
    status: z.enum(['active', 'expired', 'expiring_soon']).optional(),
  }),
});

// Helper function to calculate final price
function calculateFinalPrice(basePrice: number, discountType?: string, discountValue?: number): number {
  if (!discountType || !discountValue || discountValue <= 0) return basePrice;
  
  if (discountType === 'percentage') {
    const discount = basePrice * (discountValue / 100);
    return Math.max(0, basePrice - discount);
  }
  
  if (discountType === 'fixed') {
    return Math.max(0, basePrice - discountValue);
  }
  
  return basePrice;
}

// Helper to get subscription status based on end date
function getSubscriptionStatus(endDate: Date): 'active' | 'expired' | 'expiring_soon' {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);
  
  const diffDays = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return 'expired';
  if (diffDays <= 3) return 'expiring_soon';
  return 'active';
}

// POST /api/subscriptions - Create new subscription
router.post(
  '/',
  validate(createSubscriptionSchema),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { memberId, planId, discountType, discountValue } = req.body;

    // Verify member exists and is active (or expired/expiring_soon for renewals)
    const [member] = await db
      .select()
      .from(members)
      .where(eq(members.id, memberId))
      .limit(1);

    if (!member) {
      throw AppError.notFound('Member not found');
    }

    if (member.status === 'inactive') {
      throw AppError.badRequest('Cannot create subscription for inactive member');
    }

    // Verify plan exists and is active
    const [plan] = await db
      .select()
      .from(subscriptionPlans)
      .where(and(eq(subscriptionPlans.id, planId), eq(subscriptionPlans.isActive, true)))
      .limit(1);

    if (!plan) {
      throw AppError.notFound('Plan not found or inactive');
    }

    // Calculate dates
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + plan.durationMonths);

    // Calculate final price
    const finalPrice = calculateFinalPrice(Number(plan.price), discountType, discountValue);

    // Create subscription
    const [subscription] = await db
      .insert(subscriptions)
      .values({
        memberId,
        planId,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        status: 'active',
        discountType,
        discountValue: discountValue?.toString(),
        finalPrice: finalPrice.toString(),
        createdBy: req.user!.userId,
      })
      .returning();

    // Update member status if needed
    if (member.status === 'expired' || member.status === 'expiring_soon') {
      await db
        .update(members)
        .set({ status: 'active', updatedAt: new Date() })
        .where(eq(members.id, memberId));
    }

    return successResponse(res, subscription, 'Subscription created successfully', 201);
  })
);

// GET /api/subscriptions - List subscriptions
router.get(
  '/',
  validate(listSubscriptionsSchema),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { page, limit, memberId, status } = req.query as any;
    const offset = (page - 1) * limit;

    const conditions = [];
    if (memberId) conditions.push(eq(subscriptions.memberId, memberId));
    if (status) conditions.push(eq(subscriptions.status, status));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [data, totalResult] = await Promise.all([
      db
        .select({
          id: subscriptions.id,
          memberId: subscriptions.memberId,
          planId: subscriptions.planId,
          startDate: subscriptions.startDate,
          endDate: subscriptions.endDate,
          status: subscriptions.status,
          discountType: subscriptions.discountType,
          discountValue: subscriptions.discountValue,
          finalPrice: subscriptions.finalPrice,
          createdAt: subscriptions.createdAt,
          memberName: members.name,
          memberAccountId: members.accountId,
          planName: subscriptionPlans.name,
          planDuration: subscriptionPlans.durationMonths,
        })
        .from(subscriptions)
        .leftJoin(members, eq(subscriptions.memberId, members.id))
        .leftJoin(subscriptionPlans, eq(subscriptions.planId, subscriptionPlans.id))
        .where(whereClause)
        .orderBy(desc(subscriptions.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: count() })
        .from(subscriptions)
        .where(whereClause),
    ]);

    return paginatedResponse(res, data, page, limit, totalResult[0].count);
  })
);

// GET /api/subscriptions/:id - Get subscription details
router.get(
  '/:id',
  validate(subscriptionParamsSchema),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { id } = req.params as any;

    const [subscription] = await db
      .select({
        id: subscriptions.id,
        memberId: subscriptions.memberId,
        planId: subscriptions.planId,
        startDate: subscriptions.startDate,
        endDate: subscriptions.endDate,
        status: subscriptions.status,
        discountType: subscriptions.discountType,
        discountValue: subscriptions.discountValue,
        finalPrice: subscriptions.finalPrice,
        createdAt: subscriptions.createdAt,
        memberName: members.name,
        memberPhone: members.phone,
        memberAccountId: members.accountId,
        planName: subscriptionPlans.name,
        planDuration: subscriptionPlans.durationMonths,
        planPrice: subscriptionPlans.price,
      })
      .from(subscriptions)
      .leftJoin(members, eq(subscriptions.memberId, members.id))
      .leftJoin(subscriptionPlans, eq(subscriptions.planId, subscriptionPlans.id))
      .where(eq(subscriptions.id, id))
      .limit(1);

    if (!subscription) {
      throw AppError.notFound('Subscription not found');
    }

    // Get payments for this subscription
    const subscriptionPayments = await db
      .select()
      .from(payments)
      .where(eq(payments.subscriptionId, id))
      .orderBy(desc(payments.createdAt));

    return successResponse(res, { ...subscription, payments: subscriptionPayments });
  })
);

// POST /api/subscriptions/:id/renew - Renew subscription
router.post(
  '/:id/renew',
  validate(renewSubscriptionSchema),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { id } = req.params as any;
    const { planId, discountType, discountValue } = req.body;

    // Get current subscription
    const [currentSub] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.id, id))
      .limit(1);

    if (!currentSub) {
      throw AppError.notFound('Subscription not found');
    }

    // Verify new plan
    const [newPlan] = await db
      .select()
      .from(subscriptionPlans)
      .where(and(eq(subscriptionPlans.id, planId), eq(subscriptionPlans.isActive, true)))
      .limit(1);

    if (!newPlan) {
      throw AppError.notFound('Plan not found or inactive');
    }

    // Calculate new dates
    const currentEndDate = new Date(currentSub.endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let newStartDate: Date;
    let newEndDate: Date;

    if (currentEndDate >= today) {
      // Active subscription: add to current end date
      newStartDate = new Date(currentEndDate);
      newStartDate.setDate(newStartDate.getDate() + 1);
      newEndDate = new Date(currentEndDate);
      newEndDate.setMonth(newEndDate.getMonth() + newPlan.durationMonths);
    } else {
      // Expired subscription: start from today
      newStartDate = today;
      newEndDate = new Date(today);
      newEndDate.setMonth(newEndDate.getMonth() + newPlan.durationMonths);
    }

    // Calculate final price
    const finalPrice = calculateFinalPrice(Number(newPlan.price), discountType, discountValue);

    // Create new subscription (renewal)
    const [newSubscription] = await db
      .insert(subscriptions)
      .values({
        memberId: currentSub.memberId,
        planId,
        startDate: newStartDate.toISOString().split('T')[0],
        endDate: newEndDate.toISOString().split('T')[0],
        status: 'active',
        discountType,
        discountValue: discountValue?.toString(),
        finalPrice: finalPrice.toString(),
        createdBy: req.user!.userId,
      })
      .returning();

    // Update old subscription status to expired
    await db
      .update(subscriptions)
      .set({ status: 'expired', updatedAt: new Date() })
      .where(eq(subscriptions.id, id));

    // Update member status to active
    await db
      .update(members)
      .set({ status: 'active', updatedAt: new Date() })
      .where(eq(members.id, currentSub.memberId));

    return successResponse(res, newSubscription, 'Subscription renewed successfully', 201);
  })
);

// PATCH /api/subscriptions/:id - Update subscription status (manual)
router.patch(
  '/:id',
  validate(subscriptionParamsSchema.merge(z.object({
    body: z.object({
      status: z.enum(['active', 'expired', 'expiring_soon']).optional(),
    }),
  }))),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { id } = req.params as any;
    const { status } = req.body;

    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.id, id))
      .limit(1);

    if (!subscription) {
      throw AppError.notFound('Subscription not found');
    }

    const [updated] = await db
      .update(subscriptions)
      .set({ status: status!, updatedAt: new Date() })
      .where(eq(subscriptions.id, id))
      .returning();

    return successResponse(res, updated, 'Subscription updated successfully');
  })
);

export default router;