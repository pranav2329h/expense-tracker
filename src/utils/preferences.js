/**
 * Small per-device conveniences kept in localStorage. Nothing here is required
 * data — every read falls back gracefully when storage is unavailable.
 */
import { PAYMENT_METHOD_VALUES } from './constants';

const LAST_PAYMENT_METHOD_KEY = 'expense-tracker:last-payment-method';

export function readLastPaymentMethod() {
  try {
    const value = localStorage.getItem(LAST_PAYMENT_METHOD_KEY);
    return PAYMENT_METHOD_VALUES.includes(value) ? value : null;
  } catch {
    return null;
  }
}

export function rememberPaymentMethod(value) {
  try {
    localStorage.setItem(LAST_PAYMENT_METHOD_KEY, value);
  } catch {
    /* storage unavailable */
  }
}
