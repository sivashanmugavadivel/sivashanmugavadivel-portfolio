// Dev-server stand-in for Firebase (DEMO_MODE): two demo members, a demo admin and an access log,
// all in memory, so `pnpm dev` without a Firebase project still reaches every screen. scanApi.js
// and accountApi.js load it with import() behind import.meta.env.DEV, so production builds leave
// it out. It answers like the real thing (same messages and codes) and forgets everything on reload.
//
//   Member:    ID demo, password demo1234. Their card: ?id=testcard23, PIN DEMO_PIN.
//   Older:     ID meera, password meera1234: made before emails and kept PINs, so she has no
//              email and her card details say the PIN isn't on file until it's reset.
//   Admin:     the "Sign in with Google" button signs straight in.
//   Email:     nothing is sent. Addresses at fail.test get the mail server's "no", to try
//              the Try again buttons.
import { appError, failure } from './apiErrors';
import { DEMO_PIN, LINK_CODE_PATTERN, loginEmail, MAX_PIN_LENGTH, MIN_PIN_LENGTH, passwordProblem, PIN_LENGTH } from './config';
import { blankProfile, sampleData } from './sampleData';

const clone = (value) => JSON.parse(JSON.stringify(value));
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const DAY = 86_400_000;

const LINK_NOT_ACTIVE = 'This emergency link isn’t active. Call 112 if you need help.';
const LOCKED = 'Too many incorrect tries. Wait a minute and try again.';
const MAX_TRIES = 5;
const PIN_FORMAT = new RegExp(`^\\d{${MIN_PIN_LENGTH},${MAX_PIN_LENGTH}}$`);

// The same alphabets the server uses: no characters that are easy to misread on a card.
const TEMP_PASSWORD_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
const LINK_CODE_CHARS = 'abcdefghjkmnpqrstuvwxyz23456789';
const TEMP_PASSWORD_FORMAT = /^[A-HJ-NP-Za-km-z2-9]{12}$/;

// What adminEmailMember accepts as the card: a PNG (base64, or a data: URL of one) up to 1.5 MB.
const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const MAX_CARD_BYTES = 1.5 * 1024 * 1024;
const NO_EMAIL = 'This member has no email address.';

const ADMIN = {
  uid: 'demo-admin',
  kind: 'admin',
  loginId: null,
  name: 'Demo admin',
  email: 'admin@demo.local',
  mustChangePassword: false,
};

function randomFrom(chars, length) {
  return Array.from(crypto.getRandomValues(new Uint32Array(length)), (n) => chars[n % chars.length]).join('');
}

/** Like the server: no 111111, 123456, 654321, 121212 or 112233. */
function isWeakPin(pin) {
  const digits = [...pin].map(Number);
  const steps = digits.slice(1).map((d, i) => d - digits[i]);
  return (
    /^(\d)\1+$/.test(pin) ||
    /^(\d\d)\1+$/.test(pin) ||
    /^(?:(\d)\1)+$/.test(pin) ||
    steps.every((s) => s === 1) ||
    steps.every((s) => s === -1)
  );
}

function newPin() {
  let pin;
  do {
    pin = randomFrom('0123456789', PIN_LENGTH);
  } while (isWeakPin(pin));
  return pin;
}

const members = new Map();
const logs = [];
const listeners = new Set();
let session = null; // a member's uid, ADMIN.uid, or null when signed out
let logCount = 0;

// This browser, as the access log would record it.
const THIS_VISITOR = randomFrom('0123456789abcdef', 10);

function newLinkCode() {
  let code;
  do {
    code = randomFrom(LINK_CODE_CHARS, 10);
  } while ([...members.values()].some((m) => m.linkCode === code));
  return code;
}

function log(uid, type, { at = Date.now(), visitor = THIS_VISITOR, userAgent = navigator.userAgent, detail = '' } = {}) {
  logs.push({ id: `demo-log-${++logCount}`, uid, type, at, visitor, userAgent, detail });
}

/** Like the server's log of an admin or member action: no device to show. */
const logAction = (uid, type, visitor, detail = '') => log(uid, type, { visitor, userAgent: '', detail });

