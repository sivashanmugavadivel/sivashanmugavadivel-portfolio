import { useState } from 'react';
import { IdCard, KeyRound, QrCode } from 'lucide-react';
import { getCard } from '../accountApi';
import { linkUrl } from '../config';
import CopyButton from './CopyButton';
import LinkQr from './LinkQr';
import MailStatus from './MailStatus';
import { sendCard, sendingTo } from './mail';
import { useLoad } from './useLoad';

const formatDate = (ms) => new Date(ms).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });

/**
 * A member's card as it stands (getCard): the PIN, the link and its QR code, and the card with the
 * PIN to download. `viewer` 'admin' is the admin's Card details for anyone, with their ID and
 * email and a button to email them the card; 'member' is the member's own My card.
 */
export default function CardDetails({ uid, viewer = 'member' }) {
  const card = useLoad(getCard, uid);
  const [mail, setMail] = useState(null);

  if (card.status !== 'ready') {
    return (
      <section className="em-panel" aria-labelledby="em-card-title">
        <h2 id="em-card-title">
          <IdCard aria-hidden="true" /> {viewer === 'admin' ? 'Card details' : 'Your card'}
        </h2>
        {card.status === 'loading' ? (
          <p className="em-hint" role="status">
            Loading the card…
          </p>
        ) : (
          <div className="em-inline-notice" role="alert">
            <p>{card.error}</p>
            <button type="button" className="em-btn" onClick={card.retry}>
              Try again
            </button>
          </div>
        )}
      </section>
    );
  }

  const c = card.value;
  if (viewer !== 'admin') return <OwnCard card={c} />;

  const url = c.linkCode ? linkUrl(c.linkCode) : '';
  const emailCard = async () => {
    setMail(sendingTo(c.email));
    setMail(await sendCard(uid, c));
  };

  return (
    <section className="em-panel" aria-labelledby="em-card-title">
      <h2 id="em-card-title">
        <IdCard aria-hidden="true" /> Card details
      </h2>
      <dl className="em-cred__list">
        <div className="em-cred__row">
          <dt>Name</dt>
          <dd>{c.name || 'Not set'}</dd>
        </div>
        <div className="em-cred__row">
          <dt>ID</dt>
          <dd>
            <span className="em-secret">{c.loginId}</span>
            <CopyButton text={c.loginId} ariaLabel="Copy ID" className="em-btn em-btn--sm" />
          </dd>
        </div>
        <div className="em-cred__row">
          <dt>Email</dt>
          <dd>{c.email ? <span className="em-cred__link">{c.email}</span> : <span className="em-cred__none">None on file</span>}</dd>
        </div>
        <div className="em-cred__row">
          <dt>PIN</dt>
          <dd>
            {c.pin ? (
              <>
                <span className="em-secret em-secret--pin">{c.pin}</span>
                <CopyButton text={c.pin} ariaLabel="Copy PIN" className="em-btn em-btn--sm" />
              </>
            ) : (
              <span className="em-cred__none">PIN not on file — reset the PIN to see it here</span>
            )}
          </dd>
        </div>
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

      {c.linkCode ? (
        <LinkQr code={c.linkCode} loginId={c.loginId} pin={c.pin} compact />
      ) : (
        <p className="em-empty">No card link. Make one with New link under Manage.</p>
      )}
      {c.pinSetAt && <p className="em-hint">PIN set on {formatDate(c.pinSetAt)}.</p>}

      {c.email && c.pin && c.linkCode ? (
        <MailStatus mail={mail} what="the card" onSend={emailCard} sendLabel="Email card to member" />
      ) : (
        !c.email && <p className="em-hint">To email them their card, add their email with Edit email under Manage.</p>
      )}
    </section>
  );
}

/** My card: the member's own PIN, link and QR code. They can't change the PIN themselves. */
function OwnCard({ card: c }) {
  return (
    <>
      <section className="em-panel" aria-labelledby="em-pin-title">
        <h2 id="em-pin-title">
          <KeyRound aria-hidden="true" /> Your PIN
        </h2>
        {c.pin ? (
          <p>
            <span className="em-secret em-secret--pin">{c.pin}</span>
          </p>
        ) : (
          <p>Your PIN isn’t on file here yet. Ask the admin for a new PIN, and it shows here after that.</p>
        )}
        <p className="em-hint">
          {`Whoever helps you types it after scanning your card. The admin set it${c.pinSetAt ? ` on ${formatDate(c.pinSetAt)}` : ''}.`}{' '}
          To change your PIN, ask the admin.
        </p>
      </section>
      <section className="em-panel" aria-labelledby="em-card-title">
        <h2 id="em-card-title">
          <QrCode aria-hidden="true" /> Your link and QR code
        </h2>
        {c.linkCode ? (
          <LinkQr code={c.linkCode} loginId={c.loginId} pin={c.pin} />
        ) : (
          <p className="em-empty">You don’t have a card link yet. Ask the admin to make one.</p>
        )}
        <p className="em-hint">
          Print the card with your PIN on a card or sticker and keep it where a helper will look: your wallet, phone case or
          helmet.
        </p>
        <p className="em-hint">Lost your card? Ask the admin for a new link. The old QR code then stops working.</p>
      </section>
    </>
  );
}
