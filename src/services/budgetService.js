import { deleteDoc, doc, onSnapshot, serverTimestamp, setDoc, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { readDoc, userCollection, userDoc } from '@/firebase/firestore';
import { AppError } from '@/utils/errors';
import { validateBudgetInput } from '@/utils/validation';

const COLLECTION = 'budgets';

/** The single overall monthly budget lives at a fixed id (also enforced by the rules). */
export const OVERALL_BUDGET_ID = 'overall';

function readBudget(snapshot) {
  const data = readDoc(snapshot);
  return {
    id: data.id,
    name: typeof data.name === 'string' ? data.name : 'Budget',
    scope: data.id === OVERALL_BUDGET_ID ? 'overall' : 'category',
    categoryIds: Array.isArray(data.categoryIds) ? data.categoryIds.filter((id) => typeof id === 'string') : [],
    amount: Number.isFinite(data.amount) ? data.amount : 0,
    createdAt: data.createdAt,
  };
}

function validateOrThrow(input, categoriesById) {
  const { ok, errors, value } = validateBudgetInput(input, { categoriesById });
  if (!ok) throw new AppError(Object.values(errors)[0], 'invalid-argument');
  return value;
}

export function subscribeToBudgets(onNext, onError) {
  return onSnapshot(
    userCollection(COLLECTION),
    (snapshot) =>
      onNext(snapshot.docs.map(readBudget).sort((a, b) => a.name.localeCompare(b.name))),
    onError,
  );
}

/** Budgets are monthly limits that apply to every month until changed. */
export async function createBudget(input, categoriesById) {
  const value = validateOrThrow(input, categoriesById);
  const ref =
    value.scope === 'overall' ? userDoc(COLLECTION, OVERALL_BUDGET_ID) : doc(userCollection(COLLECTION));
  await setDoc(ref, { ...value, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  return ref.id;
}

export async function updateBudget(budget, input, categoriesById) {
  const value = validateOrThrow({ ...input, scope: budget.scope }, categoriesById);
  await updateDoc(userDoc(COLLECTION, budget.id), {
    name: value.name,
    categoryIds: value.categoryIds,
    amount: value.amount,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteBudget(id) {
  await deleteDoc(userDoc(COLLECTION, id));
}

export async function importBudgets(budgets) {
  if (budgets.length === 0) return 0;
  const batch = writeBatch(db);
  for (const budget of budgets) {
    const value = validateOrThrow(budget);
    batch.set(userDoc(COLLECTION, budget.id), {
      ...value,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
  await batch.commit();
  return budgets.length;
}
