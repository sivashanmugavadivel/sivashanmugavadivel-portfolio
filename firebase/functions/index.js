/**
 * Cloud Functions for the emergency page: one admin, many members, one card each.
 *
 *   unlockProfile        A responder scanned a card and sends its link code + PIN. If the PIN
 *                        is right they get that member's profile back. Wrong guesses are
 *                        rate-limited per visitor and per card.
 *   claimAdmin           The site owner signs in with Google; a verified address on
 *                        ADMIN_EMAILS gets the custom claim { admin: true }. It, and every
 *                        admin function, counts only in a Google session.
 *   adminCheckLoginIds   Which of a few login IDs are free: the one typed into Add member and the
 *                        alternatives the page offers when it's taken.
 *   adminCreateMember    The admin makes a member: login ID, temporary password, PIN, link code,
 *                        and optionally their email address.
 *   adminEmailMember     Emails a member their welcome (ID, temporary password, card) or a new card.
 *   adminResetPassword   New temporary password; the member must change it again. Emailed to them
 *                        when they have an address.
 *   adminResetPin        New PIN (the old printed card stops opening).
 *   adminNewLink         New link code (the old QR code stops working).
 *   adminSetDisabled     Switch a member off or on.
 *   adminUpdateMember    Change a member's email address or name.
 *   adminDeleteMember    Delete a member for good: sign-in, page, card link, PIN, attempts, access log.
 *   getCard              The card details again (ID, link, PIN): for the admin, or the member themself.
 *   changeTempPassword   A member replaces the temporary password with their own.
 *
 * PINs are checked against salted scrypt hashes in secrets/, which Firestore rules make unreadable
 * from any browser. The PIN itself sits next to its hash, so the admin and the member can see the
 * card again (getCard). Temporary passwords are returned once, emailed when asked, and never stored.
 * A password reset, a switch-off or a member's own new password also ends the member's sessions
 * there and then: members/{uid}.tokensValidAfter, which firestore.rules checks.
 */
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { setGlobalOptions } = require('firebase-functions/v2');
const { defineString } = require('firebase-functions/params');
const logger = require('firebase-functions/logger');
const { initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore, FieldPath, FieldValue, Timestamp } = require('firebase-admin/firestore');
const crypto = require('node:crypto');
const { GMAIL_APP_PASSWORD, deliverEmail, renderEmail } = require('./mail');

initializeApp();
const db = getFirestore();
const auth = getAuth();

// ---- Settings ----
const REGION = 'asia-south1'; // Mumbai. Must match VITE_FIREBASE_FUNCTIONS_REGION.

// Hidden email domain for member logins. Same as LOGIN_DOMAIN in src/emergency/config.js.
const LOGIN_DOMAIN = 'id.sivashanmugavadivel.in';

// Google addresses allowed to use the admin panel, comma-separated, from functions/.env.
// Read with .value() only inside a function: at deploy time it isn't known yet.
const ADMIN_EMAILS = defineString('ADMIN_EMAILS', {
  description: 'Google addresses that may use the emergency page admin panel (comma-separated).',
});

const LIMITS = {
  // Each visitor (one IPv4 address or one IPv6 /64) on one card: 5 wrong PINs, then locked out
  // of that card for 15 minutes.
  perVisitor: { max: 5, windowMs: 15 * 60_000, lockMs: 15 * 60_000 },
  // Everyone together on one card: trips after 60 wrong PINs within an hour, a backstop against
  // guessing from many addresses. Right PINs don't count. Once tripped it stays locked for at least
  // lockMs and until the hour is up. While it's locked, each visitor still gets one try per
  // perVisitor window, so someone else's guessing can't keep a responder with the printed PIN out
  // (see reserveAttempt). Those tries aren't capped in total: App Check (ENFORCE_APP_CHECK) is what
  // stops a script. Buckets are per card, so an attack on one card never locks out anyone else's.
  global: { max: 60, windowMs: 60 * 60_000, lockMs: 30 * 60_000 },
};

// Turn on only after the web app initialises App Check (VITE_RECAPTCHA_SITE_KEY), or every
// call is refused. Once on, a plain script can't feed the limits above.
const ENFORCE_APP_CHECK = false;

setGlobalOptions({ region: REGION, maxInstances: 5 });

const PIN_PATTERN = /^\d{4,8}$/;
const LOGIN_ID_PATTERN = /^[a-z0-9][a-z0-9._-]{2,29}$/;
const LINK_CODE_PATTERN = /^[a-hjkmnp-z2-9]{10}$/;
// Auto-generated Firebase Auth uids are 28 letters and digits; members only ever get those.
const UID_PATTERN = /^[A-Za-z0-9]{1,128}$/;

const LINK_ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789'; // no i, l, o, 0, 1
const LINK_CODE_LENGTH = 10;
const PASSWORD_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
const TEMP_PASSWORD_LENGTH = 12;
// The alphabet is letters and digits only, so it's safe inside a character class.
const TEMP_PASSWORD_PATTERN = new RegExp(`^[${PASSWORD_ALPHABET}]{${TEMP_PASSWORD_LENGTH}}$`);
const DEFAULT_PIN_LENGTH = 6;
const NAME_MAX = 80;
const EMAIL_MAX = 254;
// Simple on purpose (Gmail has the last word), but strict enough that one address can never read
// as two: no commas, spaces, quotes or angle brackets.
const EMAIL_PATTERN = /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9-]+(?:\.[a-z0-9-]+)+$/;
// The card PNG the page draws (pinCardDataUrl) is well under this.
const CARD_MAX_BYTES = 1.5 * 1024 * 1024;
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const EMAIL_TEMPLATES = ['welcome', 'card']; // the ones the admin sends by hand
// A batch takes up to 500 writes; deleting a member's logs and attempts goes 400 at a time.
const DELETE_PAGE = 400;
// The ID typed plus the alternatives the page offers; Firestore's 'in' takes up to 30.
const CHECK_IDS_MAX = 20;

// Kept short on purpose: the length rule does most of the work. Same list as COMMON_PASSWORDS in
// src/emergency/config.js, which checks a member's own password change in the browser.
const WEAK_PASSWORDS = new Set([
  'password',
  'password1',
  'password123',
  '12345678',
  '123456789',
  '1234567890',
  '87654321',
  '11111111',
  '00000000',
  'qwerty123',
  'qwertyui',
  'qwertyuiop',
  '1q2w3e4r',
  'abcd1234',
  'abc12345',
  'iloveyou',
  'letmein1',
  'welcome1',
  'welcome123',
  'admin123',
  'emergency',
]);

