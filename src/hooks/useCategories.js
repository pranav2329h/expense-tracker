import { useContext } from 'react';
import { CategoriesContext } from '@/context/contexts';

/**
 * { categories, byId, expenseCategories, incomeCategories, resolveCategory, status, error }
 * resolveCategory(tx) returns the transaction's current category (or a fallback built
 * from the stored categoryName if the category was deleted).
 */
export function useCategories() {
  const context = useContext(CategoriesContext);
  if (!context) throw new Error('useCategories must be used inside <UserDataProvider>.');
  return context;
}
