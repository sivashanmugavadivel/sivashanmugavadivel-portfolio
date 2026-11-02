// The account side: members signing in to keep their own page, and the admin running the cards.
// Loaded only with the lazy account chunk, never by the responder's scan. Every function throws
// Error(friendly message) with .code set to the Firebase code (see failure in apiErrors.js).
// On the dev server without Firebase (DEMO_MODE), the same functions run against demoStore.js.
import {
  EmailAuthProvider,
  getIdToken,
  getIdTokenResult,
  GoogleAuthProvider,
  onIdTokenChanged,
  reauthenticateWithCredential,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updatePassword,
} from 'firebase/auth';
import { collection, doc, getDoc, getDocs, limit, orderBy, query, serverTimestamp, setDoc, where } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { CONFIGURED, DEMO_MODE, functions } from './firebase';
import { auth, db } from './firebaseAccount';
import { appError, errorCode, failure, friendlyError, NOT_SET_UP } from './apiErrors';
import {
  LOGIN_DOMAIN,
  LOGIN_ID_HINT,
  LOGIN_ID_PATTERN,
  loginEmail,
  normalizeLoginId,
  passwordProblem,
  PIN_LENGTH,
} from './config';
import { blankProfile } from './sampleData';

// import.meta.env.DEV is a build-time false in production, so the demo store and its sample
// data are left out of the build entirely.
const loadDemo = import.meta.env.DEV && DEMO_MODE ? () => import('./demoStore') : null;

const clone = (value) => JSON.parse(JSON.stringify(value));

/** The keys firestore.rules allow in profiles/{uid}, besides updatedAt. */
const PROFILE_KEYS = Object.keys(blankProfile);

const WRONG_CURRENT_PASSWORD = new Set(['wrong-password', 'invalid-credential']);

/** Firestore Timestamps → milliseconds, so the rest of the app only sees plain JSON. */
function toPlain(value) {
  if (value && typeof value.toMillis === 'function') return value.toMillis();
  if (Array.isArray(value)) return value.map(toPlain);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, toPlain(v)]));
  }
  return value;
}

/** The demo store's version on the dev server without Firebase, the real one otherwise; failures come out friendly. */
async function run(fallback, demo, real) {
  try {
    if (loadDemo) return await demo(await loadDemo());
    if (!CONFIGURED) throw appError(NOT_SET_UP);
    return await real();
  } catch (error) {
    throw failure(error, fallback);
  }
}

async function callable(name, data) {
  const result = await httpsCallable(functions, name)(data);
  return result.data;
}

/**
 * A time from a callable as milliseconds: functions/index.js sends numbers, but a Timestamp that
 * slipped through arrives as { _seconds, _nanoseconds }.
 */
function asMillis(value) {
  if (typeof value === 'number') return value;
  const seconds = value?._seconds ?? value?.seconds;
  if (typeof seconds === 'number') return seconds * 1000 + Math.round((value._nanoseconds ?? value.nanoseconds ?? 0) / 1e6);
  const parsed = typeof value === 'string' ? Date.parse(value) : NaN;
  return Number.isNaN(parsed) ? null : parsed;
}

/** What the server says about one email: { sent, to, reason } ('' where it doesn't say). */
const toMailResult = (r) => ({ sent: r?.sent === true, to: r?.to || '', reason: r?.reason || '' });

function toCard(c) {
  return {
    uid: c.uid,
    loginId: c.loginId || '',
    name: c.name || '',
    email: c.email || '',
    linkCode: c.linkCode || null,
    // Members made before PINs were kept on file have none to show.
    pin: c.pin || null,
    pinSetAt: asMillis(c.pinSetAt),
  };
}

function signedInUser() {
  if (!auth.currentUser) throw appError('You’re signed out. Sign in again.', 'unauthenticated');
  return auth.currentUser;
}

