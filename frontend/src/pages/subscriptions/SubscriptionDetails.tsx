import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Table } from '../../components/ui/Table';
import { api } from '../../services/api';
import { Subscription, Payment } from '../../types';
import { formatDateShort, formatCurrency, getStatusLabel, cn } from '../../utils/helpers';
import { ArrowLeft, CreditCard, DollarSign, RotateCcw } from 'lucide-react';

export default function SubscriptionDetails() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: subData, isLoading } = useQuery({
    queryKey: ['subscription', id],
    queryFn: () => api.get<{ success: boolean; data: Subscription & { payments: Payment[] } }>(`/subscriptions/${id}`).then(r => r.data),
    enabled: !!id,
  });

  if (isLoading) return <div className="animate-pulse space-y-4"><div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4" /><div className="h-64 bg-gray-200 dark:bg-gray-700 rounded" /></div>;

  const sub = subData?.data;
  if (!sub) return <div className="text-center py-12">Subscription not found</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => navigate('/subscriptions')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('common.back')}
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('subscriptions.subscriptionDetails')}</h1>
          <p className="text-gray-500 dark:text-gray-400">ID: {sub.id}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('subscriptions.plan')}</CardTitle></CardHeader>
          <CardContent><p className="text-xl font-semibold">{sub.planName || sub.planName}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('subscriptions.startDate')}</CardTitle></CardHeader>
          <CardContent><p className="text-xl font-semibold">{formatDateShort(sub.startDate)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('subscriptions.endDate')}</CardTitle></CardHeader>
          <CardContent><p className={cn('text-xl font-semibold', sub.status === 'expired' ? 'text-red-600' : sub.status === 'expiring_soon' ? 'text-yellow-600' : 'text-green-600')}>{formatDateShort(sub.endDate)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('common.status')}</CardTitle></CardHeader>
          <CardContent><Badge variant="status" status={sub.status} className="text-lg">{getStatusLabel(sub.status, t)}</Badge></CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5" />{t('subscriptions.subscriptionDetails')}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">{t('subscriptions.finalPrice')}</span><span className="font-semibold">{formatCurrency(sub.finalPrice)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">{t('subscriptions.discountType')}</span><span>{sub.discountType ? t(`subscriptions.discount${sub.discountType.charAt(0).toUpperCase() + sub.discountType.slice(1)}`) : t('subscriptions.noDiscount')}</span></div>
            <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">{t('subscriptions.discountValue')}</span><span>{sub.discountValue || '-'}</span></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><DollarSign className="h-5 w-5" />{t('payments.paymentList')}</CardTitle></CardHeader>
          <CardContent>
            <Table columns={[
              { key: 'createdAt', header: t('common.date'), render: (item: Payment) => formatDateShort(item.createdAt) },
              { key: 'amount', header: t('common.amount'), render: (item: Payment) => formatCurrency(item.amount) },
              { key: 'method', header: t('payments.method'), render: (item: Payment) => <Badge variant="status" status={item.method}>{t(`payments.${item.method}`)}</Badge> },
            ]} data={sub.payments || []} keyExtractor={(item) => item.id} emptyMessage="No payments" />
          </CardContent>
        </Card>
      </div>

      {sub.status !== 'active' && (
        <div className="text-center">
          <Button onClick={() => navigate(`/subscriptions/${id}/renew`)} size="lg">
            <RotateCcw className="h-4 w-4 mr-2" />
            {t('subscriptions.renewSubscription')}
          </Button>
        </div>
      )}
    </div>
  );
}