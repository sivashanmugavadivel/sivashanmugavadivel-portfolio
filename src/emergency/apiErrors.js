// Turns Firebase failures into short, calm messages for people in a hurry. Shared by the scan
// (scanApi.js) and the account side (accountApi.js), so it must not import Auth or Firestore.

export const NOT_SET_UP = 'This emergency page isn’t set up yet.';
const NO_CONNECTION = 'No connection. Check mobile data or Wi-Fi and try again.';
const WRONG_LOGIN = 'That ID and password don’t match.';

/** The Firebase error code without its 'auth/' or 'functions/' prefix ('' if there is none). */
export const errorCode = (error) => String(error?.code || '').replace(/^(functions|auth|firestore)\//, '');

/** Rejects with code 'deadline-exceeded' if `promise` hasn't settled after `ms`. */
export function withDeadline(promise, ms) {
  let timer;
  const deadline = new Promise((_, reject) => {
    timer = setTimeout(() => reject(Object.assign(new Error('deadline-exceeded'), { code: 'deadline-exceeded' })), ms);
  });
  return Promise.race([promise, deadline]).finally(() => clearTimeout(timer));
}

/**
 * A Cloud Function's own message ("Incorrect PIN. 4 tries left."), or '' when there isn't one.
 * Auth and Firestore messages are written for developers ("Firebase: Error (auth/…).",
 * "Missing or insufficient permissions."), so those never reach the screen.
 */
function serverMessage(error) {
  if (!String(error?.code || '').startsWith('functions/')) return '';
  // The SDK appends the HTTP status: "Incorrect PIN. 4 tries left. [403]".
  const text = String(error.message || '').replace(/\s*\[\d{3}\]$/, '');
  // Without a message from the function, the SDK fills in the code or "Backend error status: …".
  if (text === errorCode(error) || /^(Unknown backend|Backend) error status/.test(text)) return '';
  return text;
}

export function friendlyError(error, fallback = 'Something went wrong. Try again.') {
  if (error?.friendly) return error.message;
  switch (errorCode(error)) {
    case 'unavailable':
    case 'network-request-failed':
      return NO_CONNECTION;
    case 'deadline-exceeded':
      return 'The connection is too slow right now. Move to better signal, or switch between mobile data and Wi-Fi, and try again.';
    case 'internal':
      // A request that never left the phone also ends up as 'internal'.
      return navigator.onLine === false ? NO_CONNECTION : fallback;
    case 'unauthenticated':
      // What App Check enforcement returns when this browser's token is missing or rejected.
      return 'The server couldn’t verify this browser. Reload the page and try again.';
    case 'popup-blocked':
      return 'Your browser blocked the sign-in window. Allow pop-ups for this site and try again.';
    case 'operation-not-supported-in-this-environment':
      return 'This browser can’t open the sign-in window. Open the page in Chrome or Safari to sign in.';
    case 'unauthorized-domain':
      return 'Google sign-in isn’t allowed on this address yet. Add it under Authorized domains in the Firebase console.';
    case 'wrong-password':
    case 'user-not-found':
    case 'invalid-credential':
    case 'invalid-email':
      return WRONG_LOGIN;
    case 'too-many-requests':
      return 'Too many tries. Wait a few minutes and try again.';
    case 'user-disabled':
      return 'This account is switched off. Ask the admin.';
    default:
      return serverMessage(error) || fallback;
  }
}

/** An error whose message is ready to show. friendlyError and failure pass it through as it is. */
export const appError = (message, code = '') => Object.assign(new Error(message), { code, friendly: true });

/**
 * What the data layer throws: Error(friendly message) with .code set to the Firebase code (no
 * prefix, e.g. 'permission-denied') and the original error as .cause.
 */
export function failure(error, fallback) {
  if (error?.friendly) return error;
  return Object.assign(new Error(friendlyError(error, fallback), { cause: error }), { code: errorCode(error), friendly: true });
}