const LINK_INACTIVE = 'This emergency link isn’t active. Call 112 if you need help.';
const NOT_ADMIN = 'Only the admin can do this.';
const NO_MEMBER = 'There’s no member with that ID.';
const SWITCHED_OFF = 'This account is switched off. Ask the admin.';
const BAD_CARD = 'The card image has to be a PNG of up to 1.5 MB.';
const CONFIRM_DELETE = 'Type the member’s ID to confirm.';
const ID_TAKEN = 'That ID is taken. Pick another.';

// Same as SERVICES and blankProfile in src/emergency/sampleData.js. Keep them in sync.
const SERVICES = [
  { label: 'Emergency', number: '112', description: 'Police, fire and ambulance' },
  { label: 'Ambulance', number: '108', description: 'Medical emergencies' },
  { label: 'Police', number: '100', description: '' },
  { label: 'Fire', number: '101', description: '' },
];

const BLANK_PROFILE = {
  profile: {
    name: '',
    photoUrl: '',
    dob: '',
    gender: '',
    bloodGroup: '',
    languages: [],
    address: '',
    organDonor: false,
    criticalNote: '',
  },
  services: SERVICES,
  medical: {
    conditions: [],
    allergies: [],
    medications: [],
    height: '',
    weight: '',
    devices: '',
    doctor: { name: '', hospital: '', phone: '' },
    insurance: { provider: '', policyNumber: '', phone: '' },
    notes: '',
  },
  contacts: [],
  vehicles: [],
  about: { headline: '', bio: '', occupation: '', employer: '', website: '', linkedin: '', github: '' },
  map: { label: '', lat: null, lng: null },
};

const memberRef = (uid) => db.doc(`members/${uid}`);
const profileRef = (uid) => db.doc(`profiles/${uid}`);
const secretRef = (uid) => db.doc(`secrets/${uid}`);
const linkRef = (code) => db.doc(`links/${code}`);
// Next to the PIN hashes, so the same rule keeps browsers out. UID_PATTERN has no '_', so no
// member's PIN doc can ever be this one.
const visitorKeyRef = db.doc('secrets/_visitor');

// ---------------------------------------------------------------------------
// Helpers: secrets
// ---------------------------------------------------------------------------
function scrypt(pin, salt) {
  return new Promise((resolve, reject) => {
    crypto.scrypt(pin, salt, 64, { N: 16384, r: 8, p: 1 }, (err, key) => (err ? reject(err) : resolve(key)));
  });
}

async function pinMatches(pin, saltHex, hashHex) {
  const expected = Buffer.from(hashHex, 'hex');
  const actual = await scrypt(pin, Buffer.from(saltHex, 'hex'));
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}

async function hashPin(pin) {
  const salt = crypto.randomBytes(16);
  const hash = await scrypt(pin, salt);
  return { salt: salt.toString('hex'), hash: hash.toString('hex'), updatedAt: FieldValue.serverTimestamp() };
}

function randomString(alphabet, length) {
  return Array.from({ length }, () => alphabet[crypto.randomInt(alphabet.length)]).join('');
}

/**
 * PINs people would guess first: one digit repeated, any steady run (123456, 654321, 135791,
 * 890123), repeating pairs (121212) and doubled digits (112233).
 */
function isWeakPin(pin) {
  const d = [...pin].map(Number);
  const steps = d.slice(1).map((x, i) => (x - d[i] + 10) % 10);
  if (steps.every((s) => s === steps[0])) return true;
  if (d.every((x, i) => i < 2 || x === d[i - 2])) return true;
  if (d.every((x, i) => i % 2 === 0 || x === d[i - 1])) return true;
  return false;
}

function makePin(length) {
  let pin;
  do {
    pin = randomString('0123456789', length);
  } while (isWeakPin(pin));
  return pin;
}

/** One of each letter case and a digit, so a strict Auth password policy can't refuse it. */
function makeTempPassword() {
  let password;
  do {
    password = randomString(PASSWORD_ALPHABET, TEMP_PASSWORD_LENGTH);
  } while (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password));
  return password;
}

/** Picks a link code nobody has, inside the caller's transaction (reads come before writes). */
async function freeLinkCode(tx) {
  for (let i = 0; i < 5; i += 1) {
    const code = randomString(LINK_ALPHABET, LINK_CODE_LENGTH);
    const snap = await tx.get(linkRef(code));
    if (!snap.exists) return code;
  }
  throw new Error('no free link code after 5 tries'); // 31^10 codes: effectively never
}

function newProfile(name) {
  const blank = structuredClone(BLANK_PROFILE);
  blank.profile.name = name;
  return { ...blank, updatedAt: FieldValue.serverTimestamp() };
}

// ---------------------------------------------------------------------------
// Helpers: input
// ---------------------------------------------------------------------------
function input(request) {
  const data = request.data;
  return data && typeof data === 'object' && !Array.isArray(data) ? data : {};
}

function readLoginId(value) {
  const loginId = typeof value === 'string' ? value.trim().toLowerCase() : '';
  if (!LOGIN_ID_PATTERN.test(loginId)) {
    throw new HttpsError(
      'invalid-argument',
      'The ID needs 3 to 30 letters, digits, dots, dashes or underscores, starting with a letter or digit.',
    );
  }
  return loginId;
}

function readName(value) {
  const name = typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : '';
  if (!name || name.length > NAME_MAX || /\p{Cc}/u.test(name)) {
    throw new HttpsError('invalid-argument', `Enter a name of up to ${NAME_MAX} characters.`);
  }
  return name;
}

function readPinLength(value) {
  const length = value ?? DEFAULT_PIN_LENGTH;
  if (!Number.isInteger(length) || length < 4 || length > 8) {
    throw new HttpsError('invalid-argument', 'The PIN length must be 4 to 8 digits.');
  }
  return length;
}

function readUid(value) {
  if (typeof value !== 'string' || !UID_PATTERN.test(value)) throw new HttpsError('invalid-argument', NO_MEMBER);
  return value;
}

