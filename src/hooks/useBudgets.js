import { useContext } from 'react';
import { BudgetsContext } from '@/context/contexts';

/** { budgets, overallBudget, categoryBudgets, status, error } */
export function useBudgets() {
  const context = useContext(BudgetsContext);
  if (!context) throw new Error('useBudgets must be used inside <UserDataProvider>.');
  return context;
}
