import { useState } from 'react';
import { flushSync } from 'react-dom';
import { CircleCheck, KeyRound, Pencil, QrCode, ScrollText } from 'lucide-react';
import { loadProfile, saveProfile } from '../accountApi';
import AccessLog from './AccessLog';
import CardDetails from './CardDetails';
import ChangePasswordForm from './ChangePasswordForm';
import ProfilePages from './ProfilePages';
import { Busy, Page, Problem } from './Layout';
import { focusScreen, requestScreenFocus, useScreenFocus } from './screenFocus';
import { useLoad } from './useLoad';

/** Nothing a responder could act on yet: no blood group, critical note, medical facts or contacts. */
function isNearlyEmpty(p) {
  if (!p) return true;
  const m = p.medical || {};
  return !(
    p.profile?.bloodGroup ||
    p.profile?.criticalNote ||
    p.contacts?.some((c) => c.phone) ||
    m.conditions?.length ||
    m.allergies?.length ||
    m.medications?.length
  );
}

/** A signed-in member: their own page, their card (link, QR and PIN), who opened it, and their password. */
export default function MemberHome({ account, onSignOut, onSignedOut }) {
  const page = useLoad(loadProfile, account.uid);
  const [mode, setMode] = useState('view'); // view | edit | preview | card | log | password
  const [notice, setNotice] = useState('');

  useScreenFocus(`${page.status}:${mode}`);

  // Leaving the page view clears a "saved" message; coming back after a save keeps it.
  const go = (next) => {
    if (next !== 'view') setNotice('');
    requestScreenFocus();
    setMode(next);
  };

  const retry = () => {
    requestScreenFocus();
    page.retry();
  };

  // OK takes the button away with the notice, so focus goes back to the top of the page.
  const dismissNotice = () => {
    flushSync(() => setNotice(''));
    focusScreen();
  };

  if (page.status === 'loading') return <Busy label="Loading your page…" />;
  if (page.status === 'error') {
    return (
      <Problem
        title="Couldn’t load your page"
        body={page.error}
        actions={[
          { label: 'Try again', onClick: retry, solid: true },
          { label: 'Sign out', onClick: onSignOut },
        ]}
      />
    );
  }

  if (mode === 'password') {
    return (
      <ChangePasswordForm
        mode="normal"
        account={account}
        onCancel={() => go('view')}
        onSignedOut={onSignedOut}
        onDone={() => {
          go('view');
          setNotice('Password changed. Use the new one next time you sign in.');
        }}
      />
    );
  }

  if (mode === 'card') {
    // Loaded when opened, not with the page: the server logs each look at the card.
    return (
      <Page title="Your card" onBack={() => go('view')}>
        <CardDetails uid={account.uid} viewer="member" />
      </Page>
    );
  }

  if (mode === 'log') {
    return (
      <Page title="Who opened your page" onBack={() => go('view')}>
        <AccessLog
          uid={account.uid}
          self
          intro="Each time someone opens your page with the PIN, or is locked out after wrong guesses, it shows up here. So do emails to you and changes the admin makes."
        />
      </Page>
    );
  }

  // The banner's text takes focus when the page view opens (screenFocus.js): a notice mounted
  // together with the whole page isn't read out as a live region.
  let banner = null;
  if (notice) {
    banner = (
      <>
        <p tabIndex={-1} data-screen-focus>
          <CircleCheck className="em-banner__icon" aria-hidden="true" /> {notice}
        </p>
        <button type="button" className="em-btn" onClick={dismissNotice}>
          OK
        </button>
      </>
    );
  } else if (isNearlyEmpty(page.value)) {
    banner = (
      <>
        <p tabIndex={-1} data-screen-focus>
          <strong>Your page is almost empty.</strong> Add your blood group, medical details and family contacts, so whoever finds
          you knows how to help.
        </p>
        <button type="button" className="em-btn em-btn--solid" onClick={() => go('edit')}>
          <Pencil aria-hidden="true" /> Fill in my details
        </button>
      </>
    );
  }

  return (
    <ProfilePages
      profile={page.value}
      mode={mode}
      onMode={go}
      onSave={async (draft) => {
        page.setValue(await saveProfile(account.uid, draft));
        setNotice('Saved. Anyone who scans your card now sees these details.');
      }}
      title="Your emergency page"
      editTitle="Edit your emergency page"
      actions={[
        { label: 'My card', icon: QrCode, onClick: () => go('card') },
        { label: 'Who opened my page', icon: ScrollText, onClick: () => go('log') },
        { label: 'Change password', icon: KeyRound, onClick: () => go('password') },
      ]}
      onSignOut={onSignOut}
      banner={banner}
    />
  );
}