/** 'ravi' for 'ravi@id.sivashanmugavadivel.in'; null for any other address (a Google account). */
function loginIdFromEmail(email) {
  const suffix = `@${LOGIN_DOMAIN}`;
  const address = String(email || '').toLowerCase();
  return address.endsWith(suffix) ? address.slice(0, -suffix.length) : null;
}

function toMember(uid, data) {
  const m = toPlain(data);
  return {
    uid,
    loginId: m.loginId || '',
    name: m.name || '',
    email: m.email || '',
    linkCode: m.linkCode || null,
    disabled: m.disabled === true,
    mustChangePassword: m.mustChangePassword === true,
    createdAt: m.createdAt ?? null,
    updatedAt: m.updatedAt ?? null,
    pinSetAt: m.pinSetAt ?? null,
    passwordSetAt: m.passwordSetAt ?? null,
  };
}

async function readMember(uid) {
  const snap = await getDoc(doc(db, 'members', uid));
  return snap.exists() ? toMember(snap.id, snap.data()) : null;
}

/** Only what the rules accept for profiles/{uid}: the profile keys, and no undefined values (Firestore rejects them). */
function cleanProfile(data) {
  const copy = clone(data ?? {});
  return Object.fromEntries(PROFILE_KEYS.filter((key) => key in copy).map((key) => [key, copy[key]]));
}

// ---------------------------------------------------------------------------
// Contact emails (members/{uid}.email): where the welcome and card emails go. Not the sign-in
// address, which stays the hidden `${loginId}@${LOGIN_DOMAIN}`.
// ---------------------------------------------------------------------------
export const EMAIL_MAX_LENGTH = 254;
// Deliberately loose: the mail server is the real test, this only catches slips like a missing @.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;

/** Trimmed and lowercased, as functions/index.js stores it. */
export const normalizeEmail = (email) => String(email ?? '').trim().toLowerCase();

/** Why a normalised address won't do, or '' if it's fine. Empty is fine too: the email is optional. */
export function emailProblem(email) {
  if (!email) return '';
  if (email.length > EMAIL_MAX_LENGTH || !EMAIL_PATTERN.test(email)) return 'Enter a full email address, like ravi@example.com.';
  return '';
}

// ---------------------------------------------------------------------------
// Who is signed in
// ---------------------------------------------------------------------------
/**
 * What onAccountChange reports for this Firebase user: { account } with account null if it is
 * neither an admin nor a member, plus `why` when this page ended the session itself.
 */
async function describeAccount(user) {
  let claims;
  try {
    ({ claims } = await getIdTokenResult(user));
  } catch {
    return { account: null }; // Can't tell who this is (offline with an expired token), so offer the sign-in form.
  }
  if (claims.admin === true) {
    return {
      account: {
        uid: user.uid,
        kind: 'admin',
        loginId: null,
        name: user.displayName || user.email || 'Admin',
        email: user.email,
        mustChangePassword: false,
      },
    };
  }

  // Members have a login-domain address. A Google account lands here between the popup and
  // claimAdmin, or when it isn't an admin; it isn't an account of this page either way.
  const loginId = loginIdFromEmail(user.email);
  if (!loginId) return { account: null };
  let member = null;
  try {
    member = await readMember(user.uid);
  } catch {
    // Offline: the token alone is enough to carry on.
  }
  if (member?.disabled) {
    // Switched off while signed in here. The admin revoked the session too; end it now, not in an
    // hour, and say why, or the member is just dropped on the sign-in form.
    await signOut(auth).catch(() => {});
    return { account: null, why: friendlyError({ code: 'auth/user-disabled' }) };
  }
  return {
    account: {
      uid: user.uid,
      kind: 'member',
      loginId: member?.loginId || loginId,
      name: member?.name || user.displayName || loginId,
      email: user.email,
      // The claim, not the members doc: it's what firestore.rules and changeTempPassword go by.
      mustChangePassword: claims.mustChangePassword === true,
    },
  };
}

