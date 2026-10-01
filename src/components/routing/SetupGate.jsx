import { lazy, Suspense, useEffect } from 'react';
import { LogOut, RefreshCw } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { ErrorState } from '@/components/common/ErrorState';
import { FullPageLoader } from '@/components/common/LoadingSpinner';
import { Logo } from '@/components/common/Logo';
import { signOutUser } from '@/firebase/auth';
import { useSettings } from '@/hooks/useSettings';
import { useTheme } from '@/hooks/useTheme';

const Onboarding = lazy(() => import('@/pages/Onboarding'));

function SetupError({ error }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-page px-4">
      <Logo />
      <div className="w-full max-w-md rounded-2xl border border-line bg-surface">
        <ErrorState title="We couldn't load your account" error={error} />
        <div className="flex justify-center gap-2 px-6 pb-8">
          <Button variant="secondary" leftIcon={LogOut} onClick={() => signOutUser()}>
            Sign out
          </Button>
          <Button leftIcon={RefreshCw} onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * Waits for the user's settings document. Missing settings mean first login, so the
 * onboarding screen is shown instead of the app. Also applies the saved theme.
 */
export function SetupGate({ children }) {
  const { status, error, offline, settings } = useSettings();
  const { setPreference } = useTheme();
  const savedTheme = status === 'ready' ? settings.theme : null;

  useEffect(() => {
    if (savedTheme) setPreference(savedTheme);
  }, [savedTheme, setPreference]);

  if (status === 'loading') {
    return (
      <FullPageLoader label={offline ? "You're offline. Waiting for a connection…" : 'Loading your data…'} />
    );
  }
  if (status === 'error') return <SetupError error={error} />;
  if (status === 'missing') {
    return (
      <Suspense fallback={<FullPageLoader />}>
        <Onboarding />
      </Suspense>
    );
  }
  return children;
}
