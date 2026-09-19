import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { api } from '../../services/api';
import { Subscription, SubscriptionFilters } from '../../types';
import { formatDateShort, formatCurrency, getStatusLabel } from '../../utils/helpers';
import { Plus, Search, Eye, RotateCcw } from 'lucide-react';
import { useState, FormEvent } from 'react';

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'active', label: 'Active' },
  { value: 'expired', label: 'Expired' },
  { value: 'expiring_soon', label: 'Expiring Soon' },
];

export default function Subscriptions() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [filters, setFilters] = useState<SubscriptionFilters>({ page: 1, limit: 20 });
  const [search, setSearch] = useState('');

  const { data: subsData, isLoading } = useQuery({
    queryKey: ['subscriptions', filters],
    queryFn: () => api.get<{ success: boolean; data: Subscription[]; meta: any }>('/subscriptions', { params: filters }).then(r => r.data),
  });

  const columns = [
    { key: 'memberName', header: t('members.memberList') },
    { key: 'memberAccountId', header: t('members.accountId') },
    { key: 'planName', header: t('subscriptions.plan') },
    { key: 'startDate', header: t('subscriptions.startDate'), render: (item: Subscription) => formatDateShort(item.startDate) },
    { key: 'endDate', header: t('subscriptions.endDate'), render: (item: Subscription) => formatDateShort(item.endDate) },
    { key: 'status', header: t('common.status'), render: (item: Subscription) => <Badge variant="status" status={item.status}>{getStatusLabel(item.status, t)}</Badge> },
    { key: 'finalPrice', header: t('subscriptions.finalPrice'), render: (item: Subscription) => formatCurrency(item.finalPrice) },
    {
      key: 'actions',
      header: t('common.actions'),
      render: (item: Subscription) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/subscriptions/${item.id}`)} aria-label={t('common.view')}>
            <Eye className="h-4 w-4" />
          </Button>
          {item.status !== 'active' && (
            <Button variant="ghost" size="icon" onClick={() => navigate(`/subscriptions/${item.id}/renew`)} aria-label={t('subscriptions.renewSubscription')}>
              <RotateCcw className="h-4 w-4" />
            </Button>
          )}
        </div>
      )
    },
  ];

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    setFilters(prev => ({ ...prev, page: 1, search }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('subscriptions.title')}</h1>
          <p className="text-gray-500 dark:text-gray-400">{t('subscriptions.subscriptionList')}</p>
        </div>
        <Button onClick={() => navigate('/subscriptions/create')}>
          <Plus className="h-4 w-4 mr-2" />
          {t('subscriptions.createSubscription')}
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
            </div>
            <Select options={statusOptions} value={filters.status || ''} onChange={(e) => setFilters(prev => ({ ...prev, page: 1, status: e.target.value as any }))} className="w-full sm:w-48" />
          </form>

          <Table
            columns={columns}
            data={subsData?.data || []}
            keyExtractor={(item) => item.id}
            isLoading={isLoading}
            pagination={subsData?.meta ? { page: subsData.meta.page, totalPages: subsData.meta.totalPages, onPageChange: (page) => setFilters(prev => ({ ...prev, page })) } : undefined}
          />
        </CardContent>
      </Card>
    </div>
  );
}