const ACCOUNT_FIELDS = ['uid', 'kind', 'loginId', 'name', 'email', 'mustChangePassword'];
const sameAccount = (a, b) => a === b || Boolean(a && b && ACCOUNT_FIELDS.every((key) => a[key] === b[key]));

/**
 * Calls cb(null) when signed out, else cb({ uid, kind: 'admin' | 'member', loginId, name, email,
 * mustChangePassword }). When this page signed the person out itself (their account is switched
 * off), cb(null, why) also says why, for the sign-in form. Returns the unsubscribe function.
 */
export function onAccountChange(cb) {
  if (loadDemo) {
    let stop = () => {};
    let active = true;
    loadDemo().then((demo) => {
      if (active) stop = demo.onAccountChange(cb);
    });
    return () => {
      active = false;
      stop();
    };
  }
  if (!auth) {
    cb(null);
    return () => {};
  }

  let active = true;
  let latest = 0;
  let reported;
  // onIdTokenChanged rather than onAuthStateChanged: it also fires when the token is refreshed,
  // which is how claim changes arrive (getIdToken(true) after claimAdmin, the fresh sign-in after
  // changeTempPassword). The hourly refresh fires it too, so unchanged accounts aren't re-reported.
  const stop = onIdTokenChanged(auth, async (user) => {
    const turn = ++latest;
    const { account, why } = user ? await describeAccount(user) : { account: null };
    // A newer change may have arrived while this one was looking things up.
    if (!active || turn !== latest || (reported !== undefined && sameAccount(reported, account))) return;
    reported = account;
    cb(account, why);
  });
  return () => {
    active = false;
    stop();
  };
}

// ---------------------------------------------------------------------------
// Signing in and out, passwords
// ---------------------------------------------------------------------------
export async function signInMember(loginId, password) {
  const id = normalizeLoginId(loginId);
  if (!id) throw appError('Enter your ID.', 'invalid-argument');
  if (!password) throw appError('Enter your password.', 'invalid-argument');
  // An ID that can't exist gets the same answer as a wrong password.
  if (!LOGIN_ID_PATTERN.test(id)) throw failure({ code: 'auth/invalid-credential' });
  return run(
    'Couldn’t sign in. Try again.',
    (demo) => demo.signInMember(id, password),
    async () => {
      const { user } = await signInWithEmailAndPassword(auth, loginEmail(id), password);
      // Auth still takes the password of a member who is switched off in members/ when the Auth
      // half of adminSetDisabled failed. onAccountChange signs them straight out again and has
      // nothing new to report, so without this the form would wait for an account that never comes.
      const member = await readMember(user.uid).catch(() => null);
      // onAccountChange reads the same doc, and its sign-out can land first and fail this read.
      // Nothing else on the page signs a member out in that moment.
      if (member?.disabled || auth.currentUser?.uid !== user.uid) {
        await signOut(auth).catch(() => {});
        throw failure({ code: 'auth/user-disabled' });
      }
    },
  );
}

/** Google popup, then claimAdmin, then a fresh token so the admin claim reaches onAccountChange. */
export function signInAdmin() {
  return run(
    'Sign-in failed. Try again.',
    (demo) => demo.signInAdmin(),
    async () => {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      let user;
      try {
        ({ user } = await signInWithPopup(auth, provider));
      } catch (error) {
        // No signInWithRedirect fallback: with authDomain on firebaseapp.com and the page on another
        // domain, Safari and Firefox come back from it signed out. friendlyError says what to do instead.
        if (['popup-closed-by-user', 'cancelled-popup-request'].includes(errorCode(error))) return;
        throw error;
      }
      try {
        await callable('claimAdmin');
        await getIdToken(user, true);
      } catch (error) {
        // Don't leave a Google account signed in that this page has no use for.
        await signOut(auth).catch(() => {});
        if (errorCode(error) === 'permission-denied') {
          throw appError('That Google account isn’t an admin of this page.', 'permission-denied');
        }
        throw error;
      }
    },
  );
}

