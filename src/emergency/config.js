// Settings for the emergency page. Values come from your .env file (see .env.example).
const env = import.meta.env;

/** Must match the region your Cloud Functions are deployed to. */
export const FUNCTIONS_REGION = env.VITE_FIREBASE_FUNCTIONS_REGION || 'asia-south1';

/** The server accepts any PIN of 4–8 digits (PIN_PATTERN in functions/index.js). */
export const MIN_PIN_LENGTH = 4;
export const MAX_PIN_LENGTH = 8;

/**
 * How many digits a PIN the admin creates or resets has (sent as pinLength), and how many
 * responders are told to expect (4–8). Six or more is strongly recommended. The keypad still
 * takes any 4–8 digits, so a PIN made before this changed still opens its page.
 */
export const PIN_LENGTH = Math.min(MAX_PIN_LENGTH, Math.max(MIN_PIN_LENGTH, Number(env.VITE_EMERGENCY_PIN_LENGTH) || 6));

/** PIN used only in demo mode (the dev server without Firebase). */
export const DEMO_PIN = '12345678'.slice(0, PIN_LENGTH);

/**
 * The page the QR codes and NFC tags open; each card adds ?id=<link code> (linkUrl below). Not
 * taken from the address bar, so a card made on the dev server or from /emergency/ (GitHub
 * Pages' slow 404 path) doesn't encode the wrong address.
 */
const PAGE_URL_SETTING = (env.VITE_EMERGENCY_PAGE_URL || '').trim().replace(/\/+$/, '');

/**
 * The live page, even on the dev server: for what leaves this device, like a card emailed to a
 * member, which has to open on their phone. The emails' own links (functions/mail.js) go there too.
 */
export const LIVE_PAGE_URL = PAGE_URL_SETTING || 'https://sivashanmugavadivel.in/emergency';

export const PAGE_URL = PAGE_URL_SETTING || (env.PROD ? LIVE_PAGE_URL : `${window.location.origin}/emergency`);

/**
 * Members sign in with an ID; Firebase Auth knows it as `${id}@${LOGIN_DOMAIN}`, an address
 * nobody sees or receives mail at. Same constant as LOGIN_DOMAIN in functions/index.js.
 */
export const LOGIN_DOMAIN = 'id.sivashanmugavadivel.in';

/** A login ID after normalizeLoginId: 3–30 characters, starting with a letter or digit. */
export const LOGIN_ID_PATTERN = /^[a-z0-9][a-z0-9._-]{2,29}$/;
export const LOGIN_ID_HINT = 'Use 3 to 30 letters, digits, dots, dashes or underscores, starting with a letter or digit.';

/** The code in a card's link: 10 characters with no look-alikes (no i, l, o, 0 or 1). */
export const LINK_CODE_PATTERN = /^[a-hjkmnp-z2-9]{10}$/;

/** IDs are case-insensitive, and a phone keyboard likes to add a capital or a trailing space. */
export const normalizeLoginId = (loginId) => String(loginId ?? '').trim().toLowerCase();

export const loginEmail = (loginId) => `${normalizeLoginId(loginId)}@${LOGIN_DOMAIN}`;

/** The address a member's QR code and NFC tag open. */
export const linkUrl = (code) => `${PAGE_URL}?id=${code}`;

/** The same on the live page: what an emailed card's QR code opens. */
export const liveLinkUrl = (code) => `${LIVE_PAGE_URL}?id=${code}`;

/**
 * The link code in the address (?id=<code>, or /emergency/<code> on the dev server), or null if
 * there is none or it isn't a valid code. A present ?id= wins over the path.
 */
export function linkCodeFromLocation(loc = window.location) {
  const fromQuery = new URLSearchParams(loc.search || '').get('id');
  const fromPath = /^\/emergency\/([^/]+)\/?$/.exec(loc.pathname || '')?.[1];
  const code = String(fromQuery || fromPath || '').trim().toLowerCase();
  return LINK_CODE_PATTERN.test(code) ? code : null;
}

/** A member's own password. changeTempPassword in functions/index.js applies the same rules. */
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;
// Same list as WEAK_PASSWORDS in firebase/functions/index.js.
const COMMON_PASSWORDS = new Set([
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

/** Why `password` won't do for this login ID, or '' if it's fine. */
export function passwordProblem(password, loginId = '') {
  const value = String(password ?? '');
  if (value.length < PASSWORD_MIN_LENGTH) return `Use at least ${PASSWORD_MIN_LENGTH} characters.`;
  if (value.length > PASSWORD_MAX_LENGTH) return `Use at most ${PASSWORD_MAX_LENGTH} characters.`;
  if (loginId && value.toLowerCase() === normalizeLoginId(loginId)) return 'Don’t use your ID as your password.';
  if (COMMON_PASSWORDS.has(value.toLowerCase())) return 'That password is too easy to guess. Pick another.';
  return '';
}

/** reCAPTCHA Enterprise site key for App Check. Empty = App Check off. */
export const RECAPTCHA_SITE_KEY = (env.VITE_RECAPTCHA_SITE_KEY || '').trim();

/**
 * Browser key for the Maps JavaScript API and Places API (New), restricted to your domain.
 * Without it, "Nearby help" shows only the "Search in Google Maps" links.
 */
export const GOOGLE_MAPS_KEY = env.VITE_GOOGLE_MAPS_API_KEY || '';

/** Map ID for the pins (Google Cloud console → Map management). DEMO_MAP_ID is for testing only. */
export const GOOGLE_MAP_ID = env.VITE_GOOGLE_MAPS_MAP_ID || 'DEMO_MAP_ID';

/** Shown on the locked screen so anyone can call for help without the PIN. */
export const PUBLIC_NUMBERS = [
  { label: 'Emergency', number: '112' },
  { label: 'Ambulance', number: '108' },
];
