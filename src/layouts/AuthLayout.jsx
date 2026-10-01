import { createElement } from 'react';
import { Outlet } from 'react-router';
import { ArrowLeftRight, ChartPie, Cloud, ShieldCheck, Target } from 'lucide-react';
import { Logo } from '@/components/common/Logo';

const FEATURES = [
  { icon: ArrowLeftRight, title: 'Every transaction in one place', text: 'Log expenses and income in seconds, from any device.' },
  { icon: Target, title: 'Budgets that warn you early', text: 'Monthly and category limits with alerts at 80%, 90% and 100%.' },
  { icon: ChartPie, title: 'Clear analytics', text: 'See where your money goes by category, month and payment method.' },
  { icon: Cloud, title: 'Synced everywhere', text: 'Your data follows you across phone, tablet and desktop.' },
];

/** Split layout for sign-in pages: product summary on large screens, form on the right. */
export default function AuthLayout() {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <aside className="hidden flex-col justify-between border-r border-line bg-surface p-10 xl:p-14 lg:flex">
        <Logo />
        <div className="max-w-md">
          <h2 className="text-3xl font-semibold tracking-tight text-ink">Know exactly where your money goes.</h2>
          <ul className="mt-10 space-y-6">
            {FEATURES.map((feature) => (
              <li key={feature.title} className="flex gap-4">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand-text">
                  {createElement(feature.icon, { className: 'size-5', 'aria-hidden': true })}
                </span>
                <div>
                  <p className="text-sm font-semibold text-ink">{feature.title}</p>
                  <p className="mt-0.5 text-sm text-ink-3">{feature.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <p className="flex items-center gap-2 text-xs text-ink-3">
          <ShieldCheck className="size-4" aria-hidden="true" />
          Your data is private to your account and protected by Firebase security rules.
        </p>
      </aside>

      <main className="flex flex-col items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-sm">
          <div className="mb-10 lg:hidden">
            <Logo />
          </div>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
