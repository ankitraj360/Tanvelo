import React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'emerald';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export function Button({
  className,
  variant = 'primary',
  size = 'md',
  loading,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 cursor-pointer active:scale-[0.98] select-none';

  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-500 text-white shadow-sm shadow-blue-900/30 focus:ring-blue-500 active:bg-blue-700',
    secondary: 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/80 focus:ring-slate-600',
    outline: 'border border-slate-700/80 hover:border-slate-600 bg-transparent text-slate-300 hover:bg-slate-800/60 focus:ring-slate-600',
    danger: 'bg-rose-600 hover:bg-rose-500 text-white focus:ring-rose-500 active:bg-rose-700',
    ghost: 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 focus:ring-slate-700',
    emerald: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm shadow-emerald-950/50 focus:ring-emerald-500 active:bg-emerald-700',
  };

  const sizes = {
    sm: 'text-xs px-2.5 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2 gap-2',
    lg: 'text-base px-5 py-2.5 gap-2.5',
  };

  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          Loading...
        </>
      ) : (
        children
      )}
    </button>
  );
}