export function signOutAccount() {
  return run(
    'Couldn’t sign out. Try again.',
    (demo) => demo.signOutAccount(),
    () => signOut(auth),
  );
}

/** Replaces the admin's temporary password with the member's own, then signs in again with it. */
export function changeTempPassword(newPassword) {
  return run(
    'Couldn’t change the password. Try again.',
    (demo) => demo.changeTempPassword(newPassword),
    async () => {
      const user = signedInUser();
      const problem = passwordProblem(newPassword, loginIdFromEmail(user.email));
      if (problem) throw appError(problem, 'invalid-argument');
      await callable('changeTempPassword', { newPassword });
      try {
        // The new password ended this session, and only a fresh token drops the mustChangePassword
        // claim; onAccountChange then reports the member without it.
        await signInWithEmailAndPassword(auth, user.email, newPassword);
      } catch (error) {
        await signOut(auth).catch(() => {});
        // signedOut: the form that called this is already being replaced by the sign-in form, so
        // the message has to be shown there (AccountPage passes it on).
        throw Object.assign(appError('Your new password is saved. Sign in with it to carry on.', errorCode(error)), {
          signedOut: true,
        });
      }
    },
  );
}

/** A member changing their own password: the current one first, then the new one. */
export async function changePassword(currentPassword, newPassword) {
  if (!currentPassword) throw appError('Enter your current password.', 'invalid-argument');
  if (newPassword === currentPassword) {
    throw appError('The new password is the same as the current one.', 'invalid-argument');
  }
  return run(
    'Couldn’t change the password. Try again.',
    (demo) => demo.changePassword(currentPassword, newPassword),
    async () => {
      const user = signedInUser();
      const problem = passwordProblem(newPassword, loginIdFromEmail(user.email));
      if (problem) throw appError(problem, 'invalid-argument');
      try {
        await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, currentPassword));
      } catch (error) {
        if (WRONG_CURRENT_PASSWORD.has(errorCode(error))) {
          throw appError('That isn’t your current password.', errorCode(error));
        }
        throw error;
      }
      await updatePassword(user, newPassword);
      // Auth stops renewing the other devices' sessions, but Firestore would honour their ID
      // tokens for up to an hour; passwordChanged ends them all (this one too). If it can't be
      // reached the password is still changed, so carry on in this session.
      const ended = await callable('passwordChanged').then(
        () => true,
        () => false,
      );
      if (!ended) return;
      try {
        await signInWithEmailAndPassword(auth, user.email, newPassword);
      } catch (error) {
        await signOut(auth).catch(() => {});
        throw Object.assign(appError('Your new password is saved. Sign in with it to carry on.', errorCode(error)), {
          signedOut: true,
        });
      }
    },
  );
}

// ---------------------------------------------------------------------------
// Members, profiles, access logs (Firestore rules: self or admin)
// ---------------------------------------------------------------------------
/** { uid, loginId, name, email, linkCode, disabled, mustChangePassword, createdAt, updatedAt, pinSetAt, passwordSetAt } or null. */
export function loadMember(uid) {
  return run(
    'Couldn’t load the member.',
    (demo) => demo.loadMember(uid),
    () => readMember(uid),
  );
}

export function loadProfile(uid) {
  return run(
    'Couldn’t load the profile.',
    (demo) => demo.loadProfile(uid),
    async () => {
      const snap = await getDoc(doc(db, 'profiles', uid));
      return snap.exists() ? toPlain(snap.data()) : null;
    },
  );
}

/** Saves the whole profile and returns it as saved (updatedAt = now). */
export function saveProfile(uid, data) {
  const profile = cleanProfile(data);
  return run(
    'Couldn’t save. Your changes are still here; try again.',
    (demo) => demo.saveProfile(uid, profile),
    async () => {
      await setDoc(doc(db, 'profiles', uid), { ...profile, updatedAt: serverTimestamp() });
      return { ...profile, updatedAt: Date.now() };
    },
  );
}

