import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';
import { api } from '../../services/api';
import { SubscriptionPlan } from '../../types';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const planSchema = z.object({
  name: z.string().min(2, 'Plan name must be at least 2 characters'),
  durationMonths: z.number().int().positive('Duration must be positive'),
  price: z.number().positive('Price must be positive'),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

type PlanFormData = z.infer<typeof planSchema>;

function PlanForm({ onSubmit, editingPlan, isLoading, onClose }: { onSubmit: (data: PlanFormData) => void; editingPlan: SubscriptionPlan | null; isLoading: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<PlanFormData>({
    resolver: zodResolver(planSchema),
    defaultValues: { name: '', durationMonths: 1, price: 0, description: '', isActive: true },
  });

  if (editingPlan) {
    setValue('name', editingPlan.name);
    setValue('durationMonths', editingPlan.durationMonths);
    setValue('price', Number(editingPlan.price));
    setValue('description', editingPlan.description || '');
    setValue('isActive', editingPlan.isActive);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input label={t('plans.planName')} error={errors.name?.message} {...register('name')} />
      <div className="grid grid-cols-2 gap-4">
        <Input label={t('plans.durationMonths')} type="number" min="1" error={errors.durationMonths?.message} {...register('durationMonths', { valueAsNumber: true })} />
        <Input label={t('plans.price')} type="number" min="0" step="0.01" error={errors.price?.message} {...register('price', { valueAsNumber: true })} />
      </div>
      <Input label={t('plans.description')} {...register('description')} />
      <div className="flex items-center gap-2">
        <input type="checkbox" id="isActive" {...register('isActive')} className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
        <label htmlFor="isActive" className="text-sm font-medium text-gray-700 dark:text-gray-200">{t('plans.isActive')}</label>
      </div>
      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onClose}>{t('common.cancel')}</Button>
        <Button type="submit" loading={isLoading}>{editingPlan ? t('common.save') : t('plans.addPlan')}</Button>
      </div>
    </form>
  );
}

export default function Plans() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);

  const { data: plansData, isLoading } = useQuery({
    queryKey: ['plans'],
    queryFn: () => api.get<{ success: boolean; data: SubscriptionPlan[] }>('/plans', { params: { limit: 100 } }).then(r => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: PlanFormData) => api.post('/plans', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      toast.success(t('plans.createdSuccess'));
      setIsModalOpen(false);
      setEditingPlan(null);
    },
    onError: (error) => toast.error(error.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<PlanFormData> }) => api.patch(`/plans/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      toast.success(t('plans.updatedSuccess'));
      setIsModalOpen(false);
      setEditingPlan(null);
    },
    onError: (error) => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/plans/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      toast.success(t('plans.deletedSuccess'));
    },
    onError: (error) => toast.error(error.message),
  });

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPlan(null);
  };

  const handleSubmit = (data: PlanFormData) => {
    if (editingPlan) {
      updateMutation.mutate({ id: editingPlan.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const columns = [
    { key: 'name', header: t('plans.planName') },
    { key: 'durationMonths', header: t('plans.durationMonths'), render: (item: SubscriptionPlan) => `${item.durationMonths} ${t('subscriptions.monthly')}` },
    { key: 'price', header: t('plans.price'), render: (item: SubscriptionPlan) => `${item.price} EGP` },
    { key: 'isActive', header: t('common.status'), render: (item: SubscriptionPlan) => <Badge variant={item.isActive ? 'default' : 'outline'}>{item.isActive ? t('plans.isActive') : t('common.inactive')}</Badge> },
    {
      key: 'actions',
      header: t('common.actions'),
      render: (item: SubscriptionPlan) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => { setEditingPlan(item); setIsModalOpen(true); }} aria-label={t('common.edit')}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="text-red-600" onClick={() => { if (confirm(t('common.delete') + '?')) deleteMutation.mutate(item.id); }} aria-label={t('common.delete')}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('plans.title')}</h1>
          <p className="text-gray-500 dark:text-gray-400">{t('plans.addPlan')}</p>
        </div>
        <Button onClick={() => { setEditingPlan(null); setIsModalOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          {t('plans.addPlan')}
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table
            columns={columns}
            data={plansData || []}
            keyExtractor={(item) => item.id}
            isLoading={isLoading}
            emptyMessage="No plans found"
          />
        </CardContent>
      </Card>

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingPlan ? t('plans.editPlan') : t('plans.addPlan')} size="lg">
        <PlanForm onSubmit={handleSubmit} editingPlan={editingPlan} isLoading={createMutation.isPending || updateMutation.isPending} onClose={handleCloseModal} />
      </Modal>
    </div>
  );
}