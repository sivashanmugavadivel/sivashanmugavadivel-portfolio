/**
 * Shared setup for the emulator tests. Every actor (the admin, each member, the responder who
 * scans a card) gets its own Firebase app, so they're as separate as different phones, and all of
 * them use the same client SDK the page ships with (firebase from the repo root).
 */
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { deleteApp, initializeApp, setLogLevel } from 'firebase/app';
import {
  connectAuthEmulator,
  getAuth,
  getIdTokenResult,
  GoogleAuthProvider,
  signInWithCredential,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import {
  collection,
  connectFirestoreEmulator,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';
import { connectFunctionsEmulator, getFunctions, httpsCallable } from 'firebase/functions';

// Half these tests expect a refusal; don't print an SDK warning for each one.
setLogLevel('error');

export const PROJECT_ID = 'demo-emergency';
export const REGION = 'asia-south1';
export const ADMIN_EMAIL = 'admin@example.com';
export const LOGIN_DOMAIN = 'id.sivashanmugavadivel.in';
export const LINK_CODE_PATTERN = /^[a-hjkmnp-z2-9]{10}$/;
// ABCDEFGHJKLMNPQRSTUVWXYZ abcdefghijkmnpqrstuvwxyz 23456789
export const TEMP_PASSWORD_PATTERN = /^[A-HJ-NP-Za-kmnp-z2-9]{12}$/;
export const PROFILE_KEYS = ['profile', 'services', 'medical', 'contacts', 'vehicles', 'about', 'map', 'updatedAt'];
export const SERVICE_NUMBERS = ['112', '108', '100', '101'];
export const NOT_ACTIVE = 'This emergency link isn’t active. Call 112 if you need help.';
export const WRONG_PASSWORD = ['auth/invalid-credential', 'auth/wrong-password'];
// The live page's address, which every email links to (also from the emulator).
export const PAGE_URL = 'https://sivashanmugavadivel.in/emergency';
// GMAIL_USER in firebase/functions/.env.local.
export const GMAIL_USER = 'gmail-user@example.com';
// A real 1×1 PNG, base64: stands in for the card image the page draws.
export const TINY_PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
export const TINY_PNG_URL = `data:image/png;base64,${TINY_PNG}`;

// emulators:exec sets the first two. It sets nothing for functions, so that one has its own name.
const AUTH_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST || '127.0.0.1:9099';
const FIRESTORE_HOST = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080';
export const FUNCTIONS_HOST = process.env.FUNCTIONS_EMULATOR_HOST || '127.0.0.1:5001';

function hostAndPort(value) {
  const at = value.lastIndexOf(':');
  return [value.slice(0, at), Number(value.slice(at + 1))];
}

const apps = [];
let appSeq = 0;

/**
 * A fresh, signed-out actor. `account: false` gives only functions, like the scan page, which
 * never loads firebase/auth or firebase/firestore.
 */
export function newActor(label, { account = true } = {}) {
  const app = initializeApp(
    { projectId: PROJECT_ID, apiKey: 'demo-key', authDomain: 'localhost' },
    `${label}-${(appSeq += 1)}`,
  );
  apps.push(app);
  const actor = { label, app, auth: null, db: null };
  if (account) {
    actor.auth = getAuth(app);
    connectAuthEmulator(actor.auth, `http://${AUTH_HOST}`, { disableWarnings: true });
    actor.db = getFirestore(app);
    connectFirestoreEmulator(actor.db, ...hostAndPort(FIRESTORE_HOST));
  }
  const functions = getFunctions(app, REGION);
  connectFunctionsEmulator(functions, ...hostAndPort(FUNCTIONS_HOST));
  actor.call = async (name, data) => (await httpsCallable(functions, name)(data)).data;
  actor.claims = async (refresh = false) => (await getIdTokenResult(actor.auth.currentUser, refresh)).claims;
  return actor;
}

/** Closes every app this file made, so the test process can exit. */
export async function deleteActors() {
  await Promise.all(apps.splice(0).map((app) => deleteApp(app)));
}

/**
 * An unsigned ID token with these claims on top of the usual ones (issued and signed in now, by
 * email and password). The emulators don't check signatures (the Auth emulator's own tokens are
 * unsigned too), so the rules and the functions see exactly these claims. For token shapes a real
 * sign-in here can't make: a password session on the admin's address (not without changing the
 * admin's account, which every test file shares), or a sign-in at a chosen second.
 */
export function forgeIdToken({ firebase, ...claims }) {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: `https://securetoken.google.com/${PROJECT_ID}`,
    aud: PROJECT_ID,
    iat: now,
    exp: now + 3600,
    auth_time: now,
    user_id: claims.sub,
    ...claims,
    firebase: { identities: {}, sign_in_provider: 'password', ...firebase },
  };
  const part = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${part({ alg: 'none', typ: 'JWT' })}.${part(payload)}.`;
}

/**
 * A browser holding a forged token (forgeIdToken): Firestore sends it, and so does `call`, which
 * speaks the callable protocol itself because the Functions SDK only sends real sign-ins. Its
 * errors carry the SDK's codes ('functions/permission-denied'), so rejectsWith works on them.
 */
export function forgedActor(label, claims) {
  const token = forgeIdToken(claims);
  const app = initializeApp({ projectId: PROJECT_ID, apiKey: 'demo-key' }, `${label}-${(appSeq += 1)}`);
  apps.push(app);
  const db = getFirestore(app);
  connectFirestoreEmulator(db, ...hostAndPort(FIRESTORE_HOST), { mockUserToken: token });
  const call = async (name, data = null) => {
    const res = await fetch(`http://${FUNCTIONS_HOST}/${PROJECT_ID}/${REGION}/${name}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ data }),
    });
    const body = await res.json();
    if (!body.error) return body.result;
    const code = `functions/${String(body.error.status).toLowerCase().replace(/_/g, '-')}`;
    throw Object.assign(new Error(body.error.message), { code });
  };
  return { label, app, auth: null, db, call };
}

