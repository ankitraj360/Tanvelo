import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'destructive' | 'cyan' | 'purple' | 'blue' | 'indigo' | 'outline';
}

export function Badge({ className, variant = 'default', children, ...props }: BadgeProps) {
  const variants = {
    default: 'bg-slate-800 text-slate-300 border border-slate-700',
    success: 'bg-emerald-950/70 text-emerald-400 border border-emerald-800/60',
    warning: 'bg-amber-950/70 text-amber-400 border border-amber-800/60',
    destructive: 'bg-rose-950/70 text-rose-400 border border-rose-800/60',
    cyan: 'bg-cyan-950/70 text-cyan-400 border border-cyan-800/60',
    purple: 'bg-purple-950/70 text-purple-400 border border-purple-800/60',
    blue: 'bg-blue-950/70 text-blue-400 border border-blue-800/60',
    indigo: 'bg-indigo-950/70 text-indigo-400 border border-indigo-800/60',
    outline: 'border border-slate-700/80 text-slate-400 bg-slate-900/40',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium tracking-wide uppercase',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
