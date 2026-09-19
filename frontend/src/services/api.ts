import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const accessToken = localStorage.getItem('accessToken');
    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) throw new Error('No refresh token');
        
        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken,
        }, { withCredentials: true });
        
        const { accessToken } = response.data.data;
        localStorage.setItem('accessToken', accessToken);
        
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }
        
        return api(originalRequest);
      } catch {
        // Refresh failed, clear auth and redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(error);
      }
    }
    
    return Promise.reject(error);
  }
);

// Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Dashboard & Reports Types
export interface DashboardStats {
  members: {
    total: number;
    active: number;
    expired: number;
    expiringSoon: number;
  };
  revenue: {
    today: number;
    thisWeek: number;
    thisMonth: number;
    thisYear: number;
    byMethod: {
      cash: number;
      electronic: number;
    };
  };
  attendances: {
    today: number;
  };
  topPlans: Array<{
    plan_name: string;
    duration_months: number;
    sales_count: number;
    total_revenue: number;
  }>;
}

export interface RevenueReport {
  byPeriod: Array<{
    period: string;
    total: number;
    transactions: number;
  }>;
  byMethod: Array<{
    method: string;
    total: number;
    transactions: number;
  }>;
}

export interface SubscriptionReport {
  byPlan: Array<{
    plan_name: string;
    duration_months: number;
    count: number;
    revenue: number;
  }>;
  byStatus: Array<{
    status: string;
    count: number;
  }>;
}

export interface AttendanceReport {
  byPeriod: Array<{
    period: string;
    count: number;
    unique_members: number;
  }>;
  topMembers: Array<{
    name: string;
    account_id: string;
    attendance_count: number;
  }>;
}

// Error handling helper
export function handleApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (error.response?.data?.error?.message) {
      return error.response.data.error.message;
    }
    if (error.message) {
      return error.message;
    }
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
}

export default api;