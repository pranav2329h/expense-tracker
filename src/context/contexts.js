import { createContext } from 'react';

// Context objects live here so provider files only export components (fast refresh friendly).
export const AuthContext = createContext(null);
export const ThemeContext = createContext(null);
export const ToastContext = createContext(null);
export const SettingsContext = createContext(null);
export const CategoriesContext = createContext(null);
export const BudgetsContext = createContext(null);
export const RecentTransactionsContext = createContext(null);
export const TransactionModalContext = createContext(null);