/** A contact address, or null for none ('' and null clear it). Not the sign-in address. */
function readEmail(value) {
  if (value === undefined || value === null) return null;
  const bad = 'Enter a valid email address, or leave it empty.';
  if (typeof value !== 'string') throw new HttpsError('invalid-argument', bad);
  const email = value.trim().toLowerCase();
  if (!email) return null;
  if (email.length > EMAIL_MAX || !EMAIL_PATTERN.test(email)) throw new HttpsError('invalid-argument', bad);
  // The hidden sign-in addresses look real but receive nothing.
  if (email.endsWith(`@${LOGIN_DOMAIN}`)) {
    throw new HttpsError('invalid-argument', 'That’s a sign-in ID, not an email address.');
  }
  return email;
}

function readTempPassword(value) {
  if (typeof value !== 'string' || !TEMP_PASSWORD_PATTERN.test(value)) {
    throw new HttpsError('invalid-argument', 'Send the temporary password exactly as it was shown.');
  }
  return value;
}

/** The card PNG as bytes, from base64 or a data:image/png;base64, URL. */
function readCardPng(value) {
  const base64 = typeof value === 'string' ? value.replace(/^data:image\/png;base64,/, '') : '';
  // Checked before decoding: Buffer.from skips what isn't base64 instead of failing.
  if (!base64 || base64.length > Math.ceil(CARD_MAX_BYTES / 3) * 4 || !/^[A-Za-z0-9+/]+={0,2}$/.test(base64)) {
    throw new HttpsError('invalid-argument', BAD_CARD);
  }
  const png = Buffer.from(base64, 'base64');
  if (png.length > CARD_MAX_BYTES || png.length <= PNG_SIGNATURE.length || !png.subarray(0, 8).equals(PNG_SIGNATURE)) {
    throw new HttpsError('invalid-argument', BAD_CARD);
  }
  return png;
}

function readNewPassword(value, loginId) {
  if (typeof value !== 'string' || value.length < 8 || value.length > 128) {
    throw new HttpsError('invalid-argument', 'Use 8 to 128 characters for your password.');
  }
  const lower = value.toLowerCase();
  if (lower === String(loginId || '').toLowerCase()) {
    throw new HttpsError('invalid-argument', 'Don’t use your ID as your password.');
  }
  if (WEAK_PASSWORDS.has(lower)) {
    throw new HttpsError('invalid-argument', 'That password is too easy to guess. Pick another.');
  }
  return value;
}

