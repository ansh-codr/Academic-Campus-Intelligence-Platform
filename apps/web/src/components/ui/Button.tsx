import React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'gradient';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}
const variants = {
  primary: 'bg-brand-blue text-white hover:bg-brand-blueHover shadow-[0_6px_18px_rgba(37,99,235,.18)]',
  secondary: 'bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-500/15 dark:text-blue-200 dark:hover:bg-blue-500/25',
  outline: 'border border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 hover:border-blue-300 dark:hover:border-blue-500/60 hover:bg-blue-50/60 dark:hover:bg-slate-700',
  ghost: 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80',
  danger: 'bg-rose-600 text-white hover:bg-rose-700 shadow-sm',
  gradient: 'bg-gradient-to-r from-brand-blue to-brand-cyan text-white shadow-[0_12px_26px_rgba(37,99,235,.23)] hover:shadow-[0_14px_32px_rgba(37,99,235,.32)]',
};
const sizes = {
  sm: 'min-h-[36px] px-3.5 py-2 text-xs gap-1.5',
  md: 'min-h-[42px] px-5 py-2.5 text-sm gap-2',
  lg: 'min-h-[50px] px-7 py-3 text-sm sm:text-base gap-2.5 font-semibold',
};
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant='primary', size='md', isLoading=false, children, disabled, type='button', ...props }, ref) => (
    <button ref={ref} type={type} disabled={disabled || isLoading} aria-busy={isLoading}
      className={cn('inline-flex items-center justify-center rounded-xl font-semibold tracking-[-.01em] transition-[color,background-color,box-shadow,transform,border-color] duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-500 disabled:cursor-not-allowed disabled:opacity-50 active:not-disabled:scale-[.98]', variants[variant], sizes[size], className)} {...props}>
      {isLoading && <svg className="animate-spin -ml-1 mr-1 h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity=".25" strokeWidth="3"/><path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/></svg>}
      {children}
    </button>
  )
);
Button.displayName='Button';
