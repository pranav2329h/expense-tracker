import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useChartTheme } from '@/hooks/useChartTheme';
import { useCurrency } from '@/hooks/useCurrency';
import { ChartLegend, ChartTooltip } from './ChartTooltip';

/** Grouped columns comparing income and expense per period, on a single shared axis. */
export function IncomeExpenseChart({ data, height = 260 }) {
  const theme = useChartTheme();
  const { format, formatCompact } = useCurrency();

  return (
    <div className="space-y-3">
      <ChartLegend
        items={[
          { label: 'Income', color: theme.income },
          { label: 'Expenses', color: theme.expense },
        ]}
      />
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: 0 }} barGap={2} barCategoryGap="22%">
          <CartesianGrid vertical={false} stroke={theme.grid} />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={{ stroke: theme.baseline }}
            tick={{ fill: theme.axis, fontSize: 12 }}
            interval="preserveStartEnd"
            minTickGap={6}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fill: theme.axis, fontSize: 12 }}
            tickFormatter={formatCompact}
            width={56}
            allowDecimals={false}
          />
          <Tooltip cursor={{ fill: theme.cursor }} content={<ChartTooltip formatValue={format} />} />
          <Bar dataKey="income" name="Income" fill={theme.income} radius={[4, 4, 0, 0]} maxBarSize={20} />
          <Bar dataKey="expense" name="Expenses" fill={theme.expense} radius={[4, 4, 0, 0]} maxBarSize={20} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
