import { getPaymentMethodLabel } from './constants';
import { FALLBACK_CATEGORY_ICON } from './categoryIcons';

/**
 * Returns a function that maps a transaction to its current category. Transactions
 * store categoryName as a fallback, so deleted categories still display sensibly.
 */
export function createCategoryResolver(categoriesById) {
  return (tx) =>
    categoriesById.get(tx.categoryId) ?? {
      id: tx.categoryId,
      name: tx.categoryName || 'Uncategorised',
      icon: FALLBACK_CATEGORY_ICON,
      type: tx.type,
      missing: true,
    };
}

/** Case-insensitive search across description, category name and payment method. */
export function searchTransactions(transactions, query, resolveCategory) {
  const terms = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return transactions;
  return transactions.filter((tx) => {
    const haystack = [tx.description, resolveCategory(tx).name, getPaymentMethodLabel(tx.paymentMethod)]
      .join(' ')
      .toLocaleLowerCase();
    return terms.every((term) => haystack.includes(term));
  });
}

export const SORT_OPTIONS = [
  { value: 'date-desc', label: 'Newest first' },
  { value: 'date-asc', label: 'Oldest first' },
  { value: 'amount-desc', label: 'Highest amount' },
  { value: 'amount-asc', label: 'Lowest amount' },
];

const createdTime = (tx) => (tx.createdAt instanceof Date ? tx.createdAt.getTime() : 0);

function compareByDateDesc(a, b) {
  if (a.date !== b.date) return a.date < b.date ? 1 : -1;
  return createdTime(b) - createdTime(a) || (a.id < b.id ? 1 : -1);
}

export function sortTransactions(transactions, sort = 'date-desc') {
  const list = [...transactions];
  switch (sort) {
    case 'date-asc':
      return list.sort((a, b) => compareByDateDesc(b, a));
    case 'amount-desc':
      return list.sort((a, b) => b.amount - a.amount || compareByDateDesc(a, b));
    case 'amount-asc':
      return list.sort((a, b) => a.amount - b.amount || compareByDateDesc(a, b));
    default:
      return list.sort(compareByDateDesc);
  }
}

/** Groups an already-sorted list into consecutive same-date sections. */
export function groupByDate(transactions) {
  const groups = [];
  for (const tx of transactions) {
    let group = groups[groups.length - 1];
    if (!group || group.date !== tx.date) {
      group = { date: tx.date, items: [], income: 0, expense: 0 };
      groups.push(group);
    }
    group.items.push(tx);
    if (tx.type === 'income') group.income += tx.amount;
    else group.expense += tx.amount;
  }
  return groups;
}
