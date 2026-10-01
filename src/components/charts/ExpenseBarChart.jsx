import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useChartTheme } from '@/hooks/useChartTheme';
import { useCurrency } from '@/hooks/useCurrency';
import { ChartTooltip } from './ChartTooltip';

/**
 * Single-series column chart of expenses per period (month or day). One series, so
 * no legend — the card title names it. Expenses keep their colour across all charts.
 */
export function ExpenseBarChart({ data, height = 260 }) {
  const theme = useChartTheme();
  const { format, formatCompact } = useCurrency();

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: 0 }} barCategoryGap="24%">
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
        <Bar dataKey="expense" name="Expenses" fill={theme.expense} radius={[4, 4, 0, 0]} maxBarSize={24} />
      </BarChart>
    </ResponsiveContainer>
  );
}
