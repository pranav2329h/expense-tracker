import { useId } from 'react';
import { cn } from '@/utils/cn';
import { Field } from './Field';
import { controlClasses, describedBy } from './fieldStyles';

/**
 * Text input with label, hint, error and optional leading/trailing adornments.
 * `prefix` is decorative text (e.g. a currency symbol); `suffix` can be a button.
 */
export function Input({
  id,
  label,
  hint,
  error,
  optional,
  hideLabel,
  prefix,
  suffix,
  className,
  inputClassName,
  ref,
  ...props
}) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <Field id={inputId} label={label} hint={hint} error={error} optional={optional} hideLabel={hideLabel} className={className}>
      <div className={cn(controlClasses(error), 'flex items-center')}>
        {prefix && (
          <span className="pl-3 text-sm text-ink-3 select-none" aria-hidden="true">
            {prefix}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(inputId, { hint, error })}
          className={cn(
            'h-10 w-full min-w-0 rounded-lg bg-transparent px-3 text-sm text-ink outline-none placeholder:text-ink-3 disabled:opacity-60',
            prefix && 'pl-2',
            inputClassName,
          )}
          {...props}
        />
        {suffix}
      </div>
    </Field>
  );
}
