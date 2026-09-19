import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Select } from '../../components/ui/Select';
import { api } from '../../services/api';
import { DashboardStats, RevenueReport, SubscriptionReport, AttendanceReport } from '../../types';
import { formatCurrency, formatNumber } from '../../utils/helpers';
import { 
  Users, CreditCard, CheckCircle, AlertCircle, Clock, TrendingUp, 
  DollarSign, Calendar, BarChart, PieChart
} from 'lucide-react';
import { useState } from 'react';
import {
  LineChart, Line, AreaChart, Area, BarChart as RechartsBarChart, Bar,
  PieChart as RechartsPieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const dateRangeOptions = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'year', label: 'This Year' },
  { value: 'custom', label: 'Custom Range' },
];

const groupByOptions = [
  { value: 'day', label: 'Daily' },
  { value: 'week', label: 'Weekly' },
  { value: 'month', label: 'Monthly' },
];

export default function Reports() {
  const { t } = useTranslation();
  const [dateRange, setDateRange] = useState('month');
  const [groupBy, setGroupBy] = useState('day');

  const { data: dashboardData } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.get<{ success: boolean; data: DashboardStats }>('/reports/dashboard').then(r => r.data.data),
  });

  const { data: revenueData } = useQuery({
    queryKey: ['revenue-report', dateRange, groupBy],
    queryFn: () => api.get<{ success: boolean; data: RevenueReport }>('/reports/revenue', { params: { dateRange, groupBy } }).then(r => r.data.data),
  });

  const { data: subscriptionData } = useQuery({
    queryKey: ['subscription-report', dateRange],
    queryFn: () => api.get<{ success: boolean; data: SubscriptionReport }>('/reports/subscriptions', { params: { dateRange } }).then(r => r.data.data),
  });

  const { data: attendanceData } = useQuery({
    queryKey: ['attendance-report', dateRange, groupBy],
    queryFn: () => api.get<{ success: boolean; data: AttendanceReport }>('/reports/attendance', { params: { dateRange, groupBy } }).then(r => r.data.data),
  });

  const members = dashboardData?.members || { total: 0, active: 0, expired: 0, expiringSoon: 0 };
  const revenue = dashboardData?.revenue || { today: 0, thisWeek: 0, thisMonth: 0, thisYear: 0, byMethod: { cash: 0, electronic: 0 } };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('reports.title')}</h1>
          <p className="text-gray-500 dark:text-gray-400">{t('reports.dashboard')}</p>
        </div>
        <div className="flex items-center gap-4">
          <Select options={dateRangeOptions} value={dateRange} onChange={(e) => setDateRange(e.target.value)} className="w-40" />
          <Select options={groupByOptions} value={groupBy} onChange={(e) => setGroupBy(e.target.value)} className="w-40" />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('reports.totalMembers')}</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{formatNumber(members.total)}</p>
              </div>
              <div className="p-3 rounded-xl bg-blue-500"><Users className="h-6 w-6 text-white" /></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('reports.activeMembers')}</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{formatNumber(members.active)}</p>
              </div>
              <div className="p-3 rounded-xl bg-green-500"><CheckCircle className="h-6 w-6 text-white" /></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('reports.expiredMembers')}</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{formatNumber(members.expired)}</p>
              </div>
              <div className="p-3 rounded-xl bg-red-500"><AlertCircle className="h-6 w-6 text-white" /></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('reports.expiringSoonMembers')}</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{formatNumber(members.expiringSoon)}</p>
              </div>
              <div className="p-3 rounded-xl bg-yellow-500"><Clock className="h-6 w-6 text-white" /></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('reports.today')}</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{formatCurrency(revenue.today)}</p>
              </div>
              <div className="p-3 rounded-xl bg-green-500"><DollarSign className="h-6 w-6 text-white" /></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('reports.thisWeek')}</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{formatCurrency(revenue.thisWeek)}</p>
              </div>
              <div className="p-3 rounded-xl bg-blue-500"><TrendingUp className="h-6 w-6 text-white" /></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('reports.thisMonth')}</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{formatCurrency(revenue.thisMonth)}</p>
              </div>
              <div className="p-3 rounded-xl bg-purple-500"><CreditCard className="h-6 w-6 text-white" /></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('reports.thisYear')}</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{formatCurrency(revenue.thisYear)}</p>
              </div>
              <div className="p-3 rounded-xl bg-orange-500"><TrendingUp className="h-6 w-6 text-white" /></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><BarChart className="h-5 w-5" />{t('reports.revenue')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData?.byPeriod || []}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => formatCurrency(value)} />
                  <Tooltip formatter={(value: number) => [formatCurrency(value), 'Revenue']} />
                  <Area type="monotone" dataKey="total" stroke="#22c55e" fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Payment Method Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><PieChart className="h-5 w-5" />{t('reports.byPaymentMethod')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={[
                      { name: t('payments.cash'), value: revenue.byMethod.cash },
                      { name: t('payments.electronic'), value: revenue.byMethod.electronic },
                    ]}
                    cx="50%" cy="50%" innerRadius={60} outerRadius={100}
                    dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    <Cell fill="#22c55e" />
                    <Cell fill="#3b82f6" />
                  </Pie>
                  <Tooltip formatter={(value: number) => [formatCurrency(value), 'Amount']} />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Subscription Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><BarChart className="h-5 w-5" />{t('reports.byPlan')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart data={subscriptionData?.byPlan || []} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tickFormatter={(value) => formatCurrency(value)} />
                  <YAxis type="category" dataKey="plan_name" width={120} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value: number) => [formatCurrency(value), 'Revenue']} />
                  <Legend />
                  <Bar dataKey="revenue" fill="#22c55e" name={t('reports.revenue')} radius={[0, 4, 4, 0]} />
                  <Bar dataKey="count" fill="#3b82f6" name={t('reports.subscriptions')} radius={[0, 4, 4, 0]} />
                </RechartsBarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Attendance Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5" />{t('reports.attendance')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={attendanceData?.byPeriod || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value: number) => [value, 'Attendances']} />
                  <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} name="Attendances" />
                  <Line type="monotone" dataKey="unique_members" stroke="#a855f7" strokeWidth={2} dot={{ r: 4 }} name="Unique Members" />
                  <Legend />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Members & Top Plans */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" />{t('reports.topMembers')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {attendanceData?.topMembers?.map((member, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                      <span className="text-sm font-medium text-primary-700 dark:text-primary-300">{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{member.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{t('members.accountId')}: {member.account_id}</p>
                    </div>
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">{member.attendance_count}</span>
                </div>
              )) || <p className="text-gray-500 dark:text-gray-400 text-center py-4">No data</p>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5" />{t('reports.subscriptions')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {subscriptionData?.byPlan?.map((plan, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <span className="text-sm font-medium text-green-700 dark:text-green-300">{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{plan.plan_name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{plan.duration_months} months</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900 dark:text-gray-100">{plan.count} sales</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{formatCurrency(plan.revenue)}</p>
                  </div>
                </div>
              )) || <p className="text-gray-500 dark:text-gray-400 text-center py-4">No data</p>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

