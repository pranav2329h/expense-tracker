import { useContext } from 'react';
import { LedgerContext } from '@/context/contexts';

/**
 * Lend & Borrow data: { people, entries, balances, totals, status, error }.
 * `balances` has one summary per person ({ balance, status: 'get' | 'give' | 'settled', ... }).
 */
export function useLedger() {
  const context = useContext(LedgerContext);
  if (!context) throw new Error('useLedger must be used inside <UserDataProvider>.');
  return context;
}
