import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import { ChevronLeft, ChevronRight, Pencil, Plus, Target, Trash2 } from 'lucide-react';
import { BudgetAlerts } from '@/components/budgets/BudgetAlerts';
import { BudgetCard } from '@/components/budgets/BudgetCard';
import { BudgetFormModal } from '@/components/budgets/BudgetFormModal';
import { BudgetProgress } from '@/components/budgets/BudgetProgress';
import { Button, IconButton } from '@/components/common/Button';
import { Card, CardHeader } from '@/components/common/Card';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { PageHeader } from '@/components/common/PageHeader';
import { SkeletonCard } from '@/components/common/Skeleton';
import { useBudgets } from '@/hooks/useBudgets';
import { useCurrency } from '@/hooks/useCurrency';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useToast } from '@/hooks/useToast';
import { useTransactionRange } from '@/hooks/useTransactions';
import { deleteBudget, OVERALL_BUDGET_ID } from '@/services/budgetService';
import { getBudgetAlerts, getBudgetProgress, sumByType } from '@/utils/calculations';
import { currentMonthKey, formatMonthKey, getMonthRange, isValidMonthKey, shiftMonthKey } from '@/utils/dates';
import { cn } from '@/utils/cn';
import { assertOnline, getErrorMessage } from '@/utils/errors';

export default function Budgets() {
  useDocumentTitle('Budgets');
  const [params, setParams] = useSearchParams();
  const thisMonth = currentMonthKey();
  const requested = params.get('month');
  const monthKey = isValidMonthKey(requested) && requested <= thisMonth ? requested : thisMonth;
  const { startDate, endDate } = getMonthRange(monthKey);

  const { budgets, overallBudget, categoryBudgets, status, error } = useBudgets();
  const range = useTransactionRange(startDate, endDate);
  const { format } = useCurrency();
  const toast = useToast();

  const [editor, setEditor] = useState({ open: false, scope: 'category', budget: null });
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const progress = useMemo(() => getBudgetProgress(budgets, range.items), [budgets, range.items]);
  const progressById = useMemo(() => new Map(progress.map((item) => [item.id, item])), [progress]);
  const alerts = useMemo(() => getBudgetAlerts(progress), [progress]);
  const monthSpent = useMemo(() => sumByType(range.items).expense, [range.items]);

  const goToMonth = (key) => setParams(key === thisMonth ? {} : { month: key }, { replace: true });

  const openEditor = (scope, budget = null) => setEditor({ open: true, scope, budget });

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      assertOnline();
      await deleteBudget(pendingDelete.id);
      toast.success('Budget deleted.');
      setPendingDelete(null);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Unable to delete the budget. Please try again.'));
    } finally {
      setDeleting(false);
    }
  };

  const loading = status === 'loading' || range.status === 'loading';
  const failed = status === 'error' || range.status === 'error';
  const overallProgress = overallBudget ? progressById.get(OVERALL_BUDGET_ID) : null;

  return (
    <>
      <PageHeader
        title="Budgets"
        description="Monthly spending limits. Budgets repeat every month until you change them."
        actions={
          <Button leftIcon={Plus} onClick={() => openEditor('category')}>
            New category budget
          </Button>
        }
      />

      <div className="mb-5 flex items-center justify-between gap-3 rounded-2xl border border-line bg-surface p-2">
        <IconButton icon={ChevronLeft} label="Previous month" onClick={() => goToMonth(shiftMonthKey(monthKey, -1))} />
        <div className="text-center">
          <p className="text-sm font-semibold text-ink" aria-live="polite">
            {formatMonthKey(monthKey)}
          </p>
          <p className="text-xs text-ink-3">{loading ? 'Loading…' : `${format(monthSpent)} spent`}</p>
        </div>
        <IconButton
          icon={ChevronRight}
          label="Next month"
          onClick={() => goToMonth(shiftMonthKey(monthKey, 1))}
          disabled={monthKey >= thisMonth}
        />
      </div>

      {failed ? (
        <Card>
          <ErrorState
            title="We couldn't load your budgets"
            error={error ?? range.error}
            onRetry={() => window.location.reload()}
          />
        </Card>
      ) : loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          <SkeletonCard lines={4} className="md:col-span-2" label="Loading budgets…" />
          <SkeletonCard lines={3} />
          <SkeletonCard lines={3} />
        </div>
      ) : (
        <div className={cn('space-y-6 transition-opacity', range.refreshing && 'opacity-60')}>
          {alerts.length > 0 && <BudgetAlerts alerts={alerts} />}

          <Card className="p-4 sm:p-6">
            <CardHeader
              title="Overall monthly budget"
              description="Covers all expenses in the month."
              action={
                overallBudget && (
                  <>
                    <Button variant="ghost" size="sm" leftIcon={Pencil} onClick={() => openEditor('overall', overallBudget)}>
                      Edit
                    </Button>
                    <Button
                      variant="danger-ghost"
                      size="sm"
                      leftIcon={Trash2}
                      onClick={() => setPendingDelete(overallBudget)}
                      aria-label="Delete overall monthly budget"
                    >
                      Delete
                    </Button>
                  </>
                )
              }
            />
            <div className="mt-5">
              {overallProgress ? (
                <BudgetProgress progress={overallProgress} label="Overall monthly budget used" size="lg" />
              ) : (
                <EmptyState
                  compact
                  icon={Target}
                  title="No overall budget yet"
                  description="Set one limit for all your spending each month."
                  action={
                    <Button variant="secondary" leftIcon={Plus} onClick={() => openEditor('overall')}>
                      Set monthly budget
                    </Button>
                  }
                />
              )}
            </div>
          </Card>

          <section aria-labelledby="category-budgets-heading">
            <h2 id="category-budgets-heading" className="mb-3 text-base font-semibold text-ink">
              Category budgets
            </h2>
            {categoryBudgets.length === 0 ? (
              <Card>
                <EmptyState
                  icon={Target}
                  title="No category budgets yet"
                  description="Create budgets for categories like Food, Travel or Shopping — or group several, such as Rent, Electricity and Internet as “Bills”."
                  action={
                    <Button leftIcon={Plus} onClick={() => openEditor('category')}>
                      New category budget
                    </Button>
                  }
                />
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {categoryBudgets.map((budget) => (
                  <BudgetCard
                    key={budget.id}
                    progress={progressById.get(budget.id)}
                    onEdit={(item) => openEditor('category', item)}
                    onDelete={setPendingDelete}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      <BudgetFormModal
        open={editor.open}
        scope={editor.scope}
        budget={editor.budget}
        onClose={() => setEditor((current) => ({ ...current, open: false }))}
      />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete budget?"
        description={
          pendingDelete
            ? `This removes the ${pendingDelete.scope === 'overall' ? 'overall monthly' : `“${pendingDelete.name}”`} budget. Your transactions are not affected.`
            : ''
        }
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </>
  );
}
