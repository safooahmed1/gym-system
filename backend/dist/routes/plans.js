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
// All routes require authentication
router.use(auth_js_1.authenticateToken);
// Validation schemas
const planSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(2, 'Plan name must be at least 2 characters'),
        durationMonths: zod_1.z.number().int().positive('Duration must be a positive integer'),
        price: zod_1.z.number().positive('Price must be positive'),
        description: zod_1.z.string().optional(),
    }),
});
const planParamsSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().transform(Number),
    }),
});
const listPlansSchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z.string().transform(Number).default('1'),
        limit: zod_1.z.string().transform(Number).default('20'),
        isActive: zod_1.z.string().transform(val => val === 'true').optional(),
    }),
});
// GET /api/plans - List all plans (accessible by all roles)
router.get('/', auth_js_1.requireAnyRole, (0, validate_js_1.validate)(listPlansSchema), (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
    const { page, limit, isActive } = req.query;
    const offset = (page - 1) * limit;
    const conditions = [];
    if (isActive !== undefined) {
        conditions.push((0, drizzle_orm_1.eq)(schema_js_1.subscriptionPlans.isActive, isActive));
    }
    const whereClause = conditions.length > 0 ? conditions[0] : undefined;
    const [data, totalResult] = await Promise.all([
        index_js_1.db
            .select()
            .from(schema_js_1.subscriptionPlans)
            .where(whereClause)
            .orderBy((0, drizzle_orm_1.desc)(schema_js_1.subscriptionPlans.createdAt))
            .limit(limit)
            .offset(offset),
        index_js_1.db
            .select({ count: (0, drizzle_orm_1.count)() })
            .from(schema_js_1.subscriptionPlans)
            .where(whereClause),
    ]);
    return (0, response_js_1.paginatedResponse)(res, data, page, limit, totalResult[0].count);
}));
// GET /api/plans/:id - Get single plan
router.get('/:id', auth_js_1.requireAnyRole, (0, validate_js_1.validate)(planParamsSchema), (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const [plan] = await index_js_1.db
        .select()
        .from(schema_js_1.subscriptionPlans)
        .where((0, drizzle_orm_1.eq)(schema_js_1.subscriptionPlans.id, id))
        .limit(1);
    if (!plan) {
        throw errors_js_1.AppError.notFound('Plan not found');
    }
    return (0, response_js_1.successResponse)(res, plan);
}));
// POST /api/plans - Create plan (Admin only)
router.post('/', auth_js_1.requireAdmin, (0, validate_js_1.validate)(planSchema), (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
    const { name, durationMonths, price, description } = req.body;
    const [plan] = await index_js_1.db
        .insert(schema_js_1.subscriptionPlans)
        .values({ name, durationMonths, price, description })
        .returning();
    return (0, response_js_1.successResponse)(res, plan, 'Plan created successfully', 201);
}));
// PATCH /api/plans/:id - Update plan (Admin only)
router.patch('/:id', auth_js_1.requireAdmin, (0, validate_js_1.validate)(planSchema.merge(planParamsSchema)), (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const { name, durationMonths, price, description, isActive } = req.body;
    const [plan] = await index_js_1.db
        .select()
        .from(schema_js_1.subscriptionPlans)
        .where((0, drizzle_orm_1.eq)(schema_js_1.subscriptionPlans.id, id))
        .limit(1);
    if (!plan) {
        throw errors_js_1.AppError.notFound('Plan not found');
    }
    const updateData = { updatedAt: new Date() };
    if (name)
        updateData.name = name;
    if (durationMonths)
        updateData.durationMonths = durationMonths;
    if (price)
        updateData.price = price;
    if (description !== undefined)
        updateData.description = description;
    if (isActive !== undefined)
        updateData.isActive = isActive;
    const [updated] = await index_js_1.db
        .update(schema_js_1.subscriptionPlans)
        .set(updateData)
        .where((0, drizzle_orm_1.eq)(schema_js_1.subscriptionPlans.id, id))
        .returning();
    return (0, response_js_1.successResponse)(res, updated, 'Plan updated successfully');
}));
// DELETE /api/plans/:id - Delete plan (Admin only)
router.delete('/:id', auth_js_1.requireAdmin, (0, validate_js_1.validate)(planParamsSchema), (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const [plan] = await index_js_1.db
        .select()
        .from(schema_js_1.subscriptionPlans)
        .where((0, drizzle_orm_1.eq)(schema_js_1.subscriptionPlans.id, id))
        .limit(1);
    if (!plan) {
        throw errors_js_1.AppError.notFound('Plan not found');
    }
    await index_js_1.db
        .delete(schema_js_1.subscriptionPlans)
        .where((0, drizzle_orm_1.eq)(schema_js_1.subscriptionPlans.id, id));
    return (0, response_js_1.successResponse)(res, null, 'Plan deleted successfully');
}));
exports.default = router;
//# sourceMappingURL=plans.js.map