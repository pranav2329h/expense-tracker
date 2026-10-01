import { Suspense, useCallback, useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router';
import { Avatar } from '@/components/common/Avatar';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { Logo } from '@/components/common/Logo';
import { OfflineBanner } from '@/components/common/OfflineBanner';
import { SkeletonCard } from '@/components/common/Skeleton';
import { MobileNav } from '@/components/layout/MobileNav';
import { Sidebar } from '@/components/layout/Sidebar';
import { signOutUser } from '@/firebase/auth';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { getErrorMessage } from '@/utils/errors';

function PageFallback() {
  return (
    <div className="space-y-4" aria-busy="true">
      <SkeletonCard lines={2} label="Loading page…" />
      <SkeletonCard lines={5} />
    </div>
  );
}

function MobileHeader() {
  const { user } = useAuth();
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-line bg-surface/95 px-4 backdrop-blur lg:hidden">
      <Link to="/dashboard" aria-label="Go to dashboard">
        <Logo />
      </Link>
      <Link to="/settings" aria-label="Open settings" className="rounded-full">
        <Avatar src={user?.photoURL} name={user?.displayName} email={user?.email} size="sm" />
      </Link>
    </header>
  );
}

/**
 * Signed-in shell: sidebar on large screens; compact header + bottom navigation on
 * phones and tablets (with the Add button in the centre).
 */
export default function DashboardLayout() {
  const toast = useToast();
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  const handleLogout = useCallback(async () => {
    try {
      await signOutUser();
      toast.info("You've been logged out.");
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to log out. Please try again.'));
    }
  }, [toast]);

  return (
    <div className="min-h-dvh">
      <a
        href="#main"
        className="sr-only z-50 rounded-lg bg-surface px-4 py-2 text-sm font-medium shadow focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>
      <Sidebar onLogout={handleLogout} />
      <div className="lg:pl-64">
        <MobileHeader />
        <OfflineBanner />
        <main id="main" tabIndex={-1} className="mx-auto w-full max-w-7xl px-4 pt-5 pb-28 outline-none sm:px-6 lg:px-8 lg:pt-8 lg:pb-12">
          <ErrorBoundary key={pathname}>
            <Suspense fallback={<PageFallback />}>
              <Outlet />
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>
      <MobileNav onLogout={handleLogout} />
    </div>
  );
}
