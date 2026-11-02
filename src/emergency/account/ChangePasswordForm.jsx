import { useRef, useState } from 'react';
import { KeyRound } from 'lucide-react';
import { changePassword, changeTempPassword } from '../accountApi';
import { PublicCallButtons } from '../components/PinGate';
import { PASSWORD_MIN_LENGTH, passwordProblem } from '../config';

/** Caught here before the round trip; the server applies the same policy again. */
function formProblem({ current, next, again, loginId, temp }) {
  if (!temp && !current) return 'Enter your current password.';
  const policy = passwordProblem(next, loginId);
  if (policy) return policy;
  if (!temp && next === current) return 'Pick a new password, not the one you use now.';
  if (next !== again) return 'The two new passwords don’t match.';
  return '';
}

/**
 * mode="temp": straight after the first sign-in, replacing the admin's temporary password.
 * mode="normal": from the member's menu, with the current password.
 * `onSignedOut(message)`: the change signed the member out, so the sign-in form has to say it.
 */
export default function ChangePasswordForm({ mode = 'normal', account, onDone, onCancel, onSignOut, onSignedOut }) {
  const temp = mode === 'temp';
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [again, setAgain] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const inFlight = useRef(false);
  const loginId = account?.loginId || '';

  const submit = async (e) => {
    e.preventDefault();
    if (inFlight.current) return;
    const problem = formProblem({ current, next, again, loginId, temp });
    if (problem) return setError(problem);
    inFlight.current = true;
    setBusy(true);
    setError('');
    try {
      if (temp) await changeTempPassword(next);
      else await changePassword(current, next);
      onDone?.();
    } catch (err) {
      // The new password saved but the sign-in after it failed, and the member was signed out:
      // this form is on its way off the screen, so the sign-in form has to say it.
      if (err.signedOut) onSignedOut?.(err.message);
      setError(err.message);
      setBusy(false);
    } finally {
      inFlight.current = false;
    }
  };

  const type = show ? 'text' : 'password';

  return (
    <div className="em-gate">
      <PublicCallButtons />

      <main className="em-gate__card">
        <KeyRound className="em-gate__mark" aria-hidden="true" />
        <h1 className="em-gate__title" tabIndex={-1}>
          {temp ? 'Choose your password' : 'Change password'}
        </h1>
        <p className="em-gate__lead">
          {temp
            ? 'The admin gave you a temporary password. Pick a new one that only you know before you go on.'
            : 'You’ll use the new password the next time you sign in.'}
        </p>

        <form className="em-gate__form" onSubmit={submit} noValidate>
          {/* Shown, and read by password managers so they save the new password under the right ID. */}
          <label className="em-field" htmlFor="em-pw-id">
            <span>Your ID</span>
            <input id="em-pw-id" name="username" autoComplete="username" value={loginId} readOnly />
          </label>
          {!temp && (
            <label className="em-field" htmlFor="em-pw-current">
              <span>Current password</span>
              <input
                id="em-pw-current"
                type={type}
                autoComplete="current-password"
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
              />
            </label>
          )}
          <label className="em-field" htmlFor="em-pw-new">
            <span>New password</span>
            <input
              id="em-pw-new"
              type={type}
              autoComplete="new-password"
              aria-describedby="em-pw-advice"
              value={next}
              onChange={(e) => setNext(e.target.value)}
            />
          </label>
          <label className="em-field" htmlFor="em-pw-again">
            <span>Type it again</span>
            <input id="em-pw-again" type={type} autoComplete="new-password" value={again} onChange={(e) => setAgain(e.target.value)} />
          </label>
          <p id="em-pw-advice" className="em-hint">
            At least {PASSWORD_MIN_LENGTH} characters. A few unrelated words are easy to remember and hard to guess.
          </p>
          <label className="em-check" htmlFor="em-pw-show">
            <input id="em-pw-show" type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} />
            <span>Show passwords</span>
          </label>
          <p className="em-gate__status" role="alert">
            {error}
          </p>
          <button type="submit" className="em-btn em-btn--solid" disabled={busy}>
            {busy ? 'Saving…' : temp ? 'Save and continue' : 'Change password'}
          </button>
        </form>

        {temp ? (
          // Not while saving: the change still goes through, and its sign-in would undo the sign-out.
          <button type="button" className="em-link" onClick={onSignOut} disabled={busy}>
            Sign out
          </button>
        ) : (
          <button type="button" className="em-link" onClick={onCancel} disabled={busy}>
            Cancel
          </button>
        )}
      </main>
    </div>
  );
}
