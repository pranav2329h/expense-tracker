import { createElement } from 'react';
import { CircleAlert, CircleCheck, TriangleAlert } from 'lucide-react';
import { ProgressBar } from '@/components/common/ProgressBar';
import { useCurrency } from '@/hooks/useCurrency';
import { formatPercent } from '@/utils/currency';
import { cn } from '@/utils/cn';

const STATUS = {
  ok: { icon: CircleCheck, label: 'On track', className: 'text-positive' },
  warning: { icon: TriangleAlert, label: 'Over 80% used', className: 'text-caution' },
  serious: { icon: TriangleAlert, label: 'Over 90% used', className: 'text-caution' },
  exceeded: { icon: CircleAlert, label: 'Over budget', className: 'text-negative' },
};

export function BudgetStatus({ level }) {
  const status = STATUS[level] ?? STATUS.ok;
  return (
    <span className={cn('inline-flex items-center gap-1 text-xs font-medium', status.className)}>
      {createElement(status.icon, { className: 'size-3.5', 'aria-hidden': true })}
      {status.label}
    </span>
  );
}

/** Budget / spent / remaining figures with a severity meter. */
export function BudgetProgress({ progress, label, size = 'md' }) {
  const { format } = useCurrency();
  const { amount, spent, remaining, overBy, percent, level } = progress;
  const large = size === 'lg';

  return (
    <div>
      <dl className={cn('grid grid-cols-3 gap-3', large ? 'mb-4' : 'mb-3')}>
        <div className="min-w-0">
          <dt className="text-xs text-ink-3">Budget</dt>
          <dd className={cn('truncate font-semibold text-ink', large ? 'text-lg sm:text-xl' : 'text-sm')}>{format(amount)}</dd>
        </div>
        <div className="min-w-0">
          <dt className="text-xs text-ink-3">Spent</dt>
          <dd className={cn('truncate font-semibold text-ink', large ? 'text-lg sm:text-xl' : 'text-sm')}>{format(spent)}</dd>
        </div>
        <div className="min-w-0">
          <dt className="text-xs text-ink-3">{remaining >= 0 ? 'Remaining' : 'Over by'}</dt>
          <dd
            className={cn(
              'truncate font-semibold',
              remaining >= 0 ? 'text-ink' : 'text-negative',
              large ? 'text-lg sm:text-xl' : 'text-sm',
            )}
          >
            {format(remaining >= 0 ? remaining : overBy)}
          </dd>
        </div>
      </dl>
      <ProgressBar value={percent} level={level} label={label} size={large ? 'lg' : 'md'} />
      <div className="mt-2 flex items-center justify-between gap-3">
        <BudgetStatus level={level} />
        <span className="text-xs font-medium text-ink-2 tabular">{formatPercent(percent)}</span>
      </div>
    </div>
  );
}
