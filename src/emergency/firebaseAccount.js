// Auth and Firestore, for the account side only (sign-in, a member's own page, the admin panel).
// They arrive with that lazily loaded chunk; the responder's scan never imports this file.
import { connectAuthEmulator, getAuth } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
import { app, CONFIGURED, USE_EMULATORS } from './firebase';

let auth = null;
let db = null;

// Without a config, getAuth throws (auth/invalid-api-key), which would blank the page.
if (CONFIGURED) {
  // Functions was set up first (firebase.js) and starts sending this Auth's ID token from here on.
  auth = getAuth(app);
  db = getFirestore(app);
  if (USE_EMULATORS) {
    try {
      // No warning banner: it covers the bottom of the page, and USE_EMULATORS is dev-server only.
      connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
    } catch {
      // A hot reload: this Auth already talks to the emulator.
    }
    try {
      connectFirestoreEmulator(db, '127.0.0.1', 8080);
    } catch {
      // A hot reload: this Firestore already talks to the emulator.
    }
  }
}

export { auth, db };
