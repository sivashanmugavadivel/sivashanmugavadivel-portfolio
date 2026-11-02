import { useState } from 'react';
import { LoaderCircle, MapPin, MessageSquareWarning, Phone, Share2, Siren } from 'lucide-react';
import Section from './Section';
import ServiceButton from './ServiceButton';
import {
  buildSosMessage,
  copyText,
  firstName,
  mapsHereUrl,
  mapsSearchUrl,
  primaryContact,
  smsHref,
  telHref,
} from '../utils';

/** Section 2: emergency numbers, the main contact, and location sharing. */
export default function EmergencyActions({ data, geo, toast }) {
  const services = (data.services || []).filter((s) => s.number);
  const contact = primaryContact(data.contacts);
  const name = data.profile?.name || 'This person';
  const [sharing, setSharing] = useState(false);

  const shareLocation = async () => {
    // Use the fix in hand, never await a fresh one: share and clipboard need the tap's
    // user activation, which a slow fix outlasts.
    const coords = geo.coords;
    const text = buildSosMessage(name, coords);
    setSharing(true);
    try {
      if (navigator.share) {
        try {
          await navigator.share({ title: 'Emergency location', text });
          toast(coords ? 'Location shared.' : 'Location unavailable. Message shared without it.');
          return;
        } catch (error) {
          if (error?.name === 'AbortError') return;
        }
      }
      const ok = await copyText(text);
      if (!ok) toast(`Couldn’t copy.${contact ? ' Use the Text or WhatsApp buttons under Emergency contacts.' : ''}`);
      else toast(coords ? 'Location copied. Paste it into any chat.' : 'Location unavailable. Message copied without it.');
    } finally {
      setSharing(false);
    }
  };

  const status = {
    tracking: geo.coords?.accuracy ? `Location found, accurate to about ${geo.coords.accuracy} m` : 'Location found',
    locating: 'Finding your location…',
    idle: 'Finding your location…',
  }[geo.status] || geo.error;

  return (
    <Section id="em-actions" title="Get help now" icon={Siren}>
      <div className="em-tiles">
        {services.map((s) => (
          <ServiceButton key={`${s.label}-${s.number}`} service={s} />
        ))}
      </div>

      {contact && (
        <a className="em-contact-tile" href={telHref(contact.phone)}>
          <span className="em-contact-tile__icon" aria-hidden="true">
            <Phone />
          </span>
          <span>
            <strong>Call {firstName(contact.name)}</strong>
            <small>
              {contact.relation ? `${contact.relation}, ` : ''}
              {contact.phone}
            </small>
          </span>
        </a>
      )}

      <div className="em-loc">
        <p className="em-loc__status">
          <span className={`em-loc__dot${geo.coords ? ' is-live' : ''}`} aria-hidden="true" />
          <span>{status}</span>
          {!geo.coords && (geo.status === 'denied' || geo.status === 'error') && (
            <button type="button" className="em-textbtn" onClick={geo.retry}>
              Try again
            </button>
          )}
        </p>
        <div className="em-loc__buttons">
          <button type="button" className="em-btn" onClick={shareLocation} disabled={sharing}>
            {sharing ? <LoaderCircle className="em-spin" aria-hidden="true" /> : <Share2 aria-hidden="true" />}
            Share current location
          </button>
          {/* A new tab keeps the unlocked page (a reload re-locks it). Without a fix yet,
              Maps centres on the phone’s own location. */}
          <a className="em-btn" href={geo.coords ? mapsSearchUrl(geo.coords) : mapsHereUrl} target="_blank" rel="noreferrer">
            <MapPin aria-hidden="true" /> Open in Google Maps
          </a>
          {/* A plain link, so the tap itself opens Messages; the body follows the live fix. */}
          {contact && (
            <a className="em-btn em-btn--red" href={smsHref(contact.phone, buildSosMessage(name, geo.coords))}>
              <MessageSquareWarning aria-hidden="true" /> Send SOS text to {firstName(contact.name)}
            </a>
          )}
        </div>
      </div>
    </Section>
  );
}
