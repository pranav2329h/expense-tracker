import { cn } from '@/utils/cn';

/** Label + control + hint/error wrapper shared by Input, Select and DatePicker. */
export function Field({ id, label, hint, error, optional = false, hideLabel = false, className, children }) {
  return (
    <div className={className}>
      {label && (
        <label
          htmlFor={id}
          className={cn('mb-1.5 flex items-baseline gap-1.5 text-sm font-medium text-ink', hideLabel && 'sr-only')}
        >
          {label}
          {optional && <span className="text-xs font-normal text-ink-3">(optional)</span>}
        </label>
      )}
      {children}
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-xs font-medium text-negative">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="mt-1.5 text-xs text-ink-3">
            {hint}
          </p>
        )
      )}
    </div>
  );
}
