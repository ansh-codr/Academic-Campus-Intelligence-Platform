import React from 'react';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BrandMarkProps {
  compact?: boolean;
  inverse?: boolean;
  className?: string;
}

/** A consistent product identity across the marketing site and both workspaces. */
export const BrandMark: React.FC<BrandMarkProps> = ({ compact = false, inverse = false, className }) => (
  <span className={cn('inline-flex items-center gap-3 min-w-0', className)}>
    <span aria-hidden="true" className="brand-symbol shrink-0">
      <Sparkles className="w-[19px] h-[19px]" strokeWidth={2.3} />
    </span>
    {!compact && (
      <span className="leading-tight min-w-0">
        <span className={cn('block text-[15px] sm:text-base font-extrabold tracking-[-0.05em]', inverse ? 'text-white' : 'text-slate-950 dark:text-white')}>
          SolveSphere<span className="text-brand-blue dark:text-brand-cyan"> AI</span>
        </span>
        <span className={cn('block mt-0.5 text-[9px] font-bold uppercase tracking-[0.15em]', inverse ? 'text-slate-400' : 'text-slate-500 dark:text-slate-400')}>
          Campus intelligence
        </span>
      </span>
    )}
  </span>
);
