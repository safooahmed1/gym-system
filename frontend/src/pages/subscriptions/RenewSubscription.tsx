import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../../components/ui/Card';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { api } from '../../services/api';
import { SubscriptionPlan } from '../../types';
import { ArrowLeft, Clock, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { formatDateShort, cn } from '../../utils/helpers';

const renewSchema = z.object({
  planId: z.number().min(1, 'Plan is required'),
  discountType: z.enum(['percentage', 'fixed']).optional(),
  discountValue: z.number().positive().optional(),
});

type RenewFormData = z.infer<typeof renewSchema>;

export default function RenewSubscription() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: plansData } = useQuery({ queryKey: ['plans-active'], queryFn: () => api.get('/plans', { params: { isActive: true } }).then(r => r.data.data) });
  const planOptions = plansData?.map((p: SubscriptionPlan) => ({ value: p.id, label: `${p.name} - ${p.price} EGP/${p.durationMonths}m` })) || [];

  const { register, handleSubmit, watch, formState: { errors } } = useForm<RenewFormData>({
    resolver: zodResolver(renewSchema),
    defaultValues: { discountType: undefined, discountValue: undefined },
  });

  const selectedPlanId = watch('planId');
  const selectedPlan = plansData?.find((p: SubscriptionPlan) => p.id === selectedPlanId);

  const onSubmit = async (data: RenewFormData) => {
    try {
      await api.post(`/subscriptions/${id}/renew`, data);
      toast.success(t('subscriptions.renewedSuccess'));
      navigate('/subscriptions');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => navigate('/subscriptions')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('common.back')}
        </Button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('subscriptions.renewSubscription')}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('subscriptions.renewSubscription')}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-xl">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg">
              <p className="font-medium">{t('subscriptions.renewDifferentPlan')}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{t('subscriptions.extendsCurrentEndDate')}</p>
            </div>

            <Select label={t('subscriptions.plan')} options={planOptions} placeholder={t('common.select')} error={errors.planId?.message} {...register('planId', { valueAsNumber: true })} />

            {selectedPlan && (
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg space-y-3">
                <h4 className="font-medium">{t('subscriptions.plan')} Details</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-gray-500 dark:text-gray-400">{t('subscriptions.price')}</span> <span className="font-semibold ml-2">{selectedPlan.price} EGP</span></div>
                  <div><span className="text-gray-500 dark:text-gray-400">{t('subscriptions.duration')}</span> <span className="font-semibold ml-2">{selectedPlan.durationMonths} {t('subscriptions.monthly')}</span></div>
                </div>
              </div>
            )}

            <Select label={t('subscriptions.discountType')} options={[
              { value: '', label: t('subscriptions.noDiscount') },
              { value: 'percentage', label: t('subscriptions.discountPercentage') },
              { value: 'fixed', label: t('subscriptions.discountFixed') },
            ]} placeholder={t('common.select')} {...register('discountType')} />

            {watch('discountType') && (
              <Input label={t('subscriptions.discountValue')} type="number" step="0.01" min="0" {...register('discountValue', { valueAsNumber: true })} />
            )}
          </form>
        </CardContent>
        <CardFooter className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => navigate('/subscriptions')}>{t('common.cancel')}</Button>
          <Button type="submit" form="renew-form">{t('subscriptions.renewSubscription')}</Button>
        </CardFooter>
      </Card>
    </div>
  );
}

// Need Input component
import { Input } from '../../components/ui/Input';