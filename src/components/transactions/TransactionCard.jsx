import { memo } from 'react';
import { CategoryBadge } from '@/components/common/CategoryBadge';
import { useCurrency } from '@/hooks/useCurrency';
import { getPaymentMethodLabel, TYPE_LABELS } from '@/utils/constants';
import { formatDate } from '@/utils/dates';
import { cn } from '@/utils/cn';

/** Compact transaction row for phones and the dashboard. Tapping opens the editor. */
export const TransactionCard = memo(function TransactionCard({ transaction, category, onSelect, showDate = false }) {
  const { formatSigned } = useCurrency();
  const isIncome = transaction.type === 'income';
  const meta = [category.name, getPaymentMethodLabel(transaction.paymentMethod)];
  if (showDate) meta.push(formatDate(transaction.date));

  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(transaction)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-subtle focus-visible:-outline-offset-2 sm:px-5"
      >
        <CategoryBadge icon={category.icon} type={transaction.type} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-ink">
            {transaction.description || category.name}
          </span>
          <span className="mt-0.5 block truncate text-xs text-ink-3">{meta.join(' · ')}</span>
        </span>
        <span className={cn('shrink-0 text-sm font-semibold tabular', isIncome ? 'text-positive' : 'text-ink')}>
          <span className="sr-only">{TYPE_LABELS[transaction.type]}: </span>
          {formatSigned(transaction.amount, transaction.type)}
        </span>
      </button>
    </li>
  );
});
