import { cn } from '@/utils/cn';

export function Skeleton({ className }) {
  return <div aria-hidden="true" className={cn('animate-pulse rounded-md bg-muted', className)} />;
}

/** A card-shaped placeholder with a few text lines. */
export function SkeletonCard({ lines = 3, className, label = 'Loading…' }) {
  return (
    <div
      role="status"
      aria-label={label}
      className={cn('rounded-2xl border border-line bg-surface p-5', className)}
    >
      <Skeleton className="h-4 w-1/3" />
      <div className="mt-4 space-y-3">
        {Array.from({ length: lines }, (_, index) => (
          <Skeleton key={index} className={cn('h-3', index % 2 ? 'w-2/3' : 'w-full')} />
        ))}
      </div>
    </div>
  );
}

/** List rows placeholder (icon + two lines + amount). */
export function SkeletonList({ rows = 5, label = 'Loading transactions…' }) {
  return (
    <div role="status" aria-label={label} className="divide-y divide-line">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="flex items-center gap-3 py-3">
          <Skeleton className="size-10 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-1/2" />
            <Skeleton className="h-3 w-1/3" />
          </div>
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  );
}
