import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '../../utils/helpers';
import { getStatusColor } from '../../utils/helpers';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'status' | 'outline';
  status?: string;
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', status, children, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium';
    
    const variants = {
      default: 'bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300',
      outline: 'border border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-300',
      status: status ? getStatusColor(status) : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
    };

    return (
      <span
        ref={ref}
        className={cn(baseStyles, variants[variant], className)}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';