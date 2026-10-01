import { LoaderCircle } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Logo } from './Logo';

export function LoadingSpinner({ label = 'Loading…', size = 'md', showLabel = false, className }) {
  return (
    <span role="status" className={cn('inline-flex items-center gap-2 text-ink-3', className)}>
      <LoaderCircle className={cn('animate-spin', size === 'sm' ? 'size-4' : 'size-6')} aria-hidden="true" />
      <span className={showLabel ? 'text-sm' : 'sr-only'}>{label}</span>
    </span>
  );
}

/** Centred full-screen loader used while auth state or user data initialises. */
export function FullPageLoader({ label = 'Loading…', children }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-page px-4">
      <Logo />
      <LoadingSpinner label={label} showLabel />
      {children}
    </div>
  );
}