/** Newest first: [{ id, type, at, visitor, userAgent, detail }]. */
export function loadAccessLogs(uid, count = 20) {
  return run(
    'Couldn’t load the access log.',
    (demo) => demo.loadAccessLogs(uid, count),
    async () => {
      const snap = await getDocs(
        query(collection(db, 'accessLogs'), where('uid', '==', uid), orderBy('at', 'desc'), limit(count)),
      );
      return snap.docs.map((d) => {
        const { type, at, visitor, userAgent, detail } = toPlain(d.data());
        return { id: d.id, type, at: at ?? null, visitor: visitor ?? '', userAgent: userAgent ?? '', detail: detail ?? '' };
      });
    },
  );
}

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------
/** Newest first. Each member also has profileUpdatedAt: when their page was last saved (null if never). */
export function listMembers() {
  return run(
    'Couldn’t load the members.',
    (demo) => demo.listMembers(),
    async () => {
      const [members, profiles] = await Promise.all([
        getDocs(query(collection(db, 'members'), orderBy('createdAt', 'desc'))),
        // Only for "last updated"; the list still shows if this read fails.
        getDocs(collection(db, 'profiles')).catch(() => null),
      ]);
      const saved = new Map((profiles?.docs ?? []).map((d) => [d.id, toPlain(d.get('updatedAt')) ?? null]));
      return members.docs.map((d) => ({ ...toMember(d.id, d.data()), profileUpdatedAt: saved.get(d.id) ?? null }));
    },
  );
}

/**
 * { uid, loginId, name, email, tempPassword, pin, linkCode }. The temporary password is never
 * shown again (emailMember 'welcome' can send it); the PIN and link are, through getCard.
 * Creating emails no one: the page sends the welcome itself, with the card it draws.
 */
export async function createMember({ loginId, name, email } = {}) {
  const id = normalizeLoginId(loginId);
  const fullName = String(name ?? '').trim();
  const contact = normalizeEmail(email);
  if (!LOGIN_ID_PATTERN.test(id)) throw appError(LOGIN_ID_HINT, 'invalid-argument');
  if (!fullName) throw appError('Enter the member’s name.', 'invalid-argument');
  const problem = emailProblem(contact);
  if (problem) throw appError(problem, 'invalid-argument');
  const request = { loginId: id, name: fullName, ...(contact && { email: contact }) };
  return run(
    'Couldn’t create the member. Try again.',
    (demo) => demo.createMember(request),
    async () => {
      const created = await callable('adminCreateMember', { ...request, pinLength: PIN_LENGTH });
      // Only an address the server says it kept: the welcome email goes nowhere else.
      return { ...created, email: created.email || '' };
    },
  );
}

/**
 * Emails a member: 'welcome' (needs tempPassword; cardPng is attached when given) or 'card'
 * (needs cardPng, the "card with PIN" PNG as a data: URL). Resolves to { sent: true, to } or,
 * when the mail server turned it down, { sent: false, to, reason }. Rejects when the request
 * itself fails, e.g. with code 'failed-precondition' for a member with no email on file.
 */
export function emailMember(uid, template, { tempPassword, cardPng } = {}) {
  const request = { uid, template, ...(tempPassword && { tempPassword }), ...(cardPng && { cardPng }) };
  return run(
    'Couldn’t send the email. Try again.',
    async (demo) => toMailResult(await demo.emailMember(uid, template, { tempPassword, cardPng })),
    async () => toMailResult(await callable('adminEmailMember', request)),
  );
}

/**
 * { tempPassword, emailed }. Signs the member out everywhere; they choose a new password at next
 * sign-in. With an email on file (and `email` not false) the server mails them the new password,
 * and emailed is { sent, to, reason }; otherwise it's null.
 */
