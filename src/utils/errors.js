/**
 * Maps Firebase/network errors to friendly, non-technical messages.
 * Raw errors (and stack traces) are only logged to the console in development.
 */

export class AppError extends Error {
  constructor(message, code = 'app/error') {
    super(message);
    this.name = 'AppError';
    this.code = code;
  }
}

const OFFLINE_MESSAGE = 'You appear to be offline. Please check your connection and try again.';

const MESSAGES = {
  // Authentication
  'auth/invalid-credential': 'Incorrect email or password.',
  'auth/wrong-password': 'Incorrect email or password.',
  'auth/user-not-found': 'Incorrect email or password.',
  'auth/invalid-login-credentials': 'Incorrect email or password.',
  'auth/email-already-in-use': 'An account with this email already exists. Try signing in instead.',
  'auth/invalid-email': 'Enter a valid email address.',
  'auth/missing-email': 'Enter your email address.',
  'auth/missing-password': 'Enter your password.',
  'auth/weak-password': 'Choose a stronger password (at least 8 characters).',
  'auth/password-does-not-meet-requirements': 'That password does not meet the password requirements.',
  'auth/too-many-requests': 'Too many attempts. Please wait a few minutes and try again.',
  'auth/network-request-failed': 'Network error. Please check your connection and try again.',
  'auth/popup-blocked': 'The sign-in popup was blocked. Allow popups for this site and try again.',
  'auth/account-exists-with-different-credential':
    'An account already exists with this email using a different sign-in method.',
  'auth/operation-not-allowed': 'This sign-in method is not enabled for this app.',
  'auth/unauthorized-domain':
    'This domain is not authorised for sign-in. Add it under Firebase Authentication → Settings → Authorized domains.',
  'auth/user-disabled': 'This account has been disabled.',
  'auth/requires-recent-login': 'Please sign in again to continue.',
  'auth/internal-error': 'Sign-in failed. Please try again.',
  'auth/invalid-api-key': 'The app is misconfigured (invalid Firebase API key).',
  'auth/configuration-not-found': 'Authentication is not set up for this Firebase project yet.',
  // Firestore
  'permission-denied':
    "You don't have permission to access this data. Try signing out and back in, and make sure the Firestore security rules are deployed.",
  unauthenticated: 'Your session has expired. Please sign in again.',
  unavailable: 'Unable to reach the server. Please check your connection and try again.',
  'deadline-exceeded': 'The request took too long. Please check your connection and try again.',
  'resource-exhausted': 'The service is busy right now. Please try again shortly.',
  'not-found': 'That item no longer exists.',
  'already-exists': 'That item already exists.',
  aborted: 'The operation was interrupted. Please try again.',
  cancelled: 'The operation was cancelled.',
  'invalid-argument': 'Some of the data was invalid and could not be saved.',
  internal: 'Something went wrong on the server. Please try again.',
};

/** Errors that should be ignored silently (the user closed a popup, etc.). */
const SILENT_CODES = new Set(['auth/popup-closed-by-user', 'auth/cancelled-popup-request', 'auth/user-cancelled']);

export function isSilentError(error) {
  return SILENT_CODES.has(error?.code);
}

export function getErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  if (!error) return fallback;
  if (import.meta.env.DEV) console.error(error);

  if (error instanceof AppError) return error.message;

  const code = typeof error.code === 'string' ? error.code : '';

  if (code === 'failed-precondition') {
    return /index/i.test(error.message ?? '')
      ? 'A required database index is missing or still building. Deploy firestore.indexes.json and try again in a few minutes.'
      : 'This action could not be completed right now. Please try again.';
  }

  if (MESSAGES[code]) return MESSAGES[code];

  if (typeof navigator !== 'undefined' && navigator.onLine === false) return OFFLINE_MESSAGE;

  return fallback;
}

export function isOffline() {
  return typeof navigator !== 'undefined' && navigator.onLine === false;
}

export function assertOnline() {
  if (isOffline()) throw new AppError(OFFLINE_MESSAGE, 'app/offline');
}
