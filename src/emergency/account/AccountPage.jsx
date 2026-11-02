import { useCallback, useEffect, useRef, useState } from 'react';
import { onAccountChange, signOutAccount } from '../accountApi';
import { DEMO_MODE } from '../firebase';
import AdminPanel from './AdminPanel';
import ChangePasswordForm from './ChangePasswordForm';
import LoginForm from './LoginForm';
import MemberHome from './MemberHome';
import { Busy } from './Layout';
import { requestScreenFocus, useScreenFocus } from './screenFocus';

/**
 * /emergency without a card link. Members manage their own page; the admin manages members.
 * Responders never land here: a scanned card opens the PIN screen, which doesn't load this chunk.
 */
export default function AccountPage() {
  const [account, setAccount] = useState(undefined); // undefined = still checking, null = signed out
  // The account object the temporary password was replaced for. Covers the moment before the
  // fresh sign-in arrives without the mustChangePassword claim; a later account object wins.
  const [passwordSetFor, setPasswordSetFor] = useState(null);
  // Why the person was signed out, for the sign-in form: a switched-off account, or a new
  // password that saved when the sign-in after it didn't. The form that knew is gone by then.
  const [notice, setNotice] = useState('');
  const settled = useRef(false);

  useEffect(
    () =>
      onAccountChange((next, why) => {
        // The first answer is just the page loading; every later one replaces the screen in use.
        if (settled.current) requestScreenFocus();
        settled.current = true;
        setAccount(next);
        // Only an account clears it: the signed-out report and the notice can arrive in either order.
        if (next) setNotice('');
        else if (why) setNotice(why);
      }),
    [],
  );

  const signOut = useCallback(() => {
    Promise.resolve()
      .then(() => signOutAccount())
      .catch(() => {
        // Signing out is local; if it fails the screen simply stays as it is.
      });
  }, []);

  let screen;
  let content;
  if (account === undefined) {
    screen = 'loading';
    content = <Busy label="Loading…" />;
  } else if (!account) {
    screen = 'sign-in';
    content = <LoginForm notice={notice} />;
  } else if (account.kind === 'admin') {
    screen = 'admin';
    content = <AdminPanel account={account} onSignOut={signOut} />;
  } else if (account.kind !== 'member') {
    // Signed in but not known yet, e.g. between the Google window and the admin check.
    screen = 'checking';
    content = (
      <Busy label="Checking your account…">
        <button type="button" className="em-link" onClick={signOut}>
          Sign out
        </button>
      </Busy>
    );
  } else if (account.mustChangePassword && passwordSetFor !== account) {
    screen = 'password';
    content = (
      <ChangePasswordForm
        mode="temp"
        account={account}
        onDone={() => {
          requestScreenFocus();
          setPasswordSetFor(account);
        }}
        onSignedOut={setNotice}
        onSignOut={signOut}
      />
    );
  } else {
    screen = 'member';
    content = <MemberHome key={account.uid} account={account} onSignOut={signOut} onSignedOut={setNotice} />;
  }

  useScreenFocus(`${screen}:${account?.uid ?? ''}`);

  return (
    <>
      {/* import.meta.env.DEV first, so production builds drop the demo text altogether. */}
      {import.meta.env.DEV && DEMO_MODE && account && (
        <p className="em-demo em-demo--bar" role="note">
          Demo mode: test data only. Nothing is saved, and reloading starts over.
        </p>
      )}
      {content}
    </>
  );
}
