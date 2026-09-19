import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validate } from '../middleware/validate.js';
import { authenticateToken, AuthenticatedRequest, requireAnyRole, requireAdmin } from '../middleware/auth.js';
import { db } from '../db/index.js';
import { payments, subscriptions, members, subscriptionPlans, attendances } from '../db/schema.js';
import { eq, desc, and, count, sum, sql, gte, lte } from 'drizzle-orm';
import { AppError } from '../utils/errors.js';
import { successResponse } from '../utils/response.js';

const router = Router();

router.use(authenticateToken);
router.use(requireAnyRole);

// Validation schemas
const reportQuerySchema = z.object({
  query: z.object({
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
    groupBy: z.enum(['day', 'week', 'month', 'year']).default('day'),
  }),
});

// GET /api/reports/dashboard - Dashboard summary
router.get(
  '/dashboard',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(today.getDate() - today.getDay());
    
    const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const thisYearStart = new Date(today.getFullYear(), 0, 1);

    // Parallel queries for dashboard stats
    const [
      totalMembers,
      activeMembers,
      expiredMembers,
      expiringSoonMembers,
      todayRevenue,
      weekRevenue,
      monthRevenue,
      yearRevenue,
      todayAttendances,
      cashRevenue,
      electronicRevenue,
      topPlans,
    ] = await Promise.all([
      // Total members
      db.select({ count: count() }).from(members).where(eq(members.status, 'active')),
      // Active members
      db.select({ count: count() }).from(members).where(eq(members.status, 'active')),
      // Expired members
      db.select({ count: count() }).from(members).where(eq(members.status, 'expired')),
      // Expiring soon members
      db.select({ count: count() }).from(members).where(eq(members.status, 'expiring_soon')),
      // Today revenue
      db.select({ total: sum(payments.amount) })
        .from(payments)
        .where(and(gte(payments.createdAt, today), lte(payments.createdAt, todayEnd))),
      // Week revenue
      db.select({ total: sum(payments.amount) })
        .from(payments)
        .where(gte(payments.createdAt, thisWeekStart)),
      // Month revenue
      db.select({ total: sum(payments.amount) })
        .from(payments)
        .where(gte(payments.createdAt, thisMonthStart)),
      // Year revenue
      db.select({ total: sum(payments.amount) })
        .from(payments)
        .where(gte(payments.createdAt, thisYearStart)),
      // Today attendances
      db.select({ count: count() })
        .from(attendances)
        .where(and(gte(attendances.checkInAt, today), lte(attendances.checkInAt, todayEnd))),
      // Cash revenue
      db.select({ total: sum(payments.amount) })
        .from(payments)
        .where(eq(payments.method, 'cash')),
      // Electronic revenue
      db.select({ total: sum(payments.amount) })
        .from(payments)
        .where(eq(payments.method, 'electronic')),
      // Top selling plans
      db.execute(sql`
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

    return successResponse(res, {
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
  })
);

// GET /api/reports/revenue - Revenue report
router.get(
  '/revenue',
  validate(reportQuerySchema),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { dateFrom, dateTo, groupBy } = req.query as any;

    const conditions = [];
    if (dateFrom) conditions.push(gte(payments.createdAt, new Date(dateFrom)));
    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      conditions.push(lte(payments.createdAt, toDate));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Group by date
    let dateFormat: string;
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

    const revenueData = await db.execute(sql`
      SELECT 
        TO_CHAR(created_at, ${dateFormat}) as period,
        SUM(amount) as total,
        COUNT(*) as transactions
      FROM payments
      ${whereClause ? sql`WHERE ${whereClause}` : sql``}
      GROUP BY period
      ORDER BY period DESC
    `);

    // By payment method
    const byMethod = await db.execute(sql`
      SELECT 
        method,
        SUM(amount) as total,
        COUNT(*) as transactions
      FROM payments
      ${whereClause ? sql`WHERE ${whereClause}` : sql``}
      GROUP BY method
    `);

    return successResponse(res, {
      byPeriod: revenueData.rows,
      byMethod: byMethod.rows,
    });
  })
);

// GET /api/reports/subscriptions - Subscription distribution
router.get(
  '/subscriptions',
  validate(reportQuerySchema),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { dateFrom, dateTo } = req.query as any;

    const conditions = [];
    if (dateFrom) conditions.push(gte(subscriptions.createdAt, new Date(dateFrom)));
    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      conditions.push(lte(subscriptions.createdAt, toDate));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const distribution = await db.execute(sql`
      SELECT 
        sp.name as plan_name,
        sp.duration_months,
        COUNT(s.id) as count,
        SUM(s.final_price) as revenue
      FROM subscriptions s
      JOIN subscription_plans sp ON s.plan_id = sp.id
      ${whereClause ? sql`WHERE ${whereClause}` : sql``}
      GROUP BY sp.id, sp.name, sp.duration_months
      ORDER BY count DESC
    `);

    // By status
    const byStatus = await db.execute(sql`
      SELECT 
        status,
        COUNT(*) as count
      FROM subscriptions
      ${whereClause ? sql`WHERE ${whereClause}` : sql``}
      GROUP BY status
    `);

    return successResponse(res, {
      byPlan: distribution.rows,
      byStatus: byStatus.rows,
    });
  })
);

// GET /api/reports/attendance - Attendance report
router.get(
  '/attendance',
  validate(reportQuerySchema),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { dateFrom, dateTo, groupBy } = req.query as any;

    const conditions = [];
    if (dateFrom) conditions.push(gte(attendances.checkInAt, new Date(dateFrom)));
    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      conditions.push(lte(attendances.checkInAt, toDate));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    let dateFormat: string;
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

    const attendanceData = await db.execute(sql`
      SELECT 
        TO_CHAR(check_in_at, ${dateFormat}) as period,
        COUNT(*) as count,
        COUNT(DISTINCT member_id) as unique_members
      FROM attendances
      ${whereClause ? sql`WHERE ${whereClause}` : sql``}
      GROUP BY period
      ORDER BY period DESC
    `);

    // Top attending members
    const topMembers = await db.execute(sql`
      SELECT 
        m.name,
        m.account_id,
        COUNT(a.id) as attendance_count
      FROM attendances a
      JOIN members m ON a.member_id = m.id
      ${whereClause ? sql`WHERE ${whereClause}` : sql``}
      GROUP BY m.id, m.name, m.account_id
      ORDER BY attendance_count DESC
      LIMIT 10
    `);

    return successResponse(res, {
      byPeriod: attendanceData.rows,
      topMembers: topMembers.rows,
    });
  })
);

// GET /api/reports/export - Export report (placeholder for Excel/PDF)
router.get(
  '/export',
  requireAdmin,
  validate(z.object({
    query: z.object({
      type: z.enum(['revenue', 'subscriptions', 'attendance', 'members']),
      format: z.enum(['excel', 'pdf']).default('excel'),
      dateFrom: z.string().optional(),
      dateTo: z.string().optional(),
    }),
  })),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    // TODO: Implement Excel/PDF export using exceljs or pdfkit
    return successResponse(res, { message: 'Export functionality coming soon' }, 'Export endpoint ready');
  })
);

export default router;