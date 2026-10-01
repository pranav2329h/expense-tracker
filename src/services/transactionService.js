import {
  addDoc,
  count,
  deleteDoc,
  getAggregateFromServer,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  startAfter,
  sum,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/firebase/config';
import { readDoc, userCollection, userDoc } from '@/firebase/firestore';
import { roundMoney } from '@/utils/calculations';
import { AppError } from '@/utils/errors';
import { validateTransactionInput } from '@/utils/validation';

const COLLECTION = 'transactions';
const BATCH_SIZE = 400;
const EXPORT_PAGE_SIZE = 500;

// ------------------------------------------------------------ change events
// Views backed by one-shot reads (all-time totals, older analytics ranges)
// refresh when this fires. Live listeners update on their own.

const changeListeners = new Set();

export function onTransactionsChanged(listener) {
  changeListeners.add(listener);
  return () => changeListeners.delete(listener);
}

export function notifyTransactionsChanged() {
  for (const listener of changeListeners) listener();
}

// ------------------------------------------------------------------ helpers

function readTransaction(snapshot) {
  const tx = readDoc(snapshot);
  return {
    ...tx,
    amount: Number.isFinite(tx.amount) ? tx.amount : 0,
    description: typeof tx.description === 'string' ? tx.description : '',
  };
}

function toFields({ type, amount, categoryId, categoryName, paymentMethod, description, date }) {
  return { type, amount, categoryId, categoryName, paymentMethod, description, date };
}

function validateOrThrow(input, categoriesById) {
  const { ok, errors, value } = validateTransactionInput(input, { categoriesById });
  if (!ok) throw new AppError(Object.values(errors)[0], 'invalid-argument');
  return value;
}

/**
 * Builds a transactions query. Equality filters (type / category / payment method)
 * and the date range run server-side, ordered by date. Composite indexes for these
 * combinations are defined in firestore.indexes.json.
 */
function buildQuery({ startDate, endDate, type, categoryId, paymentMethod, max } = {}) {
  const constraints = [];
  if (categoryId) constraints.push(where('categoryId', '==', categoryId));
  else if (type) constraints.push(where('type', '==', type));
  if (paymentMethod) constraints.push(where('paymentMethod', '==', paymentMethod));
  if (startDate) constraints.push(where('date', '>=', startDate));
  if (endDate) constraints.push(where('date', '<=', endDate));
  constraints.push(orderBy('date', 'desc'));
  if (max) constraints.push(limit(max));
  return query(userCollection(COLLECTION), ...constraints);
}

// ------------------------------------------------------------------- writes

export async function createTransaction(input, categoriesById) {
  const value = validateOrThrow(input, categoriesById);
  const ref = await addDoc(userCollection(COLLECTION), {
    ...toFields(value),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  notifyTransactionsChanged();
  return ref.id;
}

export async function updateTransaction(id, input, categoriesById) {
  const value = validateOrThrow(input, categoriesById);
  await updateDoc(userDoc(COLLECTION, id), { ...toFields(value), updatedAt: serverTimestamp() });
  notifyTransactionsChanged();
}

export async function deleteTransaction(id) {
  await deleteDoc(userDoc(COLLECTION, id));
  notifyTransactionsChanged();
}

/**
 * Writes already-sanitised backup transactions in batches. Each keeps its original id,
 * so importing the same backup twice restores rather than duplicates.
 */
export async function importTransactions(transactions, onProgress) {
  let written = 0;
  for (let start = 0; start < transactions.length; start += BATCH_SIZE) {
    const batch = writeBatch(db);
    const chunk = transactions.slice(start, start + BATCH_SIZE);
    for (const tx of chunk) {
      const value = validateOrThrow(tx);
      batch.set(userDoc(COLLECTION, tx.id), {
        ...toFields(value),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
    await batch.commit();
    written += chunk.length;
    onProgress?.(written);
  }
  if (written > 0) notifyTransactionsChanged();
  return written;
}

// -------------------------------------------------------------------- reads

/** Real-time listener. `onNext(transactions, snapshot)`. Returns the unsubscribe function. */
export function subscribeToTransactions(filters, onNext, onError) {
  return onSnapshot(
    buildQuery(filters),
    (snapshot) => onNext(snapshot.docs.map(readTransaction), snapshot),
    onError,
  );
}

export async function fetchTransactions(filters) {
  const snapshot = await getDocs(buildQuery(filters));
  return snapshot.docs.map(readTransaction);
}

/** Full history, read page by page. Only used for exports. */
export async function fetchAllTransactions() {
  const all = [];
  let cursor = null;
  for (;;) {
    const constraints = [orderBy('date', 'desc')];
    if (cursor) constraints.push(startAfter(cursor));
    constraints.push(limit(EXPORT_PAGE_SIZE));
    const snapshot = await getDocs(query(userCollection(COLLECTION), ...constraints));
    all.push(...snapshot.docs.map(readTransaction));
    if (snapshot.docs.length < EXPORT_PAGE_SIZE) break;
    cursor = snapshot.docs[snapshot.docs.length - 1];
  }
  return all;
}

/**
 * All-time income and expense totals via server-side aggregation queries, so the
 * balance never requires downloading the full transaction history.
 */
export async function fetchTransactionTotals() {
  const collectionRef = userCollection(COLLECTION);
  const [income, expense] = await Promise.all(
    ['income', 'expense'].map((type) =>
      getAggregateFromServer(query(collectionRef, where('type', '==', type)), {
        total: sum('amount'),
        count: count(),
      }),
    ),
  );
  return {
    income: roundMoney(income.data().total ?? 0),
    expense: roundMoney(expense.data().total ?? 0),
    count: income.data().count + expense.data().count,
  };
}