// ---------------------------------------------------------------------------
// Helpers: who is calling
// ---------------------------------------------------------------------------
function adminEmails() {
  return ADMIN_EMAILS.value()
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

function onAdminList(token) {
  return token?.email_verified === true && adminEmails().includes(String(token.email || '').toLowerCase());
}

/**
 * A Google sign-in with a verified address on the list. The address alone isn't enough: someone
 * could register the admin's address with Email/Password before the admin's first Google sign-in.
 * That sign-in then lands on the same account, and the earlier password session carries on, now
 * with the address shown as verified and with the admin claim. firestore.rules isAdmin() checks
 * the sign-in method too.
 */
function isAdminSession(token) {
  return token?.firebase?.sign_in_provider === 'google.com' && onAdminList(token);
}

/**
 * Someone taken off ADMIN_EMAILS still carries the claim, and Firestore rules trust the claim.
 * Drop it (and sign them out) the next time they call anything. Only when the address really is
 * off the list: a session on a listed address that merely isn't a Google one is turned away, but
 * it mustn't be able to take the claim from the real admin it shares the account with, or sign
 * them out.
 */
async function dropRemovedAdmin(request) {
  const token = request.auth?.token;
  if (token?.admin !== true || onAdminList(token)) return;
  const { uid } = request.auth;
  try {
    const user = await auth.getUser(uid);
    const claims = { ...user.customClaims };
    delete claims.admin;
    await auth.setCustomUserClaims(uid, Object.keys(claims).length ? claims : null);
    await auth.revokeRefreshTokens(uid);
  } catch (err) {
    console.error('dropping admin claim failed', err);
  }
}

/** The claim AND a Google session on an address still on the list: the claim alone outlives a removal. */
function isAdmin(token) {
  return token?.admin === true && isAdminSession(token);
}

async function requireAdmin(request) {
  if (isAdmin(request.auth?.token)) return;
  await dropRemovedAdmin(request);
  throw new HttpsError('permission-denied', NOT_ADMIN);
}

/**
 * Signs the member out everywhere, now, and returns the value for members/{uid}.tokensValidAfter.
 * Revoking stops Auth renewing their sessions, but an ID token already issued stays valid for up
 * to an hour and Firestore never checks revocation, so firestore.rules also turns away a session
 * that signed in before this (auth_time < tokensValidAfter). Read back from Auth, as Firebase's
 * own revocation guide does: the same second Auth checks against, so a sign-in afterwards (the
 * page signs in again straight after changeTempPassword) passes both.
 */
async function endSessions(uid) {
  await auth.revokeRefreshTokens(uid);
  const { tokensValidAfterTime } = await auth.getUser(uid);
  const seconds = Math.floor(Date.parse(tokensValidAfterTime) / 1000);
  return Number.isFinite(seconds) ? seconds : Math.floor(Date.now() / 1000);
}

/** The member's doc, or not-found. Also keeps admin calls off non-member accounts (the admin's own). */
async function getMember(uid) {
  const snap = await memberRef(uid).get();
  if (!snap.exists) throw new HttpsError('not-found', NO_MEMBER);
  return snap;
}

// ---------------------------------------------------------------------------
// Helpers: rate limiting and logging
// ---------------------------------------------------------------------------
/**
 * IPv6 users usually get a whole /64, so keying on the full address would hand one
 * person billions of fresh visitor buckets. Key IPv6 by its /64; IPv4 and IPv4-mapped
 * addresses (::ffff:1.2.3.4) pass through. Anything unparsable is used as it is.
 */
function ipBucket(ip) {
  if (!ip.includes(':') || ip.includes('.')) return ip;
  const halves = ip.toLowerCase().split('%')[0].split('::');
  if (halves.length > 2) return ip;
  const head = halves[0] ? halves[0].split(':') : [];
  const tail = halves[1] ? halves[1].split(':') : [];
  const missing = 8 - head.length - tail.length;
  // '::' stands for one or more zero groups; without it there must be exactly eight.
  if (halves.length === 2 ? missing < 1 : missing !== 0) return ip;
  const groups = [...head, ...Array(missing).fill('0'), ...tail];
  if (!groups.every((g) => /^[0-9a-f]{1,4}$/.test(g))) return ip;
  return `${groups.slice(0, 4).map((g) => parseInt(g, 16).toString(16)).join(':')}::/64`;
}

let visitorHashKey = null; // per instance: Promise<Buffer>

/**
 * The key for visitor hashes: 32 random bytes made on first use and kept in secrets/_visitor,
 * which no browser can read. One for the whole project, so every instance and every deploy agrees
 * and the rate-limit buckets keep their names. The transaction makes two instances racing on first
 * use settle on one key.
 */
function getVisitorHashKey() {
  visitorHashKey ??= db
    .runTransaction(async (tx) => {
      const stored = (await tx.get(visitorKeyRef)).get('key');
      if (typeof stored === 'string' && /^[0-9a-f]{64}$/.test(stored)) return Buffer.from(stored, 'hex');
      const key = crypto.randomBytes(32);
      tx.set(visitorKeyRef, { key: key.toString('hex'), createdAt: FieldValue.serverTimestamp() });
      return key;
    })
    .catch((err) => {
      visitorHashKey = null; // try again on the next call
      throw err;
    });
  return visitorHashKey;
}

/**
 * A hashed id for the caller, keyed with a secret: members read the first 10 characters in their
 * access log, and an unkeyed hash of an IPv4 address is undone by trying all 2^32 of them. Google's
 * front end appends the caller's real IP as the last X-Forwarded-For entry. If you put another
 * proxy in front, adjust this.
 */
async function visitorKey(req) {
  const chain = String(req.headers['x-forwarded-for'] || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const ip = chain.length ? chain[chain.length - 1] : req.ip || 'unknown';
  const key = await getVisitorHashKey();
  return crypto.createHmac('sha256', key).update(ipBucket(ip)).digest('hex').slice(0, 40);
}

/**
 * Counts this attempt *before* checking the PIN, inside a transaction, so firing
 * many requests in parallel can't sneak extra guesses past the limit. A right PIN
 * hands its global slot back afterwards (refundGlobalAttempt). Both buckets belong
 * to one card: pinAttempts/${uid}_${visitor} and pinAttempts/${uid}__global.
 */
async function reserveAttempt(visitorRef, globalRef) {
  const now = Date.now();
  return db.runTransaction(async (tx) => {
    const [visitorSnap, globalSnap] = await tx.getAll(visitorRef, globalRef);
    const buckets = [
      { scope: 'visitor', ref: visitorRef, snap: visitorSnap, ...LIMITS.perVisitor },
      { scope: 'global', ref: globalRef, snap: globalSnap, ...LIMITS.global },
    ];

    // A visitor's own lock always applies.
    const visitorLockedUntil = (visitorSnap.exists && visitorSnap.get('lockedUntil')) || 0;
    if (visitorLockedUntil > now) return { allowed: false, scope: 'visitor', retryAt: visitorLockedUntil };

    // While the global cap is tripped, a visitor who hasn't tried in their current window still
    // gets one check: a responder holding the printed PIN mustn't be locked out by someone else's
    // guessing. It uses up their whole allowance, so a wrong PIN locks them out for lockMs, and it
    // isn't counted globally (that bucket is already locked). An attacker gains one guess per
    // address per window; App Check (ENFORCE_APP_CHECK) takes away even that.
    const globalLockedUntil = (globalSnap.exists && globalSnap.get('lockedUntil')) || 0;
    if (globalLockedUntil > now) {
      const v = visitorSnap.exists ? visitorSnap.data() : {};
      const windowEnds = (v.windowStart || 0) + LIMITS.perVisitor.windowMs;
      if (now <= windowEnds && v.count > 0) {
        return { allowed: false, scope: 'global', retryAt: Math.min(globalLockedUntil, windowEnds) };
      }
      tx.set(visitorRef, {
        count: LIMITS.perVisitor.max,
        windowStart: now,
        lockedUntil: 0,
        expireAt: Timestamp.fromMillis(now + 2 * 86_400_000),
      });
      return { allowed: true, remaining: 0, duringGlobalLock: true };
    }

    let lock = null;
    let globalWindowStart = 0;
    const [visitorBucket, globalBucket] = buckets.map((b) => {
      const d = b.snap.exists ? b.snap.data() : {};
      const fresh = !d.windowStart || now - d.windowStart > b.windowMs;
      const windowStart = fresh ? now : d.windowStart;
      const count = (fresh ? 0 : d.count || 0) + 1;
      const over = count > b.max;
      // Stay locked until this window is over too, and start the next one after the lock.
      // Otherwise a lock shorter than the window lets another `max` through in the same window.
      const lockedUntil = over ? Math.max(now + b.lockMs, windowStart + b.windowMs) : 0;
      if (over && (!lock || lockedUntil > lock.retryAt)) lock = { scope: b.scope, retryAt: lockedUntil };
      if (b.scope === 'global') globalWindowStart = windowStart;
      return {
        ref: b.ref,
        count,
        over,
        next: {
          count: over ? 0 : count,
          windowStart: over ? lockedUntil : windowStart,
          lockedUntil,
          expireAt: Timestamp.fromMillis(now + 2 * 86_400_000), // TTL policy in firestore.indexes.json
        },
      };
    });

    tx.set(globalBucket.ref, globalBucket.next);
    // The request that trips the global cap is turned away unchecked, so it isn't charged to the
    // visitor: they keep their one try for while the cap is locked.
    if (!globalBucket.over || visitorBucket.over) tx.set(visitorBucket.ref, visitorBucket.next);

    if (lock) return { allowed: false, ...lock, newlyLocked: true };
    return { allowed: true, remaining: LIMITS.perVisitor.max - visitorBucket.count, globalWindowStart };
  });
}

/**
 * A right PIN isn't a guess, so give its slot in the global budget back. Only to the
 * window it came from: tripping the lock moves windowStart, so a lock is never lifted.
 */
function refundGlobalAttempt(globalRef, windowStart) {
  return db
    .runTransaction(async (tx) => {
      const snap = await tx.get(globalRef);
      const count = (snap.exists && snap.get('count')) || 0;
      if (snap.get('windowStart') === windowStart && count > 0) tx.update(globalRef, { count: count - 1 });
    })
    .catch((err) => console.error('global refund failed', err)); // never block access on bookkeeping
}

function lockMessage(retryAt, scope = 'visitor') {
  const minutes = Math.max(1, Math.ceil((retryAt - Date.now()) / 60_000));
  const wait = `Try again in ${minutes} minute${minutes === 1 ? '' : 's'}, or call 112 now.`;
  // The global cap trips on other people's guesses, so don't tell this visitor their PIN was wrong.
  if (scope === 'global') return `This page is getting too many PIN attempts right now. ${wait}`;
  return `Too many incorrect tries. ${wait}`;
}

/**
 * One line in accessLogs, filed under the member it's about (uid), who can read it. `detail` says a
 * little more where the type alone doesn't: which email, or who looked at the card.
 */
function logAccess(type, uid, visitor, userAgent = '', detail = null) {
  const entry = { uid, type, at: FieldValue.serverTimestamp(), visitor, userAgent };
  if (detail) entry.detail = detail;
  return db
    .collection('accessLogs')
    .add(entry)
    .catch((err) => console.error('accessLog write failed', err)); // never block access on logging
}

/** A responder's unlock or lockout: the start of their keyed visitor hash, and their browser. */
function logScan(type, request, uid, visitor) {
  const userAgent = String(request.rawRequest.headers['user-agent'] || '').slice(0, 200);
  return logAccess(type, uid, visitor.slice(0, 10), userAgent);
}

/** Something the admin did. The member reads it, so nothing about the admin's own connection goes in. */
function logAdminAction(type, uid, detail) {
  return logAccess(type, uid, 'admin', '', detail);
}

/**
 * Emails a member one of mail.js's templates ('welcome', 'password-reset', 'card'), to the address
 * on their members doc. { sent: true, to } or { sent: false, reason }; never throws for mail
 * trouble. The log says which email went out or failed, never what was in it.
 */
async function sendMemberEmail(uid, template, { tempPassword = null, cardPng = null } = {}) {
  const member = await getMember(uid);
  const to = member.get('email');
  if (!to) return { sent: false, reason: 'no email address' };
  const message = renderEmail(template, {
    name: member.get('name'),
    loginId: member.get('loginId'),
    linkCode: member.get('linkCode'),
    tempPassword,
    card: cardPng,
  });
  const result = await deliverEmail({ to, ...message }, { uid, template });
  await logAdminAction(result.sent ? 'emailed' : 'email-failed', uid, template);
  return result.sent ? { sent: true, to } : { sent: false, reason: result.reason };
}

/**
 * Which of `loginIds` are in use: a sign-in account on the hidden address (what createUser would
 * trip over) or a members doc naming it, which can outlive its account, and would otherwise end
 * up sharing the ID with a new member.
 */
async function takenLoginIds(loginIds) {
  const suffix = `@${LOGIN_DOMAIN}`;
  const [accounts, members] = await Promise.all([
    auth.getUsers(loginIds.map((id) => ({ email: `${id}${suffix}` }))),
    db.collection('members').where('loginId', 'in', loginIds).select('loginId').get(),
  ]);
  const taken = new Set(members.docs.map((d) => d.get('loginId')));
  for (const user of accounts.users) {
    const email = String(user.email || '').toLowerCase();
    if (email.endsWith(suffix)) taken.add(email.slice(0, -suffix.length));
  }
  return taken;
}

// ---------------------------------------------------------------------------
// Helpers: deleting a member
// ---------------------------------------------------------------------------
/**
 * Everything filed under a member outside members/, profiles/ and secrets/{uid}, found by uid
 * alone, so a delete that stopped part-way can find the rest without the members doc.
 */
function memberQueries(uid) {
  const byUid = (name) => db.collection(name).where('uid', '==', uid);
  return {
    links: byUid('links'),
    // Rate-limit buckets are ${uid}_${visitor} and ${uid}__global: document IDs from `${uid}_` up to
    // `${uid}\``, the character after '_'. UID_PATTERN has no '_', so no other uid shares the prefix.
    attempts: db
      .collection('pinAttempts')
      .where(FieldPath.documentId(), '>=', `${uid}_`)
      .where(FieldPath.documentId(), '<', `${uid}\``),
    logs: byUid('accessLogs'),
    // Only the Functions emulator files emails there (mail.js).
    outbox: process.env.FUNCTIONS_EMULATOR === 'true' ? byUid('outbox') : null,
  };
}

/** Deletes every document `query` finds, DELETE_PAGE at a time, and says how many there were. */
async function deleteAll(query) {
  let removed = 0;
  for (;;) {
    const page = await query.select().limit(DELETE_PAGE).get(); // references only
    if (page.empty) return removed;
    const batch = db.batch();
    for (const doc of page.docs) batch.delete(doc.ref);
    await batch.commit();
    removed += page.size;
    if (page.size < DELETE_PAGE) return removed;
  }
}

/** Whether anything at all is still stored under a uid that has neither a members doc nor an account. */
async function hasLeftovers(uid) {
  const docs = await db.getAll(profileRef(uid), secretRef(uid));
  if (docs.some((d) => d.exists)) return true;
  const queries = Object.values(memberQueries(uid)).filter(Boolean);
  const found = await Promise.all(queries.map((q) => q.select().limit(1).get()));
  return found.some((snap) => !snap.empty);
}

/**
 * The login ID of the member adminDeleteMember is to remove, once `typed` (trimmed, lowercased)
 * matches it. Normally from members/{uid}. A retry after a run that stopped part-way may find that
 * doc gone (it goes early); the sign-in account, deleted last, still names the ID then. Anyone who
 * isn't and wasn't a member is not-found, the admin's own account above all.
 */
async function loginIdToDelete(uid, typed) {
  const member = await memberRef(uid).get();
  if (member.exists) {
    if (typed !== member.get('loginId')) throw new HttpsError('invalid-argument', CONFIRM_DELETE);
    return typed;
  }
  const user = await auth.getUser(uid).catch((err) => {
    if (err?.code === 'auth/user-not-found') return null;
    throw err;
  });
  if (user) {
    // Only a member's hidden sign-in address names an ID. The admin's own Google account, or anyone
    // else's, isn't a member whatever its address starts with.
    const email = String(user.email || '');
    if (!email.endsWith(`@${LOGIN_DOMAIN}`)) throw new HttpsError('not-found', NO_MEMBER);
    if (email !== `${typed}@${LOGIN_DOMAIN}`) throw new HttpsError('invalid-argument', CONFIRM_DELETE);
    return typed;
  }
  // The account is gone too (members can delete their own). Nothing names an ID to check against any
  // more, and what's left belongs to nobody, so it may go; but only if something is left.
  if (!(await hasLeftovers(uid))) throw new HttpsError('not-found', NO_MEMBER);
  if (!LOGIN_ID_PATTERN.test(typed)) throw new HttpsError('invalid-argument', CONFIRM_DELETE);
  return typed;
}

function toPlain(value) {
  if (value instanceof Timestamp) return value.toMillis();
  if (Array.isArray(value)) return value.map(toPlain);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, toPlain(v)]));
  }
  return value;
}

