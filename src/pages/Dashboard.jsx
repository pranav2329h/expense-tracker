import { useMemo } from 'react';
import { Link } from 'react-router';
import { ArrowDownLeft, ArrowUpRight, CalendarDays, PiggyBank, Plus, Receipt, Wallet } from 'lucide-react';
import { BudgetAlerts } from '@/components/budgets/BudgetAlerts';
import { CategoryBreakdown } from '@/components/charts/CategoryBreakdown';
import { ChartCard } from '@/components/charts/ChartCard';
import { ExpenseBarChart } from '@/components/charts/ExpenseBarChart';
import { IncomeExpenseChart } from '@/components/charts/IncomeExpenseChart';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { PageHeader } from '@/components/common/PageHeader';
import { SkeletonCard } from '@/components/common/Skeleton';
import { StatCard } from '@/components/common/StatCard';
import { MonthlyBudgetCard } from '@/components/dashboard/MonthlyBudgetCard';
import { RecentTransactions } from '@/components/dashboard/RecentTransactions';
import { useAuth } from '@/hooks/useAuth';
import { useBudgets } from '@/hooks/useBudgets';
import { useCategories } from '@/hooks/useCategories';
import { useCurrency } from '@/hooks/useCurrency';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useTransactionModal } from '@/hooks/useTransactionModal';
import { useRecentTransactions, useTransactionTotals } from '@/hooks/useTransactions';
import {
  filterByMonth,
  getBudgetAlerts,
  getBudgetProgress,
  getCategoryTotals,
  getDashboardSummary,
  getMonthlyTotals,
  toDonutSlices,
} from '@/utils/calculations';
import { formatPercent } from '@/utils/currency';
import { currentMonthKey, formatMonthKey, getRecentMonthKeys, shiftMonthKey } from '@/utils/dates';
import { sortTransactions } from '@/utils/transactions';

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

const monthTable = (format) => ({
  columns: [
    { key: 'fullLabel', label: 'Month' },
    { key: 'income', label: 'Income', align: 'right', format },
    { key: 'expense', label: 'Expenses', align: 'right', format },
    { key: 'savings', label: 'Savings', align: 'right', format },
  ],
});

