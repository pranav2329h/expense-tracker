import { CircleAlert, RefreshCw } from 'lucide-react';
import { getErrorMessage } from '@/utils/errors';
import { cn } from '@/utils/cn';
import { Button } from './Button';

/** Inline error panel. Shows a friendly message — never raw error details. */
export function ErrorState({ title = 'Something went wrong', error, message, onRetry, className }) {
  const text = message ?? getErrorMessage(error, 'We could not load this data. Please try again.');
  return (
    <div role="alert" className={cn('flex flex-col items-center px-6 py-10 text-center', className)}>
      <span className="mb-3 grid size-11 place-items-center rounded-2xl bg-negative-soft text-negative">
        <CircleAlert className="size-5" aria-hidden="true" />
      </span>
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      <p className="mt-1 max-w-md text-sm text-ink-3">{text}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" className="mt-4" leftIcon={RefreshCw} onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