/**
 * Every callable: App Check per ENFORCE_APP_CHECK, and anything that isn't an HttpsError is
 * logged and sent back as a plain "something went wrong", never with internal details.
 * `options` are onCall's own, such as the `secrets` a function that sends email needs.
 */
function callable(handler, { failMessage = 'Something went wrong on our side. Try again in a moment.', ...options } = {}) {
  return onCall({ ...options, enforceAppCheck: ENFORCE_APP_CHECK }, async (request) => {
    try {
      return await handler(request);
    } catch (err) {
      if (err instanceof HttpsError) throw err;
      // Auth user deleted in the console while its members doc stayed behind.
      if (err?.code === 'auth/user-not-found') throw new HttpsError('not-found', NO_MEMBER);
      console.error(err);
      throw new HttpsError('internal', failMessage);
    }
  });
}

// ---------------------------------------------------------------------------
// Responders
// ---------------------------------------------------------------------------
exports.unlockProfile = callable(async (request) => {
  const data = input(request);
  const id = typeof data.id === 'string' ? data.id : '';
  if (!LINK_CODE_PATTERN.test(id)) {
    throw new HttpsError('invalid-argument', 'This emergency link isn’t valid. Call 112 if you need help.');
  }
  const pin = String(data.pin ?? '');
  if (!PIN_PATTERN.test(pin)) throw new HttpsError('invalid-argument', 'Enter the PIN using digits only.');

  // Unknown and switched-off cards answer the same, so a scan can't tell them apart.
  const link = await linkRef(id).get();
  const uid = link.exists ? link.get('uid') : null;
  const member = typeof uid === 'string' && UID_PATTERN.test(uid) ? await memberRef(uid).get() : null;
  if (!member?.exists || member.get('disabled') === true || member.get('linkCode') !== id) {
    throw new HttpsError('not-found', LINK_INACTIVE);
  }

  const visitor = await visitorKey(request.rawRequest);
  const visitorRef = db.doc(`pinAttempts/${uid}_${visitor}`);
  const globalRef = db.doc(`pinAttempts/${uid}__global`);

  const attempt = await reserveAttempt(visitorRef, globalRef);
  if (!attempt.allowed) {
    if (attempt.newlyLocked) await logScan('lockout', request, uid, visitor);
    throw new HttpsError('resource-exhausted', lockMessage(attempt.retryAt, attempt.scope));
  }

  const secret = await secretRef(uid).get();
  if (!secret.exists) {
    throw new HttpsError('failed-precondition', 'This card doesn’t have a PIN yet. Call 112 if you need help.');
  }

  const ok = await pinMatches(pin, secret.get('salt'), secret.get('hash'));
  if (!ok) {
    if (attempt.remaining <= 0) {
      const until = Date.now() + LIMITS.perVisitor.lockMs;
      await visitorRef.set({ count: 0, lockedUntil: until }, { merge: true });
      await logScan('lockout', request, uid, visitor);
      throw new HttpsError(
        'resource-exhausted',
        attempt.duringGlobalLock ? `Incorrect PIN. ${lockMessage(until, 'global')}` : lockMessage(until),
      );
    }
    const left = attempt.remaining;
    throw new HttpsError('permission-denied', `Incorrect PIN. ${left} ${left === 1 ? 'try' : 'tries'} left.`);
  }

  // A try during a global lock never took a global slot, so there's nothing to refund.
  await Promise.all([
    visitorRef.delete(),
    !attempt.duringGlobalLock && refundGlobalAttempt(globalRef, attempt.globalWindowStart),
  ]);
  const profile = await profileRef(uid).get();
  if (!profile.exists) {
    throw new HttpsError('not-found', 'This page hasn’t been filled in yet. Call 112 if you need help.');
  }

  await logScan('unlock', request, uid, visitor);
  return { profile: toPlain(profile.data()) };
}, { failMessage: 'Something went wrong. Try again, or call 112 now.' });

