import { useId } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Field } from './Field';
import { controlClasses, describedBy } from './fieldStyles';

/** Native select (best keyboard + mobile support) styled to match the inputs. */
export function Select({
  id,
  label,
  hint,
  error,
  optional,
  hideLabel,
  options,
  placeholder,
  className,
  selectClassName,
  ref,
  ...props
}) {
  const generatedId = useId();
  const selectId = id ?? generatedId;

  return (
    <Field id={selectId} label={label} hint={hint} error={error} optional={optional} hideLabel={hideLabel} className={className}>
      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(selectId, { hint, error })}
          className={cn(controlClasses(error), 'h-10 appearance-none truncate pr-9 pl-3 outline-none', selectClassName)}
          {...props}
        >
          {placeholder !== undefined && <option value="">{placeholder}</option>}
          {options.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-ink-3"
          aria-hidden="true"
        />
      </div>
    </Field>
  );
}
