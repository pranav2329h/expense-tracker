import { createElement } from 'react';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { cn } from '@/utils/cn';
import { formatPercent } from '@/utils/currency';
import { Card } from './Card';
import { Skeleton } from './Skeleton';

/**
 * Change indicator: arrow + signed percentage + caption. Colour follows whether the
 * direction is good (e.g. expenses going up is bad), and the arrow + sign carry the
 * meaning without relying on colour.
 */
function Delta({ change, upIsGood, caption }) {
  const text = formatPercent(change, { signed: true });
  if (text === null) return caption ? <span>{caption}</span> : null;
  const isUp = change > 0;
  const isFlat = Math.abs(change) < 0.05;
  const good = isFlat ? null : isUp === upIsGood;
  return (
    <span className="inline-flex flex-wrap items-center gap-x-1.5">
      <span
        className={cn(
          'inline-flex items-center gap-0.5 font-medium',
          good === null ? 'text-ink-2' : good ? 'text-positive' : 'text-negative',
        )}
      >
        {!isFlat &&
          createElement(isUp ? ArrowUpRight : ArrowDownRight, { className: 'size-3.5', 'aria-hidden': true })}
        {text}
      </span>
      {caption && <span>{caption}</span>}
    </span>
  );
}

export function StatCard({
  label,
  value,
  icon,
  change,
  changeUpIsGood = true,
  caption,
  loading = false,
  emphasis = false,
  className,
}) {
  return (
    <Card as="div" className={cn('flex min-w-0 flex-col p-4 sm:p-5', className)}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-ink-2">{label}</p>
        {icon && (
          <span
            className={cn(
              'grid size-8 shrink-0 place-items-center rounded-lg',
              emphasis ? 'bg-brand-soft text-brand-text' : 'bg-subtle text-ink-2',
            )}
          >
            {createElement(icon, { className: 'size-4', 'aria-hidden': true })}
          </span>
        )}
      </div>
      {loading ? (
        <Skeleton className={cn('mt-3', emphasis ? 'h-9 w-40' : 'h-7 w-28')} />
      ) : (
        <p
          className={cn(
            'mt-2 font-semibold tracking-tight break-words text-ink',
            emphasis ? 'text-3xl sm:text-[2rem]' : 'text-xl sm:text-2xl',
          )}
        >
          {value}
        </p>
      )}
      <div className="mt-auto pt-1.5 text-xs text-ink-3">
        {loading ? (
          <Skeleton className="h-3 w-24" />
        ) : change !== undefined ? (
          <Delta change={change} upIsGood={changeUpIsGood} caption={caption} />
        ) : (
          caption
        )}
      </div>
    </Card>
  );
}
