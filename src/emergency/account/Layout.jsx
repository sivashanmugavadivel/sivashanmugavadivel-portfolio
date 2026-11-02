import { ArrowLeft, LoaderCircle, Moon, Sun, TriangleAlert } from 'lucide-react';
import { PublicCallButtons } from '../components/PinGate';
import { useTheme } from '../theme';

/** Waiting with nothing to show yet. The call buttons stay, as on every screen without a profile. */
export function Busy({ label = 'Loading…', children }) {
  return (
    <div className="em-gate">
      <PublicCallButtons />
      <div className="em-gate__card">
        <div className="em-gate__busy" role="status">
          <LoaderCircle className="em-spin" aria-hidden="true" />
          <p>{label}</p>
        </div>
        {children}
      </div>
    </div>
  );
}

/** Something failed before a profile could be shown. `actions`: [{ label, onClick, solid }]. */
export function Problem({ title, body, actions = [] }) {
  return (
    <div className="em-gate">
      <PublicCallButtons />
      <main className="em-gate__card">
        <TriangleAlert className="em-gate__mark" aria-hidden="true" />
        <h1 className="em-gate__title" tabIndex={-1}>
          {title}
        </h1>
        <p className="em-gate__lead" role="alert">
          {body}
        </p>
        <div className="em-card-solo__actions">
          {actions.map((a) => (
            <button key={a.label} type="button" className={`em-btn${a.solid ? ' em-btn--solid' : ''}`} onClick={a.onClick}>
              {a.label}
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}

/** Light or dark for this page, remembered on this device. The member's page has it in its menu. */
function ThemeButton() {
  const { theme, toggle } = useTheme();
  const label = theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
  const Icon = theme === 'dark' ? Sun : Moon;
  return (
    <button type="button" className="em-btn em-btn--quiet em-btn--icon" onClick={toggle} aria-label={label} title={label}>
      <Icon aria-hidden="true" />
    </button>
  );
}

/** A plain account screen: a sticky bar with Back (or the red cross), a title, light or dark, and optional buttons. */
export function Page({ title, onBack, backLabel = 'Back', end, children }) {
  return (
    <div className="em-acct">
      <header className="em-acct__top">
        <div className="em-acct__bar">
          {onBack ? (
            <button type="button" className="em-btn em-btn--quiet" onClick={onBack}>
              <ArrowLeft aria-hidden="true" /> {backLabel}
            </button>
          ) : (
            <span className="em-cross" aria-hidden="true" />
          )}
          {/* tabIndex: the screen change moves focus here (screenFocus.js). */}
          <h1 className="em-acct__title" tabIndex={-1}>
            {title}
          </h1>
          <ThemeButton />
          {end}
        </div>
      </header>
      <main className="em-acct__body">{children}</main>
    </div>
  );
}
