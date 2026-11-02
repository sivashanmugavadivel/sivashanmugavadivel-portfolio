import { useEffect, useId, useRef, useState } from 'react';
import { ArrowLeft, Lock, LogOut, Menu, Pencil } from 'lucide-react';
import { usePrefersReducedMotion } from '../hooks';
import { firstName } from '../utils';

const NAV = [
  { id: 'em-profile', label: 'Profile' },
  { id: 'em-actions', label: 'Get help' },
  { id: 'em-medical', label: 'Medical' },
  { id: 'em-contacts', label: 'Contacts' },
  { id: 'em-nearby', label: 'Nearby' },
  { id: 'em-firstaid', label: 'First aid' },
  { id: 'em-vehicle', label: 'Vehicle' },
  { id: 'em-about', label: 'About' },
];

/**
 * role 'viewer': a responder's view with Lock (or Back, when `onBack` is given, for the owner's preview).
 * role 'owner': `title`, Edit, and a menu of `actions` ({ label, icon, onClick }) ending in Sign out.
 */
export default function TopBar({ name, role, title, onLock, onBack, onEdit, onSignOut, actions = [] }) {
  const reduced = usePrefersReducedMotion();
  // Scroll in-page without touching the URL, so it works with any router. An explicit
  // 'smooth' overrides the CSS reduced-motion rule, so honour the preference here.
  const jump = (id) =>
    document.getElementById(id)?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
  const menu = onSignOut ? [...actions, { label: 'Sign out', icon: LogOut, onClick: onSignOut }] : actions;

  return (
    <header className="em-top">
      <div className="em-top__row">
        <p className="em-top__title">
          <span className="em-cross" aria-hidden="true" />
          <span className="em-top__text">
            {role === 'owner' ? title || 'Your emergency page' : `Emergency info for ${firstName(name || '')}`}
          </span>
        </p>
        <div className="em-top__actions">
          {role === 'owner' ? (
            <>
              {onEdit && (
                <button type="button" className="em-btn em-btn--quiet" onClick={onEdit}>
                  <Pencil aria-hidden="true" /> Edit
                </button>
              )}
              {menu.length > 0 && <TopMenu items={menu} />}
            </>
          ) : onBack ? (
            <button type="button" className="em-btn em-btn--quiet" onClick={onBack}>
              <ArrowLeft aria-hidden="true" /> Back
            </button>
          ) : (
            <button type="button" className="em-btn em-btn--quiet" onClick={onLock}>
              <Lock aria-hidden="true" /> Lock
            </button>
          )}
        </div>
      </div>
      <nav className="em-nav" aria-label="Sections">
        {NAV.map((item) => (
          <button key={item.id} type="button" onClick={() => jump(item.id)}>
            {item.label}
          </button>
        ))}
      </nav>
    </header>
  );
}

/** A disclosure list (not an ARIA menu): plain buttons, Tab to move, Escape or a tap outside to close. */
function TopMenu({ items }) {
  const [open, setOpen] = useState(false);
  const wrap = useRef(null);
  const toggle = useRef(null);
  const listId = useId();

  useEffect(() => {
    if (!open) return undefined;
    const outside = (e) => {
      if (!wrap.current?.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      setOpen(false);
      toggle.current?.focus();
    };
    // focusin rather than blur: Safari doesn't focus a tapped button, so blur would close the
    // list before the tap on an item lands.
    document.addEventListener('pointerdown', outside);
    document.addEventListener('focusin', outside);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('focusin', outside);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="em-menu" ref={wrap}>
      <button
        ref={toggle}
        type="button"
        className="em-btn em-btn--quiet"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((o) => !o)}
      >
        <Menu aria-hidden="true" /> Menu
      </button>
      <ul id={listId} className="em-menu__list" hidden={!open}>
        {items.map(({ label, icon: Icon, onClick }) => (
          <li key={label}>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onClick();
              }}
            >
              {Icon && <Icon aria-hidden="true" />} {label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
