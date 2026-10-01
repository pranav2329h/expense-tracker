import { cn } from '@/utils/cn';

export function Card({ as: Component = 'section', className, children, ...props }) {
  return (
    <Component
      className={cn('rounded-2xl border border-line bg-surface shadow-[0_1px_2px_rgb(0_0_0/0.04)]', className)}
      {...props}
    >
      {children}
    </Component>
  );
}

export function CardHeader({ title, description, action, titleId, className, as: Heading = 'h2' }) {
  return (
    <div className={cn('flex flex-wrap items-start justify-between gap-x-4 gap-y-2', className)}>
      <div className="min-w-0">
        <Heading id={titleId} className="text-base font-semibold text-ink">
          {title}
        </Heading>
        {description && <p className="mt-0.5 text-sm text-ink-3">{description}</p>}
      </div>
      {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
    </div>
  );
}
