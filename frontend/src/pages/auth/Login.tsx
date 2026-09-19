import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/Card';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function Login() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    const success = await login(data);
    if (success) {
      navigate('/dashboard');
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{t('auth.login')}</CardTitle>
          <CardDescription>{t('common.appName')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label={t('auth.email')}
              type="email"
              placeholder="admin@gym.com"
              error={errors.email?.message}
              {...register('email')}
              autoComplete="email"
            />
            <Input
              label={t('auth.password')}
              type="password"
              placeholder="••••••••"
              error={errors.password?.message}
              {...register('password')}
              autoComplete="current-password"
            />
            <Button type="submit" className="w-full" loading={isLoading}>
              {t('auth.login')}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
            {t('auth.forgotPassword')}
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}