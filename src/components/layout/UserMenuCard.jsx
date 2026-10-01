import { Avatar } from '@/components/common/Avatar';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/utils/cn';

/** Signed-in user's photo, name and email. */
export function UserMenuCard({ className }) {
  const { user } = useAuth();
  return (
    <div className={cn('flex min-w-0 items-center gap-3', className)}>
      <Avatar src={user?.photoURL} name={user?.displayName} email={user?.email} />
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-ink">{user?.displayName || 'Your account'}</p>
        <p className="truncate text-xs text-ink-3">{user?.email}</p>
      </div>
    </div>
  );
}
