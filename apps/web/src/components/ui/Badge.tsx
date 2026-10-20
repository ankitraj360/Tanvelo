import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'destructive' | 'cyan' | 'purple' | 'blue' | 'indigo' | 'outline';
}

export function Badge({ className, variant = 'default', children, ...props }: BadgeProps) {
  const variants = {
    default: 'bg-slate-100 text-slate-700 border border-slate-200',
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium',
    warning: 'bg-amber-50 text-amber-700 border border-amber-200 font-medium',
    destructive: 'bg-rose-50 text-rose-700 border border-rose-200 font-medium',
    cyan: 'bg-sky-50 text-sky-700 border border-sky-200 font-medium',
    purple: 'bg-purple-50 text-purple-700 border border-purple-200 font-medium',
    blue: 'bg-blue-50 text-blue-700 border border-blue-200 font-medium',
    indigo: 'bg-indigo-50 text-indigo-700 border border-indigo-200 font-medium',
    outline: 'border border-slate-300 text-slate-700 bg-white',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium tracking-normal',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