/**
 * Waits for the clock's next second. Sign-in times (auth_time) and members.tokensValidAfter are
 * whole seconds, and a session that signed in during the cutoff's own second still counts (as with
 * Auth's own revocation), so a test that wants a session cut off lets its sign-in second end first.
 * The emulators run on this machine, so they share this clock.
 */
export function nextSecond() {
  return new Promise((resolve) => setTimeout(resolve, 1000 - (Date.now() % 1000) + 50));
}

// ---------------------------------------------------------------------------
// People
// ---------------------------------------------------------------------------
const RUN = `${Date.now().toString(36)}${crypto.randomBytes(2).toString('hex')}`;
let idSeq = 0;

/** A login ID no other test, file or earlier run against the same emulator has used. */
export function uniqueLoginId() {
  return `t${RUN}-${(idSeq += 1)}`;
}

export function loginEmail(loginId) {
  return `${loginId}@${LOGIN_DOMAIN}`;
}

export function strongPassword() {
  return `Pw-${crypto.randomBytes(8).toString('hex')}`;
}

/** The Auth emulator takes unsigned JSON claims in place of a Google ID token. */
export async function signInGoogle(actor, email) {
  const credential = GoogleAuthProvider.credential(
    JSON.stringify({ sub: `google-${email}`, email, email_verified: true }),
  );
  return (await signInWithCredential(actor.auth, credential)).user;
}

/** Signs in as the listed Google account and claims admin, as signInAdmin does. */
export async function newAdmin() {
  const admin = newActor('admin');
  await signInGoogle(admin, ADMIN_EMAIL);
  assert.deepEqual(await admin.call('claimAdmin'), { admin: true });
  await admin.auth.currentUser.getIdToken(true); // the claim only shows up in a fresh token
  return admin;
}

