import { useRef } from 'react';
import { MailCheck, Send } from 'lucide-react';

/**
 * Where one email stands: on its way, sent, or why it didn't go. The line stays mounted, so a
 * screen reader hears it change from "Emailing…" to how it went.
 * `mail`: a mail state from mail.js, or null before anything is sent. `what`: what the email
 * carries ("the card"). `onSend` (optional) sends it: its button (`sendLabel`) shows until the
 * email has gone, and becomes Try again after a failure.
 */
export default function MailStatus({ mail, what, onSend, sendLabel = 'Send email' }) {
  const line = useRef(null);
  const status = mail?.status;

  const send = () => {
    // The button goes while the email is on its way; focus waits on the line that says how it went.
    line.current?.focus({ preventScroll: true });
    onSend();
  };

  let text = '';
  let tone = 'em-sr-only';
  if (status === 'sending') {
    text = `Emailing ${what} to ${mail.to}…`;
    tone = 'em-hint';
  } else if (status === 'sent') {
    text = `Emailed ${what} to ${mail.to}.`;
    if (mail.noCard) text += ' The card couldn’t be drawn here, so it isn’t attached. Send it from Card details.';
    tone = 'em-msg em-msg--ok';
  } else if (status === 'failed') {
    text = `Couldn’t email ${mail.to || 'them'}. ${mail.text}`;
    tone = 'em-msg em-msg--error';
  }

  return (
    <div className="em-mail">
      <p ref={line} className={tone} role="status" tabIndex={-1}>
        {status === 'sent' && <MailCheck aria-hidden="true" />}
        {text}
      </p>
      {onSend && status !== 'sending' && status !== 'sent' && (
        <button type="button" className="em-btn" onClick={send}>
          <Send aria-hidden="true" /> {status === 'failed' ? 'Try again' : sendLabel}
        </button>
      )}
    </div>
  );
}
