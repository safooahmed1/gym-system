// User & Auth
export type UserRole = 'admin' | 'reception';

export interface User {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  role: UserRole;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Members
export type MemberStatus = 'active' | 'inactive' | 'expired' | 'expiring_soon';

export interface Member {
  id: number;
  accountId: string;
  name: string;
  phone: string;
  nationalId: string;
  status: MemberStatus;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface MemberFormData {
  name: string;
  phone: string;
  nationalId: string;
}

export interface MemberFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: MemberStatus;
}

export interface MemberWithRelations extends Member {
  subscriptions?: Subscription[];
  payments?: Payment[];
  attendances?: Attendance[];
}

// Subscription Plans
export interface SubscriptionPlan {
  id: number;
  name: string;
  durationMonths: number;
  price: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PlanFormData {
  name: string;
  durationMonths: number;
  price: number;
  description?: string;
  isActive?: boolean;
}

// Subscriptions
export type SubscriptionStatus = 'active' | 'expired' | 'expiring_soon';
export type DiscountType = 'percentage' | 'fixed';

export interface Subscription {
  id: number;
  memberId: number;
  planId: number;
  startDate: string;
  endDate: string;
  status: SubscriptionStatus;
  discountType?: DiscountType;
  discountValue?: string;
  finalPrice: string;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
  member?: Member;
  plan?: SubscriptionPlan;
  payments?: Payment[];
  // Joined fields from API
  memberName?: string;
  memberPhone?: string;
  memberAccountId?: string;
  planName?: string;
  planDuration?: number;
  planPrice?: string;
}

export interface SubscriptionFormData {
  memberId: number;
  planId: number;
  discountType?: DiscountType;
  discountValue?: number;
}

export interface RenewSubscriptionData {
  planId: number;
  discountType?: DiscountType;
  discountValue?: number;
}

export interface SubscriptionFilters {
  page?: number;
  limit?: number;
  memberId?: number;
  status?: SubscriptionStatus;
}

// Payments
export type PaymentMethod = 'cash' | 'electronic';

export interface Payment {
  id: number;
  subscriptionId: number;
  memberId: number;
  amount: string;
  method: PaymentMethod;
  referenceNumber?: string;
  receivedBy: number;
  createdAt: string;
  member?: Member;
  subscription?: Subscription;
}

export interface PaymentFormData {
  subscriptionId: number;
  method: PaymentMethod;
  referenceNumber?: string;
}

export interface PaymentFilters {
  page?: number;
  limit?: number;
  memberId?: number;
  subscriptionId?: number;
  method?: PaymentMethod;
  dateFrom?: string;
  dateTo?: string;
}

// Attendances
export interface Attendance {
  id: number;
  memberId: number;
  subscriptionId: number;
  checkInAt: string;
  member?: Member;
  subscription?: Subscription;
}

export interface CheckInData {
  accountId: string;
}

export interface AttendanceFilters {
  page?: number;
  limit?: number;
  memberId?: number;
  dateFrom?: string;
  dateTo?: string;
}

export interface AttendanceStats {
  total: number;
  todayUnique: number;
  dailyStats: Array<{
    date: string;
    count: number;
  }>;
}

// Reports
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

// Notification
export type NotificationType = 'renewal_reminder' | 'expired_notice';
export type NotificationStatus = 'sent' | 'failed' | 'pending';

export interface NotificationLog {
  id: number;
  memberId: number;
  type: NotificationType;
  status: NotificationStatus;
  message: string;
  errorMessage?: string;
  sentAt?: string;
  createdAt: string;
}

// UI Types
export interface SelectOption {
  value: string | number;
  label: string;
}

export interface TableColumn<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
  className?: string;
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}