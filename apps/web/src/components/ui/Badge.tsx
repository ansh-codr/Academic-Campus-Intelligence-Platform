import React from 'react';
import { cn } from '@/lib/utils';
export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'blue'|'cyan'|'green'|'amber'|'rose'|'slate'|'outline'; size?: 'sm'|'md';
}
const variants={
  blue:'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/30',
  cyan:'bg-cyan-50 text-cyan-800 border-cyan-200 dark:bg-cyan-500/10 dark:text-cyan-300 dark:border-cyan-500/30',
  green:'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30',
  amber:'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/30',
  rose:'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/30',
  slate:'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
  outline:'border-slate-300 text-slate-600 dark:text-slate-300 dark:border-slate-700 bg-transparent',
};
export const Badge:React.FC<BadgeProps>=({className,variant='blue',size='sm',children,...props})=><span className={cn('inline-flex items-center gap-1.5 border rounded-full tracking-[.015em] font-semibold', variants[variant],size==='sm'?'text-[11px] px-2.5 py-1':'text-xs px-3.5 py-1.5',className)} {...props}>{children}</span>;
