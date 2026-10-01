/**
 * All financial calculations live here so every page agrees on the numbers.
 * Inputs are plain transaction objects: { type, amount, categoryId, paymentMethod, date, ... }.
 */
import { BUDGET_ALERT_THRESHOLDS, getPaymentMethodLabel } from './constants';
import {
  countElapsedDays,
  formatDate,
  formatMonthKey,
  getDayKeysInRange,
  getMonthKeysInRange,
  toMonthKey,
  todayKey,
} from './dates';

export function roundMoney(value) {
  return Math.round(value * 100) / 100;
}

export function sumByType(transactions) {
  let income = 0;
  let expense = 0;
  let incomeCount = 0;
  let expenseCount = 0;
  for (const tx of transactions) {
    if (tx.type === 'income') {
      income += tx.amount;
      incomeCount += 1;
    } else if (tx.type === 'expense') {
      expense += tx.amount;
      expenseCount += 1;
    }
  }
  return {
    income: roundMoney(income),
    expense: roundMoney(expense),
    net: roundMoney(income - expense),
    incomeCount,
    expenseCount,
  };
}

export function filterByDateRange(transactions, startDate, endDate) {
  return transactions.filter(
    (tx) => (!startDate || tx.date >= startDate) && (!endDate || tx.date <= endDate),
  );
}

export function filterByMonth(transactions, monthKey) {
  return transactions.filter((tx) => toMonthKey(tx.date) === monthKey);
}

/** Percentage change from `previous` to `current`; null when there is no baseline. */
export function percentChange(current, previous) {
  if (!Number.isFinite(current) || !Number.isFinite(previous) || previous === 0) return null;
  return ((current - previous) / Math.abs(previous)) * 100;
}

/**
 * Dashboard headline numbers.
 * `totals` are all-time sums from Firestore aggregation queries; month figures
 * come from the live recent-transactions window.
 */
export function getDashboardSummary({ totals, transactions, monthKey, previousMonthKey }) {
  const thisMonth = sumByType(filterByMonth(transactions, monthKey));
  const lastMonth = sumByType(filterByMonth(transactions, previousMonthKey));

  const totalIncome = totals ? totals.income : null;
  const totalExpenses = totals ? totals.expense : null;
  const balance = totals ? roundMoney(totals.income - totals.expense) : null;
  const openingBalance = balance === null ? null : roundMoney(balance - thisMonth.net);

  return {
    totalIncome,
    totalExpenses,
    balance,
    balanceChange: balance === null ? null : percentChange(balance, openingBalance),
    monthlyIncome: thisMonth.income,
    monthlyExpenses: thisMonth.expense,
    monthlySavings: thisMonth.net,
    monthlyIncomeChange: percentChange(thisMonth.income, lastMonth.income),
    monthlyExpensesChange: percentChange(thisMonth.expense, lastMonth.expense),
    savingsRate: thisMonth.income > 0 ? (thisMonth.net / thisMonth.income) * 100 : null,
  };
}

function monthLabelPattern(monthKeys) {
  const years = new Set(monthKeys.map((key) => key.slice(0, 4)));
  return years.size > 1 ? 'MMM yy' : 'MMM';
}

/** Income/expense/savings per month for the given month keys (oldest → newest). */
export function getMonthlyTotals(transactions, monthKeys) {
  const pattern = monthLabelPattern(monthKeys);
  const buckets = new Map(
    monthKeys.map((key) => [
      key,
      { key, label: formatMonthKey(key, pattern), fullLabel: formatMonthKey(key), income: 0, expense: 0 },
    ]),
  );
  for (const tx of transactions) {
    const bucket = buckets.get(toMonthKey(tx.date));
    if (!bucket) continue;
    if (tx.type === 'income') bucket.income += tx.amount;
    else if (tx.type === 'expense') bucket.expense += tx.amount;
  }
  return [...buckets.values()].map((bucket) => ({
    ...bucket,
    income: roundMoney(bucket.income),
    expense: roundMoney(bucket.expense),
    savings: roundMoney(bucket.income - bucket.expense),
  }));
}

/** Income/expense per day for short ranges. */
export function getDailyTotals(transactions, startDate, endDate) {
  const buckets = new Map(
    getDayKeysInRange(startDate, endDate).map((key) => [
      key,
      { key, label: formatDate(key, 'd'), fullLabel: formatDate(key, 'EEE, dd MMM yyyy'), income: 0, expense: 0 },
    ]),
  );
  for (const tx of transactions) {
    const bucket = buckets.get(tx.date);
    if (!bucket) continue;
    if (tx.type === 'income') bucket.income += tx.amount;
    else if (tx.type === 'expense') bucket.expense += tx.amount;
  }
  return [...buckets.values()].map((bucket) => ({
    ...bucket,
    income: roundMoney(bucket.income),
    expense: roundMoney(bucket.expense),
    savings: roundMoney(bucket.income - bucket.expense),
  }));
}

/** Chooses daily buckets for ranges up to 31 days, monthly buckets otherwise. */
export function getTrendSeries(transactions, startDate, endDate) {
  const months = getMonthKeysInRange(startDate, endDate);
  if (months.length <= 1 || getDayKeysInRange(startDate, endDate).length <= 31) {
    return { granularity: 'day', data: getDailyTotals(transactions, startDate, endDate) };
  }
  return { granularity: 'month', data: getMonthlyTotals(transactions, months) };
}

/**
 * Totals per category, highest first. `resolveCategory(tx)` returns the current
 * category (so renamed categories show their new name).
 */
