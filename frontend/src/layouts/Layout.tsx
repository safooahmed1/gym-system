import { Outlet, NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Coins,
  CheckCircle,
  BarChart,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Package,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '../utils/helpers';
import i18n from '../i18n';

const navigation = [
  { name: 'navigation.dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'navigation.members', href: '/members', icon: Users },
  { name: 'navigation.subscriptions', href: '/subscriptions', icon: CreditCard },
  { name: 'navigation.payments', href: '/payments', icon: Coins },
  { name: 'navigation.attendances', href: '/attendances', icon: CheckCircle },
  { name: 'navigation.reports', href: '/reports', icon: BarChart, roles: ['admin'] },
  { name: 'navigation.plans', href: '/plans', icon: Package, roles: ['admin'] },
  { name: 'navigation.settings', href: '/settings', icon: Settings, roles: ['admin'] },
];

export default function Layout() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const filteredNavigation = navigation.filter(item => 
    !item.roles || (user && item.roles.includes(user.role))
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700',
          'transform transition-transform duration-300 ease-in-out lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        aria-label="Sidebar"
      >
        <div className="flex h-16 items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-xl font-bold text-primary-600 dark:text-primary-400">
            {t('common.appName')}
          </h1>
          <button
            className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto" aria-label="Main navigation">
          {filteredNavigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                )
              }
              onClick={() => setSidebarOpen(false)}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
              <span>{t(item.name)}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={logout}
            className={cn(
              'flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium',
              'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
            )}
          >
            <LogOut className="h-5 w-5" aria-hidden="true" />
            <span>{t('navigation.logout')}</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top header */}
        <header className="sticky top-0 z-30 h-16 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
          <div className="flex h-full items-center justify-between px-4 lg:px-6">
            <button
              className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open sidebar"
              aria-expanded={sidebarOpen}
            >
              <Menu className="h-6 w-6" />
            </button>

            <div className="flex-1 lg:flex-none" />

            <div className="flex items-center gap-4">
              {/* Language Switcher */}
              <div className="relative">
                <select
                  value={i18n.language}
                  onChange={(e) => i18n.changeLanguage(e.target.value)}
                  className="appearance-none bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm text-gray-700 dark:text-gray-200 pr-8 cursor-pointer"
                  aria-label="Select language"
                >
                  <option value="ar">{t('settings.arabic')}</option>
                  <option value="en">{t('settings.english')}</option>
                </select>
              </div>

              {/* User Menu */}
              <div className="relative">
                <button
                  className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  aria-expanded={userMenuOpen}
                  aria-haspopup="true"
                >
                  <div className="h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                    <span className="text-sm font-medium text-primary-700 dark:text-primary-300">
                      {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                  <span className="hidden sm:block text-sm font-medium text-gray-700 dark:text-gray-200">
                    {user?.name}
                  </span>
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                </button>

                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
                      <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{user?.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user?.role}</p>
                      </div>
                      <button
                        onClick={logout}
                        className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <LogOut className="h-4 w-4" />
                        {t('navigation.logout')}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-6" id="main-content" role="main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}