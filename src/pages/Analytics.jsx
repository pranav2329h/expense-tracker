import { useMemo } from 'react';
import { useSearchParams } from 'react-router';
import {
  ArrowDownLeft,
  ArrowUpRight,
  CalendarRange,
  ChartPie,
  Crown,
  PiggyBank,
  Plus,
  Receipt,
} from 'lucide-react';
import { CategoryBreakdown } from '@/components/charts/CategoryBreakdown';
import { ChartCard } from '@/components/charts/ChartCard';
import { ExpenseBarChart } from '@/components/charts/ExpenseBarChart';
import { IncomeExpenseChart } from '@/components/charts/IncomeExpenseChart';
import { RankedBarList } from '@/components/charts/RankedBarList';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { CategoryBadge } from '@/components/common/CategoryBadge';
import { DatePicker } from '@/components/common/DatePicker';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { PageHeader } from '@/components/common/PageHeader';
import { Select } from '@/components/common/Select';
import { SkeletonCard } from '@/components/common/Skeleton';
import { StatCard } from '@/components/common/StatCard';
import { useCategories } from '@/hooks/useCategories';
import { useCurrency } from '@/hooks/useCurrency';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useTransactionModal } from '@/hooks/useTransactionModal';
import { useTransactionRange } from '@/hooks/useTransactions';
import {
  getCategoryTotals,
  getPaymentMethodTotals,
  getPeriodSummary,
  getTrendSeries,
  toDonutSlices,
} from '@/utils/calculations';
import { formatPercent } from '@/utils/currency';
import { DATE_PRESETS, formatDate, formatRangeLabel, resolveDateRange } from '@/utils/dates';
import { cn } from '@/utils/cn';

const PRESETS = DATE_PRESETS.filter((preset) =>
  ['this-month', 'last-month', 'last-3-months', 'last-6-months', 'this-year', 'last-12-months', 'custom'].includes(
    preset.value,
  ),
);
const PRESET_VALUES = PRESETS.map((preset) => preset.value);
const SINGLE_MONTH = new Set(['this-month', 'last-month']);

