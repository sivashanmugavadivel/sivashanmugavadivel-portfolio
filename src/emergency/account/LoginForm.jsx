import { useEffect, useRef, useState } from 'react';
import { UserRound } from 'lucide-react';
import { signInAdmin, signInMember } from '../accountApi';
import { DEMO_MODE } from '../firebase';
import { DEMO_PIN, LOGIN_ID_PATTERN, linkUrl, normalizeLoginId } from '../config';
import { PublicCallButtons } from '../components/PinGate';
import { focusScreen } from './screenFocus';

/**
 * /emergency: members sign in with the ID and password from the admin; the admin uses Google.
 * `notice` says why the person was just signed out (AccountPage keeps it).
 */
export default function LoginForm({ notice = '' }) {
  const noticeRef = useRef(null);
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(''); // '' | 'member' | 'admin'
  const [error, setError] = useState('');
  const inFlight = useRef(false); // Enter + click must not sign in twice

  // The notice can arrive after this form is on screen (the sign-out that brought it here came
  // first), so it takes focus itself to be read out.
  useEffect(() => {
    if (notice) focusScreen(noticeRef.current);
  }, [notice]);

  const submit = async (e) => {
    e.preventDefault();
    if (inFlight.current) return;
    const id = normalizeLoginId(loginId);
    if (!id || !password) return setError('Enter your ID and password.');
    if (!LOGIN_ID_PATTERN.test(id)) return setError('Check your ID. It’s the one the admin gave you, like ravi or ravi.kumar.');
    inFlight.current = true;
    setBusy('member');
    setError('');
    try {
      await signInMember(id, password);
    } catch (err) {
      setError(err.message);
    } finally {
      // The page usually switches to the member's screen first. If no account follows, the form
      // must not be left on a disabled "Signing in…".
      inFlight.current = false;
      setBusy('');
    }
  };

  const adminSignIn = async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy('admin');
    setError('');
    try {
      await signInAdmin();
    } catch (err) {
      setError(err.message);
    } finally {
      // Also when the Google window was closed, which ends without an error.
      inFlight.current = false;
      setBusy('');
    }
  };

  return (
    <div className="em-gate">
      <PublicCallButtons />

      <main className="em-gate__card">
        <UserRound className="em-gate__mark" aria-hidden="true" />
        <h1 className="em-gate__title" tabIndex={-1}>
          Sign in
        </h1>
        <p className="em-gate__lead">Manage your emergency page with the ID and password the admin gave you.</p>
        {notice && (
          <p ref={noticeRef} className="em-msg em-msg--note" tabIndex={-1} data-screen-focus>
            {notice}
          </p>
        )}
        {/* import.meta.env.DEV first, so production builds drop the demo login and PIN altogether. */}
        {import.meta.env.DEV && DEMO_MODE && (
          <p className="em-demo">
            Demo mode: ID <strong>demo</strong>, password <strong>demo1234</strong>. Or try the{' '}
            <a href={linkUrl('testcard23')}>responder view</a> with PIN {DEMO_PIN}.
          </p>
        )}

        <form className="em-gate__form" onSubmit={submit} noValidate>
          <label className="em-field" htmlFor="em-login-id">
            <span>ID</span>
            <input
              id="em-login-id"
              name="username"
              autoComplete="username"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
            />
          </label>
          <div className="em-field">
            <label htmlFor="em-login-password">Password</label>
            <div className="em-inline">
              <input
                id="em-login-password"
                name="password"
                type={show ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button type="button" className="em-btn" aria-pressed={show} onClick={() => setShow((s) => !s)}>
                {show ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>
          <p className="em-gate__status" role="alert">
            {error}
          </p>
          <button type="submit" className="em-btn em-btn--solid" disabled={Boolean(busy)}>
            {busy === 'member' ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="em-hint">Forgot your password? Ask the admin to reset it.</p>
        <p className="em-hint">Helping someone? Scan the QR code on their card, then enter the PIN printed next to it.</p>
        <button type="button" className="em-link" onClick={adminSignIn} disabled={Boolean(busy)}>
          {busy === 'admin' ? 'Opening Google sign-in…' : 'Admin? Sign in with Google'}
        </button>
      </main>
    </div>
  );
}
