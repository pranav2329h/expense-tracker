import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/utils/cn';
import { IconButton } from './Button';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Open modals, innermost last. Only the top-most modal handles Escape and Tab.
const modalStack = [];

function getFocusable(container) {
  return [...container.querySelectorAll(FOCUSABLE)].filter((el) => el.offsetParent !== null || el === document.activeElement);
}

function trapFocus(event, container) {
  const focusable = getFocusable(container);
  if (focusable.length === 0) {
    event.preventDefault();
    container.focus();
    return;
  }
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && (document.activeElement === first || !container.contains(document.activeElement))) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

const SIZES = {
  sm: 'sm:max-w-md',
  md: 'sm:max-w-lg',
  lg: 'sm:max-w-2xl',
};

/**
 * Accessible dialog: focus moves into the dialog and is trapped there, Escape closes,
 * focus returns to the trigger, and page scroll is locked. Bottom sheet on phones
 * (or full screen with `fullScreenOnMobile`), centred card from `sm` up.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  fullScreenOnMobile = false,
  initialFocusRef,
  className,
}) {
  const panelRef = useRef(null);
  const onCloseRef = useRef(onClose);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return undefined;

    const token = {};
    modalStack.push(token);
    const previouslyFocused = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const frame = requestAnimationFrame(() => {
      const panel = panelRef.current;
      if (!panel) return;
      const target =
        initialFocusRef?.current ?? panel.querySelector('[data-autofocus]') ?? getFocusable(panel)[0] ?? panel;
      target.focus({ preventScroll: true });
    });

    const handleKeyDown = (event) => {
      if (modalStack[modalStack.length - 1] !== token || !panelRef.current) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseRef.current?.();
      } else if (event.key === 'Tab') {
        trapFocus(event, panelRef.current);
      }
    };
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('keydown', handleKeyDown);
      modalStack.splice(modalStack.indexOf(token), 1);
      if (modalStack.length === 0) document.body.style.overflow = previousOverflow;
      if (previouslyFocused instanceof HTMLElement && document.contains(previouslyFocused)) {
        previouslyFocused.focus({ preventScroll: true });
      }
    };
  }, [open, initialFocusRef]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <div
        className="absolute inset-0 bg-overlay motion-safe:animate-fade-in"
        aria-hidden="true"
        onClick={() => onCloseRef.current?.()}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className={cn(
          'relative flex w-full flex-col bg-surface shadow-2xl outline-none motion-safe:animate-slide-up sm:rounded-2xl sm:border sm:border-line sm:motion-safe:animate-scale-in',
          fullScreenOnMobile ? 'h-dvh sm:h-auto sm:max-h-[min(90dvh,860px)]' : 'max-h-[90dvh] rounded-t-2xl',
          SIZES[size],
          className,
        )}
      >
        <header className="flex items-start justify-between gap-4 border-b border-line px-5 pt-4 pb-3.5 sm:px-6">
          <div className="min-w-0 pt-1">
            <h2 id={titleId} className="text-base font-semibold text-ink">
              {title}
            </h2>
            {description && (
              <p id={descriptionId} className="mt-0.5 text-sm text-ink-3">
                {description}
              </p>
            )}
          </div>
          <IconButton icon={X} label="Close dialog" size="sm" onClick={() => onCloseRef.current?.()} className="-mr-1.5" />
        </header>
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6">{children}</div>
        {footer && (
          <footer className="flex flex-col-reverse gap-2 border-t border-line px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:flex-row sm:items-center sm:justify-end sm:px-6 sm:pb-4">
            {footer}
          </footer>
        )}
      </div>
    </div>,
    document.body,
  );
}
