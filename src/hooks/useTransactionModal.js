import { useContext } from 'react';
import { TransactionModalContext } from '@/context/contexts';

/** { openAddTransaction(defaults?), openEditTransaction(tx), requestDeleteTransaction(tx) } */
export function useTransactionModal() {
  const context = useContext(TransactionModalContext);
  if (!context) throw new Error('useTransactionModal must be used inside <TransactionModalProvider>.');
  return context;
}
