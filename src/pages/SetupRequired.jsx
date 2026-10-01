import { Settings2 } from 'lucide-react';
import { Logo } from '@/components/common/Logo';

/** Shown instead of the app when the Firebase environment variables are missing. */
export default function SetupRequired({ missing }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-8 bg-page px-4 py-10">
      <Logo />
      <div className="w-full max-w-lg rounded-2xl border border-line bg-surface p-6 sm:p-8">
        <span className="grid size-11 place-items-center rounded-xl bg-caution-soft text-caution">
          <Settings2 className="size-5" aria-hidden="true" />
        </span>
        <h1 className="mt-4 text-lg font-semibold text-ink">Firebase isn't configured yet</h1>
        <p className="mt-1.5 text-sm text-ink-2">
          Add your Firebase web app settings as environment variables, then restart the dev server (or redeploy).
          These variables are missing:
        </p>
        <ul className="mt-4 space-y-1.5 rounded-xl bg-subtle p-4 font-mono text-xs text-ink">
          {missing.map((name) => (
            <li key={name}>{name}</li>
          ))}
        </ul>
        <ol className="mt-5 list-decimal space-y-1.5 pl-5 text-sm text-ink-2">
          <li>
            Copy <code className="rounded bg-subtle px-1 py-0.5 text-xs">.env.example</code> to{' '}
            <code className="rounded bg-subtle px-1 py-0.5 text-xs">.env</code>.
          </li>
          <li>Fill in the values from Firebase Console → Project settings → Your apps.</li>
          <li>
            On Vercel, add the same variables under Project → Settings → Environment Variables and redeploy.
          </li>
        </ol>
        <p className="mt-5 text-xs text-ink-3">See README.md and docs/FIREBASE_SETUP.md for step-by-step instructions.</p>
      </div>
    </div>
  );
}
