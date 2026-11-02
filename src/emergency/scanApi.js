// The responder's side: one function call, no sign-in. Imports only the scan-safe core
// (firebase.js), so the phone that scanned a card never downloads Auth or Firestore.
import { httpsCallable } from 'firebase/functions';
import { CONFIGURED, DEMO_MODE, functions } from './firebase';
import { appError, failure, NOT_SET_UP, withDeadline } from './apiErrors';

// import.meta.env.DEV is a build-time false in production, so the demo store and its sample
// data are left out of the build entirely.
const loadDemo = import.meta.env.DEV && DEMO_MODE ? () => import('./demoStore') : null;

// Cold start plus the scrypt check can take several seconds, so allow 20 s for the request.
const UNLOCK_REQUEST_MS = 20_000;
// The SDK's timer starts only once App Check has a token, which on phones first loads reCAPTCHA.
// Cap the whole check so a weak signal ends in a message instead of a minute of spinner.
const UNLOCK_TOTAL_MS = 30_000;

/** Checks the PIN for the card with this link code and returns that member's profile. */
export async function unlockByLink(linkCode, pin) {
  try {
    if (loadDemo) return await (await loadDemo()).unlockByLink(linkCode, pin);
    if (!CONFIGURED) throw appError(NOT_SET_UP);
    const call = httpsCallable(functions, 'unlockProfile', { timeout: UNLOCK_REQUEST_MS })({ id: linkCode, pin });
    const result = await withDeadline(call, UNLOCK_TOTAL_MS);
    return result.data.profile;
  } catch (error) {
    throw failure(error, 'The server couldn’t check the PIN. Try again in a moment.');
  }
}
