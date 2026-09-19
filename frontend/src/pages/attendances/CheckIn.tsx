import { useTranslation } from 'react-i18next';
import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { api } from '../../services/api';
import { Member } from '../../types';
import { CheckCircle, XCircle, Loader2, User, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../../utils/helpers';

const checkInSchema = z.object({
  accountId: z.string().length(5, 'Account ID must be 5 digits').regex(/^\d{5}$/, 'Account ID must be 5 digits'),
});

type CheckInFormData = z.infer<typeof checkInSchema>;

export default function CheckIn() {
  const { t } = useTranslation();
  const [lastResult, setLastResult] = useState<{ success: boolean; member?: Member; message: string; alreadyCheckedIn?: boolean } | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [inputEl, setInputEl] = useState<HTMLInputElement | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CheckInFormData>({
    resolver: zodResolver(checkInSchema),
  });

  // Get the ref from react-hook-form and combine with our local ref
  const { ref: registerRef, ...registerRest } = register('accountId');
  const inputRef = useCallback((el: HTMLInputElement | null) => {
    setInputEl(el);
    registerRef(el);
  }, [registerRef]);

  // Auto-focus input on mount and after each check-in
  useEffect(() => {
    inputEl?.focus();
  }, [lastResult]);

  const onSubmit = async (data: CheckInFormData) => {
    setIsChecking(true);
    setLastResult(null);
    try {
      const response = await api.post('/attendances/check-in', data);
      if (response.data.success) {
        const result = response.data.data;
        setLastResult({ success: true, member: result.member, message: t('attendances.checkInSuccess'), alreadyCheckedIn: result.alreadyCheckedIn });
        if (!result.alreadyCheckedIn) toast.success(t('attendances.checkInSuccess'));
        else toast.info(t('attendances.alreadyCheckedIn'));
        reset();
      }
    } catch (error: any) {
      let message = error.message;
      if (error.response?.data?.error?.code === 'FORBIDDEN') {
        message = t('attendances.subscriptionExpired');
      } else if (error.response?.data?.error?.code === 'NOT_FOUND') {
        message = t('attendances.memberNotFound');
      }
      setLastResult({ success: false, message });
      toast.error(message);
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{t('attendances.checkIn')}</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">{t('attendances.enterAccountId')}</p>
      </div>

      <Card>
        <CardHeader className="border-b border-gray-200 dark:border-gray-700">
          <CardTitle className="flex items-center justify-center gap-2 text-2xl">
            <User className="h-8 w-8 text-primary-600" />
            {t('attendances.accountId')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="relative">
              <Input
                ref={inputRef}
                {...registerRest}
                label={t('attendances.accountId')}
                placeholder="12345"
                type="text"
                inputMode="numeric"
                maxLength={5}
                error={errors.accountId?.message}
                disabled={isChecking}
                className="text-center text-2xl tracking-widest"
                autoComplete="off"
              />
            </div>
            <Button type="submit" className="w-full text-lg py-4" loading={isChecking} size="lg">
              {isChecking ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  {t('common.loading')}
                </>
              ) : (
                t('attendances.checkIn')
              )}
            </Button>
          </form>

          {lastResult && (
            <div className={cn(
              'p-6 rounded-xl border-2 transition-all',
              lastResult.success ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
            )}>
              {lastResult.success ? (
                <>
                  <div className="flex items-center justify-center gap-3 mb-4">
                    <div className={cn('p-3 rounded-full', lastResult.alreadyCheckedIn ? 'bg-yellow-100 dark:bg-yellow-900/30' : 'bg-green-100 dark:bg-green-900/30')}>
                      {lastResult.alreadyCheckedIn ? (
                        <AlertTriangle className="h-8 w-8 text-yellow-600" />
                      ) : (
                        <CheckCircle className="h-8 w-8 text-green-600" />
                      )}
                    </div>
                  </div>
                  {lastResult.member && (
                    <div className="text-center space-y-3">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">{lastResult.member.name}</h3>
                      <p className="text-gray-500 dark:text-gray-400">{t('members.accountId')}: <span className="font-mono font-semibold">{lastResult.member.accountId}</span></p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {lastResult.alreadyCheckedIn ? t('attendances.alreadyCheckedIn') : t('attendances.checkInSuccess')}
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center justify-center gap-3 text-center">
                  <XCircle className="h-8 w-8 text-red-600" />
                  <p className="text-lg font-medium text-red-800 dark:text-red-200">{lastResult.message}</p>
                </div>
              )}
            </div>
          )}

          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
              {t('attendances.accountId')} - {t('attendances.enterAccountId')}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}