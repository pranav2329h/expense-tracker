import { Link } from 'react-router';
import { ArrowRight, Target } from 'lucide-react';
import { BudgetProgress } from '@/components/budgets/BudgetProgress';
import { Card, CardHeader } from '@/components/common/Card';
import { EmptyState } from '@/components/common/EmptyState';
import { formatMonthKey } from '@/utils/dates';

/** This month's overall budget at a glance, or a prompt to set one. */
export function MonthlyBudgetCard({ progress, monthKey, categoryBudgetCount }) {
  return (
    <Card className="flex flex-col p-4 sm:p-5">
      <CardHeader
        title="Monthly budget"
        description={formatMonthKey(monthKey)}
        action={
          <Link
            to="/budgets"
            className="inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-brand-text hover:bg-brand-soft"
          >
            Budgets
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        }
      />
      <div className="mt-5 flex flex-1 flex-col justify-center">
        {progress ? (
          <>
            <BudgetProgress progress={progress} label="Monthly budget used" />
            {categoryBudgetCount > 0 && (
              <p className="mt-4 text-xs text-ink-3">
                Plus {categoryBudgetCount} category budget{categoryBudgetCount === 1 ? '' : 's'} on the Budgets page.
              </p>
            )}
          </>
        ) : (
          <EmptyState
            compact
            icon={Target}
            title="No monthly budget yet"
            description="Set a spending limit to get alerts at 80%, 90% and 100%."
            action={
              <Link
                to="/budgets"
                className="inline-flex h-9 items-center rounded-lg border border-line-strong px-3 text-sm font-medium text-ink hover:bg-subtle"
              >
                Set a budget
              </Link>
            }
          />
        )}
      </div>
    </Card>
  );
}