// ---------------------------------------------------------------------------
// Members
// ---------------------------------------------------------------------------
exports.changeTempPassword = callable(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'Sign in first.');
  const alreadySet = 'Your password is already set. Sign in with it.';
  if (request.auth.token.mustChangePassword !== true) throw new HttpsError('failed-precondition', alreadySet);

  // Check the live claim too: an ID token from before the change stays valid for up to an hour.
  const user = await auth.getUser(uid);
  if (user.customClaims?.mustChangePassword !== true) throw new HttpsError('failed-precondition', alreadySet);
  const member = await memberRef(uid).get();
  if (!member.exists) throw new HttpsError('permission-denied', 'This account isn’t set up. Ask the admin.');
  if (user.disabled || member.get('disabled') === true) throw new HttpsError('permission-denied', SWITCHED_OFF);

  const newPassword = readNewPassword(input(request).newPassword, member.get('loginId'));
  await auth.updateUser(uid, { password: newPassword });
  const claims = { ...user.customClaims };
  delete claims.mustChangePassword;
  await auth.setCustomUserClaims(uid, Object.keys(claims).length ? claims : null);
  // Ends every session on the temporary password, this one included, so whoever else saw it is
  // out too. The page signs in again with the new password, which starts a session after this.
  const tokensValidAfter = await endSessions(uid);
  const now = FieldValue.serverTimestamp();
  await memberRef(uid).update({ mustChangePassword: false, tokensValidAfter, passwordSetAt: now, updatedAt: now });
  return { ok: true };
});

/**
 * A member changed their own password in the page (reauthenticate + updatePassword). Auth stops
 * renewing their other sessions, but Firestore would keep honouring those devices' ID tokens for
 * up to an hour, so end every session here too; the page then signs in again with the new password.
 */
exports.passwordChanged = callable(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'Sign in first.');
  await getMember(uid);
  const tokensValidAfter = await endSessions(uid);
  const now = FieldValue.serverTimestamp();
  await memberRef(uid).update({ tokensValidAfter, passwordSetAt: now, updatedAt: now });
  return { ok: true };
});

