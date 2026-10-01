import { Link } from 'react-router';
import { ArrowRight, Receipt } from 'lucide-react';
import { Card, CardHeader } from '@/components/common/Card';
import { EmptyState } from '@/components/common/EmptyState';
import { SkeletonList } from '@/components/common/Skeleton';
import { TransactionCard } from '@/components/transactions/TransactionCard';
import { useCategories } from '@/hooks/useCategories';
import { useTransactionModal } from '@/hooks/useTransactionModal';

export function RecentTransactions({ transactions, loading }) {
  const { resolveCategory } = useCategories();
  const { openEditTransaction } = useTransactionModal();

  return (
    <Card className="overflow-hidden">
      <CardHeader
        title="Recent transactions"
        className="px-4 pt-4 sm:px-5 sm:pt-5"
        action={
          <Link
            to="/transactions"
            className="inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-brand-text hover:bg-brand-soft"
          >
            View all
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        }
      />
      <div className="mt-2 pb-2">
        {loading ? (
          <div className="px-4 sm:px-5">
            <SkeletonList rows={5} />
          </div>
        ) : transactions.length === 0 ? (
          <EmptyState
            compact
            icon={Receipt}
            title="Nothing in the last few months"
            description="Your most recent transactions will appear here."
          />
        ) : (
          <ul className="divide-y divide-line">
            {transactions.map((transaction) => (
              <TransactionCard
                key={transaction.id}
                transaction={transaction}
                category={resolveCategory(transaction)}
                onSelect={openEditTransaction}
                showDate
              />
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}
