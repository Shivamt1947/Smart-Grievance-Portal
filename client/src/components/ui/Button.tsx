import React from 'react';
import { cn } from '@/utils/cn';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] select-none';

    const variants = {
      primary:
        'bg-blue-600 text-white hover:bg-blue-700 shadow-sm shadow-blue-500/20 active:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500',
      secondary:
        'bg-slate-100 text-slate-900 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700',
      outline:
        'border border-slate-200 bg-transparent text-slate-800 hover:bg-slate-100 hover:text-slate-900 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-800',
      ghost:
        'bg-transparent text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
      danger:
        'bg-red-600 text-white hover:bg-red-700 shadow-sm shadow-red-500/20 active:bg-red-800',
      success:
        'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm shadow-emerald-500/20 active:bg-emerald-800',
    };

    const sizes = {
      sm: 'h-8 px-3 text-xs rounded-md gap-1.5',
      md: 'h-10 px-4 text-sm rounded-lg gap-2',
      lg: 'h-12 px-6 text-base rounded-lg gap-2.5',
      icon: 'h-9 w-9 p-0 rounded-lg',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
