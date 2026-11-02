import { MessageSquare, Phone, Users } from 'lucide-react';
import Section from './Section';
import { buildSosMessage, initials, smsHref, telHref, whatsappHref } from '../utils';

/** Section 4 */
export default function EmergencyContacts({ contacts = [], name, coords }) {
  const sorted = [...contacts].filter((c) => c.name || c.phone).sort((a, b) => Number(!!b.primary) - Number(!!a.primary));
  const message = buildSosMessage(name, coords);

  return (
    <Section id="em-contacts" title="Emergency contacts" icon={Users}>
      {sorted.length === 0 ? (
        <p className="em-empty">No contacts added yet</p>
      ) : (
        <ul className="em-contacts">
          {sorted.map((c, i) => (
            <li key={`${c.name}-${i}`} className={`em-contact${c.primary ? ' is-primary' : ''}`}>
              <div className="em-contact__who">
                <span className="em-contact__avatar" aria-hidden="true">
                  {initials(c.name)}
                </span>
                <div>
                  <p className="em-contact__name">
                    {c.name}
                    {c.primary && <span className="em-tag">Call first</span>}
                  </p>
                  <p className="em-contact__meta">
                    {c.relation && <span>{c.relation}</span>}
                    {c.phone && <span>{c.phone}</span>}
                  </p>
                  {c.notes && <p className="em-contact__note">{c.notes}</p>}
                </div>
              </div>
              {c.phone && (
                <div className="em-contact__actions">
                  <a className="em-btn em-btn--solid" href={telHref(c.phone)}>
                    <Phone aria-hidden="true" /> Call
                  </a>
                  <a className="em-btn" href={smsHref(c.phone, message)}>
                    <MessageSquare aria-hidden="true" /> Text
                  </a>
                  <a className="em-btn" href={whatsappHref(c.phone, message)} target="_blank" rel="noreferrer">
                    WhatsApp
                  </a>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}
