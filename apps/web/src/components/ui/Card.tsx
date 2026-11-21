import React from 'react';
import { cn } from '@/lib/utils';
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> { glass?: boolean; hoverEffect?: boolean; }
export const Card = React.forwardRef<HTMLDivElement, CardProps>(({ className, glass=false, hoverEffect=false, children, ...props }, ref) => (
  <div ref={ref} className={cn('rounded-[24px] border transition-[box-shadow,transform,border-color] duration-300', glass ? 'glass-panel shadow-premium' : 'bg-white dark:bg-brand-cardDark border-slate-200/80 dark:border-slate-700/60 shadow-[0_4px_24px_rgba(15,23,42,.035)]', hoverEffect && 'hover:shadow-[0_20px_45px_rgba(37,99,235,.09)] hover:-translate-y-1 hover:border-blue-200 dark:hover:border-cyan-500/40', className)} {...props}>{children}</div>
));
Card.displayName='Card';
export const CardHeader=React.forwardRef<HTMLDivElement,React.HTMLAttributes<HTMLDivElement>>(({className,...props},ref)=><div ref={ref} className={cn('p-6 pb-4',className)} {...props}/>);
CardHeader.displayName='CardHeader';
export const CardTitle=React.forwardRef<HTMLHeadingElement,React.HTMLAttributes<HTMLHeadingElement>>(({className,...props},ref)=><h3 ref={ref} className={cn('text-lg font-extrabold tracking-[-.035em] text-brand-navy dark:text-white',className)} {...props}/>);
CardTitle.displayName='CardTitle';
export const CardDescription=React.forwardRef<HTMLParagraphElement,React.HTMLAttributes<HTMLParagraphElement>>(({className,...props},ref)=><p ref={ref} className={cn('text-sm leading-relaxed text-slate-500 dark:text-slate-400 mt-1',className)} {...props}/>);
CardDescription.displayName='CardDescription';
export const CardContent=React.forwardRef<HTMLDivElement,React.HTMLAttributes<HTMLDivElement>>(({className,...props},ref)=><div ref={ref} className={cn('p-6 pt-0',className)} {...props}/>);
CardContent.displayName='CardContent';
export const CardFooter=React.forwardRef<HTMLDivElement,React.HTMLAttributes<HTMLDivElement>>(({className,...props},ref)=><div ref={ref} className={cn('p-6 pt-0 border-t border-slate-100 dark:border-slate-800/80 mt-4',className)} {...props}/>);
CardFooter.displayName='CardFooter';
