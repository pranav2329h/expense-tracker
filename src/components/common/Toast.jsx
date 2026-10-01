import { createPortal } from 'react-dom';
import { CircleAlert, CircleCheck, Info, X } from 'lucide-react';
import { cn } from '@/utils/cn';

const TONES = {
  success: { icon: CircleCheck, iconClass: 'text-positive', label: 'Success' },
  error: { icon: CircleAlert, iconClass: 'text-negative', label: 'Error' },
  info: { icon: Info, iconClass: 'text-brand-text', label: 'Notice' },
};

function ToastItem({ toast, onDismiss }) {
  const tone = TONES[toast.tone] ?? TONES.info;
  const Icon = tone.icon;
  return (
    <div
      role={toast.tone === 'error' ? 'alert' : 'status'}
      className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border border-line bg-surface p-3.5 pr-2 shadow-lg motion-safe:animate-toast-in"
    >
      <Icon className={cn('mt-0.5 size-5 shrink-0', tone.iconClass)} aria-hidden="true" />
      <div className="min-w-0 flex-1 text-sm">
        <span className="sr-only">{tone.label}: </span>
        {toast.title && <p className="font-semibold text-ink">{toast.title}</p>}
        <p className={toast.title ? 'mt-0.5 text-ink-2' : 'font-medium text-ink'}>{toast.message}</p>
      </div>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="grid size-7 shrink-0 place-items-center rounded-md text-ink-3 hover:bg-subtle hover:text-ink"
        aria-label="Dismiss notification"
      >
        <X className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}

/** Top-centre on phones (clear of the bottom navigation), bottom-right on larger screens. */
export function ToastViewport({ toasts, onDismiss }) {
  return createPortal(
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] flex flex-col items-center gap-2 p-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:top-auto sm:right-0 sm:bottom-0 sm:left-auto sm:items-end sm:p-5"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>,
    document.body,
  );
}
