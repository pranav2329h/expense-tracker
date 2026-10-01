import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { RecentTransactionsContext } from '@/context/contexts';
import {
  fetchTransactions,
  fetchTransactionTotals,
  onTransactionsChanged,
  subscribeToTransactions,
} from '@/services/transactionService';
import { filterByDateRange } from '@/utils/calculations';
import { TRANSACTIONS_PAGE_SIZE } from '@/utils/constants';

/**
 * Live transactions for the recent window (last RECENT_WINDOW_MONTHS months).
 * { items, status: 'loading' | 'ready' | 'error', error, windowStart }
 */
export function useRecentTransactions() {
  const context = useContext(RecentTransactionsContext);
  if (!context) throw new Error('useRecentTransactions must be used inside <UserDataProvider>.');
  return context;
}

/** Increments whenever transactions are written, so one-shot reads can refresh. */
function useTransactionsVersion(debounceMs = 0) {
  const [version, setVersion] = useState(0);
  useEffect(() => {
    let timer;
    const unsubscribe = onTransactionsChanged(() => {
      clearTimeout(timer);
      timer = setTimeout(() => setVersion((value) => value + 1), debounceMs);
    });
    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, [debounceMs]);
  return version;
}

/** One-shot read of a date range; refetches after writes. Keeps showing old data while refreshing. */
function useFetchedRange(startDate, endDate, enabled) {
  const key = enabled ? `${startDate ?? ''}|${endDate ?? ''}` : null;
  const version = useTransactionsVersion(300);
  const [state, setState] = useState({ key: null, version: -1, items: [], error: null });

  useEffect(() => {
    if (!key) return undefined;
    let cancelled = false;
    fetchTransactions({ startDate, endDate }).then(
      (items) => !cancelled && setState({ key, version, items, error: null }),
      (error) => !cancelled && setState({ key, version, items: [], error }),
    );
    return () => {
      cancelled = true;
    };
  }, [key, version, startDate, endDate]);

  if (!key) return null;
  const isCurrent = state.key === key;
  return {
    items: state.items,
    status: state.key === null ? 'loading' : isCurrent && state.error ? 'error' : 'ready',
    error: isCurrent ? state.error : null,
    refreshing: !isCurrent || state.version !== version,
  };
}

/**
 * All transactions within [startDate, endDate]. Ranges inside the live recent window
 * are derived from it (no extra reads); older ranges are fetched on demand.
 */
export function useTransactionRange(startDate, endDate) {
  const recent = useRecentTransactions();
  const hasRange = Boolean(startDate && endDate);
  const inWindow = hasRange && startDate >= recent.windowStart;

  const windowItems = useMemo(
    () => (inWindow ? filterByDateRange(recent.items, startDate, endDate) : null),
    [inWindow, recent.items, startDate, endDate],
  );
  const fetched = useFetchedRange(startDate, endDate, hasRange && !inWindow);

  if (!hasRange) return { items: EMPTY, status: 'idle', error: null, refreshing: false };
  if (inWindow) {
    return { items: windowItems, status: recent.status, error: recent.error, refreshing: false };
  }
  return fetched;
}

const EMPTY = [];

/**
 * Transactions page: server-side filters (type, category, payment method, date range)
 * with "load more" pagination. The listener stays live so edits and deletes show up
 * immediately; each page adds TRANSACTIONS_PAGE_SIZE more documents.
 */
export function usePaginatedTransactions({ startDate, endDate, type, categoryId, paymentMethod }) {
  const filterKey = [startDate, endDate, type, categoryId, paymentMethod].map((v) => v ?? '').join('|');
  const [pages, setPages] = useState({ filterKey, count: 1 });
  const pageCount = pages.filterKey === filterKey ? pages.count : 1;
  const max = pageCount * TRANSACTIONS_PAGE_SIZE;
  const queryKey = `${filterKey}#${max}`;

  const [state, setState] = useState({ queryKey: null, filterKey: null, items: [], error: null });

  useEffect(
    () =>
      subscribeToTransactions(
        { startDate, endDate, type, categoryId, paymentMethod, max },
        (items) => setState({ queryKey, filterKey, items, error: null }),
        (error) => setState({ queryKey, filterKey, items: [], error }),
      ),
    [queryKey, filterKey, startDate, endDate, type, categoryId, paymentMethod, max],
  );

  const loadMore = useCallback(() => {
    setPages({ filterKey, count: pageCount + 1 });
  }, [filterKey, pageCount]);

  const isCurrent = state.queryKey === queryKey;
  return {
    items: state.items,
    status: state.queryKey === null ? 'loading' : isCurrent && state.error ? 'error' : 'ready',
    error: isCurrent ? state.error : null,
    // New filters: previous results are shown dimmed until the new ones arrive.
    refreshing: state.filterKey !== filterKey,
    loadingMore: state.filterKey === filterKey && !isCurrent,
    hasMore: isCurrent && state.items.length >= max,
    loadMore,
  };
}

/** All-time income/expense totals via Firestore aggregation; refreshed after writes. */
export function useTransactionTotals() {
  const version = useTransactionsVersion(400);
  const [state, setState] = useState({ totals: null, error: null });

  useEffect(() => {
    let cancelled = false;
    fetchTransactionTotals().then(
      (totals) => !cancelled && setState({ totals, error: null }),
      (error) => !cancelled && setState((current) => ({ totals: current.totals, error })),
    );
    return () => {
      cancelled = true;
    };
  }, [version]);

  return { totals: state.totals, loading: !state.totals && !state.error, error: state.error };
}
