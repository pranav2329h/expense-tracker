import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

export function OfflineBanner() {
  const online = useOnlineStatus();
  if (online) return null;
  return (
    <div
      role="status"
      className="flex items-center justify-center gap-2 bg-caution-soft px-4 py-2 text-center text-sm font-medium text-caution"
    >
      <WifiOff className="size-4 shrink-0" aria-hidden="true" />
      You're offline. Changes can't be saved until your connection is back.
    </div>
  );
}
