import { useTranslation } from 'react-i18next';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Table } from '../../components/ui/Table';
import { api } from '../../services/api';
import { Member, Subscription, Payment, Attendance } from '../../types';
import { formatDateShort, formatCurrency, getStatusLabel, cn } from '../../utils/helpers';
import { ArrowLeft, CreditCard, DollarSign, CheckCircle, Clock, AlertCircle } from 'lucide-react';

export default function MemberDetails() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: memberData, isLoading } = useQuery({
    queryKey: ['member', id],
    queryFn: () => api.get<{ success: boolean; data: Member & { subscriptions: Subscription[]; payments: Payment[]; attendances: Attendance[] } }>(`/members/${id}`).then(r => r.data),
    enabled: !!id,
  });

  if (isLoading) return <div className="animate-pulse space-y-4"><div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4" /><div className="h-64 bg-gray-200 dark:bg-gray-700 rounded" /></div>;

  const member = memberData?.data;
  if (!member) return <div className="text-center py-12">Member not found</div>;

  const currentSubscription = member.subscriptions?.[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => navigate('/members')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('common.back')}
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{member.name}</h1>
          <p className="text-gray-500 dark:text-gray-400">{t('members.accountId')}: {member.accountId}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('common.phone')}</CardTitle>
          </CardHeader>
          <CardContent><p className="text-xl font-semibold">{member.phone}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('members.nationalId')}</CardTitle>
          </CardHeader>
          <CardContent><p className="text-xl font-semibold">{member.nationalId}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('common.status')}</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="status" status={member.status} className="text-lg px-3 py-1">
              {getStatusLabel(member.status, t)}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {currentSubscription && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              {t('members.currentSubscription')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('subscriptions.plan')}</p>
                <p className="font-semibold">{currentSubscription.planName || 'Plan'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('subscriptions.startDate')}</p>
                <p className="font-semibold">{formatDateShort(currentSubscription.startDate)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('subscriptions.endDate')}</p>
                <p className={cn('font-semibold', currentSubscription.status === 'expired' ? 'text-red-600' : currentSubscription.status === 'expiring_soon' ? 'text-yellow-600' : 'text-green-600')}>
                  {formatDateShort(currentSubscription.endDate)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('subscriptions.finalPrice')}</p>
                <p className="font-semibold">{formatCurrency(currentSubscription.finalPrice)}</p>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Badge variant="status" status={currentSubscription.status}>
                {getStatusLabel(currentSubscription.status, t)}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              {t('members.subscriptionHistory')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table
              columns={[
                { key: 'planName', header: t('subscriptions.plan') },
                { key: 'startDate', header: t('subscriptions.startDate'), render: (item: Subscription) => formatDateShort(item.startDate) },
                { key: 'endDate', header: t('subscriptions.endDate'), render: (item: Subscription) => formatDateShort(item.endDate) },
                { key: 'status', header: t('common.status'), render: (item: Subscription) => <Badge variant="status" status={item.status}>{getStatusLabel(item.status, t)}</Badge> },
                { key: 'finalPrice', header: t('subscriptions.finalPrice'), render: (item: Subscription) => formatCurrency(item.finalPrice) },
              ]}
              data={member.subscriptions || []}
              keyExtractor={(item) => item.id}
              emptyMessage="No subscriptions"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              {t('members.paymentHistory')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table
              columns={[
                { key: 'createdAt', header: t('common.date'), render: (item: Payment) => formatDateShort(item.createdAt) },
                { key: 'amount', header: t('common.amount'), render: (item: Payment) => formatCurrency(item.amount) },
                { key: 'method', header: t('payments.method'), render: (item: Payment) => <Badge variant="status" status={item.method}>{t(`payments.${item.method}`)}</Badge> },
                { key: 'referenceNumber', header: t('payments.referenceNumber') },
              ]}
              data={member.payments || []}
              keyExtractor={(item) => item.id}
              emptyMessage="No payments"
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            {t('members.attendanceHistory')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table
            columns={[
              { key: 'checkInAt', header: t('common.date'), render: (item: Attendance) => formatDateShort(item.checkInAt) },
            ]}
            data={member.attendances || []}
            keyExtractor={(item) => item.id}
            emptyMessage="No attendances"
          />
        </CardContent>
      </Card>
    </div>
  );
}