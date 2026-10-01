import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ToastViewport } from '@/components/common/Toast';
import { ToastContext } from './contexts';

const MAX_VISIBLE = 4;
const DURATIONS = { success: 4000, info: 4000, error: 6500 };

let nextToastId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());

  const dismiss = useCallback((id) => {
    setToasts((list) => list.filter((toast) => toast.id !== id));
    clearTimeout(timers.current.get(id));
    timers.current.delete(id);
  }, []);

  const show = useCallback(
    (tone, message, { title, duration } = {}) => {
      nextToastId += 1;
      const id = nextToastId;
      setToasts((list) => [...list.slice(-(MAX_VISIBLE - 1)), { id, tone, title, message }]);
      timers.current.set(
        id,
        setTimeout(() => dismiss(id), duration ?? DURATIONS[tone]),
      );
      return id;
    },
    [dismiss],
  );

  useEffect(() => {
    const activeTimers = timers.current;
    return () => activeTimers.forEach((timer) => clearTimeout(timer));
  }, []);

  const api = useMemo(
    () => ({
      success: (message, options) => show('success', message, options),
      error: (message, options) => show('error', message, options),
      info: (message, options) => show('info', message, options),
      dismiss,
    }),
    [show, dismiss],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}
