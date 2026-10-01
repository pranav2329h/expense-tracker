import { createElement } from 'react';
import { CircleAlert, TriangleAlert } from 'lucide-react';
import { useCurrency } from '@/hooks/useCurrency';
import { cn } from '@/utils/cn';

function budgetLabel(alert) {
  return alert.scope === 'overall' ? 'monthly' : alert.name;
}

/**
 * In-app budget alerts (no external notifications). Raised at 80%, 90% and 100% of
 * a budget; each carries an icon and text, so colour is never the only signal.
 */
export function BudgetAlerts({ alerts, className }) {
  const { format } = useCurrency();
  if (alerts.length === 0) return null;

  return (
    <ul className={cn('space-y-2', className)} aria-label="Budget alerts">
      {alerts.map((alert) => {
        const exceeded = alert.level === 'exceeded';
        const message = exceeded
          ? `${alert.scope === 'overall' ? 'Monthly' : alert.name} budget exceeded by ${format(alert.overBy)}.`
          : `You have used ${Math.floor(alert.percent)}% of your ${budgetLabel(alert)} budget.`;
        return (
          <li
            key={alert.id}
            role="status"
            className={cn(
              'flex items-start gap-3 rounded-xl px-4 py-3 text-sm font-medium',
              exceeded ? 'bg-negative-soft text-negative' : 'bg-caution-soft text-caution',
            )}
          >
            {createElement(exceeded ? CircleAlert : TriangleAlert, {
              className: 'mt-0.5 size-4 shrink-0',
              'aria-hidden': true,
            })}
            <span>
              <span className="sr-only">{exceeded ? 'Budget exceeded: ' : 'Budget warning: '}</span>
              {message}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
