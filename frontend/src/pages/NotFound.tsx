import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Home, Search, AlertCircle } from 'lucide-react';

export default function NotFound() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="text-center space-y-8">
        <div className="mx-auto w-24 h-24 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
          <AlertCircle className="h-12 w-12 text-red-600 dark:text-red-400" />
        </div>
        <div>
          <h1 className="text-6xl font-bold text-gray-900 dark:text-gray-100">404</h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mt-2">{t('errors.notFound')}</p>
        </div>
        <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/dashboard">
            <Button variant="primary">
              <Home className="h-4 w-4 mr-2" />
              {t('navigation.dashboard')}
            </Button>
          </Link>
          <Link to="/members">
            <Button variant="outline">
              <Search className="h-4 w-4 mr-2" />
              {t('navigation.members')}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}