export default function Analytics() {
  useDocumentTitle('Analytics');
  const [params, setParams] = useSearchParams();
  const preset = PRESET_VALUES.includes(params.get('range')) ? params.get('range') : 'this-month';
  const from = params.get('from') ?? '';
  const to = params.get('to') ?? '';
  const { startDate, endDate } = useMemo(() => resolveDateRange(preset, { from, to }), [preset, from, to]);

  const { resolveCategory } = useCategories();
  const { format } = useCurrency();
  const { openAddTransaction } = useTransactionModal();
  const range = useTransactionRange(startDate, endDate);

  const setFilter = (patch) => {
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        for (const [key, value] of Object.entries(patch)) {
          if (value) next.set(key, value);
          else next.delete(key);
        }
        if (next.get('range') !== 'custom') {
          next.delete('from');
          next.delete('to');
        }
        if (next.get('range') === 'this-month') next.delete('range');
        return next;
      },
      { replace: true },
    );
  };

  const items = range.items;
  const periodLabel = formatRangeLabel(startDate, endDate);
  const summary = useMemo(
    () => getPeriodSummary(items, { startDate, endDate, resolveCategory }),
    [items, startDate, endDate, resolveCategory],
  );
  const categoryTotals = useMemo(() => getCategoryTotals(items, resolveCategory), [items, resolveCategory]);
  const slices = useMemo(() => toDonutSlices(categoryTotals), [categoryTotals]);
  const trend = useMemo(
    () => (startDate && endDate ? getTrendSeries(items, startDate, endDate) : { granularity: 'month', data: [] }),
    [items, startDate, endDate],
  );
  const methods = useMemo(() => getPaymentMethodTotals(items), [items]);

  const trendTitle = trend.granularity === 'day' ? 'Daily expenses' : 'Monthly expenses';
  const trendTable = {
    columns: [
      { key: 'fullLabel', label: trend.granularity === 'day' ? 'Day' : 'Month' },
      { key: 'income', label: 'Income', align: 'right', format },
      { key: 'expense', label: 'Expenses', align: 'right', format },
      { key: 'savings', label: 'Savings', align: 'right', format },
    ],
    rows: trend.data,
  };
  const shareTable = (rows, label) => ({
    columns: [
      { key: 'name', label },
      { key: 'count', label: 'Transactions', align: 'right' },
      { key: 'total', label: 'Spent', align: 'right', format },
      { key: 'share', label: 'Share', align: 'right', format: (value) => formatPercent(value) },
    ],
    rows: rows.map((row) => ({ ...row, key: row.id })),
  });

  let body;
  if (range.status === 'idle') {
    body = (
      <Card>
        <EmptyState icon={CalendarRange} title="Choose a date range" description="Pick a start and end date to see analytics for that period." />
      </Card>
    );
  } else if (range.status === 'error') {
    body = (
      <Card>
        <ErrorState title="We couldn't load your analytics" error={range.error} onRetry={() => window.location.reload()} />
      </Card>
    );
  } else if (range.status === 'loading') {
    body = (
      <div className="grid gap-4 md:grid-cols-2">
        <SkeletonCard lines={3} className="md:col-span-2" label="Loading analytics…" />
        <SkeletonCard lines={6} />
        <SkeletonCard lines={6} />
      </div>
    );
  } else if (items.length === 0) {
    body = (
      <Card>
        <EmptyState
          icon={ChartPie}
          title="Not enough data yet"
          description="Add a few transactions to see your spending analytics."
          action={
            <Button leftIcon={Plus} onClick={() => openAddTransaction()}>
              Add transaction
            </Button>
          }
        />
      </Card>
    );
  } else {
    const largest = summary.largestExpense;
    const mostUsed = summary.mostUsedCategory;
    body = (
      <div className={cn('space-y-4 transition-opacity sm:space-y-6', range.refreshing && 'opacity-60')}>
        <section aria-labelledby="summary-heading">
          <h2 id="summary-heading" className="mb-3 text-base font-semibold text-ink">
            {SINGLE_MONTH.has(preset) ? 'Monthly summary' : 'Summary'}
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
            <StatCard label="Total income" icon={ArrowDownLeft} value={format(summary.income)} caption={periodLabel} />
            <StatCard label="Total expense" icon={ArrowUpRight} value={format(summary.expense)} caption={periodLabel} />
            <StatCard
              label="Savings"
              icon={PiggyBank}
              value={format(summary.savings)}
              caption={
                summary.savingsRate === null
                  ? 'No income in this period'
                  : `${formatPercent(summary.savingsRate, { digits: 0 })} of income saved`
              }
            />
            <StatCard
              label="Average daily expense"
              icon={CalendarRange}
              value={format(summary.averageDailyExpense)}
              caption={`Over ${summary.days} day${summary.days === 1 ? '' : 's'}`}
            />
            <StatCard
              label="Largest expense"
              icon={Receipt}
              value={largest ? format(largest.amount) : '—'}
              caption={
                largest
                  ? `${largest.description || resolveCategory(largest).name} · ${formatDate(largest.date, 'dd MMM')}`
                  : 'No expenses in this period'
              }
            />
            <StatCard
              label="Most used category"
              icon={Crown}
              value={mostUsed ? mostUsed.name : '—'}
              caption={
                mostUsed
                  ? `${mostUsed.count} transaction${mostUsed.count === 1 ? '' : 's'} · ${format(mostUsed.total)}`
                  : 'No expenses in this period'
              }
            />
          </div>
        </section>

        <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
          <ChartCard title="Spending by category" description={periodLabel} table={shareTable(categoryTotals, 'Category')}>
            {slices.length > 0 ? (
              <CategoryBreakdown slices={slices} total={summary.expense} layout="side" />
            ) : (
              <EmptyState compact title="No expenses in this period" />
            )}
          </ChartCard>
          <ChartCard title="Top spending categories" description="Ranked by amount spent" table={shareTable(categoryTotals, 'Category')}>
            {categoryTotals.length > 0 ? (
              <RankedBarList
                items={categoryTotals}
                renderIcon={(item) => <CategoryBadge icon={item.icon} size="sm" />}
                renderMeta={(item) => `${item.count} transaction${item.count === 1 ? '' : 's'}`}
              />
            ) : (
              <EmptyState compact title="No expenses in this period" />
            )}
          </ChartCard>
        </div>

        <ChartCard title={trendTitle} description={periodLabel} table={trendTable}>
          <ExpenseBarChart data={trend.data} />
        </ChartCard>

        <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
          <ChartCard title="Income vs expenses" description={periodLabel} table={trendTable}>
            <IncomeExpenseChart data={trend.data} />
          </ChartCard>
          <ChartCard
            title="Payment methods"
            description="Where your spending was paid from"
            table={shareTable(methods, 'Payment method')}
          >
            {methods.length > 0 ? (
              <RankedBarList
                items={methods}
                renderMeta={(item) => `${item.count} transaction${item.count === 1 ? '' : 's'}`}
              />
            ) : (
              <EmptyState compact title="No expenses in this period" />
            )}
          </ChartCard>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageHeader title="Analytics" description="Understand where your money goes." />

      <div className="mb-6 flex flex-wrap items-end gap-3">
        <Select
          label="Period"
          hideLabel
          value={preset}
          options={PRESETS}
          onChange={(event) => setFilter({ range: event.target.value })}
          className="w-full sm:w-52"
        />
        {preset === 'custom' && (
          <div className="grid w-full grid-cols-2 gap-2 sm:w-auto">
            <DatePicker label="From" value={from} max={to || undefined} onChange={(value) => setFilter({ from: value })} />
            <DatePicker label="To" value={to} min={from || undefined} onChange={(value) => setFilter({ to: value })} />
          </div>
        )}
      </div>

      {body}
    </>
  );
}