function addMember({
  uid = `demo-${randomFrom(LINK_CODE_CHARS, 12)}`,
  loginId,
  name,
  email = '',
  password,
  pin,
  pinOnFile = true,
  linkCode,
  profile,
  ownPassword,
  createdAt = Date.now(),
}) {
  const member = {
    uid,
    loginId,
    name,
    email,
    linkCode: linkCode || newLinkCode(),
    disabled: false,
    mustChangePassword: !ownPassword,
    createdAt,
    updatedAt: createdAt,
    pinSetAt: createdAt,
    passwordSetAt: ownPassword ? createdAt : null,
    // Only here: Auth keeps the password. The server keeps the PIN's hash and, since cards can be
    // looked at again, the PIN itself, except for members made before that (pinOnFile false).
    password,
    pin,
    pinOnFile,
    profile: { ...profile, updatedAt: createdAt },
    fails: 0,
    lockedUntil: 0,
  };
  members.set(uid, member);
  log(uid, 'created', { at: createdAt, visitor: 'admin', userAgent: '' });
  return member;
}

// An older member, from before emails and kept PINs: a blank page and nothing to email.
{
  const profile = clone(blankProfile);
  profile.profile.name = 'Meera Iyer';
  addMember({
    uid: 'demo-older',
    loginId: 'meera',
    name: 'Meera Iyer',
    password: 'meera1234',
    pin: newPin(),
    pinOnFile: false,
    profile,
    ownPassword: true,
    createdAt: Date.now() - 40 * DAY,
  });
}

// The demo member: sample data, two weeks old, opened once from a phone a few days ago.
addMember({
  uid: 'demo-member',
  loginId: 'demo',
  name: sampleData.profile.name,
  email: 'arjun.sharma@example.com',
  password: 'demo1234',
  pin: DEMO_PIN,
  linkCode: 'testcard23',
  profile: clone(sampleData),
  ownPassword: true,
  createdAt: Date.now() - 14 * DAY,
});
log('demo-member', 'emailed', { at: Date.now() - 14 * DAY + 60_000, visitor: 'admin', userAgent: '', detail: 'welcome' });
log('demo-member', 'unlock', {
  at: Date.now() - 3 * DAY,
  visitor: '5e0c2a91bd',
  userAgent:
    'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36',
});

const publicMember = (m) => ({
  uid: m.uid,
  loginId: m.loginId,
  name: m.name,
  email: m.email,
  linkCode: m.linkCode,
  disabled: m.disabled,
  mustChangePassword: m.mustChangePassword,
  createdAt: m.createdAt,
  updatedAt: m.updatedAt,
  pinSetAt: m.pinSetAt,
  passwordSetAt: m.passwordSetAt,
});

function currentAccount() {
  if (session === ADMIN.uid) return { ...ADMIN };
  const m = members.get(session);
  if (!m) return null;
  return {
    uid: m.uid,
    kind: 'member',
    loginId: m.loginId,
    name: m.name,
    email: loginEmail(m.loginId),
    mustChangePassword: m.mustChangePassword,
  };
}

function emit() {
  const account = currentAccount();
  listeners.forEach((cb) => cb(account));
}

function signedInMember() {
  const m = members.get(session);
  if (!m) throw appError('You’re signed out. Sign in again.', 'unauthenticated');
  return m;
}

/** Like firestore.rules: members read and write only their own records, the admin anyone's. */
function readable(uid) {
  if (session !== ADMIN.uid && session !== uid) throw appError('You don’t have access to this page.', 'permission-denied');
  return members.get(uid) ?? null;
}

/** The member an admin action is for. */
function target(uid) {
  if (session !== ADMIN.uid) throw appError('Only the admin can do this.', 'permission-denied');
  const m = members.get(uid);
  if (!m) throw appError('That member doesn’t exist any more.', 'not-found');
  return m;
}

/** The card PNG the page drew, checked like adminEmailMember checks it. */
function checkCardPng(cardPng) {
  const base64 = String(cardPng ?? '').replace(/^data:image\/png;base64,/, '');
  let bytes;
  try {
    bytes = atob(base64);
  } catch {
    bytes = '';
  }
  const isPng = PNG_SIGNATURE.every((b, i) => bytes.charCodeAt(i) === b);
  if (!isPng || bytes.length > MAX_CARD_BYTES) {
    throw appError('The card image isn’t a PNG of up to 1.5 MB. Draw it again.', 'invalid-argument');
  }
}

/**
 * Stands in for sendMemberEmail: { sent: true, to }, or { sent: false, reason } for fail.test
 * addresses. Logs 'emailed' or 'email-failed' with the template, like the server.
 */
