import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../../services/api';
import { Member, MemberFilters, MemberStatus } from '../../types';
import { formatDateShort, getStatusLabel, cn } from '../../utils/helpers';
import { Plus, Search, Filter, Edit, Trash2, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const memberSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().min(10, 'Phone is required'),
  nationalId: z.string().length(14, 'National ID must be 14 digits'),
});

type MemberFormData = z.infer<typeof memberSchema>;

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'expired', label: 'Expired' },
  { value: 'expiring_soon', label: 'Expiring Soon' },
];

export default function Members() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [filters, setFilters] = useState<MemberFilters>({ page: 1, limit: 20 });
  const [search, setSearch] = useState('');

  const { data: membersData, isLoading } = useQuery({
    queryKey: ['members', filters],
    queryFn: () => api.get<{ success: boolean; data: Member[]; meta: any }>('/members', { params: filters }).then(r => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: MemberFormData) => api.post('/members', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      toast.success(t('members.createdSuccess'));
      setIsAddModalOpen(false);
    },
    onError: (error) => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/members/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      toast.success(t('members.deletedSuccess'));
    },
    onError: (error) => toast.error(error.message),
  });

  const columns = [
    { key: 'accountId', header: t('members.accountId') },
    { key: 'name', header: t('common.name') },
    { key: 'phone', header: t('common.phone') },
    { key: 'nationalId', header: t('members.nationalId') },
    { 
      key: 'status', 
      header: t('common.status'),
      render: (item: Member) => <Badge variant="status" status={item.status}>{getStatusLabel(item.status, t)}</Badge>
    },
    { 
      key: 'createdAt', 
      header: t('common.date'),
      render: (item: Member) => formatDateShort(item.createdAt)
    },
    {
      key: 'actions',
      header: t('common.actions'),
      render: (item: Member) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/members/${item.id}`)} aria-label={t('common.view')}>
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => navigate(`/members/${item.id}/edit`)} aria-label={t('common.edit')}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="text-red-600" onClick={() => {
            if (confirm(t('members.deleteConfirm'))) deleteMutation.mutate(item.id);
          }} aria-label={t('common.delete')}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters(prev => ({ ...prev, page: 1, search }));
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, page: 1, [key]: value || undefined }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('members.title')}</h1>
          <p className="text-gray-500 dark:text-gray-400">{t('members.memberList')}</p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          {t('members.addMember')}
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder={t('members.searchPlaceholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              options={statusOptions}
              value={filters.status || ''}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full sm:w-48"
            />
          </form>

          <Table
            columns={columns}
            data={membersData?.data || []}
            keyExtractor={(item) => item.id}
            isLoading={isLoading}
            emptyMessage={t('common.loading')}
            pagination={membersData?.meta ? {
              page: membersData.meta.page,
              totalPages: membersData.meta.totalPages,
              onPageChange: (page) => setFilters(prev => ({ ...prev, page })),
            } : undefined}
          />
        </CardContent>
      </Card>

      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title={t('members.addMember')} size="lg">
        <AddMemberForm onSubmit={createMutation.mutate} onClose={() => setIsAddModalOpen(false)} isLoading={createMutation.isPending} />
      </Modal>
    </div>
  );
}

function AddMemberForm({ onSubmit, onClose, isLoading }: { onSubmit: (data: MemberFormData) => void; onClose: () => void; isLoading: boolean }) {
  const { t } = useTranslation();
  const { register, handleSubmit, formState: { errors } } = useForm<MemberFormData>({
    resolver: zodResolver(memberSchema),
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input label={t('common.name')} error={errors.name?.message} {...register('name')} />
      <Input label={t('common.phone')} type="tel" error={errors.phone?.message} {...register('phone')} />
      <Input label={t('members.nationalId')} error={errors.nationalId?.message} {...register('nationalId')} />
      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onClose}>{t('common.cancel')}</Button>
        <Button type="submit" loading={isLoading}>{t('common.save')}</Button>
      </div>
    </form>
  );
}