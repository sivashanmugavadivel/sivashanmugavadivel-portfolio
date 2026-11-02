import { RefreshCw, ScrollText } from 'lucide-react';
import { loadAccessLogs } from '../accountApi';
import { useLoad } from './useLoad';

const EVENTS = {
  unlock: { label: 'Opened', tone: 'green' },
  lockout: { label: 'Locked out', tone: 'red' },
  'pin-reset': { label: 'New PIN', tone: 'amber' },
  'password-reset': { label: 'Password reset', tone: 'amber' },
  'link-changed': { label: 'New link', tone: 'amber' },
  disabled: { label: 'Switched off', tone: 'red' },
  enabled: { label: 'Switched on', tone: 'green' },
  created: { label: 'Account made', tone: '' },
  'card-viewed': { label: 'Card viewed', tone: '' },
  emailed: { label: 'Emailed', tone: 'green' },
  'email-failed': { label: 'Email failed', tone: 'red' },
};

// Which email an 'emailed' or 'email-failed' entry was about (its detail: the template name).
const EMAILS = {
  welcome: 'Welcome with ID, temporary password and card',
  'password-reset': 'New temporary password',
  card: 'Their card',
};

// Only scans say anything useful about the device; admin changes would just show the admin's browser.
const SCAN_EVENTS = ['unlock', 'lockout'];

/** The extra words an entry gets from its detail, or ''. `self`: the member reading their own log. */
function describeDetail(log, self) {
  if (log.type === 'card-viewed') {
    if (log.detail === 'admin') return 'By the admin';
    if (log.detail === 'member') return self ? 'By you' : 'By the member';
    return '';
  }
  if (log.type === 'emailed' || log.type === 'email-failed') {
    const what = EMAILS[log.detail] || '';
    return self && log.detail === 'card' ? 'Your card' : what;
  }
  return '';
}

function describeDevice(ua = '') {
  const os = /iPhone|iPad/.test(ua) ? 'iPhone or iPad' : /Android/.test(ua) ? 'Android' : /Windows/.test(ua) ? 'Windows' : /Mac OS/.test(ua) ? 'Mac' : /Linux/.test(ua) ? 'Linux' : 'Unknown device';
  const browser = /Edg\//.test(ua) ? 'Edge' : /Chrome\//.test(ua) ? 'Chrome' : /Firefox\//.test(ua) ? 'Firefox' : /Safari\//.test(ua) ? 'Safari' : '';
  return browser ? `${os}, ${browser}` : os;
}

/**
 * Recent unlocks, lockouts, emails and admin changes for one member's page. `self`: the member
 * is reading their own, so entries say "you" rather than "the member".
 */
export default function AccessLog({ uid, intro, self = false }) {
  const logs = useLoad(loadAccessLogs, uid);
  const entries = logs.value || [];

  return (
    <section className="em-panel" aria-labelledby="em-log-title">
      <div className="em-panel__head">
        <h2 id="em-log-title">
          <ScrollText aria-hidden="true" /> Recent activity
        </h2>
        <button type="button" className="em-btn em-btn--quiet" onClick={logs.retry} disabled={logs.status === 'loading'}>
          <RefreshCw aria-hidden="true" /> Refresh
        </button>
      </div>
      {intro && <p className="em-hint">{intro}</p>}
      {logs.status === 'loading' ? (
        <p className="em-hint" role="status">
          Loading…
        </p>
      ) : logs.status === 'error' ? (
        <p className="em-msg em-msg--error" role="alert">
          {logs.error}
        </p>
      ) : entries.length === 0 ? (
        <p className="em-empty">Nothing yet. No one has opened this page with the PIN.</p>
      ) : (
        <ul className="em-log">
          {entries.map((log) => {
            const event = EVENTS[log.type] || { label: log.type, tone: '' };
            const detail = describeDetail(log, self);
            return (
              <li key={log.id}>
                <span className={`em-pill${event.tone ? ` em-pill--${event.tone}` : ''}`}>{event.label}</span>
                <time dateTime={log.at ? new Date(log.at).toISOString() : undefined}>
                  {log.at ? new Date(log.at).toLocaleString() : 'Just now'}
                </time>
                {SCAN_EVENTS.includes(log.type) && log.userAgent && (
                  <span className="em-log__device">{describeDevice(log.userAgent)}</span>
                )}
                {detail && <span className="em-log__device">{detail}</span>}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
