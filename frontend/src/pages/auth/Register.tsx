import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/Card';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
  role: z.enum(['admin', 'reception']),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

const roleOptions = [
  { value: 'admin', label: 'Admin' },
  { value: 'reception', label: 'Reception' },
];

export default function Register() {
  const { t } = useTranslation();
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'reception',
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    const success = await registerUser({
      name: data.name,
      email: data.email,
      password: data.password,
      role: data.role,
    });
    if (success) {
      navigate('/dashboard');
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{t('auth.register')}</CardTitle>
          <CardDescription>{t('common.appName')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label={t('auth.name')}
              type="text"
              placeholder="John Doe"
              error={errors.name?.message}
              {...register('name')}
              autoComplete="name"
            />
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
              autoComplete="new-password"
            />
            <Input
              label={t('auth.confirmPassword')}
              type="password"
              placeholder="••••••••"
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
              autoComplete="new-password"
            />
            <Select
              label={t('auth.role')}
              options={roleOptions}
              placeholder={t('common.select')}
              error={errors.role?.message}
              {...register('role')}
            />
            <Button type="submit" className="w-full" loading={isLoading}>
              {t('auth.register')}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
            Already have an account? <a href="/login" className="text-primary-600 hover:underline">{t('auth.login')}</a>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}