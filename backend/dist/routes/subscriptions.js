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
const errors_js_1 = require("../utils/errors.js");
const response_js_1 = require("../utils/response.js");
const router = (0, express_1.Router)();
router.use(auth_js_1.authenticateToken);
router.use(auth_js_1.requireAnyRole);
// Validation schemas
const createSubscriptionSchema = zod_1.z.object({
    body: zod_1.z.object({
        memberId: zod_1.z.number().int().positive(),
        planId: zod_1.z.number().int().positive(),
        discountType: zod_1.z.enum(['percentage', 'fixed']).optional(),
        discountValue: zod_1.z.number().positive().optional(),
    }),
});
const renewSubscriptionSchema = zod_1.z.object({
    body: zod_1.z.object({
        planId: zod_1.z.number().int().positive(),
        discountType: zod_1.z.enum(['percentage', 'fixed']).optional(),
        discountValue: zod_1.z.number().positive().optional(),
    }),
    params: zod_1.z.object({
        id: zod_1.z.string().transform(Number),
    }),
});
const subscriptionParamsSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().transform(Number),
    }),
});
const listSubscriptionsSchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z.string().transform(Number).default('1'),
        limit: zod_1.z.string().transform(Number).default('20'),
        memberId: zod_1.z.string().transform(Number).optional(),
        status: zod_1.z.enum(['active', 'expired', 'expiring_soon']).optional(),
    }),
});
// Helper function to calculate final price
function calculateFinalPrice(basePrice, discountType, discountValue) {
    if (!discountType || !discountValue || discountValue <= 0)
        return basePrice;
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
function getSubscriptionStatus(endDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0)
        return 'expired';
    if (diffDays <= 3)
        return 'expiring_soon';
    return 'active';
}
// POST /api/subscriptions - Create new subscription
router.post('/', (0, validate_js_1.validate)(createSubscriptionSchema), (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
    const { memberId, planId, discountType, discountValue } = req.body;
    // Verify member exists and is active (or expired/expiring_soon for renewals)
    const [member] = await index_js_1.db
        .select()
        .from(schema_js_1.members)
        .where((0, drizzle_orm_1.eq)(schema_js_1.members.id, memberId))
        .limit(1);
    if (!member) {
        throw errors_js_1.AppError.notFound('Member not found');
    }
    if (member.status === 'inactive') {
        throw errors_js_1.AppError.badRequest('Cannot create subscription for inactive member');
    }
    // Verify plan exists and is active
    const [plan] = await index_js_1.db
        .select()
        .from(schema_js_1.subscriptionPlans)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_js_1.subscriptionPlans.id, planId), (0, drizzle_orm_1.eq)(schema_js_1.subscriptionPlans.isActive, true)))
        .limit(1);
    if (!plan) {
        throw errors_js_1.AppError.notFound('Plan not found or inactive');
    }
    // Calculate dates
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + plan.durationMonths);
    // Calculate final price
    const finalPrice = calculateFinalPrice(Number(plan.price), discountType, discountValue);
    // Create subscription
    const [subscription] = await index_js_1.db
        .insert(schema_js_1.subscriptions)
        .values({
        memberId,
        planId,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        status: 'active',
        discountType,
        discountValue: discountValue?.toString(),
        finalPrice: finalPrice.toString(),
        createdBy: req.user.userId,
    })
        .returning();
    // Update member status if needed
    if (member.status === 'expired' || member.status === 'expiring_soon') {
        await index_js_1.db
            .update(schema_js_1.members)
            .set({ status: 'active', updatedAt: new Date() })
            .where((0, drizzle_orm_1.eq)(schema_js_1.members.id, memberId));
    }
    return (0, response_js_1.successResponse)(res, subscription, 'Subscription created successfully', 201);
}));
// GET /api/subscriptions - List subscriptions
router.get('/', (0, validate_js_1.validate)(listSubscriptionsSchema), (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
    const { page, limit, memberId, status } = req.query;
    const offset = (page - 1) * limit;
    const conditions = [];
    if (memberId)
        conditions.push((0, drizzle_orm_1.eq)(schema_js_1.subscriptions.memberId, memberId));
    if (status)
        conditions.push((0, drizzle_orm_1.eq)(schema_js_1.subscriptions.status, status));
    const whereClause = conditions.length > 0 ? (0, drizzle_orm_1.and)(...conditions) : undefined;
    const [data, totalResult] = await Promise.all([
        index_js_1.db
            .select({
            id: schema_js_1.subscriptions.id,
            memberId: schema_js_1.subscriptions.memberId,
            planId: schema_js_1.subscriptions.planId,
            startDate: schema_js_1.subscriptions.startDate,
            endDate: schema_js_1.subscriptions.endDate,
            status: schema_js_1.subscriptions.status,
            discountType: schema_js_1.subscriptions.discountType,
            discountValue: schema_js_1.subscriptions.discountValue,
            finalPrice: schema_js_1.subscriptions.finalPrice,
            createdAt: schema_js_1.subscriptions.createdAt,
            memberName: schema_js_1.members.name,
            memberAccountId: schema_js_1.members.accountId,
            planName: schema_js_1.subscriptionPlans.name,
            planDuration: schema_js_1.subscriptionPlans.durationMonths,
        })
            .from(schema_js_1.subscriptions)
            .leftJoin(schema_js_1.members, (0, drizzle_orm_1.eq)(schema_js_1.subscriptions.memberId, schema_js_1.members.id))
            .leftJoin(schema_js_1.subscriptionPlans, (0, drizzle_orm_1.eq)(schema_js_1.subscriptions.planId, schema_js_1.subscriptionPlans.id))
            .where(whereClause)
            .orderBy((0, drizzle_orm_1.desc)(schema_js_1.subscriptions.createdAt))
            .limit(limit)
            .offset(offset),
        index_js_1.db
            .select({ count: (0, drizzle_orm_1.count)() })
            .from(schema_js_1.subscriptions)
            .where(whereClause),
    ]);
    return (0, response_js_1.paginatedResponse)(res, data, page, limit, totalResult[0].count);
}));
// GET /api/subscriptions/:id - Get subscription details
router.get('/:id', (0, validate_js_1.validate)(subscriptionParamsSchema), (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const [subscription] = await index_js_1.db
        .select({
        id: schema_js_1.subscriptions.id,
        memberId: schema_js_1.subscriptions.memberId,
        planId: schema_js_1.subscriptions.planId,
        startDate: schema_js_1.subscriptions.startDate,
        endDate: schema_js_1.subscriptions.endDate,
        status: schema_js_1.subscriptions.status,
        discountType: schema_js_1.subscriptions.discountType,
        discountValue: schema_js_1.subscriptions.discountValue,
        finalPrice: schema_js_1.subscriptions.finalPrice,
        createdAt: schema_js_1.subscriptions.createdAt,
        memberName: schema_js_1.members.name,
        memberPhone: schema_js_1.members.phone,
        memberAccountId: schema_js_1.members.accountId,
        planName: schema_js_1.subscriptionPlans.name,
        planDuration: schema_js_1.subscriptionPlans.durationMonths,
        planPrice: schema_js_1.subscriptionPlans.price,
    })
        .from(schema_js_1.subscriptions)
        .leftJoin(schema_js_1.members, (0, drizzle_orm_1.eq)(schema_js_1.subscriptions.memberId, schema_js_1.members.id))
        .leftJoin(schema_js_1.subscriptionPlans, (0, drizzle_orm_1.eq)(schema_js_1.subscriptions.planId, schema_js_1.subscriptionPlans.id))
        .where((0, drizzle_orm_1.eq)(schema_js_1.subscriptions.id, id))
        .limit(1);
    if (!subscription) {
        throw errors_js_1.AppError.notFound('Subscription not found');
    }
    // Get payments for this subscription
    const subscriptionPayments = await index_js_1.db
        .select()
        .from(schema_js_1.payments)
        .where((0, drizzle_orm_1.eq)(schema_js_1.payments.subscriptionId, id))
        .orderBy((0, drizzle_orm_1.desc)(schema_js_1.payments.createdAt));
    return (0, response_js_1.successResponse)(res, { ...subscription, payments: subscriptionPayments });
}));
// POST /api/subscriptions/:id/renew - Renew subscription
router.post('/:id/renew', (0, validate_js_1.validate)(renewSubscriptionSchema), (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const { planId, discountType, discountValue } = req.body;
    // Get current subscription
    const [currentSub] = await index_js_1.db
        .select()
        .from(schema_js_1.subscriptions)
        .where((0, drizzle_orm_1.eq)(schema_js_1.subscriptions.id, id))
        .limit(1);
    if (!currentSub) {
        throw errors_js_1.AppError.notFound('Subscription not found');
    }
    // Verify new plan
    const [newPlan] = await index_js_1.db
        .select()
        .from(schema_js_1.subscriptionPlans)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_js_1.subscriptionPlans.id, planId), (0, drizzle_orm_1.eq)(schema_js_1.subscriptionPlans.isActive, true)))
        .limit(1);
    if (!newPlan) {
        throw errors_js_1.AppError.notFound('Plan not found or inactive');
    }
    // Calculate new dates
    const currentEndDate = new Date(currentSub.endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let newStartDate;
    let newEndDate;
    if (currentEndDate >= today) {
        // Active subscription: add to current end date
        newStartDate = new Date(currentEndDate);
        newStartDate.setDate(newStartDate.getDate() + 1);
        newEndDate = new Date(currentEndDate);
        newEndDate.setMonth(newEndDate.getMonth() + newPlan.durationMonths);
    }
    else {
        // Expired subscription: start from today
        newStartDate = today;
        newEndDate = new Date(today);
        newEndDate.setMonth(newEndDate.getMonth() + newPlan.durationMonths);
    }
    // Calculate final price
    const finalPrice = calculateFinalPrice(Number(newPlan.price), discountType, discountValue);
    // Create new subscription (renewal)
    const [newSubscription] = await index_js_1.db
        .insert(schema_js_1.subscriptions)
        .values({
        memberId: currentSub.memberId,
        planId,
        startDate: newStartDate.toISOString().split('T')[0],
        endDate: newEndDate.toISOString().split('T')[0],
        status: 'active',
        discountType,
        discountValue: discountValue?.toString(),
        finalPrice: finalPrice.toString(),
        createdBy: req.user.userId,
    })
        .returning();
    // Update old subscription status to expired
    await index_js_1.db
        .update(schema_js_1.subscriptions)
        .set({ status: 'expired', updatedAt: new Date() })
        .where((0, drizzle_orm_1.eq)(schema_js_1.subscriptions.id, id));
    // Update member status to active
    await index_js_1.db
        .update(schema_js_1.members)
        .set({ status: 'active', updatedAt: new Date() })
        .where((0, drizzle_orm_1.eq)(schema_js_1.members.id, currentSub.memberId));
    return (0, response_js_1.successResponse)(res, newSubscription, 'Subscription renewed successfully', 201);
}));
// PATCH /api/subscriptions/:id - Update subscription status (manual)
router.patch('/:id', (0, validate_js_1.validate)(subscriptionParamsSchema.merge(zod_1.z.object({
    body: zod_1.z.object({
        status: zod_1.z.enum(['active', 'expired', 'expiring_soon']).optional(),
    }),
}))), (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const [subscription] = await index_js_1.db
        .select()
        .from(schema_js_1.subscriptions)
        .where((0, drizzle_orm_1.eq)(schema_js_1.subscriptions.id, id))
        .limit(1);
    if (!subscription) {
        throw errors_js_1.AppError.notFound('Subscription not found');
    }
    const [updated] = await index_js_1.db
        .update(schema_js_1.subscriptions)
        .set({ status: status, updatedAt: new Date() })
        .where((0, drizzle_orm_1.eq)(schema_js_1.subscriptions.id, id))
        .returning();
    return (0, response_js_1.successResponse)(res, updated, 'Subscription updated successfully');
}));
exports.default = router;
//# sourceMappingURL=subscriptions.js.map