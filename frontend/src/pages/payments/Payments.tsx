import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { api } from '../../services/api';
import { Payment, PaymentFilters } from '../../types';
import { formatDateShort, formatCurrency, getStatusLabel } from '../../utils/helpers';
import { Search, Filter, Eye, DollarSign } from 'lucide-react';
import { useState, FormEvent } from 'react';

const methodOptions = [
  { value: '', label: 'All Methods' },
  { value: 'cash', label: 'Cash' },
  { value: 'electronic', label: 'Electronic' },
];

export default function Payments() {
  const { t } = useTranslation();
  const [filters, setFilters] = useState<PaymentFilters>({ page: 1, limit: 20 });
  const [search, setSearch] = useState('');

  const { data: paymentsData, isLoading } = useQuery({
    queryKey: ['payments', filters],
    queryFn: () => api.get<{ success: boolean; data: Payment[]; meta: any }>('/payments', { params: filters }).then(r => r.data),
  });

  const columns = [
    { key: 'memberName', header: t('members.memberList') },
    { key: 'memberAccountId', header: t('members.accountId') },
    { key: 'amount', header: t('common.amount'), render: (item: Payment) => formatCurrency(item.amount) },
    { key: 'method', header: t('payments.method'), render: (item: Payment) => <Badge variant="status" status={item.method}>{t(`payments.${item.method}`)}</Badge> },
    { key: 'referenceNumber', header: t('payments.referenceNumber') },
    { key: 'createdAt', header: t('common.date'), render: (item: Payment) => formatDateShort(item.createdAt) },
  ];

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    setFilters(prev => ({ ...prev, page: 1, search }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('payments.title')}</h1>
        <p className="text-gray-500 dark:text-gray-400">{t('payments.paymentList')}</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
            </div>
            <Select options={methodOptions} value={filters.method || ''} onChange={(e) => setFilters(prev => ({ ...prev, page: 1, method: e.target.value as any }))} className="w-full sm:w-48" />
            <Input type="date" value={filters.dateFrom || ''} onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value || undefined }))} className="w-full sm:w-48" />
            <Input type="date" value={filters.dateTo || ''} onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value || undefined }))} className="w-full sm:w-48" />
          </form>

          <Table
            columns={columns}
            data={paymentsData?.data || []}
            keyExtractor={(item) => item.id}
            isLoading={isLoading}
            pagination={paymentsData?.meta ? { page: paymentsData.meta.page, totalPages: paymentsData.meta.totalPages, onPageChange: (page) => setFilters(prev => ({ ...prev, page })) } : undefined}
          />
        </CardContent>
      </Card>
    </div>
  );
}