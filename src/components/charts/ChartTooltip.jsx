/**
 * Recharts tooltip content: value first (strong), series name second, keyed with a
 * short line in the series colour. Text always uses ink colours, never the series colour.
 */
export function ChartTooltip({ active, payload, label, formatValue, labelKey = 'fullLabel' }) {
  if (!active || !payload?.length) return null;
  const heading = payload[0]?.payload?.[labelKey] ?? label;

  return (
    <div className="min-w-36 rounded-lg border border-line bg-surface px-3 py-2.5 text-xs shadow-lg">
      {heading && <p className="mb-1.5 font-medium text-ink-2">{heading}</p>}
      <ul className="space-y-1">
        {payload.map((item) => (
          <li key={item.dataKey ?? item.name} className="flex items-center gap-2">
            <span
              className="h-[3px] w-3 shrink-0 rounded-full"
              style={{ backgroundColor: item.payload?.fill ?? item.color }}
              aria-hidden="true"
            />
            <span className="font-semibold text-ink tabular">{formatValue(item.value)}</span>
            <span className="text-ink-3">{item.name}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ChartLegend({ items }) {
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-2">
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-[3px]" style={{ backgroundColor: item.color }} aria-hidden="true" />
          {item.label}
        </li>
      ))}
    </ul>
  );
}
