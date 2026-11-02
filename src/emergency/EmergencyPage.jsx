import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { HeartPulse, LoaderCircle } from 'lucide-react';
import './emergency.css';
import { linkCodeFromLocation } from './config';
import { CONFIGURED, DEMO_MODE } from './firebase';
import { useNoIndex } from './hooks';
import PinGate, { PublicCallButtons } from './components/PinGate';
import EmergencyView from './components/EmergencyView';
import SectionBoundary from './components/SectionBoundary';

// Only sign-in needs Firebase Auth and Firestore. Loaded on demand, so a responder who scanned
// a card never downloads them on a roadside connection.
const AccountPage = lazy(() => import('./account/AccountPage'));

// Same stylesheet emergency.html links without blocking first paint. The portfolio's
// /emergency/ route doesn't have that <link>, so it's added here once.
const FONTS_URL =
  'https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:ital,wght@0,400;0,700;1,400&family=Barlow+Condensed:wght@500;600;700&display=swap';

/**
 * What the address asks for. linkCodeFromLocation() returns null both for "no link" (the
 * sign-in page) and for a broken one, and only the broken one should say so.
 */
function readLink(loc = window.location) {
  const code = linkCodeFromLocation(loc);
  if (code) return { code, invalid: false };
  const tried = new URLSearchParams(loc.search).has('id') || /^\/emergency\/[^/]+/.test(loc.pathname);
  return { code: null, invalid: tried };
}

/**
 * Who sees what:
 *  - A responder scans a card (QR or NFC) → /emergency?id=<code> → enters the PIN printed on
 *    the card → that member's page, read-only.
 *  - Members and the admin open /emergency with no code and sign in (account/AccountPage).
 */
export default function EmergencyPage() {
  useNoIndex();

  // Read once: nothing on the page changes the address.
  const [link] = useState(readLink);

  useEffect(() => {
    if (document.head.querySelector(`link[href="${FONTS_URL}"]`)) return;
    const sheet = document.createElement('link');
    sheet.rel = 'stylesheet';
    sheet.href = FONTS_URL;
    document.head.appendChild(sheet);
  }, []);

  let content;
  if (!CONFIGURED && !DEMO_MODE) {
    content = <NotSetUp />;
  } else if (link.code) {
    // Sections have their own boundaries; this one catches anything outside them (the keypad, the
    // top bar), so a crash still leaves the call buttons on screen.
    content = (
      <SectionBoundary fallback={<ScanUnavailable />}>
        <ScanFlow code={link.code} />
      </SectionBoundary>
    );
  } else if (link.invalid) {
    content = <InvalidLink />;
  } else {
    // The boundary keeps the call buttons up if the chunk can't be fetched or the account side crashes.
    content = (
      <SectionBoundary fallback={<AccountUnavailable />}>
        <Suspense fallback={<Loading />}>
          <AccountPage />
        </Suspense>
      </SectionBoundary>
    );
  }

  return <div className="em-root">{content}</div>;
}

/** PIN keypad, then the member's page. Lock goes back to the keypad for the same card. */
function ScanFlow({ code }) {
  const [data, setData] = useState(null);
  const shown = useRef(data);

  // Unlock and Lock replace the whole screen, the pressed button with it, so focus moves to the
  // new screen's heading (the person's name, or the PIN screen's title) for a screen reader to
  // announce. Not for the first screen after the page loads.
  useEffect(() => {
    window.scrollTo(0, 0);
    if (shown.current === data) return;
    shown.current = data;
    const heading = document.querySelector('.em-root h1');
    if (!heading) return;
    if (!heading.hasAttribute('tabindex')) heading.setAttribute('tabindex', '-1');
    heading.focus({ preventScroll: true });
  }, [data]);

  if (!data) return <PinGate code={code} onUnlock={setData} />;
  return (
    <>
      {/* import.meta.env.DEV first, so production builds drop the demo text altogether. */}
      {import.meta.env.DEV && DEMO_MODE && (
        <p className="em-demo" role="note">
          Demo mode: sample data, not a real person. Nothing is saved.
        </p>
      )}
      <EmergencyView data={data} role="viewer" onLock={() => setData(null)} />
    </>
  );
}

/** Call buttons first, then a short explanation: for screens that have no profile to show. */
function GateNotice({ title, children }) {
  return (
    <div className="em-gate">
      <PublicCallButtons />
      <main className="em-gate__card">
        <HeartPulse className="em-gate__mark" aria-hidden="true" />
        <h1 className="em-gate__title">{title}</h1>
        {children}
      </main>
    </div>
  );
}

/** A production build without the Firebase config: no sample data, no PIN, just the call buttons. */
function NotSetUp() {
  return (
    <GateNotice title="This emergency page isn’t set up yet">
      <p className="em-gate__lead">Its medical details and family contacts can’t be shown. Call for help with the buttons above.</p>
    </GateNotice>
  );
}

/** A card link with a malformed code: damaged print, a cut-off scan or a typo. */
function InvalidLink() {
  return (
    <GateNotice title="This emergency link isn’t valid">
      <p className="em-gate__lead">Part of the address may be missing. Scan the card again, or call for help with the buttons above.</p>
      <a className="em-link" href="/emergency">
        Is this your card? Sign in
      </a>
    </GateNotice>
  );
}

function ScanUnavailable() {
  return (
    <GateNotice title="This page hit a problem">
      <p className="em-gate__lead">Call for help with the buttons above, or reload the page and enter the PIN again.</p>
      <button type="button" className="em-btn em-btn--solid" onClick={() => window.location.reload()}>
        Reload
      </button>
    </GateNotice>
  );
}

function AccountUnavailable() {
  return (
    <GateNotice title="This page couldn’t load">
      <p className="em-gate__lead">Check mobile data or Wi-Fi and try again.</p>
      <button type="button" className="em-btn em-btn--solid" onClick={() => window.location.reload()}>
        Try again
      </button>
    </GateNotice>
  );
}

function Loading({ label = 'Loading…' }) {
  return (
    <div className="em-gate">
      <PublicCallButtons />
      <div className="em-gate__card" role="status">
        <LoaderCircle className="em-spin" aria-hidden="true" />
        <p>{label}</p>
      </div>
    </div>
  );
}
