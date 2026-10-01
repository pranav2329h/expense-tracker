import { createElement, useId } from 'react';
import { getCategoryIcon } from '@/utils/categoryIcons';
import { cn } from '@/utils/cn';

/** Grid of category options built on native radio inputs (keyboard + screen reader friendly). */
export function CategoryPicker({ label = 'Category', name, categories, value, onChange, error, type }) {
  const id = useId();
  const errorId = `${id}-error`;

  return (
    <fieldset aria-describedby={error ? errorId : undefined}>
      <legend className="mb-1.5 text-sm font-medium text-ink">{label}</legend>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {categories.map((category) => (
          <label key={category.id} className="relative min-w-0">
            <input
              type="radio"
              name={name ?? id}
              value={category.id}
              checked={value === category.id}
              onChange={() => onChange(category.id)}
              className="peer sr-only"
            />
            <span
              className={cn(
                'flex h-full cursor-pointer flex-col items-center gap-1.5 rounded-xl border px-1.5 py-2.5 text-center text-xs font-medium transition-colors select-none',
                'border-line text-ink-2 hover:border-line-strong hover:bg-subtle',
                'peer-checked:border-brand peer-checked:bg-brand-soft peer-checked:text-brand-text',
                'peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand',
              )}
            >
              {createElement(getCategoryIcon(category.icon), {
                className: cn('size-5', type === 'income' ? 'text-positive' : ''),
                'aria-hidden': true,
              })}
              <span className="w-full truncate">{category.name}</span>
            </span>
          </label>
        ))}
      </div>
      {error && (
        <p id={errorId} className="mt-1.5 text-xs font-medium text-negative">
          {error}
        </p>
      )}
    </fieldset>
  );
}
