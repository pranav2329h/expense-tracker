import { AppError, assertOnline } from '@/utils/errors';
import {
  backupFileName,
  buildBackup,
  csvFileName,
  downloadFile,
  MAX_BACKUP_BYTES,
  parseBackup,
  transactionsToCsv,
} from '@/utils/export';
import { sortTransactions } from '@/utils/transactions';
import { importBudgets } from './budgetService';
import { importCategories } from './categoryService';
import { importLedger } from './ledgerService';
import { fetchAllTransactions, importTransactions } from './transactionService';

export async function exportTransactionsCsv(resolveCategory) {
  assertOnline();
  const transactions = sortTransactions(await fetchAllTransactions());
  if (transactions.length === 0) {
    throw new AppError('There are no transactions to export yet.', 'export/empty');
  }
  downloadFile(transactionsToCsv(transactions, resolveCategory), csvFileName(), 'text/csv;charset=utf-8');
  return transactions.length;
}

export async function exportJsonBackup({ categories, budgets, settings, resolveCategory, people, ledger }) {
  assertOnline();
  const transactions = sortTransactions(await fetchAllTransactions());
  const backup = buildBackup({ transactions, categories, budgets, settings, resolveCategory, people, ledger });
  downloadFile(JSON.stringify(backup, null, 2), backupFileName(), 'application/json');
  return transactions.length;
}

/** Reads and validates a backup file. Throws AppError with a readable message on failure. */
export async function readBackupFile(file) {
  if (!file) throw new AppError('Choose a backup file to import.', 'import/no-file');
  if (!/\.json$/i.test(file.name) && file.type !== 'application/json') {
    throw new AppError('Choose a .json backup file exported from this app.', 'import/invalid-type');
  }
  if (file.size > MAX_BACKUP_BYTES) {
    throw new AppError('This file is too large to import (maximum 10 MB).', 'import/too-large');
  }
  return parseBackup(await file.text());
}

/**
 * Executes an import plan from planImport(): categories, budgets, transactions, then
 * Lend & Borrow people and entries.
 */
export async function runImport(plan, onProgress) {
  assertOnline();
  await importCategories(plan.categories);
  await importBudgets(plan.budgets);
  const transactions = await importTransactions(plan.transactions, onProgress);
  const ledger = await importLedger(plan.people ?? [], plan.ledger ?? []);
  return { transactions, categories: plan.categories.length, budgets: plan.budgets.length, ...ledger };
}
