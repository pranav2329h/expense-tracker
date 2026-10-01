import { useCallback, useDeferredValue, useMemo } from 'react';
import { useSearchParams } from 'react-router';
import { Info, Plus, Receipt, SearchX } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { PageHeader } from '@/components/common/PageHeader';
import { SkeletonList } from '@/components/common/Skeleton';
import { TransactionFilters } from '@/components/transactions/TransactionFilters';
import { TransactionList } from '@/components/transactions/TransactionList';
import { useCategories } from '@/hooks/useCategories';
import { useCurrency } from '@/hooks/useCurrency';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useTransactionModal } from '@/hooks/useTransactionModal';
import { usePaginatedTransactions } from '@/hooks/useTransactions';
import { sumByType } from '@/utils/calculations';
import { PAYMENT_METHOD_VALUES } from '@/utils/constants';
import { formatRangeLabel, isDatePreset, resolveDateRange } from '@/utils/dates';
import { cn } from '@/utils/cn';
import { searchTransactions, SORT_OPTIONS, sortTransactions } from '@/utils/transactions';

const DEFAULT_FILTERS = {
  q: '',
  type: '',
  category: '',
  method: '',
  range: 'all',
  from: '',
  to: '',
  sort: 'date-desc',
};

/** Filters live in the URL, so they survive refreshes and can be linked to. */
function readFilters(params) {
  const get = (key) => params.get(key) ?? '';
  return {
    q: get('q'),
    type: ['expense', 'income'].includes(get('type')) ? get('type') : '',
    category: get('category'),
    method: PAYMENT_METHOD_VALUES.includes(get('method')) ? get('method') : '',
    range: isDatePreset(get('range')) ? get('range') : DEFAULT_FILTERS.range,
    from: get('from'),
    to: get('to'),
    sort: SORT_OPTIONS.some((option) => option.value === get('sort')) ? get('sort') : DEFAULT_FILTERS.sort,
  };
}

export default function Transactions() {
  useDocumentTitle('Transactions');
  const [params, setParams] = useSearchParams();
  const filters = useMemo(() => readFilters(params), [params]);
  const { resolveCategory } = useCategories();
  const { format, formatSigned } = useCurrency();
  const { openAddTransaction } = useTransactionModal();

  const updateFilters = useCallback(
    (patch) => {
      setParams(
        (current) => {
          const next = new URLSearchParams(current);
          for (const [key, value] of Object.entries(patch)) {
            if (value && value !== DEFAULT_FILTERS[key]) next.set(key, value);
            else next.delete(key);
          }
          if (patch.range && patch.range !== 'custom') {
            next.delete('from');
            next.delete('to');
          }
          return next;
        },
        { replace: true },
      );
    },
    [setParams],
  );

  const resetFilters = useCallback(() => {
    setParams(filters.sort === DEFAULT_FILTERS.sort ? {} : { sort: filters.sort }, { replace: true });
  }, [setParams, filters.sort]);

  const { startDate, endDate } = resolveDateRange(filters.range, { from: filters.from, to: filters.to });
  const result = usePaginatedTransactions({
    startDate,
    endDate,
    type: filters.type || null,
    categoryId: filters.category || null,
    paymentMethod: filters.method || null,
  });

  const query = useDeferredValue(filters.q);
  const visible = useMemo(
    () => sortTransactions(searchTransactions(result.items, query, resolveCategory), filters.sort),
    [result.items, query, resolveCategory, filters.sort],
  );
  const totals = useMemo(() => sumByType(visible), [visible]);

  const activeCount = [
    filters.q.trim(),
    filters.type,
    filters.category,
    filters.method,
    filters.range !== DEFAULT_FILTERS.range,
  ].filter(Boolean).length;

  const sortedByDate = filters.sort.startsWith('date');
  const partialResults = result.hasMore && (query.trim() || !sortedByDate);
  const firstLoad = result.status === 'loading';

  let content;
  if (result.status === 'error') {
    content = <ErrorState title="We couldn't load your transactions" error={result.error} onRetry={() => window.location.reload()} />;
  } else if (firstLoad) {
    content = (
      <div className="px-4 sm:px-5">
        <SkeletonList rows={8} />
      </div>
    );
  } else if (visible.length === 0 && activeCount === 0) {
    content = (
      <EmptyState
        icon={Receipt}
        title="No transactions yet"
        description="Start tracking your finances by adding your first transaction."
        action={
          <Button leftIcon={Plus} onClick={() => openAddTransaction()}>
            Add transaction
          </Button>
        }
      />
    );
  } else if (visible.length === 0) {
    content = (
      <EmptyState
        icon={SearchX}
        title="No matching transactions"
        description={
          result.hasMore
            ? 'Nothing matches in the transactions loaded so far. Load more or adjust your filters.'
            : 'Try a different search term or adjust your filters.'
        }
        action={
          <Button variant="secondary" onClick={resetFilters}>
            Clear filters
          </Button>
        }
      />
    );
  } else {
    content = <TransactionList transactions={visible} grouped={sortedByDate} />;
  }

  return (
    <>
      <PageHeader
        title="Transactions"
        description={formatRangeLabel(startDate, endDate)}
        actions={
          <div className="hidden sm:block">
            <Button leftIcon={Plus} onClick={() => openAddTransaction()}>
              Add transaction
            </Button>
          </div>
        }
      />

      <div className="space-y-4">
        <TransactionFilters filters={filters} onChange={updateFilters} onReset={resetFilters} activeCount={activeCount} />

        {!firstLoad && result.status !== 'error' && visible.length > 0 && (
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-3" aria-live="polite">
            <span>
              <span className="font-medium text-ink">{visible.length}</span> transaction{visible.length === 1 ? '' : 's'}
              {result.hasMore ? ' loaded' : ''}
            </span>
            {totals.income > 0 && (
              <span>
                Income <span className="font-medium text-positive">{formatSigned(totals.income, 'income')}</span>
              </span>
            )}
            {totals.expense > 0 && (
              <span>
                Expenses <span className="font-medium text-ink">{format(totals.expense)}</span>
              </span>
            )}
          </p>
        )}

        {partialResults && (
          <p className="flex items-start gap-2 rounded-xl bg-brand-soft px-4 py-3 text-sm text-brand-text">
            <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            Search and amount sorting apply to the {result.items.length} most recent matching transactions loaded so far.
            Load more to include older ones.
          </p>
        )}

        <Card className={cn('overflow-clip transition-opacity', result.refreshing && 'opacity-60')} aria-busy={result.refreshing}>
          {content}
        </Card>

        {(result.hasMore || result.loadingMore) && (
          <div className="flex justify-center">
            <Button variant="secondary" onClick={result.loadMore} loading={result.loadingMore}>
              Load more transactions
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