async function send(m, template) {
  await wait(700);
  if (m.email.endsWith('@fail.test')) {
    logAction(m.uid, 'email-failed', 'admin', template);
    return { sent: false, reason: 'The mail server turned the message down (demo: fail.test addresses always fail).' };
  }
  logAction(m.uid, 'emailed', 'admin', template);
  return { sent: true, to: m.email };
}

// ---------------------------------------------------------------------------
// Scan (scanApi.js)
// ---------------------------------------------------------------------------
export async function unlockByLink(linkCode, pin) {
  await wait(450);
  const code = String(linkCode ?? '').trim().toLowerCase();
  const value = String(pin ?? '');
  if (!LINK_CODE_PATTERN.test(code)) throw appError('This emergency link isn’t valid.', 'invalid-argument');
  if (!PIN_FORMAT.test(value)) throw appError('Enter the PIN using digits only.', 'invalid-argument');
  // A switched-off member's card answers exactly like an unknown one.
  const m = [...members.values()].find((x) => x.linkCode === code);
  if (!m || m.disabled) throw appError(LINK_NOT_ACTIVE, 'not-found');
  if (Date.now() < m.lockedUntil) throw appError(LOCKED, 'resource-exhausted');
  if (value !== m.pin) {
    m.fails += 1;
    if (m.fails >= MAX_TRIES) {
      m.fails = 0;
      m.lockedUntil = Date.now() + 60_000;
      log(m.uid, 'lockout');
      throw appError(LOCKED, 'resource-exhausted');
    }
    const left = MAX_TRIES - m.fails;
    throw appError(`Incorrect PIN. ${left} ${left === 1 ? 'try' : 'tries'} left.`, 'permission-denied');
  }
  m.fails = 0;
  log(m.uid, 'unlock');
  return clone(m.profile);
}

// ---------------------------------------------------------------------------
// Account (accountApi.js passes IDs normalised and profiles cleaned)
// ---------------------------------------------------------------------------
export function onAccountChange(cb) {
  listeners.add(cb);
  cb(currentAccount());
  return () => {
    listeners.delete(cb);
  };
}

export async function signInMember(loginId, password) {
  await wait(400);
  const m = [...members.values()].find((x) => x.loginId === loginId);
  if (!m || m.password !== password) throw failure({ code: 'auth/invalid-credential' });
  if (m.disabled) throw failure({ code: 'auth/user-disabled' });
  session = m.uid;
  emit();
}

export async function signInAdmin() {
  await wait(400);
  session = ADMIN.uid;
  emit();
}

export async function signOutAccount() {
  session = null;
  emit();
}

export async function changeTempPassword(newPassword) {
  const m = signedInMember();
  if (!m.mustChangePassword) {
    throw appError('Your password is already your own. Use Change password instead.', 'failed-precondition');
  }
  const problem = passwordProblem(newPassword, m.loginId);
  if (problem) throw appError(problem, 'invalid-argument');
  await wait(500);
  Object.assign(m, { password: newPassword, mustChangePassword: false, passwordSetAt: Date.now(), updatedAt: Date.now() });
  emit();
}

export async function changePassword(currentPassword, newPassword) {
  const m = signedInMember();
  const problem = passwordProblem(newPassword, m.loginId);
  if (problem) throw appError(problem, 'invalid-argument');
  await wait(400);
  if (currentPassword !== m.password) throw appError('That isn’t your current password.', 'invalid-credential');
  // Like the real one, this doesn't touch passwordSetAt: only the server writes the members doc.
  m.password = newPassword;
}

export async function loadMember(uid) {
  await wait(200);
  const m = readable(uid);
  return m && publicMember(m);
}

export async function loadProfile(uid) {
  await wait(250);
  const m = readable(uid);
  return m?.profile ? clone(m.profile) : null;
}

export async function saveProfile(uid, profile) {
  const m = readable(uid);
  if (!m) throw appError('That member doesn’t exist any more.', 'not-found');
  // firestore.rules: someone still on the admin's temporary password can't save yet.
  if (session === uid && m.mustChangePassword) {
    throw appError('Choose your own password before saving your page.', 'permission-denied');
  }
  await wait(300);
  m.profile = { ...clone(profile), updatedAt: Date.now() };
  return clone(m.profile);
}

export async function loadAccessLogs(uid, count = 20) {
  await wait(250);
  readable(uid);
  return logs
    .filter((entry) => entry.uid === uid)
    .sort((a, b) => b.at - a.at)
    .slice(0, count)
    .map(({ id, type, at, visitor, userAgent, detail }) => ({ id, type, at, visitor, userAgent, detail }));
}

