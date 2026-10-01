import { Navigate, Outlet, useLocation } from 'react-router';
import { FullPageLoader } from '@/components/common/LoadingSpinner';
import { UserDataProvider } from '@/context/DataContext';
import { TransactionModalProvider } from '@/context/TransactionModalContext';
import { useAuth } from '@/hooks/useAuth';
import { SetupGate } from './SetupGate';

/**
 * Only signed-in users get past this route. User data providers are keyed by uid,
 * so switching accounts tears down every listener and starts fresh. (The real
 * security boundary is firestore.rules — this only controls what the UI shows.)
 */
export function ProtectedRoute() {
  const { user, initializing } = useAuth();
  const location = useLocation();

  if (initializing) return <FullPageLoader label="Checking your session…" />;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;

  return (
    <UserDataProvider key={user.uid}>
      <SetupGate>
        <TransactionModalProvider>
          <Outlet />
        </TransactionModalProvider>
      </SetupGate>
    </UserDataProvider>
  );
}
