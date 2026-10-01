import { cn } from '@/utils/cn';

const LEVEL_COLORS = {
  ok: 'var(--meter-ok)',
  warning: 'var(--meter-warning)',
  serious: 'var(--meter-serious)',
  critical: 'var(--meter-critical)',
  exceeded: 'var(--meter-critical)',
};

/**
 * Meter whose fill colour carries severity; the track is a light tint of the same hue.
 * Always pair it with a visible percentage/label — colour is never the only signal.
 */
export function ProgressBar({ value, level = 'ok', label, size = 'md', className }) {
  const percent = Number.isFinite(value) ? Math.max(0, value) : 0;
  const color = LEVEL_COLORS[level] ?? LEVEL_COLORS.ok;
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(Math.min(percent, 100))}
      aria-valuetext={`${Math.round(percent)}%`}
      className={cn('w-full overflow-hidden rounded-full', size === 'lg' ? 'h-3' : 'h-2', className)}
      style={{ backgroundColor: `color-mix(in oklab, ${color} 18%, transparent)` }}
    >
      <div
        className="h-full rounded-full transition-[width] duration-500"
        style={{ width: `${Math.min(percent, 100)}%`, backgroundColor: color }}
      />
    </div>
  );
}