export function getCategoryTotals(transactions, resolveCategory, type = 'expense') {
  const buckets = new Map();
  let grandTotal = 0;
  for (const tx of transactions) {
    if (tx.type !== type) continue;
    let bucket = buckets.get(tx.categoryId);
    if (!bucket) {
      const category = resolveCategory(tx);
      bucket = { id: tx.categoryId, name: category.name, icon: category.icon, total: 0, count: 0 };
      buckets.set(tx.categoryId, bucket);
    }
    bucket.total += tx.amount;
    bucket.count += 1;
    grandTotal += tx.amount;
  }
  return [...buckets.values()]
    .map((bucket) => ({
      ...bucket,
      total: roundMoney(bucket.total),
      share: grandTotal > 0 ? (bucket.total / grandTotal) * 100 : 0,
    }))
    .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));
}

/** Top categories for a donut; the remainder folds into a single "Other" slice. */
export function toDonutSlices(categoryTotals, maxSlices = 5) {
  if (categoryTotals.length <= maxSlices + 1) return categoryTotals;
  const top = categoryTotals.slice(0, maxSlices);
  const rest = categoryTotals.slice(maxSlices);
  const total = roundMoney(rest.reduce((sum, item) => sum + item.total, 0));
  const share = rest.reduce((sum, item) => sum + item.share, 0);
  const count = rest.reduce((sum, item) => sum + item.count, 0);
  return [...top, { id: '__other__', name: `Other (${rest.length})`, icon: 'ellipsis', total, share, count, isOther: true }];
}

export function getPaymentMethodTotals(transactions, type = 'expense') {
  const buckets = new Map();
  let grandTotal = 0;
  for (const tx of transactions) {
    if (tx.type !== type) continue;
    const bucket = buckets.get(tx.paymentMethod) ?? {
      id: tx.paymentMethod,
      name: getPaymentMethodLabel(tx.paymentMethod),
      total: 0,
      count: 0,
    };
    bucket.total += tx.amount;
    bucket.count += 1;
    buckets.set(tx.paymentMethod, bucket);
    grandTotal += tx.amount;
  }
  return [...buckets.values()]
    .map((bucket) => ({
      ...bucket,
      total: roundMoney(bucket.total),
      share: grandTotal > 0 ? (bucket.total / grandTotal) * 100 : 0,
    }))
    .sort((a, b) => b.total - a.total);
}

export function getLargestTransaction(transactions, type = 'expense') {
  let largest = null;
  for (const tx of transactions) {
    if (tx.type === type && (!largest || tx.amount > largest.amount)) largest = tx;
  }
  return largest;
}

/** Category with the most transactions (ties broken by amount). */
export function getMostUsedCategory(transactions, resolveCategory, type = 'expense') {
  const totals = getCategoryTotals(transactions, resolveCategory, type);
  if (totals.length === 0) return null;
  return [...totals].sort((a, b) => b.count - a.count || b.total - a.total)[0];
}

/** Summary block for a period (Analytics → Monthly summary). */
export function getPeriodSummary(transactions, { startDate, endDate, resolveCategory }) {
  const { income, expense, net, incomeCount, expenseCount } = sumByType(transactions);

  let days = 1;
  if (startDate && endDate) {
    days = countElapsedDays(startDate, endDate);
  } else if (transactions.length > 0) {
    const dates = transactions.map((tx) => tx.date).sort();
    days = countElapsedDays(dates[0], endDate ?? todayKey());
  }

  return {
    income,
    expense,
    savings: net,
    savingsRate: income > 0 ? (net / income) * 100 : null,
    averageDailyExpense: roundMoney(expense / days),
    days,
    largestExpense: getLargestTransaction(transactions, 'expense'),
    mostUsedCategory: getMostUsedCategory(transactions, resolveCategory, 'expense'),
    transactionCount: incomeCount + expenseCount,
  };
}

// ------------------------------------------------------------------ budgets

const [WARNING_AT, SERIOUS_AT, EXCEEDED_AT] = BUDGET_ALERT_THRESHOLDS;

/** 'ok' < 80% ≤ 'warning' < 90% ≤ 'serious' < 100% ≤ 'exceeded'. */
export function getBudgetLevel(percent) {
  if (percent >= EXCEEDED_AT) return 'exceeded';
  if (percent >= SERIOUS_AT) return 'serious';
  if (percent >= WARNING_AT) return 'warning';
  return 'ok';
}

/** Spending against each budget for one month of transactions. */
export function getBudgetProgress(budgets, monthTransactions) {
  const spentByCategory = new Map();
  let totalSpent = 0;
  for (const tx of monthTransactions) {
    if (tx.type !== 'expense') continue;
    spentByCategory.set(tx.categoryId, (spentByCategory.get(tx.categoryId) ?? 0) + tx.amount);
    totalSpent += tx.amount;
  }

  return budgets.map((budget) => {
    const spent =
      budget.scope === 'overall'
        ? totalSpent
        : budget.categoryIds.reduce((sum, id) => sum + (spentByCategory.get(id) ?? 0), 0);
    const percent = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
    return {
      ...budget,
      spent: roundMoney(spent),
      remaining: roundMoney(budget.amount - spent),
      overBy: roundMoney(Math.max(0, spent - budget.amount)),
      percent,
      level: getBudgetLevel(percent),
    };
  });
}

/** Budgets at or above the first alert threshold, most severe first. */
export function getBudgetAlerts(progress) {
  return progress
    .filter((item) => item.level !== 'ok')
    .sort((a, b) => b.percent - a.percent);
}
