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
const accountId_js_1 = require("../utils/accountId.js");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_js_1.authenticateToken);
router.use(auth_js_1.requireAnyRole);
// Validation schemas
const createMemberSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(2, 'Name must be at least 2 characters'),
        phone: zod_1.z.string().min(10, 'Phone number is required'),
        nationalId: zod_1.z.string().length(14, 'National ID must be 14 digits'),
    }),
});
const updateMemberSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(2).optional(),
        phone: zod_1.z.string().min(10).optional(),
    }),
    params: zod_1.z.object({
        id: zod_1.z.string().transform(Number),
    }),
});
const memberParamsSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().transform(Number),
    }),
});
const listMembersSchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z.string().transform(Number).default('1'),
        limit: zod_1.z.string().transform(Number).default('20'),
        search: zod_1.z.string().optional(),
        status: zod_1.z.enum(['active', 'inactive', 'expired', 'expiring_soon']).optional(),
    }),
});
// GET /api/members - List members with pagination, search, filters
router.get('/', (0, validate_js_1.validate)(listMembersSchema), (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
    const { page, limit, search, status } = req.query;
    const offset = (page - 1) * limit;
    const conditions = [];
    if (search) {
        conditions.push((0, drizzle_orm_1.or)((0, drizzle_orm_1.ilike)(schema_js_1.members.name, `%${search}%`), (0, drizzle_orm_1.ilike)(schema_js_1.members.phone, `%${search}%`), (0, drizzle_orm_1.ilike)(schema_js_1.members.accountId, `%${search}%`), (0, drizzle_orm_1.ilike)(schema_js_1.members.nationalId, `%${search}%`)));
    }
    if (status) {
        conditions.push((0, drizzle_orm_1.eq)(schema_js_1.members.status, status));
    }
    const whereClause = conditions.length > 0 ? (0, drizzle_orm_1.and)(...conditions) : undefined;
    const [data, totalResult] = await Promise.all([
        index_js_1.db
            .select({
            id: schema_js_1.members.id,
            accountId: schema_js_1.members.accountId,
            name: schema_js_1.members.name,
            phone: schema_js_1.members.phone,
            nationalId: schema_js_1.members.nationalId,
            status: schema_js_1.members.status,
            createdAt: schema_js_1.members.createdAt,
        })
            .from(schema_js_1.members)
            .where(whereClause)
            .orderBy((0, drizzle_orm_1.desc)(schema_js_1.members.createdAt))
            .limit(limit)
            .offset(offset),
        index_js_1.db
            .select({ count: (0, drizzle_orm_1.count)() })
            .from(schema_js_1.members)
            .where(whereClause),
    ]);
    return (0, response_js_1.paginatedResponse)(res, data, page, limit, totalResult[0].count);
}));
// GET /api/members/:id - Get member details with history
router.get('/:id', (0, validate_js_1.validate)(memberParamsSchema), (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const [member] = await index_js_1.db
        .select()
        .from(schema_js_1.members)
        .where((0, drizzle_orm_1.eq)(schema_js_1.members.id, id))
        .limit(1);
    if (!member) {
        throw errors_js_1.AppError.notFound('Member not found');
    }
    // Get subscriptions
    const memberSubscriptions = await index_js_1.db
        .select({
        id: schema_js_1.subscriptions.id,
        planName: (0, drizzle_orm_1.sql) `${schema_js_1.subscriptions.planId}`.as('plan_name'),
        startDate: schema_js_1.subscriptions.startDate,
        endDate: schema_js_1.subscriptions.endDate,
        status: schema_js_1.subscriptions.status,
        finalPrice: schema_js_1.subscriptions.finalPrice,
        createdAt: schema_js_1.subscriptions.createdAt,
    })
        .from(schema_js_1.subscriptions)
        .where((0, drizzle_orm_1.eq)(schema_js_1.subscriptions.memberId, id))
        .orderBy((0, drizzle_orm_1.desc)(schema_js_1.subscriptions.createdAt));
    return (0, response_js_1.successResponse)(res, {
        ...member,
        subscriptions: memberSubscriptions,
    });
}));
// POST /api/members - Create new member
router.post('/', (0, validate_js_1.validate)(createMemberSchema), (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
    const { name, phone, nationalId } = req.body;
    // Check national ID uniqueness
    const existingNationalId = await index_js_1.db
        .select({ id: schema_js_1.members.id })
        .from(schema_js_1.members)
        .where((0, drizzle_orm_1.eq)(schema_js_1.members.nationalId, nationalId))
        .limit(1);
    if (existingNationalId.length > 0) {
        throw errors_js_1.AppError.conflict('الرقم القومي مسجل مسبقاً');
    }
    const accountId = await (0, accountId_js_1.generateUniqueAccountId)();
    const [member] = await index_js_1.db
        .insert(schema_js_1.members)
        .values({ name, phone, nationalId, accountId, status: 'active' })
        .returning();
    return (0, response_js_1.successResponse)(res, member, 'Member created successfully', 201);
}));
// PATCH /api/members/:id - Update member
router.patch('/:id', (0, validate_js_1.validate)(updateMemberSchema), (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const { name, phone } = req.body;
    const [member] = await index_js_1.db
        .select()
        .from(schema_js_1.members)
        .where((0, drizzle_orm_1.eq)(schema_js_1.members.id, id))
        .limit(1);
    if (!member) {
        throw errors_js_1.AppError.notFound('Member not found');
    }
    const updateData = { updatedAt: new Date() };
    if (name)
        updateData.name = name;
    if (phone)
        updateData.phone = phone;
    const [updated] = await index_js_1.db
        .update(schema_js_1.members)
        .set(updateData)
        .where((0, drizzle_orm_1.eq)(schema_js_1.members.id, id))
        .returning();
    return (0, response_js_1.successResponse)(res, updated, 'Member updated successfully');
}));
// DELETE /api/members/:id - Soft delete member
router.delete('/:id', (0, validate_js_1.validate)(memberParamsSchema), (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const [member] = await index_js_1.db
        .select()
        .from(schema_js_1.members)
        .where((0, drizzle_orm_1.eq)(schema_js_1.members.id, id))
        .limit(1);
    if (!member) {
        throw errors_js_1.AppError.notFound('Member not found');
    }
    if (member.status === 'inactive') {
        throw errors_js_1.AppError.badRequest('Member is already inactive');
    }
    await index_js_1.db
        .update(schema_js_1.members)
        .set({ status: 'inactive', deletedAt: new Date(), updatedAt: new Date() })
        .where((0, drizzle_orm_1.eq)(schema_js_1.members.id, id));
    return (0, response_js_1.successResponse)(res, null, 'Member deactivated successfully (soft delete)');
}));
exports.default = router;
//# sourceMappingURL=members.js.map