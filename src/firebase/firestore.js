/**
 * Firestore path helpers. All data lives under /users/{uid}/..., and the uid is
 * always taken from the signed-in Firebase user — never from caller input.
 */
import { collection, doc } from 'firebase/firestore';
import { auth, db } from './config';
import { AppError } from '@/utils/errors';

export const SINGLETON_DOC_ID = 'data';

export function requireUid() {
  const uid = auth?.currentUser?.uid;
  if (!uid) throw new AppError('Your session has expired. Please sign in again.', 'unauthenticated');
  return uid;
}

export function userCollection(name) {
  return collection(db, 'users', requireUid(), name);
}

export function userDoc(collectionName, id) {
  return doc(db, 'users', requireUid(), collectionName, id);
}

export function settingsDoc() {
  return userDoc('settings', SINGLETON_DOC_ID);
}

export function profileDoc() {
  return userDoc('profile', SINGLETON_DOC_ID);
}

export function toDate(value) {
  return value && typeof value.toDate === 'function' ? value.toDate() : null;
}

/** Snapshot → plain object, with pending server timestamps estimated locally. */
export function readDoc(snapshot) {
  const data = snapshot.data({ serverTimestamps: 'estimate' });
  return {
    ...data,
    id: snapshot.id,
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  };
}
