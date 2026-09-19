import { forwardRef, InputHTMLAttributes } from 'react';
import { cn } from '../../utils/helpers';

export interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  indeterminate?: boolean;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, indeterminate, ...props }, ref) => {
    const inputRef = ref as React.RefObject<HTMLInputElement>;
    
    // Handle indeterminate state
    if (indeterminate && inputRef.current) {
      inputRef.current.indeterminate = true;
    }

    return (
      <input
        type="checkbox"
        ref={ref}
        className={cn(
          'h-4 w-4 rounded border-gray-300 text-primary-600',
          'focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'dark:border-gray-600 dark:bg-gray-800 dark:focus:ring-offset-gray-800',
          className
        )}
        {...props}
      />
    );
  }
);

Checkbox.displayName = 'Checkbox';