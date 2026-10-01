import { memo } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { CategoryBadge } from '@/components/common/CategoryBadge';
import { useCurrency } from '@/hooks/useCurrency';
import { getPaymentMethodLabel, TYPE_LABELS } from '@/utils/constants';
import { formatDate, formatDayHeading } from '@/utils/dates';
import { cn } from '@/utils/cn';

const TransactionRow = memo(function TransactionRow({ transaction, category, showDate, onEdit, onDelete }) {
  const { formatSigned } = useCurrency();
  const isIncome = transaction.type === 'income';
  const title = transaction.description || category.name;

  return (
    <tr className="border-t border-line transition-colors hover:bg-subtle/60">
      <td className="py-3 pr-3 pl-5">
        <div className="flex min-w-0 items-center gap-3">
          <CategoryBadge icon={category.icon} type={transaction.type} size="sm" />
          <div className="min-w-0">
            <p className="max-w-[28ch] truncate font-medium text-ink xl:max-w-[40ch]">{title}</p>
            <p className="truncate text-xs text-ink-3">{category.name}</p>
          </div>
        </div>
      </td>
      <td className="px-3 py-3 whitespace-nowrap text-ink-2">{getPaymentMethodLabel(transaction.paymentMethod)}</td>
      {showDate && <td className="px-3 py-3 whitespace-nowrap text-ink-2 tabular">{formatDate(transaction.date)}</td>}
      <td
        className={cn(
          'px-3 py-3 text-right font-semibold whitespace-nowrap tabular',
          isIncome ? 'text-positive' : 'text-ink',
        )}
      >
        <span className="sr-only">{TYPE_LABELS[transaction.type]}: </span>
        {formatSigned(transaction.amount, transaction.type)}
      </td>
      <td className="py-2 pr-4 pl-2">
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="sm"
            leftIcon={Pencil}
            onClick={() => onEdit(transaction)}
            aria-label={`Edit transaction: ${title}`}
          >
            Edit
          </Button>
          <Button
            variant="danger-ghost"
            size="sm"
            leftIcon={Trash2}
            onClick={() => onDelete(transaction)}
            aria-label={`Delete transaction: ${title}`}
          >
            Delete
          </Button>
        </div>
      </td>
    </tr>
  );
});

/** Desktop table. `groups` come from groupByDate(); a single group with date null renders flat. */
export function TransactionTable({ groups, resolveCategory, onEdit, onDelete }) {
  const { formatSigned } = useCurrency();
  const flat = groups.length === 1 && groups[0].date === null;
  const columnCount = flat ? 5 : 4;

  return (
    <table className="w-full text-sm">
      <caption className="sr-only">Transactions</caption>
      <thead>
        <tr className="text-left text-xs font-medium text-ink-3">
          <th scope="col" className="py-2.5 pr-3 pl-5 font-medium">
            Transaction
          </th>
          <th scope="col" className="px-3 py-2.5 font-medium">
            Payment method
          </th>
          {flat && (
            <th scope="col" className="px-3 py-2.5 font-medium">
              Date
            </th>
          )}
          <th scope="col" className="px-3 py-2.5 text-right font-medium">
            Amount
          </th>
          <th scope="col" className="py-2.5 pr-5 pl-2 text-right font-medium">
            <span className="sr-only">Actions</span>
          </th>
        </tr>
      </thead>
      {groups.map((group) => (
        <tbody key={group.date ?? 'all'}>
          {group.date && (
            <tr className="border-t border-line bg-subtle/70">
              <th scope="colgroup" colSpan={columnCount} className="py-2 pr-5 pl-5 text-left">
                <div className="flex items-center justify-between gap-4 text-xs font-medium">
                  <span className="text-ink-2">{formatDayHeading(group.date)}</span>
                  <span className="text-ink-3 tabular">
                    {group.income > 0 && <span className="text-positive">{formatSigned(group.income, 'income')}</span>}
                    {group.income > 0 && group.expense > 0 && ' · '}
                    {group.expense > 0 && formatSigned(group.expense, 'expense')}
                  </span>
                </div>
              </th>
            </tr>
          )}
          {group.items.map((transaction) => (
            <TransactionRow
              key={transaction.id}
              transaction={transaction}
              category={resolveCategory(transaction)}
              showDate={flat}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </tbody>
      ))}
    </table>
  );
}
