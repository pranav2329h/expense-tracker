import { onSnapshot, runTransaction, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/firebase/config';
import { updateAuthDisplayName } from '@/firebase/auth';
import { profileDoc, settingsDoc, userDoc } from '@/firebase/firestore';
import { DEFAULT_CURRENCY, CURRENCY_CODES } from '@/utils/currency';
import { THEME_PREFERENCES } from '@/utils/constants';
import { AppError } from '@/utils/errors';
import { validateAmount, validateDisplayName, validateSettingsPatch } from '@/utils/validation';
import { getDefaultCategoryDocs } from './categoryService';
import { OVERALL_BUDGET_ID } from './budgetService';

export const DEFAULT_SETTINGS = {
  currency: DEFAULT_CURRENCY,
  theme: 'system',
};

function normalizeSettings(data) {
  return {
    currency: CURRENCY_CODES.includes(data?.currency) ? data.currency : DEFAULT_CURRENCY,
    theme: THEME_PREFERENCES.includes(data?.theme) ? data.theme : 'system',
    onboardingCompleted: data?.onboardingCompleted === true,
  };
}

/**
 * `onNext({ exists, fromCache, settings })`. A missing settings document means the
 * user has not completed first-time setup yet.
 */
export function subscribeToSettings(onNext, onError) {
  return onSnapshot(
    settingsDoc(),
    (snapshot) =>
      onNext({
        exists: snapshot.exists(),
        fromCache: snapshot.metadata.fromCache,
        settings: snapshot.exists() ? normalizeSettings(snapshot.data()) : null,
      }),
    onError,
  );
}

export async function updateSettings(patch) {
  const { ok, errors, value } = validateSettingsPatch(patch);
  if (!ok) throw new AppError(Object.values(errors)[0], 'invalid-argument');
  await updateDoc(settingsDoc(), { ...value, updatedAt: serverTimestamp() });
}

function currentProfileFields(displayName) {
  const user = auth.currentUser;
  const photoURL = user?.photoURL && user.photoURL.length <= 2048 ? user.photoURL : null;
  return {
    displayName: (displayName ?? user?.displayName ?? '').slice(0, 100),
    email: (user?.email ?? '').slice(0, 320),
    photoURL,
  };
}

/**
 * First-time setup: settings, profile, the default categories and (optionally) an
 * overall monthly budget, written atomically. Runs inside a transaction that first
 * checks the settings document, so it can never run twice or duplicate categories.
 */
export async function completeOnboarding({ currency = DEFAULT_CURRENCY, theme = 'system', monthlyBudget = '' }) {
  const settingsCheck = validateSettingsPatch({ currency, theme });
  if (!settingsCheck.ok) throw new AppError(Object.values(settingsCheck.errors)[0], 'invalid-argument');

  let budgetAmount = null;
  if (String(monthlyBudget).trim() !== '') {
    const { value, error } = validateAmount(monthlyBudget);
    if (error) throw new AppError(error, 'invalid-argument');
    budgetAmount = value;
  }

  const settingsRef = settingsDoc();
  const profileRef = profileDoc();
  const categoryDocs = getDefaultCategoryDocs();
  const profile = currentProfileFields();

  await runTransaction(db, async (transaction) => {
    const existing = await transaction.get(settingsRef);
    if (existing.exists()) return;

    transaction.set(settingsRef, {
      ...settingsCheck.value,
      onboardingCompleted: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    transaction.set(profileRef, { ...profile, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    for (const { id, data } of categoryDocs) {
      transaction.set(userDoc('categories', id), data);
    }
    if (budgetAmount !== null) {
      transaction.set(userDoc('budgets', OVERALL_BUDGET_ID), {
        name: 'Monthly budget',
        scope: 'overall',
        categoryIds: [],
        amount: budgetAmount,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  });
}

/** Updates the name in Firebase Auth and in the profile document. */
export async function updateDisplayName(rawName) {
  const { value, error } = validateDisplayName(rawName);
  if (error) throw new AppError(error, 'invalid-argument');

  await updateAuthDisplayName(value);
  const fields = currentProfileFields(value);
  try {
    await updateDoc(profileDoc(), { ...fields, updatedAt: serverTimestamp() });
  } catch (err) {
    if (err?.code !== 'not-found') throw err;
    await setDoc(profileDoc(), { ...fields, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  }
  return value;
}
