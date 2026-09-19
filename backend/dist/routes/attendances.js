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
const checkInSchema = zod_1.z.object({
    body: zod_1.z.object({
        accountId: zod_1.z.string().length(5, 'Account ID must be 5 digits').regex(/^\d{5}$/, 'Account ID must be 5 digits'),
    }),
});
const attendanceParamsSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().transform(Number),
    }),
});
const listAttendancesSchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z.string().transform(Number).default('1'),
        limit: zod_1.z.string().transform(Number).default('50'),
        memberId: zod_1.z.string().transform(Number).optional(),
        dateFrom: zod_1.z.string().optional(),
        dateTo: zod_1.z.string().optional(),
    }),
});
const memberAttendancesSchema = zod_1.z.object({
    params: zod_1.z.object({
        memberId: zod_1.z.string().transform(Number),
    }),
    query: zod_1.z.object({
        page: zod_1.z.string().transform(Number).default('1'),
        limit: zod_1.z.string().transform(Number).default('50'),
    }),
});
// POST /api/attendances/check-in - Record check-in
router.post('/check-in', (0, validate_js_1.validate)(checkInSchema), (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
    const { accountId } = req.body;
    // Find member by account ID
    const [member] = await index_js_1.db
        .select({
        id: schema_js_1.members.id,
        name: schema_js_1.members.name,
        status: schema_js_1.members.status,
        accountId: schema_js_1.members.accountId,
    })
        .from(schema_js_1.members)
        .where((0, drizzle_orm_1.eq)(schema_js_1.members.accountId, accountId))
        .limit(1);
    if (!member) {
        throw errors_js_1.AppError.notFound('Member not found');
    }
    if (member.status !== 'active') {
        throw errors_js_1.AppError.forbidden('Member is not active');
    }
    // Find active subscription for this member
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [subscription] = await index_js_1.db
        .select({
        id: schema_js_1.subscriptions.id,
        endDate: schema_js_1.subscriptions.endDate,
        status: schema_js_1.subscriptions.status,
    })
        .from(schema_js_1.subscriptions)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_js_1.subscriptions.memberId, member.id), (0, drizzle_orm_1.eq)(schema_js_1.subscriptions.status, 'active'), (0, drizzle_orm_1.gte)(schema_js_1.subscriptions.endDate, today.toISOString().split('T')[0])))
        .orderBy((0, drizzle_orm_1.desc)(schema_js_1.subscriptions.endDate))
        .limit(1);
    if (!subscription) {
        throw errors_js_1.AppError.forbidden('الاشتراك منتهي، يرجى التجديد');
    }
    // Check if already checked in today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    const [existingAttendance] = await index_js_1.db
        .select({ id: schema_js_1.attendances.id })
        .from(schema_js_1.attendances)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_js_1.attendances.memberId, member.id), (0, drizzle_orm_1.gte)(schema_js_1.attendances.checkInAt, todayStart), (0, drizzle_orm_1.lte)(schema_js_1.attendances.checkInAt, todayEnd)))
        .limit(1);
    if (existingAttendance) {
        return (0, response_js_1.successResponse)(res, {
            member: { id: member.id, name: member.name, accountId: member.accountId },
            message: 'Already checked in today',
            alreadyCheckedIn: true
        }, 'Member already checked in today');
    }
    // Record attendance
    const [attendance] = await index_js_1.db
        .insert(schema_js_1.attendances)
        .values({
        memberId: member.id,
        subscriptionId: subscription.id,
        checkInAt: new Date(),
    })
        .returning();
    return (0, response_js_1.successResponse)(res, {
        member: { id: member.id, name: member.name, accountId: member.accountId },
        attendance: { id: attendance.id, checkInAt: attendance.checkInAt },
        alreadyCheckedIn: false
    }, 'Check-in successful', 201);
}));
// GET /api/attendances - List attendances with filters
router.get('/', (0, validate_js_1.validate)(listAttendancesSchema), (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
    const { page, limit, memberId, dateFrom, dateTo } = req.query;
    const offset = (page - 1) * limit;
    const conditions = [];
    if (memberId)
        conditions.push((0, drizzle_orm_1.eq)(schema_js_1.attendances.memberId, memberId));
    if (dateFrom)
        conditions.push((0, drizzle_orm_1.gte)(schema_js_1.attendances.checkInAt, new Date(dateFrom)));
    if (dateTo) {
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999);
        conditions.push((0, drizzle_orm_1.lte)(schema_js_1.attendances.checkInAt, toDate));
    }
    const whereClause = conditions.length > 0 ? (0, drizzle_orm_1.and)(...conditions) : undefined;
    const [data, totalResult] = await Promise.all([
        index_js_1.db
            .select({
            id: schema_js_1.attendances.id,
            memberId: schema_js_1.attendances.memberId,
            subscriptionId: schema_js_1.attendances.subscriptionId,
            checkInAt: schema_js_1.attendances.checkInAt,
            memberName: schema_js_1.members.name,
            memberAccountId: schema_js_1.members.accountId,
        })
            .from(schema_js_1.attendances)
            .leftJoin(schema_js_1.members, (0, drizzle_orm_1.eq)(schema_js_1.attendances.memberId, schema_js_1.members.id))
            .where(whereClause)
            .orderBy((0, drizzle_orm_1.desc)(schema_js_1.attendances.checkInAt))
            .limit(limit)
            .offset(offset),
        index_js_1.db
            .select({ count: (0, drizzle_orm_1.count)() })
            .from(schema_js_1.attendances)
            .where(whereClause),
    ]);
    return (0, response_js_1.paginatedResponse)(res, data, page, limit, totalResult[0].count);
}));
// GET /api/attendances/member/:memberId - Get attendances for a member
router.get('/member/:memberId', (0, validate_js_1.validate)(memberAttendancesSchema), (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
    const { memberId } = req.params;
    const { page, limit } = req.query;
    const offset = (page - 1) * limit;
    const [data, totalResult] = await Promise.all([
        index_js_1.db
            .select()
            .from(schema_js_1.attendances)
            .where((0, drizzle_orm_1.eq)(schema_js_1.attendances.memberId, memberId))
            .orderBy((0, drizzle_orm_1.desc)(schema_js_1.attendances.checkInAt))
            .limit(limit)
            .offset(offset),
        index_js_1.db
            .select({ count: (0, drizzle_orm_1.count)() })
            .from(schema_js_1.attendances)
            .where((0, drizzle_orm_1.eq)(schema_js_1.attendances.memberId, memberId)),
    ]);
    return (0, response_js_1.paginatedResponse)(res, data, page, limit, totalResult[0].count);
}));
// GET /api/attendances/stats - Get attendance statistics
router.get('/stats', (0, validate_js_1.validate)(zod_1.z.object({
    query: zod_1.z.object({
        dateFrom: zod_1.z.string().optional(),
        dateTo: zod_1.z.string().optional(),
    }),
})), (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
    const { dateFrom, dateTo } = req.query;
    const conditions = [];
    if (dateFrom)
        conditions.push((0, drizzle_orm_1.gte)(schema_js_1.attendances.checkInAt, new Date(dateFrom)));
    if (dateTo) {
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999);
        conditions.push((0, drizzle_orm_1.lte)(schema_js_1.attendances.checkInAt, toDate));
    }
    const whereClause = conditions.length > 0 ? (0, drizzle_orm_1.and)(...conditions) : undefined;
    // Daily stats for the last 30 days
    const dailyStats = await index_js_1.db.execute((0, drizzle_orm_1.sql) `
      SELECT 
        DATE(check_in_at) as date,
        COUNT(*) as count
      FROM attendances
      ${whereClause ? (0, drizzle_orm_1.sql) `WHERE ${whereClause}` : (0, drizzle_orm_1.sql) ``}
      GROUP BY DATE(check_in_at)
      ORDER BY date DESC
      LIMIT 30
    `);
    // Total count
    const [totalResult] = await index_js_1.db
        .select({ count: (0, drizzle_orm_1.count)() })
        .from(schema_js_1.attendances)
        .where(whereClause);
    // Unique members today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    const [todayUnique] = await index_js_1.db
        .select({ count: (0, drizzle_orm_1.count)((0, drizzle_orm_1.sql) `DISTINCT ${schema_js_1.attendances.memberId}`) })
        .from(schema_js_1.attendances)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.gte)(schema_js_1.attendances.checkInAt, today), (0, drizzle_orm_1.lte)(schema_js_1.attendances.checkInAt, todayEnd)));
    return (0, response_js_1.successResponse)(res, {
        total: totalResult.count,
        todayUnique: todayUnique.count,
        dailyStats: dailyStats.rows,
    });
}));
exports.default = router;
//# sourceMappingURL=attendances.js.map