export function resetMemberPassword(uid, { email = true } = {}) {
  const send = email !== false;
  const toReset = (r) => ({ tempPassword: r.tempPassword, emailed: r.emailed ? toMailResult(r.emailed) : null });
  return run(
    'Couldn’t reset the password. Try again.',
    async (demo) => toReset(await demo.resetMemberPassword(uid, { email: send })),
    async () => toReset(await callable('adminResetPassword', { uid, email: send })),
  );
}

/**
 * Changes a member's contact email ('' removes it) and/or name; leave a field out to keep it.
 * Resolves to the changes as sent (normalised), for patching what's on screen.
 */
export async function updateMember(uid, { email, name } = {}) {
  const changes = {};
  if (email !== undefined) {
    changes.email = normalizeEmail(email);
    const problem = emailProblem(changes.email);
    if (problem) throw appError(problem, 'invalid-argument');
  }
  if (name !== undefined) {
    changes.name = String(name ?? '').replace(/\s+/g, ' ').trim();
    if (!changes.name) throw appError('Enter the member’s name.', 'invalid-argument');
  }
  if (Object.keys(changes).length === 0) return changes;
  return run(
    'Couldn’t save the change. Try again.',
    async (demo) => {
      await demo.updateMember(uid, changes);
      return changes;
    },
    async () => {
      await callable('adminUpdateMember', { uid, ...changes });
      return changes;
    },
  );
}

/**
 * A member's card as it stands: { uid, loginId, name, email, linkCode, pin, pinSetAt }, with pin
 * null when it isn't on file. The admin can ask for anyone's, a member only for their own. The
 * server logs each look as 'card-viewed'.
 */
export function getCard(uid) {
  return run(
    'Couldn’t load the card. Try again.',
    async (demo) => toCard(await demo.getCard(uid)),
    async () => toCard(await callable('getCard', { uid })),
  );
}

/** { pin }. The old PIN stops working at once; the new one shows under getCard. */
export function resetMemberPin(uid) {
  return run(
    'Couldn’t reset the PIN. Try again.',
    (demo) => demo.resetMemberPin(uid),
    () => callable('adminResetPin', { uid, pinLength: PIN_LENGTH }),
  );
}

/** { linkCode }. The old link, and every QR code or tag made from it, stops working. */
export function newMemberLink(uid) {
  return run(
    'Couldn’t make a new link. Try again.',
    (demo) => demo.newMemberLink(uid),
    () => callable('adminNewLink', { uid }),
  );
}

/** Switched off: can't sign in, and a scan of their card acts like an unknown link. */
export function setMemberDisabled(uid, disabled) {
  return run(
    disabled ? 'Couldn’t switch the member off. Try again.' : 'Couldn’t switch the member on. Try again.',
    (demo) => demo.setMemberDisabled(uid, Boolean(disabled)),
    async () => {
      await callable('adminSetDisabled', { uid, disabled: Boolean(disabled) });
    },
  );
}

/** What adminDeleteMember says it removed besides the member's own records: { logs, attempts }. */
const toRemoved = (r) => ({ removed: { logs: Number(r?.removed?.logs) || 0, attempts: Number(r?.removed?.attempts) || 0 } });

/**
 * Deletes a member for good: their sign-in, their page, card link, PIN and access log. Their card
 * stops opening anything at once. `loginId` is the ID the admin typed to confirm; the server checks
 * it against the member's own. Resolves to { removed: { logs, attempts } }, the access-log entries
 * and PIN-try counters that went with them. Safe to call again after a failure part-way.
 */
export async function deleteMember(uid, loginId) {
  const confirmLoginId = normalizeLoginId(loginId);
  if (!confirmLoginId) throw appError('Type the member’s ID to confirm.', 'invalid-argument');
  return run(
    'Couldn’t delete the member. Try again.',
    async (demo) => toRemoved(await demo.deleteMember(uid, confirmLoginId)),
    async () => toRemoved(await callable('adminDeleteMember', { uid, confirmLoginId })),
  );
}
