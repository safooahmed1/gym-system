import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { toast } from 'sonner';
import { Save, Sun, Globe } from 'lucide-react';

const settingsSchema = z.object({
  language: z.enum(['ar', 'en']),
  theme: z.enum(['light', 'dark', 'system']),
});

type SettingsFormData = z.infer<typeof settingsSchema>;

const applyTheme = (themeValue: string) => {
  const root = document.documentElement;
  if (themeValue === 'dark' || (themeValue === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
};

export default function Settings() {
  const { t, i18n } = useTranslation();

  const { register, handleSubmit, formState: { errors } } = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: { language: i18n.language as 'ar' | 'en', theme: 'system' },
  });

  const onSubmit = (data: SettingsFormData) => {
    i18n.changeLanguage(data.language);
    localStorage.setItem('theme', data.theme);
    applyTheme(data.theme);
    toast.success(t('settings.saveSuccess'));
  };

  // Load saved theme on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'system' || 'system';
    applyTheme(savedTheme);
  }, []);

  const languageOptions = [
    { value: 'ar', label: t('settings.arabic') },
    { value: 'en', label: t('settings.english') },
  ];

  const themeOptions = [
    { value: 'light', label: t('settings.light') },
    { value: 'dark', label: t('settings.dark') },
    { value: 'system', label: t('settings.system') },
  ];

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('settings.title')}</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Globe className="h-5 w-5" />{t('settings.language')}</CardTitle>
          <CardDescription>{t('settings.language')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Select
            label={t('settings.language')}
            options={languageOptions}
            error={errors.language?.message}
            {...register('language')}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Sun className="h-5 w-5" />{t('settings.theme')}</CardTitle>
          <CardDescription>{t('settings.theme')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Select
            label={t('settings.theme')}
            options={themeOptions}
            error={errors.theme?.message}
            {...register('theme')}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Save className="h-5 w-5" />{t('common.save')}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="flex justify-end">
              <Button type="submit" className="w-full sm:w-auto">
                <Save className="h-4 w-4 mr-2" />
                {t('common.save')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}