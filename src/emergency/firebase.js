// The Firebase core every screen shares, the responder's scan included. Only app, App Check and
// Functions: Auth and Firestore live in firebaseAccount.js, so a phone at the roadside that
// scanned a card never downloads them.
import { getApp, getApps, initializeApp } from 'firebase/app';
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check';
import { connectFunctionsEmulator, getFunctions } from 'firebase/functions';
import { FUNCTIONS_REGION, RECAPTCHA_SITE_KEY } from './config';

const env = import.meta.env;

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
};

/** The Firebase web config is filled in (.env locally, repository variables in CI). */
export const CONFIGURED = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

/**
 * Demo mode runs entirely in the browser with the test data and PIN from config.js.
 * Only on the dev server: a production build without the config shows a "not set up" screen
 * instead, so sample medical details and the demo PIN never reach a printed card.
 */
export const DEMO_MODE = !CONFIGURED && env.DEV;

/**
 * `pnpm dev` against the local Firebase emulators (VITE_FIREBASE_EMULATORS=1 in
 * .env.development.local). Never in a build, so a stray setting can't point the live site at 127.0.0.1.
 */
export const USE_EMULATORS = env.DEV && env.VITE_FIREBASE_EMULATORS === '1';

let app = null;
let functions = null;

if (CONFIGURED) {
  // Reuse the app if your portfolio already initialised Firebase elsewhere.
  app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  // Before any function call: once enforceAppCheck is on, calls without a token are rejected.
  // Not against the emulators: the reCAPTCHA key belongs to the live site.
  if (RECAPTCHA_SITE_KEY && !USE_EMULATORS) {
    try {
      initializeAppCheck(app, { provider: new ReCaptchaEnterpriseProvider(RECAPTCHA_SITE_KEY), isTokenAutoRefreshEnabled: true });
    } catch {
      // Already set up on this app (a hot reload, or another part of the site).
    }
  }
  functions = getFunctions(app, FUNCTIONS_REGION);
  if (USE_EMULATORS) connectFunctionsEmulator(functions, '127.0.0.1', 5001);
}

export { app, functions };
