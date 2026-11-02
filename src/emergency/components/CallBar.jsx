import { Phone } from 'lucide-react';
import { firstName, primaryContact, telHref } from '../utils';

/** Always-visible call buttons at the bottom of the screen. */
export default function CallBar({ services = [], contacts = [] }) {
  const main = services.find((s) => s.number) || { number: '112' };
  const contact = primaryContact(contacts);
  return (
    <div className="em-callbar" role="region" aria-label="Quick call">
      <a className="em-callbar__btn em-callbar__btn--red" href={telHref(main.number)}>
        <Phone aria-hidden="true" /> Call {main.number}
      </a>
      {contact && (
        <a className="em-callbar__btn" href={telHref(contact.phone)}>
          <Phone aria-hidden="true" /> Call {firstName(contact.name)}
        </a>
      )}
    </div>
  );
}