/** Like getCard: the admin for anyone, a member for themself once their own password is set. */
export async function getCard(uid) {
  await wait(300);
  const m = readable(uid);
  if (!m) throw appError('That member doesn’t exist any more.', 'not-found');
  const viewer = session === ADMIN.uid ? 'admin' : 'member';
  if (viewer === 'member' && (m.disabled || m.mustChangePassword)) {
    throw appError('Choose your own password before looking at your card.', 'permission-denied');
  }
  logAction(uid, 'card-viewed', viewer, viewer);
  return {
    uid,
    loginId: m.loginId,
    name: m.name,
    email: m.email,
    linkCode: m.linkCode,
    pin: m.pinOnFile ? m.pin : null,
    pinSetAt: m.pinSetAt,
  };
}

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------
export async function listMembers() {
  if (session !== ADMIN.uid) throw appError('Only the admin can do this.', 'permission-denied');
  await wait(300);
  return [...members.values()]
    .sort((a, b) => b.createdAt - a.createdAt)
    .map((m) => ({ ...publicMember(m), profileUpdatedAt: m.profile?.updatedAt ?? null }));
}

export async function createMember({ loginId, name, email = '' }) {
  if (session !== ADMIN.uid) throw appError('Only the admin can do this.', 'permission-denied');
  await wait(600);
  if ([...members.values()].some((m) => m.loginId === loginId)) {
    throw appError('That ID is already taken. Pick another.', 'already-exists');
  }
  const profile = clone(blankProfile);
  profile.profile.name = name;
  const tempPassword = randomFrom(TEMP_PASSWORD_CHARS, 12);
  const pin = newPin();
  const m = addMember({ loginId, name, email, password: tempPassword, pin, profile });
  return { uid: m.uid, loginId, name, email, tempPassword, pin, linkCode: m.linkCode };
}

export async function emailMember(uid, template, { tempPassword, cardPng } = {}) {
  const m = target(uid);
  if (!['welcome', 'card'].includes(template)) throw appError('Pick which email to send.', 'invalid-argument');
  if (!m.email) throw appError(NO_EMAIL, 'failed-precondition');
  if (template === 'welcome' && !TEMP_PASSWORD_FORMAT.test(String(tempPassword ?? ''))) {
    throw appError('The welcome email needs the temporary password.', 'invalid-argument');
  }
  if (template === 'card' && !cardPng) throw appError('The card email needs the card image.', 'invalid-argument');
  if (cardPng) checkCardPng(cardPng);
  return send(m, template);
}

export async function resetMemberPassword(uid, { email = true } = {}) {
  const m = target(uid);
  await wait(400);
  const tempPassword = randomFrom(TEMP_PASSWORD_CHARS, 12);
  Object.assign(m, { password: tempPassword, mustChangePassword: true, updatedAt: Date.now() });
  logAction(uid, 'password-reset', 'admin');
  const emailed = m.email && email !== false ? await send(m, 'password-reset') : null;
  return { tempPassword, emailed };
}

export async function resetMemberPin(uid) {
  const m = target(uid);
  await wait(400);
  const pin = newPin();
  Object.assign(m, { pin, pinOnFile: true, pinSetAt: Date.now(), updatedAt: Date.now() });
  logAction(uid, 'pin-reset', 'admin');
  return { pin };
}

export async function newMemberLink(uid) {
  const m = target(uid);
  await wait(400);
  Object.assign(m, { linkCode: newLinkCode(), updatedAt: Date.now() });
  logAction(uid, 'link-changed', 'admin');
  return { linkCode: m.linkCode };
}

export async function setMemberDisabled(uid, disabled) {
  const m = target(uid);
  await wait(400);
  Object.assign(m, { disabled, updatedAt: Date.now() });
  logAction(uid, disabled ? 'disabled' : 'enabled', 'admin');
}

/** accountApi.js has already normalised and checked the fields it passes. */
export async function updateMember(uid, { email, name } = {}) {
  const m = target(uid);
  await wait(400);
  if (email !== undefined) m.email = email;
  if (name !== undefined) {
    m.name = name;
    // Like the server: the page's own name is the member's to keep, unless it's still empty.
    if (!m.profile.profile?.name) m.profile.profile = { ...m.profile.profile, name };
  }
  m.updatedAt = Date.now();
  return { ok: true };
}
