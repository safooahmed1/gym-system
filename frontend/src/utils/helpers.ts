import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: string | number, currency: string = 'EGP'): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('ar-EG', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

export function formatDate(date: string | Date, locale: string = 'ar-EG'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(d);
}

export function formatDateShort(date: string | Date, locale: string = 'ar-EG'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}

export function formatDateTime(date: string | Date, locale: string = 'ar-EG'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

export function formatRelativeTime(date: string | Date, locale: string = 'ar-EG'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    return locale === 'ar-EG' 
      ? `منذ ${Math.abs(diffDays)} يوم` 
      : `${Math.abs(diffDays)} days ago`;
  } else if (diffDays === 0) {
    return locale === 'ar-EG' ? 'اليوم' : 'Today';
  } else if (diffDays === 1) {
    return locale === 'ar-EG' ? 'غداً' : 'Tomorrow';
  } else if (diffDays <= 3) {
    return locale === 'ar-EG' 
      ? `خلال ${diffDays} أيام` 
      : `In ${diffDays} days`;
  } else {
    return formatDateShort(d, locale);
  }
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
    expired: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    expiring_soon: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    pending: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    sent: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    failed: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    cash: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    electronic: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  };
  return colors[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
}

export function getStatusLabel(status: string, t: (key: string) => string): string {
  const labels: Record<string, string> = {
    active: t('members.statusActive'),
    inactive: t('members.statusInactive'),
    expired: t('members.statusExpired'),
    expiring_soon: t('members.statusExpiringSoon'),
    pending: t('notification.status.pending'),
    sent: t('notification.status.sent'),
    failed: t('notification.status.failed'),
    cash: t('payments.cash'),
    electronic: t('payments.electronic'),
  };
  return labels[status] || status;
}

export function calculateDiscount(
  price: number,
  discountType?: 'percentage' | 'fixed',
  discountValue?: number
): { discountAmount: number; finalPrice: number } {
  if (!discountType || !discountValue || discountValue <= 0) {
    return { discountAmount: 0, finalPrice: price };
  }
  
  if (discountType === 'percentage') {
    const discountAmount = price * (discountValue / 100);
    return { discountAmount, finalPrice: Math.max(0, price - discountAmount) };
  }
  
  if (discountType === 'fixed') {
    const discountAmount = Math.min(discountValue, price);
    return { discountAmount, finalPrice: price - discountAmount };
  }
  
  return { discountAmount: 0, finalPrice: price };
}

export function generateAccountId(): string {
  return String(Math.floor(Math.random() * 90000) + 10000);
}

export function validateNationalId(nationalId: string): boolean {
  // Egyptian National ID: 14 digits
  return /^\d{14}$/.test(nationalId);
}

export function validatePhone(phone: string): boolean {
  // Egyptian phone numbers
  return /^(\+20|0)?1[0-2,5]\d{8}$/.test(phone.replace(/\s/g, ''));
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function formatNumber(num: number, locale: string = 'ar-EG'): string {
  return new Intl.NumberFormat(locale).format(num);
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}