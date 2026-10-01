import { addDoc, deleteDoc, onSnapshot, serverTimestamp, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { readDoc, userCollection, userDoc } from '@/firebase/firestore';
import { DEFAULT_CATEGORIES } from '@/utils/constants';
import { FALLBACK_CATEGORY_ICON, isCategoryIconKey } from '@/utils/categoryIcons';
import { AppError } from '@/utils/errors';
import { validateCategoryInput } from '@/utils/validation';

const COLLECTION = 'categories';

function readCategory(snapshot) {
  const data = readDoc(snapshot);
  return {
    id: data.id,
    name: typeof data.name === 'string' && data.name ? data.name : 'Untitled',
    type: data.type === 'income' ? 'income' : 'expense',
    icon: isCategoryIconKey(data.icon) ? data.icon : FALLBACK_CATEGORY_ICON,
    isDefault: data.isDefault === true,
    createdAt: data.createdAt,
  };
}

/** Alphabetical, with "Other…" categories last. */
function sortCategories(categories) {
  const isOther = (category) => /^other\b/i.test(category.name);
  return categories.sort((a, b) => isOther(a) - isOther(b) || a.name.localeCompare(b.name));
}

function validateOrThrow(input, options) {
  const { ok, errors, value } = validateCategoryInput(input, options);
  if (!ok) throw new AppError(Object.values(errors)[0], 'invalid-argument');
  return value;
}

export function subscribeToCategories(onNext, onError) {
  return onSnapshot(
    userCollection(COLLECTION),
    (snapshot) => onNext(sortCategories(snapshot.docs.map(readCategory))),
    onError,
  );
}

export async function createCategory(input, existingCategories) {
  const value = validateOrThrow(input, { categories: existingCategories });
  const ref = await addDoc(userCollection(COLLECTION), {
    ...value,
    isDefault: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

/** Name and icon can change; a category's type is fixed (also enforced by the rules). */
export async function updateCategory(category, input, existingCategories) {
  const value = validateOrThrow({ ...input, type: category.type }, {
    categories: existingCategories,
    editingId: category.id,
  });
  await updateDoc(userDoc(COLLECTION, category.id), {
    name: value.name,
    icon: value.icon,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteCategory(id) {
  await deleteDoc(userDoc(COLLECTION, id));
}

/** Default category documents, keyed by their fixed ids (used during onboarding). */
export function getDefaultCategoryDocs() {
  return DEFAULT_CATEGORIES.map(({ id, name, type, icon }) => ({
    id,
    data: { name, type, icon, isDefault: true, createdAt: serverTimestamp(), updatedAt: serverTimestamp() },
  }));
}

export async function importCategories(categories) {
  if (categories.length === 0) return 0;
  const batch = writeBatch(db);
  for (const category of categories) {
    const value = validateOrThrow(category);
    batch.set(userDoc(COLLECTION, category.id), {
      ...value,
      isDefault: category.isDefault === true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
  await batch.commit();
  return categories.length;
}
