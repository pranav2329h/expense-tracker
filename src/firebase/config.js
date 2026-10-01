/**
 * Centralised Firebase initialisation. Configuration comes from Vite environment
 * variables (see .env.example) — nothing environment-specific is hard-coded.
 * The Admin SDK is never used in the frontend.
 */
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { setupAppCheck } from './appCheck';

const env = import.meta.env;

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
};

const REQUIRED_ENV_VARS = {
  VITE_FIREBASE_API_KEY: firebaseConfig.apiKey,
  VITE_FIREBASE_AUTH_DOMAIN: firebaseConfig.authDomain,
  VITE_FIREBASE_PROJECT_ID: firebaseConfig.projectId,
  VITE_FIREBASE_APP_ID: firebaseConfig.appId,
};

/** Names of required variables that are missing — shown on the setup screen. */
export const missingFirebaseEnvVars = Object.entries(REQUIRED_ENV_VARS)
  .filter(([, value]) => !value || !String(value).trim())
  .map(([name]) => name);

export const isFirebaseConfigured = missingFirebaseEnvVars.length === 0;

let app = null;
let auth = null;
let db = null;

if (isFirebaseConfigured) {
  app = initializeApp(firebaseConfig);
  // App Check must be activated before other Firebase services are used.
  setupAppCheck(app);
  auth = getAuth(app);
  db = getFirestore(app);
}

export { app, auth, db };
