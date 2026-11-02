import { useCallback, useEffect, useRef, useState } from 'react';
import { Delete, HeartPulse, Phone } from 'lucide-react';
import { unlockByLink } from '../scanApi';
import { DEMO_MODE } from '../firebase';
import { DEMO_PIN, MAX_PIN_LENGTH, MIN_PIN_LENGTH, PIN_LENGTH, PUBLIC_NUMBERS } from '../config';
import { telHref } from '../utils';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];

// Read out by screen readers but not shown: the dots alone aren't announced as digits go in.
const SR_ONLY = {
  position: 'absolute',
  width: 1,
  height: 1,
  margin: -1,
  padding: 0,
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
  border: 0,
};

const digitsEntered = (n) => `${n} ${n === 1 ? 'digit' : 'digits'} entered`;

/** The 112 / 108 links. On every screen a stranger can land on, so calling never waits for anything. */
export function PublicCallButtons() {
  return (
    <div className="em-gate__call">
      <p>Calling for help doesn’t need a PIN</p>
      <div className="em-gate__numbers">
        {PUBLIC_NUMBERS.map((n) => (
          <a key={n.number} className="em-btn em-btn--red em-btn--stack" href={telHref(n.number)}>
            <span className="em-btn__big">
              <Phone aria-hidden="true" /> {n.number}
            </span>
            <span className="em-btn__small">{n.label}</span>
          </a>
        ))}
      </div>
    </div>
  );
}

/** `code` is the card's link code; the PIN printed on that card unlocks it. */
export default function PinGate({ code, onUnlock }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [shakes, setShakes] = useState(0);
  const mounted = useRef(false);
  const inFlight = useRef(false); // a double tap or Enter + click must not spend two tries

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const press = useCallback(
    (key) => {
      if (busy) return;
      setError('');
      if (key === 'del') setPin((p) => p.slice(0, -1));
      else if (/^\d$/.test(key)) setPin((p) => (p.length < MAX_PIN_LENGTH ? p + key : p));
    },
    [busy],
  );

  // Sent on Unlock rather than at PIN_LENGTH digits, so a PIN set before
  // VITE_EMERGENCY_PIN_LENGTH changed still goes through (the server takes 4–8).
  const submit = useCallback(async () => {
    if (inFlight.current || pin.length < MIN_PIN_LENGTH) return;
    inFlight.current = true;
    setBusy(true);
    setError('');
    try {
      const data = await unlockByLink(code, pin);
      if (mounted.current) onUnlock(data);
    } catch (err) {
      if (mounted.current) {
        setError(err.message);
        setPin('');
        setShakes((n) => n + 1);
      }
    } finally {
      inFlight.current = false;
      if (mounted.current) setBusy(false);
    }
  }, [code, pin, onUnlock]);

  // Physical keyboard support.
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.closest?.('input, textarea, select')) return;
      if (/^\d$/.test(e.key)) press(e.key);
      else if (e.key === 'Backspace') press('del');
      // A focused button or link handles Enter itself.
      else if (e.key === 'Enter' && !e.target.closest?.('button, a')) submit();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [press, submit]);

  return (
    <div className="em-gate">
      <PublicCallButtons />

      <main className="em-gate__card">
        <HeartPulse className="em-gate__mark" aria-hidden="true" />
        {/* tabIndex: Lock brings focus back here from the profile (ScanFlow in EmergencyPage). */}
        <h1 className="em-gate__title" tabIndex={-1}>
          Emergency medical info
        </h1>
        <p className="em-gate__lead">
          Enter the {PIN_LENGTH}-digit PIN printed on the card, then tap Unlock to see medical details and family
          contacts.
        </p>
        {/* import.meta.env.DEV first, so production builds drop the demo PIN altogether. */}
        {import.meta.env.DEV && DEMO_MODE && <p className="em-demo">Demo: PIN {DEMO_PIN}</p>}

        <div
          key={shakes}
          className={`em-dots${shakes ? ' is-shaking' : ''}`}
          role="img"
          aria-label={digitsEntered(pin.length)}
        >
          {Array.from({ length: Math.max(PIN_LENGTH, pin.length) }, (_, i) => (
            <span key={i} className={i < pin.length ? 'is-filled' : ''} />
          ))}
        </div>
        <span style={SR_ONLY} aria-live="polite">
          {pin.length && !busy ? digitsEntered(pin.length) : ''}
        </span>

        <p className={`em-gate__status${busy ? ' is-busy' : ''}`} role="status" aria-live="assertive">
          {busy ? 'Checking PIN…' : error}
        </p>

        <div className="em-keypad">
          {KEYS.map((key, i) =>
            key === '' ? (
              <span key={i} aria-hidden="true" />
            ) : (
              <button
                key={i}
                type="button"
                onClick={() => press(key)}
                disabled={busy}
                aria-label={key === 'del' ? 'Delete last digit' : key}
                className={key === 'del' ? 'em-keypad__del' : undefined}
              >
                {key === 'del' ? <Delete aria-hidden="true" /> : key}
              </button>
            ),
          )}
        </div>

        <button
          type="button"
          className="em-btn em-btn--solid em-gate__unlock"
          onClick={submit}
          disabled={busy || pin.length < MIN_PIN_LENGTH}
        >
          Unlock
        </button>

        {/* A plain link: /emergency without the card's code is the sign-in page. */}
        <a className="em-link" href="/emergency">
          Is this your card? Sign in
        </a>
      </main>
    </div>
  );
}