/**
 * The card again: ID, link and PIN. The admin may ask for anyone's; a member only for their own,
 * in a session firestore.rules would let edit (switched on, past the temporary password, signed in
 * since tokensValidAfter), because the PIN is what opens their page to anyone holding the link.
 */
exports.getCard = callable(async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Sign in first.');
  const { token } = request.auth;
  const uid = readUid(input(request).uid);
  let viewer = null;
  if (isAdmin(token)) viewer = 'admin';
  else if (request.auth.uid === uid) viewer = 'member';
  if (!viewer) {
    await dropRemovedAdmin(request);
    throw new HttpsError('permission-denied', 'You can only see your own card.');
  }

  const member = await getMember(uid);
  if (viewer === 'member') {
    if (member.get('disabled') === true) throw new HttpsError('permission-denied', SWITCHED_OFF);
    if (!(token.auth_time >= (member.get('tokensValidAfter') || 0))) {
      throw new HttpsError('unauthenticated', 'You’ve been signed out. Sign in again.');
    }
    if (token.mustChangePassword === true || member.get('mustChangePassword') === true) {
      throw new HttpsError('failed-precondition', 'Choose your own password first.');
    }
  }

  // Members made before PINs were kept have only the hash: the admin resets the PIN to see one.
  const pin = (await secretRef(uid).get()).get('pin');
  await logAccess('card-viewed', uid, viewer, '', viewer);
  return {
    uid,
    loginId: member.get('loginId'),
    name: member.get('name'),
    email: member.get('email') || null,
    linkCode: member.get('linkCode'),
    pin: typeof pin === 'string' && PIN_PATTERN.test(pin) ? pin : null,
    pinSetAt: toPlain(member.get('pinSetAt') ?? null),
  };
});

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------
exports.claimAdmin = callable(async (request) => {
  const token = request.auth?.token;
  if (!isAdminSession(token)) {
    await dropRemovedAdmin(request);
    throw new HttpsError('permission-denied', 'That Google account isn’t an admin of this page.');
  }
  if (token.admin !== true) {
    const user = await auth.getUser(request.auth.uid);
    await auth.setCustomUserClaims(request.auth.uid, { ...user.customClaims, admin: true });
  }
  return { admin: true };
});

/**
 * For the Add member form, as the admin types: { free, taken }, which of up to CHECK_IDS_MAX login
 * IDs anyone has. Advice only: adminCreateMember checks again.
 */
exports.adminCheckLoginIds = callable(async (request) => {
  await requireAdmin(request);
  const { loginIds } = input(request);
  if (!Array.isArray(loginIds) || loginIds.length === 0 || loginIds.length > CHECK_IDS_MAX) {
    throw new HttpsError('invalid-argument', `Send 1 to ${CHECK_IDS_MAX} IDs to check.`);
  }
  const ids = [...new Set(loginIds.map(readLoginId))];
  const taken = await takenLoginIds(ids);
  return { free: ids.filter((id) => !taken.has(id)), taken: ids.filter((id) => taken.has(id)) };
});

exports.adminCreateMember = callable(async (request) => {
  await requireAdmin(request);
  const data = input(request);
  const loginId = readLoginId(data.loginId);
  const name = readName(data.name);
  const email = readEmail(data.email);
  const pin = makePin(readPinLength(data.pinLength));
  const tempPassword = makeTempPassword();
  if ((await takenLoginIds([loginId])).size) throw new HttpsError('already-exists', ID_TAKEN);
  const secret = await hashPin(pin);

  let user;
  try {
    user = await auth.createUser({
      email: `${loginId}@${LOGIN_DOMAIN}`,
      emailVerified: false,
      password: tempPassword,
      displayName: name,
      disabled: false,
    });
  } catch (err) {
    if (err?.code === 'auth/email-already-exists') {
      throw new HttpsError('already-exists', ID_TAKEN);
    }
    if (err?.code === 'auth/invalid-email') {
      throw new HttpsError('invalid-argument', 'That ID can’t be used. Try another.');
    }
    throw err;
  }

  const { uid } = user;
  try {
    await auth.setCustomUserClaims(uid, { mustChangePassword: true });
    const linkCode = await db.runTransaction(async (tx) => {
      const code = await freeLinkCode(tx);
      const now = FieldValue.serverTimestamp();
      tx.create(memberRef(uid), {
        loginId,
        name,
        email,
        linkCode: code,
        disabled: false,
        mustChangePassword: true,
        createdAt: now,
        updatedAt: now,
        pinSetAt: now,
        passwordSetAt: null,
      });
      tx.create(profileRef(uid), newProfile(name));
      tx.create(linkRef(code), { uid, createdAt: now });
      tx.set(secretRef(uid), { ...secret, pin });
      return code;
    });
    await logAdminAction('created', uid);
    // No email from here: the page draws the card first, then sends the welcome (adminEmailMember).
    return { uid, loginId, name, email, tempPassword, pin, linkCode };
  } catch (err) {
    // Don't leave a half-made account behind: it would keep the ID taken.
    await auth.deleteUser(uid).catch((e) => console.error('rolling back new member failed', e));
    throw err;
  }
});

/**
 * Emails the new temporary password too (template 'password-reset') when the member has an address
 * and the admin didn't say { email: false }. `emailed` is null when no email was tried.
 */
exports.adminResetPassword = callable(async (request) => {
  await requireAdmin(request);
  const data = input(request);
  const uid = readUid(data.uid);
  if (data.email != null && typeof data.email !== 'boolean') {
    throw new HttpsError('invalid-argument', 'Say whether to email the new password.');
  }
  const member = await getMember(uid);

  const tempPassword = makeTempPassword();
  await auth.updateUser(uid, { password: tempPassword });
  // Replaces all of the member's claims, which also guarantees a member never carries admin.
  await auth.setCustomUserClaims(uid, { mustChangePassword: true });
  // A reset is the answer to a stolen password, so sessions already signed in end now, not in an hour.
  const tokensValidAfter = await endSessions(uid);
  await memberRef(uid).update({ mustChangePassword: true, tokensValidAfter, updatedAt: FieldValue.serverTimestamp() });
  await logAdminAction('password-reset', uid);
  // The password has changed either way, so nothing about the email may keep it from the admin.
  const emailed =
    data.email !== false && member.get('email')
      ? await sendMemberEmail(uid, 'password-reset', { tempPassword }).catch((err) => {
          console.error('password-reset email failed', err);
          return { sent: false, reason: 'the email couldn’t be sent' };
        })
      : null;
  return { tempPassword, emailed };
}, { secrets: [GMAIL_APP_PASSWORD] });

