import { useEffect, useMemo, useState } from 'react';
import { subscribeToBudgets, OVERALL_BUDGET_ID } from '@/services/budgetService';
import { subscribeToCategories } from '@/services/categoryService';
import { subscribeToLedger, subscribeToPeople } from '@/services/ledgerService';
import { notifyTransactionsChanged, subscribeToTransactions } from '@/services/transactionService';
import { DEFAULT_SETTINGS, subscribeToSettings } from '@/services/userService';
import { RECENT_WINDOW_MONTHS } from '@/utils/constants';
import { getWindowStartKey } from '@/utils/dates';
import { getLedgerTotals, getPersonBalances } from '@/utils/ledger';
import { createCategoryResolver } from '@/utils/transactions';
import {
  BudgetsContext,
  CategoriesContext,
  LedgerContext,
  RecentTransactionsContext,
  SettingsContext,
} from './contexts';

/**
 * Live, per-user data shared by every signed-in page. Mounted once per user (keyed
 * by uid), so each listener is opened once per session rather than once per page:
 *
 * - settings, categories and budgets: small collections, kept live so changes made
 *   on another device appear immediately;
 * - the last RECENT_WINDOW_MONTHS months of transactions: powers the dashboard,
 *   budgets and recent analytics without re-reading on every navigation.
 *
 * Older history is never downloaded here — the Transactions page paginates and
 * Analytics fetches older ranges on demand.
 */
export function UserDataProvider({ children }) {
  const [settingsState, setSettingsState] = useState({ status: 'loading', settings: null, error: null, offline: false });
  const [categoriesState, setCategoriesState] = useState({ status: 'loading', categories: [], error: null });
  const [budgetsState, setBudgetsState] = useState({ status: 'loading', budgets: [], error: null });
  const [recentState, setRecentState] = useState({ status: 'loading', items: [], error: null });
  const [peopleState, setPeopleState] = useState({ status: 'loading', people: [], error: null });
  const [ledgerState, setLedgerState] = useState({ status: 'loading', entries: [], error: null });
  const [windowStart] = useState(() => getWindowStartKey(RECENT_WINDOW_MONTHS));

  useEffect(
    () =>
      subscribeToSettings(
        ({ exists, fromCache, settings }) => {
          if (exists) {
            setSettingsState({ status: 'ready', settings, error: null, offline: false });
          } else if (fromCache) {
            // No server answer yet (offline): wait rather than show first-time setup.
            setSettingsState((current) => ({ ...current, offline: true }));
          } else {
            setSettingsState({ status: 'missing', settings: null, error: null, offline: false });
          }
        },
        (error) => setSettingsState({ status: 'error', settings: null, error, offline: false }),
      ),
    [],
  );

  useEffect(
    () =>
      subscribeToCategories(
        (categories) => setCategoriesState({ status: 'ready', categories, error: null }),
        (error) => setCategoriesState((current) => ({ ...current, status: 'error', error })),
      ),
    [],
  );

  useEffect(
    () =>
      subscribeToBudgets(
        (budgets) => setBudgetsState({ status: 'ready', budgets, error: null }),
        (error) => setBudgetsState((current) => ({ ...current, status: 'error', error })),
      ),
    [],
  );

  useEffect(() => {
    let isFirstSnapshot = true;
    return subscribeToTransactions(
      { startDate: windowStart },
      (items, snapshot) => {
        setRecentState({ status: 'ready', items, error: null });
        // Changes confirmed by the server that didn't originate here (e.g. another
        // device) — let one-shot views such as all-time totals refresh.
        if (!isFirstSnapshot && !snapshot.metadata.hasPendingWrites && snapshot.docChanges().length > 0) {
          notifyTransactionsChanged();
        }
        isFirstSnapshot = false;
      },
      (error) => setRecentState((current) => ({ ...current, status: 'error', error })),
    );
  }, [windowStart]);

  const settingsValue = useMemo(
    () => ({ ...settingsState, settings: settingsState.settings ?? DEFAULT_SETTINGS }),
    [settingsState],
  );

  const categoriesValue = useMemo(() => {
    const byId = new Map(categoriesState.categories.map((category) => [category.id, category]));
    return {
      ...categoriesState,
      byId,
      expenseCategories: categoriesState.categories.filter((category) => category.type === 'expense'),
      incomeCategories: categoriesState.categories.filter((category) => category.type === 'income'),
      resolveCategory: createCategoryResolver(byId),
    };
  }, [categoriesState]);

  const budgetsValue = useMemo(
    () => ({
      ...budgetsState,
      overallBudget: budgetsState.budgets.find((budget) => budget.id === OVERALL_BUDGET_ID) ?? null,
      categoryBudgets: budgetsState.budgets.filter((budget) => budget.id !== OVERALL_BUDGET_ID),
    }),
    [budgetsState],
  );

  const recentValue = useMemo(() => ({ ...recentState, windowStart }), [recentState, windowStart]);

  // Lend & Borrow: people and their entries are small collections, kept live for the session.
  useEffect(
    () =>
      subscribeToPeople(
        (people) => setPeopleState({ status: 'ready', people, error: null }),
        (error) => setPeopleState((current) => ({ ...current, status: 'error', error })),
      ),
    [],
  );

  useEffect(
    () =>
      subscribeToLedger(
        (entries) => setLedgerState({ status: 'ready', entries, error: null }),
        (error) => setLedgerState((current) => ({ ...current, status: 'error', error })),
      ),
    [],
  );

  const ledgerValue = useMemo(() => {
    const balances = getPersonBalances(peopleState.people, ledgerState.entries);
    const statuses = [peopleState.status, ledgerState.status];
    return {
      people: peopleState.people,
      entries: ledgerState.entries,
      balances,
      totals: getLedgerTotals(balances),
      status: statuses.includes('error') ? 'error' : statuses.includes('loading') ? 'loading' : 'ready',
      error: peopleState.error ?? ledgerState.error,
    };
  }, [peopleState, ledgerState]);

  return (
    <SettingsContext.Provider value={settingsValue}>
      <CategoriesContext.Provider value={categoriesValue}>
        <BudgetsContext.Provider value={budgetsValue}>
          <RecentTransactionsContext.Provider value={recentValue}>
            <LedgerContext.Provider value={ledgerValue}>{children}</LedgerContext.Provider>
          </RecentTransactionsContext.Provider>
        </BudgetsContext.Provider>
      </CategoriesContext.Provider>
    </SettingsContext.Provider>
  );
}
