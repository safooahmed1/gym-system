import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { AuthState, User, LoginCredentials, RegisterData } from '../types';
import { api, handleApiError } from '../services/api';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<boolean>;
  register: (data: RegisterData) => Promise<boolean>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const [state, setState] = useState<AuthState>({
    user: null,
    accessToken: localStorage.getItem('accessToken'),
    refreshToken: localStorage.getItem('refreshToken'),
    isAuthenticated: false,
    isLoading: true,
  });

  const refreshUser = useCallback(async () => {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
      setState(prev => ({ ...prev, isLoading: false, isAuthenticated: false }));
      return;
    }

    try {
      const response = await api.get<{ success: boolean; data: User }>('/auth/me');
      if (response.data.success && response.data.data) {
        setState(prev => ({
          ...prev,
          user: response.data.data!,
          isAuthenticated: true,
          isLoading: false,
        }));
      } else {
        throw new Error('Invalid response');
      }
    } catch {
      // Token invalid, clear auth
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setState(prev => ({
        ...prev,
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
      }));
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    try {
      const response = await api.post<{ success: boolean; data: { user: User; accessToken: string } }>(
        '/auth/login',
        credentials
      );

      if (response.data.success && response.data.data) {
        const { user, accessToken } = response.data.data;
        // Refresh token is set via HttpOnly cookie
        localStorage.setItem('accessToken', accessToken);
        
        setState(prev => ({
          ...prev,
          user,
          accessToken,
          isAuthenticated: true,
          isLoading: false,
        }));

        toast.success(t('auth.loginSuccess'));
        return true;
      }
      return false;
    } catch (error) {
      toast.error(handleApiError(error));
      return false;
    }
  };

  const register = async (data: RegisterData): Promise<boolean> => {
    try {
      const response = await api.post<{ success: boolean; data: { user: User; accessToken: string } }>(
        '/auth/register',
        data
      );

      if (response.data.success && response.data.data) {
        const { user, accessToken } = response.data.data;
        localStorage.setItem('accessToken', accessToken);
        
        setState(prev => ({
          ...prev,
          user,
          accessToken,
          isAuthenticated: true,
          isLoading: false,
        }));

        toast.success(t('auth.registerSuccess'));
        return true;
      }
      return false;
    } catch (error) {
      toast.error(handleApiError(error));
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    
    // Call logout endpoint to clear refresh token cookie
    api.post('/auth/logout').catch(() => {});
    
    setState(prev => ({
      ...prev,
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
    }));

    toast.success(t('auth.logoutSuccess'));
  };

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}