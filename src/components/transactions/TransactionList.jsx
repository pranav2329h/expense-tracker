import { useMemo } from 'react';
import { useCategories } from '@/hooks/useCategories';
import { useCurrency } from '@/hooks/useCurrency';
import { useIsDesktop } from '@/hooks/useMediaQuery';
import { useTransactionModal } from '@/hooks/useTransactionModal';
import { formatDayHeading } from '@/utils/dates';
import { groupByDate } from '@/utils/transactions';
import { TransactionCard } from './TransactionCard';
import { TransactionTable } from './TransactionTable';

/**
 * Responsive transaction list: a table with inline Edit/Delete actions on larger
 * screens, tappable cards on phones. Grouped by day unless `grouped` is false.
 */
export function TransactionList({ transactions, grouped = true }) {
  const isDesktop = useIsDesktop();
  const { resolveCategory } = useCategories();
  const { formatSigned } = useCurrency();
  const { openEditTransaction, requestDeleteTransaction } = useTransactionModal();

  const groups = useMemo(
    () => (grouped ? groupByDate(transactions) : [{ date: null, items: transactions, income: 0, expense: 0 }]),
    [grouped, transactions],
  );

  if (isDesktop) {
    return (
      <TransactionTable
        groups={groups}
        resolveCategory={resolveCategory}
        onEdit={openEditTransaction}
        onDelete={requestDeleteTransaction}
      />
    );
  }

  return (
    <div>
      {groups.map((group) => (
        <section key={group.date ?? 'all'} aria-label={group.date ? formatDayHeading(group.date) : 'Transactions'}>
          {group.date && (
            <h3 className="sticky top-14 z-10 flex items-center justify-between gap-3 border-y border-line bg-subtle px-4 py-2 text-xs font-medium text-ink-2">
              <span>{formatDayHeading(group.date)}</span>
              <span className="text-ink-3 tabular">
                {group.income > 0 && <span className="text-positive">{formatSigned(group.income, 'income')}</span>}
                {group.income > 0 && group.expense > 0 && ' · '}
                {group.expense > 0 && formatSigned(group.expense, 'expense')}
              </span>
            </h3>
          )}
          <ul className="divide-y divide-line">
            {group.items.map((transaction) => (
              <TransactionCard
                key={transaction.id}
                transaction={transaction}
                category={resolveCategory(transaction)}
                onSelect={openEditTransaction}
                showDate={!group.date}
              />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
