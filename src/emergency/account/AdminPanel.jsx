import { useEffect, useId, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import {
  ArrowLeft,
  AtSign,
  ChevronDown,
  Download,
  Hash,
  IdCard,
  KeyRound,
  Link2,
  LogOut,
  Power,
  PowerOff,
  RefreshCw,
  ScrollText,
  Trash2,
  UserPlus,
  Users,
} from 'lucide-react';
import {
  createMember,
  deleteMember,
  emailProblem,
  listMembers,
  loadMember,
  loadProfile,
  newMemberLink,
  normalizeEmail,
  resetMemberPassword,
  resetMemberPin,
  saveProfile,
  setMemberDisabled,
  updateMember,
} from '../accountApi';
import { LOGIN_ID_HINT, LOGIN_ID_PATTERN, PIN_LENGTH, linkUrl, normalizeLoginId } from '../config';
import { firstName } from '../utils';
import AccessLog from './AccessLog';
import CardDetails from './CardDetails';
import MemberCredentials from './MemberCredentials';
import ProfilePages from './ProfilePages';
import { Busy, Page, Problem } from './Layout';
import { mailState, passwordAtRisk, sendCard, sendingTo, sendWelcome } from './mail';
import { downloadDataUrl, qrDataUrl, qrFileName } from './qr';
import { focusScreen, requestScreenFocus, useScreenFocus } from './screenFocus';
import { useLoad } from './useLoad';

const shortName = (m) => firstName(m.name || '') || m.loginId;
const formatDate = (ms) => new Date(ms).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

// members.updatedAt changes with admin actions, so only the profile's own save time counts here.
function lastChange(m) {
  if (m.profileUpdatedAt) return `Profile updated ${formatDate(m.profileUpdatedAt)}`;
  return m.createdAt ? `Added ${formatDate(m.createdAt)}` : '';
}

/** Which card a card email is for: a newer PIN or link for the member is a different card. */
const cardKey = (r) => `${r.linkCode || ''}:${r.pin || ''}`;

let resultCount = 0; // keys each credentials card, so a new result scrolls into view again

/** The site owner: make members, hand out their ID, password, PIN and card, and look after them. */
export default function AdminPanel({ account, onSignOut }) {
  const members = useLoad(listMembers);
  const list = members.value || [];
  // The credentials cards, newest first, each closed with its own Done: a new result never takes
  // a temporary password that wasn't emailed off the screen. One card per member, though, since
  // an older card would still show a PIN or link that has just stopped working.
  const [results, setResults] = useState([]);
  const [freshId, setFreshId] = useState(null); // the card that just arrived; it takes focus
  const [view, setView] = useState(null); // null = the list | { kind: 'profile' | 'card' | 'log', member }
  const [notice, setNotice] = useState(''); // "Deleted Ravi Kumar." under the Members heading
  const membersTitle = useRef(null);
  const working = useRef(0); // requests that will come back with a temporary password
  // Only an un-emailed temporary password is lost by leaving: the PIN, link and QR code can be
  // seen again under Card details.
  const unsaved = results.some(passwordAtRisk);

  useScreenFocus(view ? `${view.kind}:${view.member.uid}` : 'list');

  // The secrets live only in this component, so a reload or a closed tab would lose them too.
  useEffect(() => {
    if (!unsaved) return undefined;
    const warn = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [unsaved]);

  const open = (next) => {
    requestScreenFocus();
    // Cards seen before leaving don't take focus again on the way back; one that arrived
    // meanwhile (a member still being made) does.
    if (next) setFreshId(null);
    // It was about the list as it stood; the way back shouldn't read it out again.
    setNotice('');
    setView(next);
  };

  const show = (next) => {
    const id = ++resultCount;
    setResults((prev) => {
      const same = prev.find((r) => r.uid === next.uid);
      // Each secret stays valid until a newer one of its kind replaces it; the old note may not.
      const card = same ? { ...same, ...next, note: next.note, id } : { ...next, id };
      return [card, ...prev.filter((r) => r !== same)];
    });
    setFreshId(id);
  };

  // An email's outcome lands on the member's card only while the card still shows what was sent:
  // a newer password or PIN that arrived meanwhile hasn't been emailed.
  const patchResult = (uid, stillSame, changes) =>
    setResults((prev) => prev.map((r) => (r.uid === uid && stillSame(r) ? { ...r, ...changes } : r)));

  const emailWelcome = async (r) => {
    const stillSame = (x) => x.tempPassword === r.tempPassword;
    patchResult(r.uid, stillSame, { passwordMail: sendingTo(r.email) });
    patchResult(r.uid, stillSame, { passwordMail: await sendWelcome(r) });
  };

  const emailCard = async (r) => {
    const sent = cardKey(r);
    const stillSame = (x) => cardKey(x) === sent;
    patchResult(r.uid, stillSame, { cardMail: sendingTo(r.email) });
    patchResult(r.uid, stillSame, { cardMail: await sendCard(r.uid, r) });
  };

  const dismiss = (id) => {
    flushSync(() => setResults((prev) => prev.filter((r) => r.id !== id)));
    // Done went with its card: on to the next card, or else the top of the page.
    focusScreen(document.querySelector('.em-root .em-cred'));
  };

  const track = async (task) => {
    working.current += 1;
    try {
      return await task();
    } finally {
      working.current -= 1;
    }
  };

  // Also behind Sign out on a member's page. Leaving drops every card, like Done does.
  const signOut = () => {
    let warning = '';
    if (unsaved) warning = 'Sign out? The temporary passwords on screen haven’t been emailed, and they can’t be shown again.';
    else if (working.current > 0) warning = 'Sign out? A new temporary password is still on its way, and you won’t see it.';
    if (warning && !window.confirm(warning)) return;
    onSignOut();
  };

  const patch = (uid, changes) => {
    members.update((prev) => prev.map((m) => (m.uid === uid ? { ...m, ...changes } : m)));
    // A card on screen offers to email only while there's an address to email.
    if ('email' in changes) setResults((prev) => prev.map((r) => (r.uid === uid ? { ...r, email: changes.email } : r)));
  };

  // Deleted from its row: the row goes, and so do their cards on screen, without the "can’t be
  // shown again" question, as their password, PIN and link no longer open anything. Focus went
  // with the row, so it moves to the Members heading.
  const removeMember = (m) => {
    flushSync(() => {
      members.update((prev) => prev.filter((x) => x.uid !== m.uid));
      setResults((prev) => prev.filter((r) => r.uid !== m.uid));
      setNotice(`Deleted ${m.name || m.loginId}.`);
    });
    membersTitle.current?.scrollIntoView({ block: 'nearest' });
    membersTitle.current?.focus({ preventScroll: true });
  };

  if (view?.kind === 'profile') {
    const { uid } = view.member;
    return (
      <MemberPage
        member={view.member}
        onClose={() => open(null)}
        onSaved={(saved) => patch(uid, { profileUpdatedAt: saved?.updatedAt ?? Date.now() })}
        onSignOut={signOut}
      />
    );
  }
  if (view?.kind === 'card') {
    return (
      <Page title={`${shortName(view.member)}’s card`} onBack={() => open(null)} backLabel="Members">
        <CardDetails uid={view.member.uid} viewer="admin" />
      </Page>
    );
  }
  if (view?.kind === 'log') {
    const who = shortName(view.member);
    return (
      <Page title={`${who}’s access log`} onBack={() => open(null)} backLabel="Members">
        <AccessLog uid={view.member.uid} intro={`Unlocks, lockouts, emails and admin changes for ${who}’s page, newest first.`} />
      </Page>
    );
  }

  return (
    <Page
      title="Admin"
      end={
        <button type="button" className="em-btn em-btn--quiet" onClick={signOut}>
          <LogOut aria-hidden="true" /> Sign out
        </button>
      }
    >
      {account?.email && <p className="em-hint">Signed in as {account.email}</p>}

      {results.map((r) => (
        <MemberCredentials
          key={r.id}
          result={r}
          fresh={r.id === freshId}
          onDone={() => dismiss(r.id)}
          onRetryWelcome={() => emailWelcome(r)}
          onEmailCard={() => emailCard(r)}
        />
      ))}

      <CreateMember
        onTrack={track}
        onCreated={(created) => {
          const { uid, loginId, name, email, linkCode } = created;
          const added = {
            uid,
            loginId,
            name,
            email,
            linkCode,
            disabled: false,
            mustChangePassword: true,
            createdAt: Date.now(),
            profileUpdatedAt: null,
          };
          // A list that failed or is still loading loads again instead, with them in it.
          members.update((prev) => [added, ...(prev || []).filter((m) => m.uid !== uid)]);
          setNotice('');
          show({
            ...created,
            title: `${firstName(created.name) || created.loginId} is set up`,
            passwordTemplate: 'welcome',
            passwordMail: email ? sendingTo(email) : null,
          });
          // The page sends the welcome itself, so it can attach the card it draws.
          if (email) emailWelcome(created);
        }}
      />

      <section className="em-acct__section" aria-labelledby="em-members-title">
        <div className="em-panel__head">
          {/* tabIndex: focus lands here after a member is deleted. */}
          <h2 id="em-members-title" ref={membersTitle} className="em-acct__h2" tabIndex={-1}>
            <Users aria-hidden="true" /> Members{members.status === 'ready' ? ` (${list.length})` : ''}
          </h2>
          <button
            type="button"
            className="em-btn em-btn--quiet"
            onClick={() => {
              setNotice('');
              members.retry();
            }}
            disabled={members.status === 'loading'}
          >
            <RefreshCw aria-hidden="true" /> Refresh
          </button>
        </div>
        {/* Stays mounted, hidden while empty, so a screen reader hears it when a member is deleted. */}
        <p className={notice ? 'em-msg em-msg--ok' : 'em-sr-only'} role="status">
          {notice}
        </p>
        {members.status === 'loading' ? (
          <p className="em-hint" role="status">
            Loading members…
          </p>
        ) : members.status === 'error' ? (
          <div className="em-inline-notice" role="alert">
            <p>{members.error}</p>
            <button type="button" className="em-btn" onClick={members.retry}>
              Try again
            </button>
          </div>
        ) : list.length === 0 ? (
          <p className="em-empty">No members yet. Make the first one above.</p>
        ) : (
          <ul className="em-members">
            {list.map((m) => (
              <MemberRow
                key={m.uid}
                member={m}
                onOpen={() => open({ kind: 'profile', member: m })}
                onCard={() => open({ kind: 'card', member: m })}
                onLog={() => open({ kind: 'log', member: m })}
                onPatch={(changes) => patch(m.uid, changes)}
                onResult={show}
                onTrack={track}
                onDeleted={() => removeMember(m)}
              />
            ))}
          </ul>
        )}
      </section>
    </Page>
  );
}

function CreateMember({ onCreated, onTrack }) {
  const [loginId, setLoginId] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    const id = normalizeLoginId(loginId);
    const fullName = name.trim();
    const contact = normalizeEmail(email);
    if (!LOGIN_ID_PATTERN.test(id)) return setError(LOGIN_ID_HINT);
    if (!fullName) return setError('Enter their name.');
    if (emailProblem(contact)) return setError(emailProblem(contact));
    setBusy(true);
    setError('');
    try {
      const created = await onTrack(() => createMember({ loginId: id, name: fullName, email: contact }));
      setLoginId('');
      setName('');
      setEmail('');
      onCreated(created);
    } catch (err) {
      setError(err.code === 'already-exists' ? `The ID “${id}” is taken. Pick another one.` : err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="em-panel" aria-labelledby="em-create-title">
      <h2 id="em-create-title">
        <UserPlus aria-hidden="true" /> Add a member
      </h2>
      <p className="em-hint">
        They get a temporary password, a {PIN_LENGTH}-digit PIN and a card link. The password is shown only once, so give their
        email and we’ll send it to them, or have somewhere to keep it.
      </p>
      <form className="em-form-grid" onSubmit={submit} noValidate>
        <label className="em-field" htmlFor="em-new-id">
          <span>ID they sign in with</span>
          <input
            id="em-new-id"
            autoComplete="off"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            placeholder="ravi"
            aria-describedby="em-new-id-hint"
            value={loginId}
            onChange={(e) => setLoginId(e.target.value)}
          />
        </label>
        <label className="em-field" htmlFor="em-new-name">
          <span>Full name</span>
          <input id="em-new-name" autoComplete="off" placeholder="Ravi Kumar" value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <p id="em-new-id-hint" className="em-hint em-span-2">
          3 to 30 letters or digits; dots, dashes and underscores are fine. Capitals become lowercase. Keep it simple, like ravi or ravi.kumar.
        </p>
        <label className="em-field em-span-2" htmlFor="em-new-email">
          <span>
            Email <span className="em-field__optional">(optional)</span>
          </span>
          <input
            id="em-new-email"
            type="email"
            inputMode="email"
            autoComplete="off"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            placeholder="ravi@example.com"
            aria-describedby="em-new-email-hint"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <p id="em-new-email-hint" className="em-hint em-span-2">
          We’ll email the ID, a temporary password and their card.
        </p>
        {error && (
          <p className="em-msg em-msg--error em-span-2" role="alert">
            {error}
          </p>
        )}
        <div className="em-span-2">
          <button type="submit" className="em-btn em-btn--solid" disabled={busy}>
            <UserPlus aria-hidden="true" /> {busy ? 'Making the account…' : 'Add member'}
          </button>
        </div>
      </form>
    </section>
  );
}

function MemberRow({ member: m, onOpen, onCard, onLog, onPatch, onResult, onTrack, onDeleted }) {
  const [open, setOpen] = useState(false);
  const [panel, setPanel] = useState(null); // the form open under Manage: null | 'email' | 'delete'
  const [busy, setBusy] = useState('');
  const [msg, setMsg] = useState(null); // { ok, text }
  const editButton = useRef(null);
  const deleteButton = useRef(null);
  const who = shortName(m);
  const moreId = `em-more-${m.uid}`;
  const editId = `em-email-${m.uid}`;
  const deleteId = `em-delete-${m.uid}`;

  const run = async (kind, confirmText, task) => {
    if (busy) return;
    if (confirmText && !window.confirm(confirmText)) return;
    setBusy(kind);
    setMsg(null);
    try {
      await task();
    } catch (err) {
      setMsg({ ok: false, text: err.message || 'That didn’t work. Try again.' });
    } finally {
      setBusy('');
    }
  };

  const resetPassword = () =>
    run(
      'password',
      m.email
        ? `Reset ${who}’s password? The current one stops working and they’re signed out. We’ll email the temporary password to ${m.email}.`
        : `Reset ${who}’s password? The current one stops working and they’re signed out. You’ll get a temporary password to give them.`,
      async () => {
        const { tempPassword, emailed } = await onTrack(() => resetMemberPassword(m.uid));
        onPatch({ mustChangePassword: true });
        onResult({
          title: `New temporary password for ${who}`,
          uid: m.uid,
          name: m.name,
          loginId: m.loginId,
          email: m.email,
          tempPassword,
          passwordTemplate: 'password-reset',
          passwordMail: mailState(emailed, m.email),
        });
      },
    );

  // A new PIN or link is a new card: the card on screen offers to email it (cardMail starts over).
  const resetPin = () =>
    run(
      'pin',
      `Make a new PIN for ${who}? The PIN on their card stops working, so they’ll need the new one (or a new card).`,
      async () => {
        const { pin } = await resetMemberPin(m.uid);
        onPatch({ pinSetAt: Date.now() });
        onResult({
          title: `New PIN for ${who}`,
          uid: m.uid,
          name: m.name,
          loginId: m.loginId,
          email: m.email,
          pin,
          linkCode: m.linkCode,
          cardChanged: true,
          cardMail: null,
        });
      },
    );

  const newLink = () =>
    run('link', `Make a new link for ${who}? The old QR code stops working, so print the new one.`, async () => {
      const { linkCode } = await newMemberLink(m.uid);
      onPatch({ linkCode });
      onResult({
        title: `New card link for ${who}`,
        uid: m.uid,
        name: m.name,
        loginId: m.loginId,
        email: m.email,
        linkCode,
        cardChanged: true,
        cardMail: null,
        note: 'The old QR code no longer opens anything. The PIN hasn’t changed.',
      });
    });

  const toggle = () =>
    m.disabled
      ? run('power', '', async () => {
          await setMemberDisabled(m.uid, false);
          onPatch({ disabled: false });
          setMsg({ ok: true, text: `Switched on. ${who} can sign in and their card works again.` });
        })
      : run(
          'power',
          `Switch off ${who}’s page? Their card stops opening anything and they can’t sign in until you switch it back on.`,
          async () => {
            await setMemberDisabled(m.uid, true);
            onPatch({ disabled: true });
            setMsg({ ok: true, text: `Switched off. ${who}’s card and sign-in no longer work.` });
          },
        );

  const downloadQr = () =>
    run('qr', '', async () => {
      downloadDataUrl(await qrDataUrl(linkUrl(m.linkCode)), qrFileName(m.loginId));
    });

  // The form goes with the button that was pressed in it, so focus returns to Edit email.
  const closeEditor = (saved) => {
    flushSync(() => {
      setPanel(null);
      if (saved !== undefined) {
        setMsg({ ok: true, text: saved ? `Email saved. We’ll write to ${saved}.` : `Email removed. ${who} gets no emails now.` });
      }
    });
    editButton.current?.focus();
  };

  // Cancel goes with the confirm panel, so focus returns to Delete member.
  const closeDelete = () => {
    flushSync(() => setPanel(null));
    deleteButton.current?.focus();
  };

  // Delete permanently. A failure rejects, for the confirm panel to show; success takes the whole
  // row away (onDeleted), so nothing here is set after it.
  const remove = async (typed) => {
    if (busy) return;
    setBusy('delete');
    setMsg(null);
    try {
      await deleteMember(m.uid, typed);
    } catch (err) {
      // 'not-found' again after a try whose answer was lost: that try finished if the member is
      // gone. Look, though: a function that isn't deployed answers 'not-found' too.
      const gone = err.code === 'not-found' && (await loadMember(m.uid).then((x) => !x, () => false));
      if (!gone) {
        setBusy('');
        throw err;
      }
    }
    onDeleted();
  };

  const toggleMore = () => {
    setOpen((o) => !o);
    setPanel(null);
  };

  const label = (kind, idle, working) => (busy === kind ? working : idle);

  return (
    <li className={`em-member${m.disabled ? ' is-off' : ''}`}>
      <div className="em-member__head">
        <div className="em-member__who">
          <p className="em-member__name">{m.name || m.loginId}</p>
          <p className="em-member__id">
            ID <span className="em-secret">{m.loginId}</span>
          </p>
          <p className="em-member__email">{m.email || 'No email on file'}</p>
        </div>
        <ul className="em-member__chips" aria-label="Status">
          <li className={`em-pill em-pill--${m.disabled ? 'red' : 'green'}`}>{m.disabled ? 'Switched off' : 'Active'}</li>
          {m.mustChangePassword && <li className="em-pill em-pill--amber">Must change password</li>}
        </ul>
      </div>
      {lastChange(m) && <p className="em-hint">{lastChange(m)}</p>}

      {/* Open profile, Card details and Access log wait while an action runs, so its result
          comes back to this list rather than to a screen that has moved on. */}
      <div className="em-member__actions">
        {/* The hidden names tell a screen reader which of the many "Open profile" buttons this is. */}
        <button type="button" className="em-btn em-btn--solid" onClick={onOpen} disabled={Boolean(busy)}>
          Open profile<span className="em-sr-only">: {m.name || m.loginId}</span>
        </button>
        <button type="button" className="em-btn" onClick={onCard} disabled={Boolean(busy)}>
          <IdCard aria-hidden="true" /> Card details<span className="em-sr-only">: {m.name || m.loginId}</span>
        </button>
        {/* Not while deleting: the confirm panel, and any problem it reports, would fold away. */}
        <button
          type="button"
          className="em-btn"
          aria-expanded={open}
          aria-controls={moreId}
          onClick={toggleMore}
          disabled={busy === 'delete'}
        >
          Manage<span className="em-sr-only"> {m.name || m.loginId}</span>
          <ChevronDown className={open ? 'em-flip' : undefined} aria-hidden="true" />
        </button>
      </div>

      <div id={moreId} className="em-member__more" hidden={!open}>
        <button
          ref={editButton}
          type="button"
          className="em-btn"
          aria-expanded={panel === 'email'}
          aria-controls={editId}
          onClick={() => setPanel((p) => (p === 'email' ? null : 'email'))}
          disabled={Boolean(busy)}
        >
          <AtSign aria-hidden="true" /> Edit email
        </button>
        <button type="button" className="em-btn" onClick={resetPassword} disabled={Boolean(busy)}>
          <KeyRound aria-hidden="true" /> {label('password', 'Reset password', 'Resetting…')}
        </button>
        <button type="button" className="em-btn" onClick={resetPin} disabled={Boolean(busy)}>
          <Hash aria-hidden="true" /> {label('pin', 'Reset PIN', 'Making a PIN…')}
        </button>
        <button type="button" className="em-btn" onClick={newLink} disabled={Boolean(busy)}>
          <Link2 aria-hidden="true" /> {label('link', 'New link', 'Making a link…')}
        </button>
        <button type="button" className="em-btn" onClick={downloadQr} disabled={Boolean(busy) || !m.linkCode}>
          <Download aria-hidden="true" /> {label('qr', 'Download QR', 'Drawing…')}
        </button>
        <button type="button" className="em-btn" onClick={onLog} disabled={Boolean(busy)}>
          <ScrollText aria-hidden="true" /> Access log
        </button>
        <button type="button" className={`em-btn${m.disabled ? '' : ' em-btn--danger'}`} onClick={toggle} disabled={Boolean(busy)}>
          {m.disabled ? <Power aria-hidden="true" /> : <PowerOff aria-hidden="true" />}{' '}
          {label('power', m.disabled ? 'Switch on' : 'Switch off', 'Saving…')}
        </button>
        <button
          ref={deleteButton}
          type="button"
          className="em-btn em-btn--danger"
          aria-expanded={panel === 'delete'}
          aria-controls={deleteId}
          onClick={() => setPanel((p) => (p === 'delete' ? null : 'delete'))}
          disabled={Boolean(busy)}
        >
          <Trash2 aria-hidden="true" /> Delete member
        </button>
      </div>

      {open && panel === 'email' && (
        <EmailEditor
          id={editId}
          member={m}
          onCancel={() => closeEditor()}
          onSaved={(email) => {
            onPatch({ email });
            closeEditor(email);
          }}
        />
      )}

      {open && panel === 'delete' && (
        <DeleteMember id={deleteId} member={m} busy={busy === 'delete'} onCancel={closeDelete} onDelete={remove} />
      )}

      {msg && (
        <p className={`em-msg ${msg.ok ? 'em-msg--ok' : 'em-msg--error'}`} role={msg.ok ? 'status' : 'alert'}>
          {msg.text}
        </p>
      )}
    </li>
  );
}

/** Edit email: where the welcome, password and card emails go. Empty removes the address. */
function EmailEditor({ id, member, onCancel, onSaved }) {
  const [value, setValue] = useState(member.email || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const input = useRef(null);
  const inputId = useId();
  const hintId = useId();
  const who = shortName(member);

  // Opened from Edit email: straight to the field.
  useEffect(() => {
    input.current?.focus();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    const email = normalizeEmail(value);
    if (emailProblem(email)) return setError(emailProblem(email));
    if (email === (member.email || '')) return onCancel();
    setBusy(true);
    setError('');
    try {
      await updateMember(member.uid, { email });
      onSaved(email);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <form id={id} className="em-member__edit" onSubmit={submit} noValidate>
      <label className="em-field" htmlFor={inputId}>
        <span>{who}’s email</span>
        <input
          ref={input}
          id={inputId}
          type="email"
          inputMode="email"
          autoComplete="off"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          placeholder="ravi@example.com"
          aria-describedby={hintId}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') onCancel();
          }}
        />
      </label>
      <p id={hintId} className="em-hint">
        Used for their temporary passwords and cards. Leave it empty to stop emails.
      </p>
      {error && (
        <p className="em-msg em-msg--error" role="alert">
          {error}
        </p>
      )}
      <div className="em-btnrow">
        <button type="submit" className="em-btn em-btn--solid" disabled={busy}>
          {busy ? 'Saving…' : 'Save email'}
        </button>
        <button type="button" className="em-btn" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}

/**
 * Delete member: what goes, and the member's ID typed out before anything is deleted. `onDelete(typed)`
 * rejects with the message to show here; `busy` while it runs.
 */
function DeleteMember({ id, member, busy, onCancel, onDelete }) {
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const input = useRef(null);
  const titleId = useId();
  const textId = useId();
  const inputId = useId();
  const name = member.name || member.loginId;
  // Compared as the server compares them: trimmed and lowercased.
  const matches = normalizeLoginId(value) === member.loginId;

  // Opened from Delete member: straight to the field.
  useEffect(() => {
    input.current?.focus();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!matches || busy) return;
    setError('');
    try {
      await onDelete(value);
    } catch (err) {
      setError(err.message || 'Couldn’t delete the member. Try again.');
      // Delete permanently was switched off while it ran, which dropped focus: back to the field.
      if (!document.activeElement || document.activeElement === document.body) input.current?.focus();
    }
  };

  return (
    <form id={id} className="em-member__delete" onSubmit={submit} aria-labelledby={titleId} noValidate>
      <h3 id={titleId} className="em-member__delete-title">
        <Trash2 aria-hidden="true" />
        Delete {name} permanently?
      </h3>
      <p id={textId}>
        This removes their sign-in, their page, card link, PIN and access log. Their printed card stops working. This can’t be
        undone.
      </p>
      <label className="em-field" htmlFor={inputId}>
        <span>
          Type <span className="em-secret">{member.loginId}</span> to confirm
        </span>
        <input
          ref={input}
          id={inputId}
          autoComplete="off"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          // Focus lands here first, so the field also reads out what's about to happen.
          aria-describedby={`${titleId} ${textId}`}
          value={value}
          readOnly={busy}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape' && !busy) onCancel();
          }}
        />
      </label>
      {error && (
        <p className="em-msg em-msg--error" role="alert">
          {error}
        </p>
      )}
      {/* The button below is switched off while it works, so its "Deleting…" isn't read out by itself. */}
      <p className="em-sr-only" role="status">
        {busy ? `Deleting ${name}…` : ''}
      </p>
      <div className="em-btnrow">
        <button type="submit" className="em-btn em-btn--red" disabled={!matches || busy}>
          <Trash2 aria-hidden="true" /> {busy ? 'Deleting…' : 'Delete permanently'}
        </button>
        <button type="button" className="em-btn" onClick={onCancel} disabled={busy}>
          Cancel
        </button>
      </div>
    </form>
  );
}

/** The admin looking at (and editing) one member's page. `onSaved(saved)` keeps the members list current. */
function MemberPage({ member, onClose, onSaved, onSignOut }) {
  const page = useLoad(loadProfile, member.uid);
  const [mode, setMode] = useState('view'); // view | edit | preview | log
  const [saved, setSaved] = useState(false);
  const who = shortName(member);

  useScreenFocus(`${page.status}:${mode}`);

  const go = (next) => {
    if (next !== 'view') setSaved(false);
    requestScreenFocus();
    setMode(next);
  };

  const retry = () => {
    requestScreenFocus();
    page.retry();
  };

  if (page.status === 'loading') return <Busy label={`Loading ${who}’s page…`} />;
  if (page.status === 'error') {
    return (
      <Problem
        title={`Couldn’t load ${who}’s page`}
        body={page.error}
        actions={[
          { label: 'Try again', onClick: retry, solid: true },
          { label: 'Back to members', onClick: onClose },
        ]}
      />
    );
  }
  if (mode === 'log') {
    return (
      <Page title={`${who}’s access log`} onBack={() => go('view')}>
        <AccessLog uid={member.uid} intro={`Unlocks, lockouts, emails and admin changes for ${who}’s page, newest first.`} />
      </Page>
    );
  }

  return (
    <ProfilePages
      profile={page.value}
      mode={mode}
      onMode={go}
      onSave={async (draft) => {
        const next = await saveProfile(member.uid, draft);
        page.setValue(next);
        setSaved(true);
        onSaved(next);
      }}
      title={`${who}’s emergency page`}
      editTitle={`Editing ${who}’s page`}
      actions={[
        { label: 'Access log', icon: ScrollText, onClick: () => go('log') },
        { label: 'Back to members', icon: ArrowLeft, onClick: onClose },
      ]}
      onSignOut={onSignOut}
      banner={
        <>
          {/* Takes focus when the page opens or a save comes back here (screenFocus.js), so it's read out. */}
          <p tabIndex={-1} data-screen-focus>
            {saved ? 'Saved. ' : ''}You’re looking at {who}’s page as the admin. Changes you save go live straight away.
          </p>
          <button type="button" className="em-btn" onClick={onClose}>
            <ArrowLeft aria-hidden="true" /> Members
          </button>
        </>
      }
    />
  );
}
