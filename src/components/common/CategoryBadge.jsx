import { createElement } from 'react';
import { getCategoryIcon } from '@/utils/categoryIcons';
import { cn } from '@/utils/cn';

const SIZES = {
  sm: { box: 'size-8 rounded-lg', icon: 'size-4' },
  md: { box: 'size-10 rounded-xl', icon: 'size-[18px]' },
  lg: { box: 'size-12 rounded-xl', icon: 'size-5' },
};

/** Category icon tile. Income categories get a green tint, expenses stay neutral. */
export function CategoryBadge({ icon, type = 'expense', size = 'md', className }) {
  const sizing = SIZES[size];
  return (
    <span
      aria-hidden="true"
      className={cn(
        'grid shrink-0 place-items-center',
        type === 'income' ? 'bg-positive-soft text-positive' : 'bg-subtle text-ink-2',
        sizing.box,
        className,
      )}
    >
      {createElement(getCategoryIcon(icon), { className: sizing.icon })}
    </span>
  );
}

/** Small inline chip: icon + category name. */
export function CategoryChip({ category, className }) {
  return (
    <span
      className={cn(
        'inline-flex max-w-full items-center gap-1.5 rounded-md bg-subtle px-2 py-0.5 text-xs font-medium text-ink-2',
        className,
      )}
    >
      {createElement(getCategoryIcon(category.icon), { className: 'size-3.5 shrink-0', 'aria-hidden': true })}
      <span className="truncate">{category.name}</span>
    </span>
  );
}
