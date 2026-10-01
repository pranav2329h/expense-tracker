import { createElement, useId } from 'react';
import { cn } from '@/utils/cn';

/**
 * Radio-group styled as a segmented control. Built on native radio inputs, so
 * arrow-key navigation and screen-reader semantics work out of the box.
 */
export function SegmentedControl({ label, hideLabel = false, value, onChange, options, name, className, size = 'md' }) {
  const generatedName = useId();
  const groupName = name ?? generatedName;

  return (
    <fieldset className={className}>
      <legend className={hideLabel ? 'sr-only' : 'mb-1.5 text-sm font-medium text-ink'}>{label}</legend>
      <div className="grid auto-cols-fr grid-flow-col gap-1 rounded-xl bg-subtle p-1">
        {options.map((option) => (
          <label key={option.value} className="relative">
            <input
              type="radio"
              name={groupName}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className="peer sr-only"
            />
            <span
              className={cn(
                'flex cursor-pointer items-center justify-center gap-2 rounded-lg font-medium text-ink-2 transition-colors select-none',
                'hover:text-ink peer-checked:bg-surface peer-checked:text-ink peer-checked:shadow-sm',
                'peer-focus-visible:outline-2 peer-focus-visible:outline-offset-1 peer-focus-visible:outline-brand',
                size === 'sm' ? 'h-8 text-xs' : 'h-9 text-sm',
              )}
            >
              {option.icon && createElement(option.icon, { className: 'size-4', 'aria-hidden': true })}
              {option.label}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
