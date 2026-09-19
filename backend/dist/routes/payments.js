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
const createPaymentSchema = zod_1.z.object({
    body: zod_1.z.object({
        subscriptionId: zod_1.z.number().int().positive(),
        method: zod_1.z.enum(['cash', 'electronic']),
        referenceNumber: zod_1.z.string().optional(),
    }),
});
const paymentParamsSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().transform(Number),
    }),
});
const listPaymentsSchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z.string().transform(Number).default('1'),
        limit: zod_1.z.string().transform(Number).default('20'),
        memberId: zod_1.z.string().transform(Number).optional(),
        subscriptionId: zod_1.z.string().transform(Number).optional(),
        method: zod_1.z.enum(['cash', 'electronic']).optional(),
        dateFrom: zod_1.z.string().optional(),
        dateTo: zod_1.z.string().optional(),
    }),
});
// POST /api/payments - Record payment
router.post('/', (0, validate_js_1.validate)(createPaymentSchema), (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
    const { subscriptionId, method, referenceNumber } = req.body;
    // Get subscription with plan price
    const [subscription] = await index_js_1.db
        .select({
        id: schema_js_1.subscriptions.id,
        memberId: schema_js_1.subscriptions.memberId,
        finalPrice: schema_js_1.subscriptions.finalPrice,
        status: schema_js_1.subscriptions.status,
    })
        .from(schema_js_1.subscriptions)
        .where((0, drizzle_orm_1.eq)(schema_js_1.subscriptions.id, subscriptionId))
        .limit(1);
    if (!subscription) {
        throw errors_js_1.AppError.notFound('Subscription not found');
    }
    // Verify payment amount matches final price (no partial payments)
    const amount = subscription.finalPrice;
    // Create payment record
    const [payment] = await index_js_1.db
        .insert(schema_js_1.payments)
        .values({
        subscriptionId,
        memberId: subscription.memberId,
        amount,
        method,
        referenceNumber,
        receivedBy: req.user.userId,
    })
        .returning();
    // Update subscription status to active if it was expiring/expired
    if (subscription.status !== 'active') {
        await index_js_1.db
            .update(schema_js_1.subscriptions)
            .set({ status: 'active', updatedAt: new Date() })
            .where((0, drizzle_orm_1.eq)(schema_js_1.subscriptions.id, subscriptionId));
    }
    // Update member status to active
    await index_js_1.db
        .update(schema_js_1.members)
        .set({ status: 'active', updatedAt: new Date() })
        .where((0, drizzle_orm_1.eq)(schema_js_1.members.id, subscription.memberId));
    return (0, response_js_1.successResponse)(res, payment, 'Payment recorded successfully', 201);
}));
// GET /api/payments - List payments with filters
router.get('/', (0, validate_js_1.validate)(listPaymentsSchema), (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
    const { page, limit, memberId, subscriptionId, method, dateFrom, dateTo } = req.query;
    const offset = (page - 1) * limit;
    const conditions = [];
    if (memberId)
        conditions.push((0, drizzle_orm_1.eq)(schema_js_1.payments.memberId, memberId));
    if (subscriptionId)
        conditions.push((0, drizzle_orm_1.eq)(schema_js_1.payments.subscriptionId, subscriptionId));
    if (method)
        conditions.push((0, drizzle_orm_1.eq)(schema_js_1.payments.method, method));
    if (dateFrom)
        conditions.push((0, drizzle_orm_1.gte)(schema_js_1.payments.createdAt, new Date(dateFrom)));
    if (dateTo) {
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999);
        conditions.push((0, drizzle_orm_1.lte)(schema_js_1.payments.createdAt, toDate));
    }
    const whereClause = conditions.length > 0 ? (0, drizzle_orm_1.and)(...conditions) : undefined;
    const [data, totalResult] = await Promise.all([
        index_js_1.db
            .select({
            id: schema_js_1.payments.id,
            subscriptionId: schema_js_1.payments.subscriptionId,
            memberId: schema_js_1.payments.memberId,
            amount: schema_js_1.payments.amount,
            method: schema_js_1.payments.method,
            referenceNumber: schema_js_1.payments.referenceNumber,
            receivedBy: schema_js_1.payments.receivedBy,
            createdAt: schema_js_1.payments.createdAt,
            memberName: schema_js_1.members.name,
            memberAccountId: schema_js_1.members.accountId,
        })
            .from(schema_js_1.payments)
            .leftJoin(schema_js_1.members, (0, drizzle_orm_1.eq)(schema_js_1.payments.memberId, schema_js_1.members.id))
            .where(whereClause)
            .orderBy((0, drizzle_orm_1.desc)(schema_js_1.payments.createdAt))
            .limit(limit)
            .offset(offset),
        index_js_1.db
            .select({ count: (0, drizzle_orm_1.count)() })
            .from(schema_js_1.payments)
            .where(whereClause),
    ]);
    return (0, response_js_1.paginatedResponse)(res, data, page, limit, totalResult[0].count);
}));
// GET /api/payments/:id - Get payment details
router.get('/:id', (0, validate_js_1.validate)(paymentParamsSchema), (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const [payment] = await index_js_1.db
        .select({
        id: schema_js_1.payments.id,
        subscriptionId: schema_js_1.payments.subscriptionId,
        memberId: schema_js_1.payments.memberId,
        amount: schema_js_1.payments.amount,
        method: schema_js_1.payments.method,
        referenceNumber: schema_js_1.payments.referenceNumber,
        receivedBy: schema_js_1.payments.receivedBy,
        createdAt: schema_js_1.payments.createdAt,
        memberName: schema_js_1.members.name,
        memberPhone: schema_js_1.members.phone,
        memberAccountId: schema_js_1.members.accountId,
    })
        .from(schema_js_1.payments)
        .leftJoin(schema_js_1.members, (0, drizzle_orm_1.eq)(schema_js_1.payments.memberId, schema_js_1.members.id))
        .where((0, drizzle_orm_1.eq)(schema_js_1.payments.id, id))
        .limit(1);
    if (!payment) {
        throw errors_js_1.AppError.notFound('Payment not found');
    }
    return (0, response_js_1.successResponse)(res, payment);
}));
// GET /api/payments/member/:memberId - Get payments for a member
router.get('/member/:memberId', (0, validate_js_1.validate)(zod_1.z.object({
    params: zod_1.z.object({ memberId: zod_1.z.string().transform(Number) }),
    query: zod_1.z.object({
        page: zod_1.z.string().transform(Number).default('1'),
        limit: zod_1.z.string().transform(Number).default('20'),
    }),
})), (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
    const { memberId } = req.params;
    const { page, limit } = req.query;
    const offset = (page - 1) * limit;
    const [data, totalResult] = await Promise.all([
        index_js_1.db
            .select()
            .from(schema_js_1.payments)
            .where((0, drizzle_orm_1.eq)(schema_js_1.payments.memberId, memberId))
            .orderBy((0, drizzle_orm_1.desc)(schema_js_1.payments.createdAt))
            .limit(limit)
            .offset(offset),
        index_js_1.db
            .select({ count: (0, drizzle_orm_1.count)() })
            .from(schema_js_1.payments)
            .where((0, drizzle_orm_1.eq)(schema_js_1.payments.memberId, memberId)),
    ]);
    return (0, response_js_1.paginatedResponse)(res, data, page, limit, totalResult[0].count);
}));
exports.default = router;
//# sourceMappingURL=payments.js.map