import { CircleAlert, CircleCheck } from 'lucide-react';
import { cn } from '@/utils/cn';

export function FormAlert({ tone = 'error', children, className }) {
  if (!children) return null;
  const Icon = tone === 'error' ? CircleAlert : CircleCheck;
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn(
        'flex items-start gap-2.5 rounded-xl px-3.5 py-3 text-sm',
        tone === 'error' ? 'bg-negative-soft text-negative' : 'bg-positive-soft text-positive',
        className,
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <span className="font-medium">{children}</span>
    </div>
  );
}

export function Divider({ children }) {
  return (
    <div className="my-6 flex items-center gap-3 text-xs text-ink-3">
      <span className="h-px flex-1 bg-line" />
      {children}
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}
