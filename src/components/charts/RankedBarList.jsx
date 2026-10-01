import { useChartTheme } from '@/hooks/useChartTheme';
import { useCurrency } from '@/hooks/useCurrency';
import { formatPercent } from '@/utils/currency';

/**
 * Ranked horizontal bars with direct labels (name, amount, share). A single series,
 * so every bar uses one colour; bar length is relative to the largest item.
 */
export function RankedBarList({ items, limit = 8, renderIcon, renderMeta, color }) {
  const theme = useChartTheme();
  const { format } = useCurrency();
  const visible = items.slice(0, limit);
  const max = visible[0]?.total ?? 0;
  const fill = color ?? theme.expense;

  return (
    <ol className="space-y-3.5">
      {visible.map((item, index) => (
        <li key={item.id}>
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="flex min-w-0 items-center gap-2.5">
              <span className="w-4 shrink-0 text-xs text-ink-3 tabular">{index + 1}</span>
              {renderIcon?.(item)}
              <span className="min-w-0">
                <span className="block truncate font-medium text-ink">{item.name}</span>
                {renderMeta && <span className="block truncate text-xs text-ink-3">{renderMeta(item)}</span>}
              </span>
            </span>
            <span className="shrink-0 text-right">
              <span className="font-semibold text-ink tabular">{format(item.total)}</span>
              <span className="ml-1.5 text-xs text-ink-3 tabular">{formatPercent(item.share, { digits: 0 })}</span>
            </span>
          </div>
          <div className="mt-1.5 ml-6.5 h-1.5 overflow-hidden rounded-full bg-subtle" aria-hidden="true">
            <div
              className="h-full rounded-full"
              style={{ width: `${max > 0 ? Math.max(2, (item.total / max) * 100) : 0}%`, backgroundColor: fill }}
            />
          </div>
        </li>
      ))}
    </ol>
  );
}
