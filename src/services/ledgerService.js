import { deleteDoc, doc, onSnapshot, serverTimestamp, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { readDoc, userCollection, userDoc } from '@/firebase/firestore';
import { LIMITS } from '@/utils/constants';
import { AppError } from '@/utils/errors';
import {
  findPersonByName,
  validateLedgerEntryInput,
  validatePersonName,
  validateTransactionInput,
} from '@/utils/validation';
import { notifyTransactionsChanged } from './transactionService';

const PEOPLE = 'people';
const LEDGER = 'ledger';
const TRANSACTIONS = 'transactions';
const BATCH_SIZE = 400;

function readPerson(snapshot) {
  const data = readDoc(snapshot);
  return {
    id: data.id,
    name: typeof data.name === 'string' && data.name ? data.name : 'Unnamed',
    createdAt: data.createdAt,
  };
}

function readEntry(snapshot) {
  const data = readDoc(snapshot);
  return {
    id: data.id,
    personId: data.personId,
    personName: data.personName ?? '',
    direction: data.direction === 'got' ? 'got' : 'gave',
    amount: Number.isFinite(data.amount) ? data.amount : 0,
    note: typeof data.note === 'string' ? data.note : '',
    date: data.date,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

function firstError(errors) {
  return new AppError(Object.values(errors).find(Boolean), 'invalid-argument');
}

export function subscribeToPeople(onNext, onError) {
  return onSnapshot(
    userCollection(PEOPLE),
    (snapshot) => onNext(snapshot.docs.map(readPerson).sort((a, b) => a.name.localeCompare(b.name))),
    onError,
  );
}

export function subscribeToLedger(onNext, onError) {
  return onSnapshot(userCollection(LEDGER), (snapshot) => onNext(snapshot.docs.map(readEntry)), onError);
}

/**
 * Adds a Lend & Borrow entry in one atomic batch:
 * - creates the person if the name is new (an existing name is reused, case-insensitively);
 * - optionally also records the amount as an expense — for when someone paid for
 *   something of yours, such as a bill (`expense: { categoryId }`, "got" entries only).
 */
export async function createLedgerEntry(input, { people, expense = null, categoriesById } = {}) {
  const { ok, errors, value } = validateLedgerEntryInput(input);
  if (!ok) throw firstError(errors);

  const batch = writeBatch(db);
  let person = value.personId ? people.find((item) => item.id === value.personId) : null;
  person ??= findPersonByName(people, value.personName);
  if (!person) {
    const ref = doc(userCollection(PEOPLE));
    person = { id: ref.id, name: value.personName };
    batch.set(ref, { name: person.name, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  }

  const entryRef = doc(userCollection(LEDGER));
  batch.set(entryRef, {
    personId: person.id,
    personName: person.name,
    direction: value.direction,
    amount: value.amount,
    note: value.note,
    date: value.date,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  const addExpense = Boolean(expense) && value.direction === 'got';
  if (addExpense) {
    const description = [value.note, `paid by ${person.name}`].filter(Boolean).join(' — ').slice(0, LIMITS.descriptionMax);
    const tx = validateTransactionInput(
      {
        type: 'expense',
        amount: value.amount,
        categoryId: expense.categoryId,
        paymentMethod: 'other',
        date: value.date,
        description,
      },
      { categoriesById },
    );
    if (!tx.ok) throw firstError(tx.errors);
    const { type, amount, categoryId, categoryName, paymentMethod, date } = tx.value;
    batch.set(doc(userCollection(TRANSACTIONS)), {
      type,
      amount,
      categoryId,
      categoryName,
      paymentMethod,
      description: tx.value.description,
      date,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  await batch.commit();
  if (addExpense) notifyTransactionsChanged();
  return { entryId: entryRef.id, personId: person.id };
}

/** Amount, direction, date and note can change; the person stays the same. */
export async function updateLedgerEntry(entry, input) {
  const { ok, errors, value } = validateLedgerEntryInput({
    ...input,
    personId: entry.personId,
    personName: entry.personName,
  });
  if (!ok) throw firstError(errors);
  await updateDoc(userDoc(LEDGER, entry.id), {
    direction: value.direction,
    amount: value.amount,
    note: value.note,
    date: value.date,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteLedgerEntry(id) {
  await deleteDoc(userDoc(LEDGER, id));
}

export async function renamePerson(person, rawName, people) {
  const { value, error } = validatePersonName(rawName);
  if (error) throw new AppError(error, 'invalid-argument');
  if (findPersonByName(people, value, person.id)) {
    throw new AppError(`You already have someone called "${value}".`, 'invalid-argument');
  }
  await updateDoc(userDoc(PEOPLE, person.id), { name: value, updatedAt: serverTimestamp() });
}

/** Deletes a person and all of their entries. */
export async function deletePerson(person, entries) {
  const refs = [
    ...entries.filter((entry) => entry.personId === person.id).map((entry) => userDoc(LEDGER, entry.id)),
    userDoc(PEOPLE, person.id),
  ];
  for (let start = 0; start < refs.length; start += BATCH_SIZE) {
    const batch = writeBatch(db);
    refs.slice(start, start + BATCH_SIZE).forEach((ref) => batch.delete(ref));
    await batch.commit();
  }
}

/** Restores people and entries from a sanitised backup plan (original ids are kept). */
export async function importLedger(people, entries) {
  const writes = [
    ...people.map((person) => ({
      ref: userDoc(PEOPLE, person.id),
      data: { name: person.name },
    })),
    ...entries.map((entry) => ({
      ref: userDoc(LEDGER, entry.id),
      data: {
        personId: entry.personId,
        personName: entry.personName,
        direction: entry.direction,
        amount: entry.amount,
        note: entry.note,
        date: entry.date,
      },
    })),
  ];
  for (let start = 0; start < writes.length; start += BATCH_SIZE) {
    const batch = writeBatch(db);
    for (const { ref, data } of writes.slice(start, start + BATCH_SIZE)) {
      batch.set(ref, { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    }
    await batch.commit();
  }
  return { people: people.length, entries: entries.length };
}
