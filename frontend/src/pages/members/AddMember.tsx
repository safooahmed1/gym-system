import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { api } from '../../services/api';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';

const memberSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().min(10, 'Phone is required'),
  nationalId: z.string().length(14, 'National ID must be 14 digits'),
});

type MemberFormData = z.infer<typeof memberSchema>;

export default function AddMember() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors } } = useForm<MemberFormData>({
    resolver: zodResolver(memberSchema),
  });

  const onSubmit = async (data: MemberFormData) => {
    try {
      await api.post('/members', data);
      toast.success(t('members.createdSuccess'));
      navigate('/members');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => navigate('/members')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('common.back')}
        </Button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('members.addMember')}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('members.addMember')}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-md">
            <Input label={t('common.name')} error={errors.name?.message} {...register('name')} autoFocus />
            <Input label={t('common.phone')} type="tel" error={errors.phone?.message} {...register('phone')} />
            <Input label={t('members.nationalId')} error={errors.nationalId?.message} {...register('nationalId')} />
          </form>
        </CardContent>
        <CardFooter className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => navigate('/members')}>{t('common.cancel')}</Button>
          <Button type="submit" form="member-form">{t('common.save')}</Button>
        </CardFooter>
      </Card>
    </div>
  );
}