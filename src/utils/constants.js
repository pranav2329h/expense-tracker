export const APP_NAME = 'Expense Tracker';

export const TRANSACTION_TYPES = ['expense', 'income'];

export const TYPE_LABELS = {
  expense: 'Expense',
  income: 'Income',
};

export const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'upi', label: 'UPI' },
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'debit_card', label: 'Debit Card' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'net_banking', label: 'Net Banking' },
  { value: 'other', label: 'Other' },
];

export const PAYMENT_METHOD_VALUES = PAYMENT_METHODS.map((method) => method.value);

const PAYMENT_METHOD_LABELS = Object.fromEntries(PAYMENT_METHODS.map((m) => [m.value, m.label]));

export function getPaymentMethodLabel(value) {
  return PAYMENT_METHOD_LABELS[value] ?? 'Other';
}

export const THEME_PREFERENCES = ['light', 'dark', 'system'];

/** Field limits shared by form validation, import sanitising and (mirrored in) firestore.rules. */
export const LIMITS = {
  amountMax: 1_000_000_000,
  descriptionMax: 200,
  categoryNameMax: 40,
  budgetNameMax: 50,
  budgetCategoriesMax: 30,
  displayNameMax: 100,
  personNameMax: 60,
  ledgerNoteMax: 200,
};

/** Lend & Borrow entry directions, from your point of view. */
export const LEDGER_DIRECTIONS = ['gave', 'got'];

/** Spending levels (percent of budget) that raise an in-app alert. */
export const BUDGET_ALERT_THRESHOLDS = [80, 90, 100];

/** Months of transactions kept live for the dashboard, budgets and recent analytics. */
export const RECENT_WINDOW_MONTHS = 6;

export const TRANSACTIONS_PAGE_SIZE = 50;

/**
 * Seeded once per user during onboarding. Fixed ids make seeding idempotent:
 * running it twice overwrites the same documents instead of creating duplicates.
 */
export const DEFAULT_CATEGORIES = [
  { id: 'default-food', name: 'Food', type: 'expense', icon: 'utensils' },
  { id: 'default-groceries', name: 'Groceries', type: 'expense', icon: 'shopping-basket' },
  { id: 'default-travel', name: 'Travel', type: 'expense', icon: 'plane' },
  { id: 'default-shopping', name: 'Shopping', type: 'expense', icon: 'shopping-bag' },
  { id: 'default-rent', name: 'Rent', type: 'expense', icon: 'house' },
  { id: 'default-electricity', name: 'Electricity', type: 'expense', icon: 'zap' },
  { id: 'default-internet', name: 'Internet', type: 'expense', icon: 'wifi' },
  { id: 'default-mobile', name: 'Mobile', type: 'expense', icon: 'smartphone' },
  { id: 'default-entertainment', name: 'Entertainment', type: 'expense', icon: 'clapperboard' },
  { id: 'default-education', name: 'Education', type: 'expense', icon: 'graduation-cap' },
  { id: 'default-health', name: 'Health', type: 'expense', icon: 'heart-pulse' },
  { id: 'default-subscriptions', name: 'Subscriptions', type: 'expense', icon: 'repeat' },
  { id: 'default-personal', name: 'Personal', type: 'expense', icon: 'user' },
  { id: 'default-other', name: 'Other', type: 'expense', icon: 'ellipsis' },
  { id: 'default-salary', name: 'Salary', type: 'income', icon: 'briefcase' },
  { id: 'default-freelance', name: 'Freelance', type: 'income', icon: 'laptop' },
  { id: 'default-business', name: 'Business', type: 'income', icon: 'building' },
  { id: 'default-investment', name: 'Investment', type: 'income', icon: 'trending-up' },
  { id: 'default-bonus', name: 'Bonus', type: 'income', icon: 'gift' },
  { id: 'default-other-income', name: 'Other Income', type: 'income', icon: 'coins' },
];
