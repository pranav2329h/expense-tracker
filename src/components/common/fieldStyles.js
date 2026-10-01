import { cn } from '@/utils/cn';

export function describedBy(id, { hint, error }) {
  if (error) return `${id}-error`;
  if (hint) return `${id}-hint`;
  return undefined;
}

export const controlClasses = (error) =>
  cn(
    'w-full rounded-lg border bg-surface text-sm text-ink transition-colors placeholder:text-ink-3',
    'focus-within:outline-none focus-visible:outline-none',
    error
      ? 'border-negative focus-within:ring-2 focus-within:ring-negative/20'
      : 'border-line-strong focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20',
  );
