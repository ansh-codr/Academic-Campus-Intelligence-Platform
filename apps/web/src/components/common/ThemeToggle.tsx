import React from 'react';
import { useTheme } from '@/hooks/useTheme';
import { Sun, Moon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ThemeToggleProps {
  className?: string;
  variant?: 'ghost' | 'outline';
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className, variant = 'ghost' }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      type="button"
      aria-label="Toggle theme"
      className={cn(
        'relative inline-flex items-center justify-center rounded-lg p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-blue/30',
        variant === 'outline' && 'border border-slate-200 dark:border-slate-800 bg-white dark:bg-brand-surfaceDark',
        className
      )}
    >
      {theme === 'dark' ? (
        <Sun className="w-4 h-4 text-amber-400 transition-transform duration-200 rotate-0 hover:rotate-45" />
      ) : (
        <Moon className="w-4 h-4 text-brand-navy transition-transform duration-200 hover:-rotate-12" />
      )}
    </button>
  );
};
