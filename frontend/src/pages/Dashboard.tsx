import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { api, type DashboardStats } from '../services/api';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { 
  Users, 
  CreditCard, 
  CheckCircle, 
  AlertCircle, 
  TrendingUp,
  DollarSign,
  Clock
} from 'lucide-react';
import { formatCurrency, formatNumber, cn } from '../utils/helpers';

const statCards = [
  { key: 'total', label: 'reports.totalMembers', icon: Users, color: 'bg-blue-500', darkColor: 'dark:bg-blue-500' },
  { key: 'active', label: 'reports.activeMembers', icon: CheckCircle, color: 'bg-green-500', darkColor: 'dark:bg-green-500' },
  { key: 'expired', label: 'reports.expiredMembers', icon: AlertCircle, color: 'bg-red-500', darkColor: 'dark:bg-red-500' },
  { key: 'expiringSoon', label: 'reports.expiringSoonMembers', icon: Clock, color: 'bg-yellow-500', darkColor: 'dark:bg-yellow-500' },
];

const revenueCards = [
  { key: 'today', label: 'reports.today', icon: DollarSign, color: 'bg-green-500' },
  { key: 'thisWeek', label: 'reports.thisWeek', icon: TrendingUp, color: 'bg-blue-500' },
  { key: 'thisMonth', label: 'reports.thisMonth', icon: CreditCard, color: 'bg-purple-500' },
  { key: 'thisYear', label: 'reports.thisYear', icon: TrendingUp, color: 'bg-orange-500' },
];

export default function Dashboard() {
  const { t } = useTranslation();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.get<{ success: boolean; data: DashboardStats }>('/reports/dashboard').then(res => res.data.data),
    refetchInterval: 60000, // Refresh every minute
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="pt-6">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-2" />
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="pt-6">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-2" />
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const members = stats?.members || { total: 0, active: 0, expired: 0, expiringSoon: 0 };
  const revenue = stats?.revenue || { today: 0, thisWeek: 0, thisMonth: 0, thisYear: 0, byMethod: { cash: 0, electronic: 0 } };
  const attendances = stats?.attendances || { today: 0 };
  const topPlans = stats?.topPlans || [];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('navigation.dashboard')}</h1>
          <p className="text-gray-500 dark:text-gray-400">{t('reports.dashboard')}</p>
        </div>
      </div>

      {/* Member Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.key}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t(stat.label)}</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                    {formatNumber(stat.key === 'total' ? members.total : 
                      stat.key === 'active' ? members.active :
                      stat.key === 'expired' ? members.expired : members.expiringSoon)}
                  </p>
                </div>
                <div className={cn('p-3 rounded-xl', stat.color, stat.darkColor)}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Revenue Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {revenueCards.map((stat) => {
          let value = 0;
          if (stat.key === 'today') value = revenue.today;
          else if (stat.key === 'thisWeek') value = revenue.thisWeek;
          else if (stat.key === 'thisMonth') value = revenue.thisMonth;
          else if (stat.key === 'thisYear') value = revenue.thisYear;
          
          return (
            <Card key={stat.key}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t(stat.label)}</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                      {formatCurrency(value)}
                    </p>
                  </div>
                  <div className={cn('p-3 rounded-xl', stat.color)}>
                    <stat.icon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Additional Stats & Top Plans */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Today's Attendance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-primary-600" />
              {t('attendances.todayCount')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-gray-900 dark:text-gray-100">
              {formatNumber(attendances.today)}
            </p>
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary-600" />
              {t('reports.byPaymentMethod')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-300">{t('payments.cash')}</span>
                <span className="font-semibold">{formatCurrency(revenue.byMethod.cash)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-300">{t('payments.electronic')}</span>
                <span className="font-semibold">{formatCurrency(revenue.byMethod.electronic)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Selling Plans */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary-600" />
              {t('reports.topMembers')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topPlans.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">{t('common.loading')}</p>
              ) : (
                topPlans.map((plan, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                        <span className="text-sm font-medium text-primary-700 dark:text-primary-300">
                          {index + 1}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{plan.plan_name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{plan.duration_months} months</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900 dark:text-gray-100">{plan.sales_count} sales</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{formatCurrency(plan.total_revenue)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}