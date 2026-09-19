import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';
import { Toaster } from 'sonner';
import { useAuth } from './contexts/AuthContext';
import Layout from './layouts/Layout';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Dashboard from './pages/Dashboard';
import Members from './pages/members/Members';
import MemberDetails from './pages/members/MemberDetails';
import AddMember from './pages/members/AddMember';
import Subscriptions from './pages/subscriptions/Subscriptions';
import SubscriptionDetails from './pages/subscriptions/SubscriptionDetails';
import CreateSubscription from './pages/subscriptions/CreateSubscription';
import RenewSubscription from './pages/subscriptions/RenewSubscription';
import Payments from './pages/payments/Payments';
import Attendances from './pages/attendances/Attendances';
import CheckIn from './pages/attendances/CheckIn';
import Reports from './pages/reports/Reports';
import Plans from './pages/plans/Plans';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: ('admin' | 'reception')[] }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
      </div>
    );
  }
  
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
}

function AppRoutes() {
  const { i18n } = useTranslation();
  const { refreshUser } = useAuth();

  useEffect(() => {
    const handleLanguageChange = () => {
      refreshUser();
    };
    
    i18n.on('languageChanged', handleLanguageChange);
    return () => i18n.off('languageChanged', handleLanguageChange);
  }, [i18n, refreshUser]);

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={
        <PublicRoute>
          <Login />
        </PublicRoute>
      } />
      <Route path="/register" element={
        <PublicRoute>
          <Register />
        </PublicRoute>
      } />
      
      {/* Protected Routes */}
      <Route element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/members" element={<Members />} />
        <Route path="/members/add" element={<AddMember />} />
        <Route path="/members/:id" element={<MemberDetails />} />
        <Route path="/subscriptions" element={<Subscriptions />} />
        <Route path="/subscriptions/create" element={<CreateSubscription />} />
        <Route path="/subscriptions/:id" element={<SubscriptionDetails />} />
        <Route path="/subscriptions/:id/renew" element={<RenewSubscription />} />
        <Route path="/payments" element={<Payments />} />
        <Route path="/attendances" element={<Attendances />} />
        <Route path="/check-in" element={<CheckIn />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/plans" element={<Plans />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
      
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
      <Toaster position="top-right" />
    </BrowserRouter>
  );
}

export default App;