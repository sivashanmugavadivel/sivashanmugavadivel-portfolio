import { useEffect, useId, useRef } from 'react';
import { CircleCheck, TriangleAlert } from 'lucide-react';
import { linkUrl, PAGE_URL } from '../config';
import { usePrefersReducedMotion } from '../hooks';
import CopyButton from './CopyButton';
import LinkQr from './LinkQr';
import MailStatus from './MailStatus';
import { passwordAtRisk } from './mail';

const PASSWORD_WARNING =
  'Save it now. The temporary password is shown only this once. If it’s lost, you can reset it but not see it again.';

/**
 * The result of creating a member or resetting something: what to hand over.
 * `result`: { title, uid, name, loginId, email?, tempPassword?, pin?, linkCode?, note?,
 * passwordTemplate?, passwordMail?, cardChanged?, cardMail? } (mail states: see mail.js).
 * The temporary password lives only in memory here, and is never put in the address bar, the
 * console or browser storage; once it's emailed nothing is lost by closing. The PIN, link and QR
 * code can be seen again under Card details.
 * `fresh`: it just arrived, so it comes into view and takes focus.
 * `onRetryWelcome` sends the welcome again; `onEmailCard` emails a changed card.
 */
export default function MemberCredentials({ result, fresh = false, onDone, onRetryWelcome, onEmailCard }) {
  const card = useRef(null);
  const titleId = useId(); // several cards can be open at once
  const reduced = usePrefersReducedMotion();
  const url = result.linkCode ? linkUrl(result.linkCode) : '';
  const passwordMail = result.tempPassword ? result.passwordMail : null;
  const welcome = result.passwordTemplate === 'welcome';
  const resetMailFailed = !welcome && passwordMail?.status === 'failed';

  // A reset is started from further down the list, so bring the new secret into view. Not for
  // cards already seen, which mount again when the admin comes back to the list.
  useEffect(() => {
    if (!fresh) return;
    card.current?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
    card.current?.focus({ preventScroll: true });
    // Only when a new result arrives, not when the motion preference changes or it stops being new.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const lines = [
    `Emergency page: ${result.name || result.loginId}`,
    `ID: ${result.loginId}`,
    result.tempPassword && `Temporary password: ${result.tempPassword}`,
    result.pin && `PIN: ${result.pin}`,
    url && `Card link: ${url}`,
    result.tempPassword && `Sign in at ${PAGE_URL} with the ID and temporary password, then choose your own password.`,
  ].filter(Boolean);

  const done = () => {
    if (passwordAtRisk(result)) {
      const question =
        passwordMail?.status === 'sending'
          ? 'Close this? The email with the temporary password hasn’t gone yet, and the password can’t be shown again.'
          : 'Close this? The temporary password can’t be shown again.';
      if (!window.confirm(question)) return;
    }
    onDone();
  };

  return (
    // data-screen-focus: coming back to the list lands on a card that arrived meanwhile.
    <section
      ref={card}
      className="em-panel em-cred"
      tabIndex={-1}
      aria-labelledby={titleId}
      data-screen-focus={fresh || undefined}
    >
      <h2 id={titleId}>
        <CircleCheck aria-hidden="true" /> {result.title}
      </h2>
      {/* Not while the email is on its way: the line below says how that went. */}
      {result.tempPassword && (!passwordMail || passwordMail.status === 'failed') && (
        <p className="em-warn" role="note">
          <TriangleAlert aria-hidden="true" />
          <span>{PASSWORD_WARNING}</span>
        </p>
      )}
      {result.note && <p className="em-hint">{result.note}</p>}

      <dl className="em-cred__list">
        <div className="em-cred__row">
          <dt>Name</dt>
          <dd>{result.name || 'Not set'}</dd>
        </div>
        <div className="em-cred__row">
          <dt>ID</dt>
          <dd>
            <span className="em-secret">{result.loginId}</span>
            <CopyButton text={result.loginId} ariaLabel="Copy ID" className="em-btn em-btn--sm" />
          </dd>
        </div>
        {result.tempPassword && (
          <div className="em-cred__row">
            <dt>Temporary password</dt>
            <dd>
              <span className="em-secret">{result.tempPassword}</span>
              <CopyButton text={result.tempPassword} ariaLabel="Copy temporary password" className="em-btn em-btn--sm" />
            </dd>
          </div>
        )}
        {result.pin && (
          <div className="em-cred__row">
            <dt>PIN</dt>
            <dd>
              <span className="em-secret em-secret--pin">{result.pin}</span>
              <CopyButton text={result.pin} ariaLabel="Copy PIN" className="em-btn em-btn--sm" />
            </dd>
          </div>
        )}
        {url && (
          <div className="em-cred__row">
            <dt>Card link</dt>
            <dd>
              <span className="em-cred__link">{url}</span>
              <CopyButton text={url} ariaLabel="Copy card link" className="em-btn em-btn--sm" />
            </dd>
          </div>
        )}
      </dl>

      {result.linkCode && <LinkQr code={result.linkCode} loginId={result.loginId} pin={result.pin} compact />}

      {/* Only the welcome can be sent again; a reset's email goes out with the reset itself. */}
      {passwordMail && (
        <MailStatus
          mail={passwordMail}
          what={welcome ? 'the ID, temporary password and card' : 'the new temporary password'}
          onSend={welcome ? onRetryWelcome : undefined}
        />
      )}
      {resetMailFailed && <p className="em-hint">Give them the temporary password yourself, or reset it again to send a new one.</p>}
      {result.cardChanged && result.email && (
        <MailStatus mail={result.cardMail} what="the new card" onSend={onEmailCard} sendLabel="Email the new card" />
      )}

      {result.tempPassword && (
        <p className="em-hint">
          They sign in at <strong>{PAGE_URL}</strong> with the ID and temporary password, then choose their own password.
        </p>
      )}
      {result.pin && (
        <p className="em-hint">
          Print the PIN next to the QR code (the card download does this). Whoever helps them needs it to open the page.
        </p>
      )}
      {(result.pin || result.linkCode) && (
        <p className="em-hint">You can see the PIN, link and QR code again later under Card details.</p>
      )}

      <div className="em-btnrow">
        <CopyButton text={lines.join('\n')} label="Copy all" className="em-btn em-btn--solid" />
        <button type="button" className="em-btn" onClick={done}>
          Done
        </button>
      </div>
    </section>
  );
}
