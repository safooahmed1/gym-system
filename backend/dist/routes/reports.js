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
const response_js_1 = require("../utils/response.js");
const router = (0, express_1.Router)();
router.use(auth_js_1.authenticateToken);
router.use(auth_js_1.requireAnyRole);
// Validation schemas
const reportQuerySchema = zod_1.z.object({
    query: zod_1.z.object({
        dateFrom: zod_1.z.string().optional(),
        dateTo: zod_1.z.string().optional(),
        groupBy: zod_1.z.enum(['day', 'week', 'month', 'year']).default('day'),
    }),
});
// GET /api/reports/dashboard - Dashboard summary
router.get('/dashboard', (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(today.getDate() - today.getDay());
    const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const thisYearStart = new Date(today.getFullYear(), 0, 1);
    // Parallel queries for dashboard stats
    const [totalMembers, activeMembers, expiredMembers, expiringSoonMembers, todayRevenue, weekRevenue, monthRevenue, yearRevenue, todayAttendances, cashRevenue, electronicRevenue, topPlans,] = await Promise.all([
        // Total members
        index_js_1.db.select({ count: (0, drizzle_orm_1.count)() }).from(schema_js_1.members).where((0, drizzle_orm_1.eq)(schema_js_1.members.status, 'active')),
        // Active members
        index_js_1.db.select({ count: (0, drizzle_orm_1.count)() }).from(schema_js_1.members).where((0, drizzle_orm_1.eq)(schema_js_1.members.status, 'active')),
        // Expired members
        index_js_1.db.select({ count: (0, drizzle_orm_1.count)() }).from(schema_js_1.members).where((0, drizzle_orm_1.eq)(schema_js_1.members.status, 'expired')),
        // Expiring soon members
        index_js_1.db.select({ count: (0, drizzle_orm_1.count)() }).from(schema_js_1.members).where((0, drizzle_orm_1.eq)(schema_js_1.members.status, 'expiring_soon')),
        // Today revenue
        index_js_1.db.select({ total: (0, drizzle_orm_1.sum)(schema_js_1.payments.amount) })
            .from(schema_js_1.payments)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.gte)(schema_js_1.payments.createdAt, today), (0, drizzle_orm_1.lte)(schema_js_1.payments.createdAt, todayEnd))),
        // Week revenue
        index_js_1.db.select({ total: (0, drizzle_orm_1.sum)(schema_js_1.payments.amount) })
            .from(schema_js_1.payments)
            .where((0, drizzle_orm_1.gte)(schema_js_1.payments.createdAt, thisWeekStart)),
        // Month revenue
        index_js_1.db.select({ total: (0, drizzle_orm_1.sum)(schema_js_1.payments.amount) })
            .from(schema_js_1.payments)
            .where((0, drizzle_orm_1.gte)(schema_js_1.payments.createdAt, thisMonthStart)),
        // Year revenue
        index_js_1.db.select({ total: (0, drizzle_orm_1.sum)(schema_js_1.payments.amount) })
            .from(schema_js_1.payments)
            .where((0, drizzle_orm_1.gte)(schema_js_1.payments.createdAt, thisYearStart)),
        // Today attendances
        index_js_1.db.select({ count: (0, drizzle_orm_1.count)() })
            .from(schema_js_1.attendances)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.gte)(schema_js_1.attendances.checkInAt, today), (0, drizzle_orm_1.lte)(schema_js_1.attendances.checkInAt, todayEnd))),
        // Cash revenue
        index_js_1.db.select({ total: (0, drizzle_orm_1.sum)(schema_js_1.payments.amount) })
            .from(schema_js_1.payments)
            .where((0, drizzle_orm_1.eq)(schema_js_1.payments.method, 'cash')),
        // Electronic revenue
        index_js_1.db.select({ total: (0, drizzle_orm_1.sum)(schema_js_1.payments.amount) })
            .from(schema_js_1.payments)
            .where((0, drizzle_orm_1.eq)(schema_js_1.payments.method, 'electronic')),
        // Top selling plans
        index_js_1.db.execute((0, drizzle_orm_1.sql) `
        SELECT 
          sp.name as plan_name,
          sp.duration_months,
          COUNT(s.id) as sales_count,
          SUM(s.final_price) as total_revenue
        FROM subscriptions s
        JOIN subscription_plans sp ON s.plan_id = sp.id
        GROUP BY sp.id, sp.name, sp.duration_months
        ORDER BY sales_count DESC
        LIMIT 5
      `),
    ]);
    return (0, response_js_1.successResponse)(res, {
        members: {
            total: totalMembers[0].count,
            active: activeMembers[0].count,
            expired: expiredMembers[0].count,
            expiringSoon: expiringSoonMembers[0].count,
        },
        revenue: {
            today: Number(todayRevenue[0].total || 0),
            thisWeek: Number(weekRevenue[0].total || 0),
            thisMonth: Number(monthRevenue[0].total || 0),
            thisYear: Number(yearRevenue[0].total || 0),
            byMethod: {
                cash: Number(cashRevenue[0].total || 0),
                electronic: Number(electronicRevenue[0].total || 0),
            },
        },
        attendances: {
            today: todayAttendances[0].count,
        },
        topPlans: topPlans.rows,
    });
}));
// GET /api/reports/revenue - Revenue report
router.get('/revenue', (0, validate_js_1.validate)(reportQuerySchema), (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
    const { dateFrom, dateTo, groupBy } = req.query;
    const conditions = [];
    if (dateFrom)
        conditions.push((0, drizzle_orm_1.gte)(schema_js_1.payments.createdAt, new Date(dateFrom)));
    if (dateTo) {
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999);
        conditions.push((0, drizzle_orm_1.lte)(schema_js_1.payments.createdAt, toDate));
    }
    const whereClause = conditions.length > 0 ? (0, drizzle_orm_1.and)(...conditions) : undefined;
    // Group by date
    let dateFormat;
    switch (groupBy) {
        case 'week':
            dateFormat = 'YYYY-"W"WW';
            break;
        case 'month':
            dateFormat = 'YYYY-MM';
            break;
        case 'year':
            dateFormat = 'YYYY';
            break;
        default:
            dateFormat = 'YYYY-MM-DD';
    }
    const revenueData = await index_js_1.db.execute((0, drizzle_orm_1.sql) `
      SELECT 
        TO_CHAR(created_at, ${dateFormat}) as period,
        SUM(amount) as total,
        COUNT(*) as transactions
      FROM payments
      ${whereClause ? (0, drizzle_orm_1.sql) `WHERE ${whereClause}` : (0, drizzle_orm_1.sql) ``}
      GROUP BY period
      ORDER BY period DESC
    `);
    // By payment method
    const byMethod = await index_js_1.db.execute((0, drizzle_orm_1.sql) `
      SELECT 
        method,
        SUM(amount) as total,
        COUNT(*) as transactions
      FROM payments
      ${whereClause ? (0, drizzle_orm_1.sql) `WHERE ${whereClause}` : (0, drizzle_orm_1.sql) ``}
      GROUP BY method
    `);
    return (0, response_js_1.successResponse)(res, {
        byPeriod: revenueData.rows,
        byMethod: byMethod.rows,
    });
}));
// GET /api/reports/subscriptions - Subscription distribution
router.get('/subscriptions', (0, validate_js_1.validate)(reportQuerySchema), (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
    const { dateFrom, dateTo } = req.query;
    const conditions = [];
    if (dateFrom)
        conditions.push((0, drizzle_orm_1.gte)(schema_js_1.subscriptions.createdAt, new Date(dateFrom)));
    if (dateTo) {
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999);
        conditions.push((0, drizzle_orm_1.lte)(schema_js_1.subscriptions.createdAt, toDate));
    }
    const whereClause = conditions.length > 0 ? (0, drizzle_orm_1.and)(...conditions) : undefined;
    const distribution = await index_js_1.db.execute((0, drizzle_orm_1.sql) `
      SELECT 
        sp.name as plan_name,
        sp.duration_months,
        COUNT(s.id) as count,
        SUM(s.final_price) as revenue
      FROM subscriptions s
      JOIN subscription_plans sp ON s.plan_id = sp.id
      ${whereClause ? (0, drizzle_orm_1.sql) `WHERE ${whereClause}` : (0, drizzle_orm_1.sql) ``}
      GROUP BY sp.id, sp.name, sp.duration_months
      ORDER BY count DESC
    `);
    // By status
    const byStatus = await index_js_1.db.execute((0, drizzle_orm_1.sql) `
      SELECT 
        status,
        COUNT(*) as count
      FROM subscriptions
      ${whereClause ? (0, drizzle_orm_1.sql) `WHERE ${whereClause}` : (0, drizzle_orm_1.sql) ``}
      GROUP BY status
    `);
    return (0, response_js_1.successResponse)(res, {
        byPlan: distribution.rows,
        byStatus: byStatus.rows,
    });
}));
// GET /api/reports/attendance - Attendance report
router.get('/attendance', (0, validate_js_1.validate)(reportQuerySchema), (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
    const { dateFrom, dateTo, groupBy } = req.query;
    const conditions = [];
    if (dateFrom)
        conditions.push((0, drizzle_orm_1.gte)(schema_js_1.attendances.checkInAt, new Date(dateFrom)));
    if (dateTo) {
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999);
        conditions.push((0, drizzle_orm_1.lte)(schema_js_1.attendances.checkInAt, toDate));
    }
    const whereClause = conditions.length > 0 ? (0, drizzle_orm_1.and)(...conditions) : undefined;
    let dateFormat;
    switch (groupBy) {
        case 'week':
            dateFormat = 'YYYY-"W"WW';
            break;
        case 'month':
            dateFormat = 'YYYY-MM';
            break;
        case 'year':
            dateFormat = 'YYYY';
            break;
        default:
            dateFormat = 'YYYY-MM-DD';
    }
    const attendanceData = await index_js_1.db.execute((0, drizzle_orm_1.sql) `
      SELECT 
        TO_CHAR(check_in_at, ${dateFormat}) as period,
        COUNT(*) as count,
        COUNT(DISTINCT member_id) as unique_members
      FROM attendances
      ${whereClause ? (0, drizzle_orm_1.sql) `WHERE ${whereClause}` : (0, drizzle_orm_1.sql) ``}
      GROUP BY period
      ORDER BY period DESC
    `);
    // Top attending members
    const topMembers = await index_js_1.db.execute((0, drizzle_orm_1.sql) `
      SELECT 
        m.name,
        m.account_id,
        COUNT(a.id) as attendance_count
      FROM attendances a
      JOIN members m ON a.member_id = m.id
      ${whereClause ? (0, drizzle_orm_1.sql) `WHERE ${whereClause}` : (0, drizzle_orm_1.sql) ``}
      GROUP BY m.id, m.name, m.account_id
      ORDER BY attendance_count DESC
      LIMIT 10
    `);
    return (0, response_js_1.successResponse)(res, {
        byPeriod: attendanceData.rows,
        topMembers: topMembers.rows,
    });
}));
// GET /api/reports/export - Export report (placeholder for Excel/PDF)
router.get('/export', auth_js_1.requireAdmin, (0, validate_js_1.validate)(zod_1.z.object({
    query: zod_1.z.object({
        type: zod_1.z.enum(['revenue', 'subscriptions', 'attendance', 'members']),
        format: zod_1.z.enum(['excel', 'pdf']).default('excel'),
        dateFrom: zod_1.z.string().optional(),
        dateTo: zod_1.z.string().optional(),
    }),
})), (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
    // TODO: Implement Excel/PDF export using exceljs or pdfkit
    return (0, response_js_1.successResponse)(res, { message: 'Export functionality coming soon' }, 'Export endpoint ready');
}));
exports.default = router;
//# sourceMappingURL=reports.js.map