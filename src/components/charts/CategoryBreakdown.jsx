import { useMemo } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { useChartTheme } from '@/hooks/useChartTheme';
import { useCurrency } from '@/hooks/useCurrency';
import { formatPercent } from '@/utils/currency';
import { cn } from '@/utils/cn';
import { ChartTooltip } from './ChartTooltip';

/**
 * Spending by category: a donut (at most 5 categories + "Other") with a labelled
 * legend listing every slice's amount and share, so no value depends on colour alone.
 */
export function CategoryBreakdown({ slices, total, layout = 'stacked', height = 200 }) {
  const theme = useChartTheme();
  const { format } = useCurrency();

  const data = useMemo(
    () =>
      slices.map((slice, index) => ({
        ...slice,
        fill: slice.isOther ? theme.other : theme.series[index % theme.series.length],
      })),
    [slices, theme],
  );

  return (
    <div className={cn('flex gap-5', layout === 'side' ? 'flex-col sm:flex-row sm:items-center' : 'flex-col')}>
      <div className={cn('relative mx-auto w-full', layout === 'side' ? 'max-w-[240px]' : 'max-w-[220px]')} style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="total"
              nameKey="name"
              innerRadius="64%"
              outerRadius="96%"
              startAngle={90}
              endAngle={-270}
              stroke={theme.surface}
              strokeWidth={2}
              isAnimationActive={false}
            >
              {data.map((entry) => (
                <Cell key={entry.id} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip formatValue={format} labelKey="__none__" />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
          <div>
            <p className="text-xs text-ink-3">Total spent</p>
            <p className="text-base font-semibold text-ink">{format(total)}</p>
          </div>
        </div>
      </div>

      <ul className="min-w-0 flex-1 space-y-2">
        {data.map((entry) => (
          <li key={entry.id} className="flex items-center gap-2.5 text-sm">
            <span className="size-2.5 shrink-0 rounded-[3px]" style={{ backgroundColor: entry.fill }} aria-hidden="true" />
            <span className="min-w-0 flex-1 truncate text-ink-2">{entry.name}</span>
            <span className="font-medium text-ink tabular">{format(entry.total)}</span>
            <span className="w-11 text-right text-xs text-ink-3 tabular">{formatPercent(entry.share, { digits: 0 })}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
