import { useMemo } from 'react';
import { formatCurrency, formatTransactionAmount, getCurrencySymbol } from '@/utils/currency';
import { useSettings } from './useSettings';

/** Currency formatters bound to the user's currency setting. */
export function useCurrency() {
  const { settings } = useSettings();
  const currency = settings.currency;
  return useMemo(
    () => ({
      currency,
      symbol: getCurrencySymbol(currency),
      format: (amount) => formatCurrency(amount, currency),
      formatCompact: (amount) => formatCurrency(amount, currency, { compact: true }),
      formatSigned: (amount, type) => formatTransactionAmount(amount, type, currency),
    }),
    [currency],
  );
}
