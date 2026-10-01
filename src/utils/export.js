/**
 * CSV export, JSON backup and backup import parsing. Everything happens in the
 * browser — exported data is never sent to any third-party service.
 */
import { getPaymentMethodLabel, TYPE_LABELS } from './constants';
import { toDateKey } from './dates';
import { AppError } from './errors';
import {
  isValidDocId,
  validateBudgetInput,
  validateCategoryInput,
  validateTransactionInput,
} from './validation';

export const BACKUP_APP_ID = 'expense-tracker';
export const BACKUP_VERSION = 1;
export const MAX_BACKUP_BYTES = 10 * 1024 * 1024;
export const MAX_IMPORT_TRANSACTIONS = 50_000;

const CSV_COLUMNS = ['Date', 'Type', 'Amount', 'Category', 'Payment Method', 'Description'];

function escapeCsvCell(value) {
  if (typeof value === 'number') return String(value);
  let text = String(value ?? '');
  // Neutralise spreadsheet formula injection (=, +, -, @ at the start of a cell).
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  if (/[",\r\n]/.test(text)) text = `"${text.replace(/"/g, '""')}"`;
  return text;
}

export function transactionsToCsv(transactions, resolveCategory) {
  const rows = transactions.map((tx) => [
    tx.date,
    TYPE_LABELS[tx.type] ?? tx.type,
    tx.amount,
    resolveCategory(tx).name,
    getPaymentMethodLabel(tx.paymentMethod),
    tx.description,
  ]);
  // Byte-order mark so spreadsheet apps open the UTF-8 file (₹, €, £) correctly.
  return `\uFEFF${[CSV_COLUMNS, ...rows].map((row) => row.map(escapeCsvCell).join(',')).join('\r\n')}`;
}

export function csvFileName(date = new Date()) {
  return `expense-tracker-transactions-${toDateKey(date)}.csv`;
}

export function backupFileName(date = new Date()) {
  return `expense-tracker-backup-${toDateKey(date)}.json`;
}

export function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const toIso = (value) => (value instanceof Date && !Number.isNaN(value.getTime()) ? value.toISOString() : null);

export function buildBackup({ transactions, categories, budgets, settings, resolveCategory }) {
  return {
    app: BACKUP_APP_ID,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    settings: { currency: settings.currency },
    categories: categories.map(({ id, name, type, icon, isDefault }) => ({ id, name, type, icon, isDefault })),
    budgets: budgets.map(({ id, name, scope, categoryIds, amount }) => ({ id, name, scope, categoryIds, amount })),
    transactions: transactions.map((tx) => ({
      id: tx.id,
      type: tx.type,
      amount: tx.amount,
      categoryId: tx.categoryId,
      categoryName: resolveCategory(tx).name,
      paymentMethod: tx.paymentMethod,
      description: tx.description,
      date: tx.date,
      createdAt: toIso(tx.createdAt),
      updatedAt: toIso(tx.updatedAt),
    })),
  };
}

const isPlainObject = (value) => typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * Parses and validates a backup file. Only known fields are kept; every record is
 * re-validated with the same rules as the forms. Invalid records are counted and dropped.
 */
export function parseBackup(text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new AppError('This file is not valid JSON.', 'import/invalid-json');
  }

  if (!isPlainObject(data) || data.app !== BACKUP_APP_ID) {
    throw new AppError("This file isn't an Expense Tracker backup.", 'import/invalid-format');
  }
  if (data.version !== BACKUP_VERSION) {
    throw new AppError('This backup was created by an unsupported version of the app.', 'import/unsupported-version');
  }
  if (!Array.isArray(data.transactions)) {
    throw new AppError('The backup has no transaction list.', 'import/invalid-format');
  }
  if (data.transactions.length > MAX_IMPORT_TRANSACTIONS) {
    throw new AppError(
      `Backups can contain at most ${MAX_IMPORT_TRANSACTIONS.toLocaleString('en-IN')} transactions.`,
      'import/too-large',
    );
  }
  for (const key of ['categories', 'budgets']) {
    if (data[key] !== undefined && !Array.isArray(data[key])) {
      throw new AppError(`The backup's ${key} list is malformed.`, 'import/invalid-format');
    }
  }

  const skipped = { transactions: 0, categories: 0, budgets: 0 };

  const categories = [];
  const categoryIds = new Set();
  for (const raw of data.categories ?? []) {
    if (!isPlainObject(raw) || !isValidDocId(raw.id) || categoryIds.has(raw.id)) {
      skipped.categories += 1;
      continue;
    }
    const { ok, value } = validateCategoryInput(raw);
    if (!ok) {
      skipped.categories += 1;
      continue;
    }
    categoryIds.add(raw.id);
    categories.push({ id: raw.id, ...value, isDefault: raw.isDefault === true });
  }

  const budgets = [];
  const budgetIds = new Set();
  for (const raw of data.budgets ?? []) {
    const idOk =
      isPlainObject(raw) &&
      isValidDocId(raw.id) &&
      !budgetIds.has(raw.id) &&
      (raw.scope === 'overall') === (raw.id === 'overall');
    const validation = idOk ? validateBudgetInput(raw) : null;
    if (!validation?.ok) {
      skipped.budgets += 1;
      continue;
    }
    budgetIds.add(raw.id);
    budgets.push({ id: raw.id, ...validation.value });
  }

  const transactions = [];
  const transactionIds = new Set();
  for (const raw of data.transactions) {
    if (!isPlainObject(raw) || !isValidDocId(raw.id) || transactionIds.has(raw.id)) {
      skipped.transactions += 1;
      continue;
    }
    const { ok, value } = validateTransactionInput(raw);
    if (!ok) {
      skipped.transactions += 1;
      continue;
    }
    transactionIds.add(raw.id);
    transactions.push({ id: raw.id, ...value });
  }

  return { transactions, categories, budgets, skipped };
}

/**
 * Reconciles a parsed backup with the user's current data:
 * - categories that already exist (same id, or same type + name) are reused, not duplicated;
 * - transactions are re-pointed at the reused categories, and dropped if the category type disagrees;
 * - budgets that already exist are left untouched; unknown category ids are removed from new ones.
 */
export function planImport(parsed, { categories: existingCategories, budgets: existingBudgets }) {
  const existingById = new Map(existingCategories.map((c) => [c.id, c]));
  const existingByName = new Map(existingCategories.map((c) => [`${c.type}|${c.name.toLocaleLowerCase()}`, c]));
  const idMap = new Map();
  const categoriesToCreate = [];

  for (const category of parsed.categories) {
    const byId = existingById.get(category.id);
    if (byId) {
      if (byId.type === category.type) idMap.set(category.id, byId.id);
      continue;
    }
    const byName = existingByName.get(`${category.type}|${category.name.toLocaleLowerCase()}`);
    if (byName) {
      idMap.set(category.id, byName.id);
      continue;
    }
    categoriesToCreate.push(category);
    idMap.set(category.id, category.id);
  }

  const finalTypes = new Map(existingCategories.map((c) => [c.id, c.type]));
  for (const category of categoriesToCreate) finalTypes.set(category.id, category.type);

  let mismatched = 0;
  const transactions = [];
  for (const tx of parsed.transactions) {
    const categoryId = idMap.get(tx.categoryId) ?? tx.categoryId;
    const knownType = finalTypes.get(categoryId);
    if (knownType && knownType !== tx.type) {
      mismatched += 1;
      continue;
    }
    transactions.push({ ...tx, categoryId });
  }

  const existingBudgetIds = new Set(existingBudgets.map((b) => b.id));
  const budgetsToCreate = [];
  let budgetsSkipped = 0;
  for (const budget of parsed.budgets) {
    if (existingBudgetIds.has(budget.id)) {
      budgetsSkipped += 1;
      continue;
    }
    if (budget.scope === 'overall') {
      budgetsToCreate.push(budget);
      continue;
    }
    const ids = [
      ...new Set(budget.categoryIds.map((id) => idMap.get(id) ?? id).filter((id) => finalTypes.get(id) === 'expense')),
    ];
    if (ids.length === 0) {
      budgetsSkipped += 1;
      continue;
    }
    budgetsToCreate.push({ ...budget, categoryIds: ids });
  }

  return {
    transactions,
    categories: categoriesToCreate,
    budgets: budgetsToCreate,
    skipped: {
      transactions: parsed.skipped.transactions + mismatched,
      categories: parsed.skipped.categories,
      budgets: parsed.skipped.budgets + budgetsSkipped,
    },
  };
}
