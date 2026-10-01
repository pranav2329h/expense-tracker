/**
 * Firebase App Check (optional).
 *
 * Enabled only when VITE_FIREBASE_APPCHECK_SITE_KEY is set, so local development
 * works without any App Check setup. In development, a debug token (registered in
 * Firebase Console → App Check → Manage debug tokens) lets localhost pass checks
 * once enforcement is turned on. See docs/FIREBASE_SETUP.md, step 9.
 */
import { initializeAppCheck, ReCaptchaEnterpriseProvider, ReCaptchaV3Provider } from 'firebase/app-check';

export function setupAppCheck(app) {
  const siteKey = import.meta.env.VITE_FIREBASE_APPCHECK_SITE_KEY?.trim();
  if (!siteKey) return null;

  if (import.meta.env.DEV) {
    const debugToken = import.meta.env.VITE_FIREBASE_APPCHECK_DEBUG_TOKEN?.trim();
    // `true` makes the SDK print a new debug token to the console for you to register.
    self.FIREBASE_APPCHECK_DEBUG_TOKEN = debugToken || true;
  }

  const provider =
    import.meta.env.VITE_FIREBASE_APPCHECK_PROVIDER === 'recaptcha-v3'
      ? new ReCaptchaV3Provider(siteKey)
      : new ReCaptchaEnterpriseProvider(siteKey);

  try {
    return initializeAppCheck(app, { provider, isTokenAutoRefreshEnabled: true });
  } catch (error) {
    if (import.meta.env.DEV) console.warn('App Check could not be initialised:', error);
    return null;
  }
}
