import { Link } from 'react-router';
import { Compass } from 'lucide-react';
import { Logo } from '@/components/common/Logo';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

export default function NotFound() {
  useDocumentTitle('Page not found');
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-8 bg-page px-4 text-center">
      <Logo />
      <div>
        <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-subtle text-ink-2">
          <Compass className="size-6" aria-hidden="true" />
        </span>
        <h1 className="mt-4 text-xl font-semibold text-ink">Page not found</h1>
        <p className="mt-1.5 text-sm text-ink-3">The page you're looking for doesn't exist or has moved.</p>
        <Link
          to="/dashboard"
          className="mt-6 inline-flex h-10 items-center rounded-lg bg-brand px-4 text-sm font-medium text-white hover:bg-brand-hover"
        >
          Go to dashboard
        </Link>
      </div>
    </div>
  );
}
