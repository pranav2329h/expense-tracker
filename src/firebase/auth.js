/**
 * Firebase Authentication helpers. Passwords are handled entirely by Firebase Auth;
 * the app never stores them. Session persistence uses Firebase's default
 * (browserLocalPersistence), so users stay signed in across reloads.
 */
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { auth } from './config';

export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const { user } = await signInWithPopup(auth, provider);
  return user;
}

export async function signInWithEmail(email, password) {
  const { user } = await signInWithEmailAndPassword(auth, email, password);
  return user;
}

export async function registerWithEmail({ name, email, password }) {
  const { user } = await createUserWithEmailAndPassword(auth, email, password);
  if (name) await updateProfile(user, { displayName: name });
  return user;
}

export function sendPasswordReset(email) {
  return sendPasswordResetEmail(auth, email);
}

export function signOutUser() {
  return signOut(auth);
}

export async function updateAuthDisplayName(displayName) {
  if (!auth.currentUser) return;
  await updateProfile(auth.currentUser, { displayName });
}
