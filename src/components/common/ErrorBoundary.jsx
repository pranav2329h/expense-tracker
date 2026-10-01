import { Component } from 'react';
import { RefreshCw, TriangleAlert } from 'lucide-react';
import { Button } from './Button';

/**
 * Catches render errors (including failed lazy-loaded chunks after a new deploy)
 * and shows a recovery screen instead of a blank page. No stack traces are shown.
 */
export class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    if (import.meta.env.DEV) console.error(error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div role="alert" className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
        <span className="mb-4 grid size-12 place-items-center rounded-2xl bg-caution-soft text-caution">
          <TriangleAlert className="size-6" aria-hidden="true" />
        </span>
        <h1 className="text-lg font-semibold text-ink">Something went wrong</h1>
        <p className="mt-1.5 max-w-sm text-sm text-ink-3">
          An unexpected error occurred. Reloading the page usually fixes it — your data is safe.
        </p>
        <Button className="mt-5" leftIcon={RefreshCw} onClick={() => window.location.reload()}>
          Reload page
        </Button>
      </div>
    );
  }
}
