import { Navigate, Outlet, useLocation } from 'react-router';
import { FullPageLoader } from '@/components/common/LoadingSpinner';
import { useAuth } from '@/hooks/useAuth';

const AUTH_PATHS = ['/login', '/register', '/forgot-password'];

/** Login / register pages. Signed-in users are sent to the page they wanted, or the dashboard. */
export function PublicOnlyRoute() {
  const { user, initializing } = useAuth();
  const location = useLocation();

  if (initializing) return <FullPageLoader label="Checking your session…" />;

  if (user) {
    const from = location.state?.from;
    const target =
      from?.pathname && !AUTH_PATHS.includes(from.pathname)
        ? `${from.pathname}${from.search ?? ''}${from.hash ?? ''}`
        : '/dashboard';
    return <Navigate to={target} replace />;
  }

  return <Outlet />;
}
