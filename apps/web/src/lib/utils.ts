import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Merge conditional Tailwind classes without conflicting utilities. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format ISO dates safely; undefined timestamps remain clearly unknown. */
export function formatDate(value?: string | number | Date | null): string {
  if (value === null || value === undefined || value === '') return 'Date unavailable';
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime())
    ? 'Date unavailable'
    : new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
}

export function externalFileUrl(value?: string): string | undefined {
  if (!value) return;
  try {
    const url = new URL(value);
    if (url.username || url.password) return;
    if (url.protocol === 'https:') return url.href;
    if (import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true' && url.origin === 'http://127.0.0.1:9199') return url.href;
  } catch { /* Older records may contain incomplete URLs. */ }
}