exports.adminResetPin = callable(async (request) => {
  await requireAdmin(request);
  const data = input(request);
  const uid = readUid(data.uid);
  const pinLength = readPinLength(data.pinLength);
  await getMember(uid);

  const pin = makePin(pinLength);
  const secret = await hashPin(pin);
  const now = FieldValue.serverTimestamp();
  const batch = db.batch();
  batch.set(secretRef(uid), { ...secret, pin });
  batch.update(memberRef(uid), { pinSetAt: now, updatedAt: now });
  await batch.commit();
  await logAdminAction('pin-reset', uid);
  return { pin };
});

exports.adminNewLink = callable(async (request) => {
  await requireAdmin(request);
  const uid = readUid(input(request).uid);

  const linkCode = await db.runTransaction(async (tx) => {
    const member = await tx.get(memberRef(uid));
    if (!member.exists) throw new HttpsError('not-found', NO_MEMBER);
    const code = await freeLinkCode(tx);
    const old = member.get('linkCode');
    const now = FieldValue.serverTimestamp();
    // Deleting the old link is what makes the old QR code stop working.
    if (typeof old === 'string' && LINK_CODE_PATTERN.test(old)) tx.delete(linkRef(old));
    tx.create(linkRef(code), { uid, createdAt: now });
    tx.update(memberRef(uid), { linkCode: code, updatedAt: now });
    return code;
  });
  await logAdminAction('link-changed', uid);
  return { linkCode };
});

exports.adminSetDisabled = callable(async (request) => {
  await requireAdmin(request);
  const data = input(request);
  const uid = readUid(data.uid);
  if (typeof data.disabled !== 'boolean') {
    throw new HttpsError('invalid-argument', 'Say whether to switch the member off or on.');
  }
  const { disabled } = data;
  await getMember(uid);

  // The members flag first: it's what stops scans, the part that matters most when switching off.
  await memberRef(uid).update({ disabled, updatedAt: FieldValue.serverTimestamp() });
  // A member can delete their own sign-in account; the card is still switched off by the flag above.
  const hasAccount = await auth.updateUser(uid, { disabled }).then(
    () => true,
    (error) => {
      if (error?.code === 'auth/user-not-found') return false;
      throw error;
    },
  );
  // Their sessions end for good: switching them back on later doesn't bring the old ones back.
  if (disabled && hasAccount) await memberRef(uid).update({ tokensValidAfter: await endSessions(uid) });
  await logAdminAction(disabled ? 'disabled' : 'enabled', uid);
  return { ok: true };
});

/**
 * Sends a member the welcome (their ID, the temporary password adminCreateMember just showed, and
 * the card if the page drew one) or their new card after a PIN reset or a new link. The page sends
 * the card it drew (pinCardDataUrl), so it matches what the admin downloads.
 */
exports.adminEmailMember = callable(async (request) => {
  await requireAdmin(request);
  const data = input(request);
  const uid = readUid(data.uid);
  const { template } = data;
  if (!EMAIL_TEMPLATES.includes(template)) throw new HttpsError('invalid-argument', 'Pick which email to send.');
  const options = {};
  if (template === 'welcome') {
    options.tempPassword = readTempPassword(data.tempPassword);
    if (data.cardPng != null && data.cardPng !== '') options.cardPng = readCardPng(data.cardPng);
  } else {
    options.cardPng = readCardPng(data.cardPng);
  }

  const member = await getMember(uid);
  if (!member.get('email')) throw new HttpsError('failed-precondition', 'This member has no email address.');
  return sendMemberEmail(uid, template, options);
}, { secrets: [GMAIL_APP_PASSWORD] });

/**
 * The admin changes a member's contact email (null or '' removes it) or name. The name on their
 * page is theirs to edit, so the new one goes there only if they've left it blank.
 */
exports.adminUpdateMember = callable(async (request) => {
  await requireAdmin(request);
  const data = input(request);
  const uid = readUid(data.uid);
  const changes = {};
  if (data.email !== undefined) changes.email = readEmail(data.email);
  if (data.name !== undefined) changes.name = readName(data.name);
  if (!Object.keys(changes).length) throw new HttpsError('invalid-argument', 'Nothing to change.');

  await db.runTransaction(async (tx) => {
    const [member, profile] = await tx.getAll(memberRef(uid), profileRef(uid));
    if (!member.exists) throw new HttpsError('not-found', NO_MEMBER);
    const now = FieldValue.serverTimestamp();
    tx.update(memberRef(uid), { ...changes, updatedAt: now });
    if (changes.name && profile.exists && !String(profile.get('profile.name') ?? '').trim()) {
      tx.update(profileRef(uid), { 'profile.name': changes.name, updatedAt: now });
    }
  });
  return { ok: true };
});

/**
 * Deletes a member for good, once the admin has typed their ID: the card link first, so the printed
 * card stops at once, then their members, profiles and secrets docs, their PIN attempts, their access
 * log and, last, their sign-in account. Each step finds what's left by uid and deleting twice is
 * harmless, so a run that stops part-way is simply repeated. Nobody else's docs are touched.
 */
exports.adminDeleteMember = callable(async (request) => {
  await requireAdmin(request);
  const data = input(request);
  const uid = readUid(data.uid);
  const typed = typeof data.confirmLoginId === 'string' ? data.confirmLoginId.trim().toLowerCase() : '';
  const loginId = await loginIdToDelete(uid, typed);
  const queries = memberQueries(uid);

  // By uid rather than members.linkCode: a link that isn't theirs can never go.
  await deleteAll(queries.links);
  const batch = db.batch();
  batch.delete(memberRef(uid));
  batch.delete(profileRef(uid));
  batch.delete(secretRef(uid)); // never secrets/_visitor: readUid lets no '_' through
  await batch.commit();
  const attempts = await deleteAll(queries.attempts);
  const logs = await deleteAll(queries.logs);
  if (queries.outbox) await deleteAll(queries.outbox);
  // Last: while anything else is left, the account still names the ID a retry is checked against.
  await auth.deleteUser(uid).catch((err) => {
    if (err?.code !== 'auth/user-not-found') throw err;
  });

  // No access-log entry: there's no member left to read it.
  logger.info('member deleted', { uid, loginId });
  return { ok: true, removed: { logs, attempts } };
});
