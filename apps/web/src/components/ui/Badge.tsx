import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'blue' | 'cyan' | 'green' | 'amber' | 'rose' | 'slate' | 'outline';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'blue',
  size = 'sm',
  children,
  ...props
}) => {
  const variants = {
    blue: 'bg-blue-50 text-brand-blue border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900',
    cyan: 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-300 dark:border-cyan-900',
    green: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900',
    amber: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900',
    rose: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900',
    slate: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    outline: 'border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 bg-transparent',
  };

  const sizes = {
    sm: 'text-xs px-2.5 py-0.5 rounded-full font-medium',
    md: 'text-xs px-3 py-1 rounded-full font-semibold',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 border transition-colors',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};