export default function Dashboard() {
  useDocumentTitle('Dashboard');
  const { user } = useAuth();
  const { items, status, error } = useRecentTransactions();
  const { totals, loading: totalsLoading, error: totalsError } = useTransactionTotals();
  const { resolveCategory } = useCategories();
  const { budgets, categoryBudgets } = useBudgets();
  const { format } = useCurrency();
  const { openAddTransaction } = useTransactionModal();

  const monthKey = currentMonthKey();
  const monthKeys = useMemo(() => getRecentMonthKeys(6), []);

  const summary = useMemo(
    () => getDashboardSummary({ totals, transactions: items, monthKey, previousMonthKey: shiftMonthKey(monthKey, -1) }),
    [totals, items, monthKey],
  );
  const monthly = useMemo(() => getMonthlyTotals(items, monthKeys), [items, monthKeys]);
  const monthTransactions = useMemo(() => filterByMonth(items, monthKey), [items, monthKey]);
  const categoryTotals = useMemo(
    () => getCategoryTotals(monthTransactions, resolveCategory),
    [monthTransactions, resolveCategory],
  );
  const slices = useMemo(() => toDonutSlices(categoryTotals), [categoryTotals]);
  const budgetProgress = useMemo(() => getBudgetProgress(budgets, monthTransactions), [budgets, monthTransactions]);
  const alerts = useMemo(() => getBudgetAlerts(budgetProgress), [budgetProgress]);
  const recent = useMemo(() => sortTransactions(items).slice(0, 8), [items]);

  const loading = status === 'loading';
  const totalsUnavailable = Boolean(totalsError) && !totals;
  const hasAnyTransactions = items.length > 0 || (totals?.count ?? 0) > 0;
  const firstName = user?.displayName?.split(' ')[0];
  const allTime = (value) => (totalsUnavailable ? '—' : format(value ?? 0));

  return (
    <>
      <PageHeader
        title={`${greeting()}${firstName ? `, ${firstName}` : ''}`}
        description={`Here's your financial overview for ${formatMonthKey(monthKey)}.`}
        actions={
          <div className="hidden sm:block">
            <Button leftIcon={Plus} onClick={() => openAddTransaction()}>
              Add transaction
            </Button>
          </div>
        }
      />

      {status === 'error' ? (
        <Card>
          <ErrorState title="We couldn't load your dashboard" error={error} onRetry={() => window.location.reload()} />
        </Card>
      ) : (
        <div className="space-y-4 sm:space-y-6">
          <section aria-label="Summary" className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-5">
            <StatCard
              className="col-span-2 md:col-span-1"
              emphasis
              label="Total balance"
              icon={Wallet}
              value={allTime(summary.balance)}
              loading={totalsLoading || loading}
              change={summary.balanceChange ?? undefined}
              caption={
                totalsUnavailable
                  ? 'Totals are unavailable right now'
                  : summary.balanceChange === null
                    ? 'All income minus all expenses'
                    : 'this month'
              }
            />
            <StatCard
              label="Total income"
              icon={ArrowDownLeft}
              value={allTime(summary.totalIncome)}
              loading={totalsLoading}
              caption="All time"
            />
            <StatCard
              label="Total expenses"
              icon={ArrowUpRight}
              value={allTime(summary.totalExpenses)}
              loading={totalsLoading}
              caption="All time"
            />
            <StatCard
              label="Monthly expenses"
              icon={CalendarDays}
              value={format(summary.monthlyExpenses)}
              loading={loading}
              change={summary.monthlyExpensesChange ?? undefined}
              changeUpIsGood={false}
              caption={summary.monthlyExpensesChange === null ? formatMonthKey(monthKey) : 'vs last month'}
            />
            <StatCard
              label="Monthly savings"
              icon={PiggyBank}
              value={format(summary.monthlySavings)}
              loading={loading}
              caption={
                summary.savingsRate === null
                  ? 'No income recorded this month'
                  : `${formatPercent(summary.savingsRate, { digits: 0 })} of this month's income`
              }
            />
          </section>

          {alerts.length > 0 && <BudgetAlerts alerts={alerts} />}

          {loading ? (
            <div className="grid gap-4 lg:grid-cols-3">
              <SkeletonCard lines={6} className="lg:col-span-2" label="Loading charts…" />
              <SkeletonCard lines={6} />
            </div>
          ) : !hasAnyTransactions ? (
            <Card>
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
            </Card>
          ) : (
            <>
              <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
                <ChartCard
                  className="lg:col-span-2"
                  title="Monthly expenses"
                  description="Last 6 months"
                  table={{ ...monthTable(format), rows: monthly }}
                >
                  <ExpenseBarChart data={monthly} />
                </ChartCard>
                <ChartCard
                  title="Spending by category"
                  description={formatMonthKey(monthKey)}
                  table={{
                    columns: [
                      { key: 'name', label: 'Category' },
                      { key: 'total', label: 'Spent', align: 'right', format },
                      { key: 'share', label: 'Share', align: 'right', format: (v) => formatPercent(v) },
                    ],
                    rows: categoryTotals.map((row) => ({ ...row, key: row.id })),
                  }}
                >
                  {slices.length > 0 ? (
                    <CategoryBreakdown slices={slices} total={summary.monthlyExpenses} />
                  ) : (
                    <EmptyState compact title="No expenses this month" description="Spending by category will appear here." />
                  )}
                </ChartCard>
              </div>

              <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
                <ChartCard
                  className="lg:col-span-2"
                  title="Income vs expenses"
                  description="Last 6 months"
                  table={{ ...monthTable(format), rows: monthly }}
                >
                  <IncomeExpenseChart data={monthly} />
                </ChartCard>
                <MonthlyBudgetCard
                  progress={budgetProgress.find((item) => item.scope === 'overall') ?? null}
                  monthKey={monthKey}
                  categoryBudgetCount={categoryBudgets.length}
                />
              </div>
            </>
          )}

          {(loading || hasAnyTransactions) && <RecentTransactions transactions={recent} loading={loading} />}

          {!loading && hasAnyTransactions && (
            <p className="text-center text-xs text-ink-3">
              Looking for more detail?{' '}
              <Link to="/analytics" className="font-medium text-brand-text hover:underline">
                Open analytics
              </Link>
            </p>
          )}
        </div>
      )}
    </>
  );
}
