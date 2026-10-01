import { WalletMinimal } from 'lucide-react';
import { APP_NAME } from '@/utils/constants';
import { cn } from '@/utils/cn';

export function Logo({ className, showName = true }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <span className="grid size-8 place-items-center rounded-lg bg-brand text-white shadow-sm">
        <WalletMinimal className="size-[18px]" aria-hidden="true" />
      </span>
      {showName && <span className="text-[15px] font-semibold tracking-tight text-ink">{APP_NAME}</span>}
    </span>
  );
}