export async function signInMember(actor, loginId, password) {
  return (await signInWithEmailAndPassword(actor.auth, loginEmail(loginId), password)).user;
}

/** `email` only goes in when given, as from an admin who left the field empty. */
export function createMember(admin, { name = 'Test Member', pinLength = 6, email } = {}) {
  return admin.call('adminCreateMember', { loginId: uniqueLoginId(), name, pinLength, ...(email && { email }) });
}

/** A contact address no other member uses. */
export function uniqueEmail() {
  return `${uniqueLoginId()}@example.com`;
}

/** A member who has swapped the temporary password for their own and is signed in with it. */
export async function readyMember(admin, options) {
  const created = await createMember(admin, options);
  const actor = newActor(`member-${created.loginId}`);
  await signInMember(actor, created.loginId, created.tempPassword);
  const password = strongPassword();
  assert.deepEqual(await actor.call('changeTempPassword', { newPassword: password }), { ok: true });
  await signInMember(actor, created.loginId, password);
  return { ...created, password, actor };
}

// ---------------------------------------------------------------------------
// Firestore, the way the account pages use it
// ---------------------------------------------------------------------------
export function getMember(actor, uid) {
  return getDoc(doc(actor.db, 'members', uid));
}

export function getProfile(actor, uid) {
  return getDoc(doc(actor.db, 'profiles', uid));
}

/** Writes a profile the way saveProfile does: the stored keys, with a fresh updatedAt. */
export function saveProfile(actor, uid, data) {
  const fields = { ...data };
  delete fields.updatedAt;
  return setDoc(doc(actor.db, 'profiles', uid), { ...fields, updatedAt: serverTimestamp() });
}

/** The access-log query from loadAccessLogs. */
export function accessLogs(actor, uid, count = 50) {
  return getDocs(
    query(collection(actor.db, 'accessLogs'), where('uid', '==', uid), orderBy('at', 'desc'), limit(count)),
  );
}

/** Retries `check` for a few seconds, for writes that may land just after a call returns. */
export async function eventually(check, { timeout = 8000, interval = 250 } = {}) {
  const deadline = Date.now() + timeout;
  for (;;) {
    try {
      return await check();
    } catch (err) {
      if (Date.now() > deadline) throw err;
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }
}

export function expectLog(actor, uid, type) {
  return eventually(async () => {
    const types = (await accessLogs(actor, uid)).docs.map((d) => d.get('type'));
    assert.ok(types.includes(type), `no '${type}' log for ${uid} (have: ${types.join(', ') || 'none'})`);
  });
}

/** The member's access-log entries of one type, newest first, as plain data. */
export async function logEntries(actor, uid, type) {
  return (await accessLogs(actor, uid)).docs.map((d) => d.data()).filter((d) => d.type === type);
}

// ---------------------------------------------------------------------------
// Server-only documents
// ---------------------------------------------------------------------------
// secrets/ and outbox/ are closed to every browser, so the tests read them the way the functions
// do: past the rules. The Firestore emulator's REST API lets a request with "Bearer owner" do that.
const DOCUMENTS = `http://${FIRESTORE_HOST}/v1/projects/${PROJECT_ID}/databases/(default)/documents`;
const OWNER = { Authorization: 'Bearer owner' };

function fromValue(value) {
  if ('mapValue' in value) return fromFields(value.mapValue.fields);
  if ('arrayValue' in value) return (value.arrayValue.values || []).map(fromValue);
  if ('integerValue' in value) return Number(value.integerValue);
  if ('timestampValue' in value) return new Date(value.timestampValue);
  if ('nullValue' in value) return null;
  return value.stringValue ?? value.booleanValue ?? value.doubleValue;
}

function fromFields(fields = {}) {
  return Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, fromValue(value)]));
}

