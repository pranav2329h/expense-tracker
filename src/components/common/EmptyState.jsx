import { createElement } from 'react';
import { cn } from '@/utils/cn';

export function EmptyState({ icon, title, description, action, className, compact = false }) {
  return (
    <div className={cn('flex flex-col items-center text-center', compact ? 'px-4 py-8' : 'px-6 py-14', className)}>
      {icon && (
        <span className="mb-4 grid size-12 place-items-center rounded-2xl bg-subtle text-ink-2">
          {createElement(icon, { className: 'size-6', 'aria-hidden': true })}
        </span>
      )}
      <h3 className="text-base font-semibold text-ink">{title}</h3>
      {description && <p className="mt-1.5 max-w-sm text-sm text-ink-3">{description}</p>}
      {action && <div className="mt-5 flex flex-wrap justify-center gap-2">{action}</div>}
    </div>
  );
}