async function ownerFetch(path, init = {}, { missingOk = false } = {}) {
  const res = await fetch(`${DOCUMENTS}${path}`, { ...init, headers: { ...OWNER, ...init.headers } });
  if (!res.ok && !(missingOk && res.status === 404)) {
    throw new Error(`owner ${init.method || 'GET'} ${path}: ${res.status} ${await res.text()}`);
  }
  return res;
}

/** A document's fields past the rules (`secrets/<uid>`), or null if there's none. */
export async function ownerGet(path) {
  const res = await ownerFetch(`/${path}`, {}, { missingOk: true });
  return res.status === 404 ? null : fromFields((await res.json()).fields);
}

/** Removes one field past the rules: an update mask naming a field the body leaves out. */
export async function ownerDeleteField(path, field) {
  await ownerFetch(`/${path}?updateMask.fieldPaths=${encodeURIComponent(field)}&currentDocument.exists=true`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: {} }),
  });
}

/** The emulator's copies of the emails sent to one member, oldest first, each with its doc `id`. */
export async function outbox(uid) {
  const res = await ownerFetch(':runQuery', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId: 'outbox' }],
        where: { fieldFilter: { field: { fieldPath: 'uid' }, op: 'EQUAL', value: { stringValue: uid } } },
      },
    }),
  });
  const rows = (await res.json())
    .filter((row) => row.document)
    .map(({ document }) => ({ id: document.name.split('/').pop(), ...fromFields(document.fields) }));
  return rows.sort((a, b) => a.createdAt - b.createdAt);
}

// ---------------------------------------------------------------------------
// Errors and PINs
// ---------------------------------------------------------------------------
/**
 * Expects `promise` to fail with one of `codes`. `message` is an exact string or a RegExp.
 * Codes are the SDK's: 'functions/not-found', 'auth/user-disabled', 'permission-denied' (Firestore).
 */
export async function rejectsWith(promise, codes, message) {
  const expected = [codes].flat();
  await assert.rejects(promise, (err) => {
    assert.ok(expected.includes(err.code), `expected ${expected.join(' or ')}, got ${err.code}: ${err.message}`);
    // The Functions SDK appends the HTTP status ("… [404]"); the page strips it too (apiErrors.js).
    const text = String(err.message).replace(/\s*\[\d{3}\]$/, '');
    if (message instanceof RegExp) assert.match(text, message);
    else if (message !== undefined) assert.equal(text, message);
    return true;
  });
}

/** Firestore rules said no. */
export function denied(promise) {
  return rejectsWith(promise, 'permission-denied');
}

/** Same length, last digit off by one: well-formed but wrong. */
export function wrongPin(pin) {
  return `${pin.slice(0, -1)}${(Number(pin.at(-1)) + 1) % 10}`;
}

/** A well-formed link code that no card uses. */
export function unknownLinkCode() {
  const alphabet = 'abcdefghjkmnpqrstuvwxyz23456789';
  return Array.from({ length: 10 }, () => alphabet[crypto.randomInt(alphabet.length)]).join('');
}

/** Only the shapes the spec rules out: 000000, 123456, 654321, 121212, 112233. */
export function isWeakPin(pin) {
  const d = [...pin].map(Number);
  const steps = d.slice(1).map((n, i) => n - d[i]);
  if (steps.every((s) => s === 0) || steps.every((s) => s === 1) || steps.every((s) => s === -1)) return true;
  if (pin.length % 2 === 0 && pin === pin.slice(0, 2).repeat(pin.length / 2)) return true;
  if (pin.length % 2 === 0) {
    const pairs = pin.match(/../g);
    if (pairs.every((p) => p[0] === p[1])) {
      const firsts = pairs.map((p) => Number(p[0]));
      const pairSteps = firsts.slice(1).map((n, i) => n - firsts[i]);
      if (pairSteps.every((s) => s === 1) || pairSteps.every((s) => s === -1)) return true;
    }
  }
  return false;
}
