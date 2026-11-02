# Emergency page backend tests

Integration tests for the multi-user emergency page: the Cloud Functions, the Firestore rules and
the sign-in flows, run against the Firebase emulators. They use the same client SDK the page ships
with (`firebase` from the repo root), and every actor (the admin, each member, the responder who
scans a card) gets its own Firebase app, as if on separate phones.

## Before the first run

1. Java 21 or newer, for the Firestore emulator.
2. `pnpm install` at the repo root. The tests import `firebase` from there.
3. `npm install` in `firebase/functions`.
4. `firebase/functions/.env.local` (gitignored) containing:

   ```
   ADMIN_EMAILS=admin@example.com
   GMAIL_USER=gmail-user@example.com
   MAIL_FROM_NAME="Emergency page"
   ```

   Every setting the functions read must be there (or in `.env`): the emulator stops to ask for a
   missing one, which `emulators:exec` can't answer.
5. `firebase/functions/.secret.local` (gitignored) containing a placeholder for the Gmail App
   Password, so the emulator doesn't look for the real one in Secret Manager:

   ```
   GMAIL_APP_PASSWORD=emulator-placeholder
   ```

## Run

From `firebase/`, in Git Bash:

```sh
export JAVA_HOME="C:/Users/uie03244/AppData/Local/Temp/claude/f--Projects-Personal-MyPortfolio-Main/61fb1844-7a6f-48a6-9594-3cef1d524fb8/scratchpad/jdk/jdk-21.0.13+9"
# cygpath: PATH entries are split at ':', so "C:/..." would break in two and Java wouldn't be found.
export PATH="$(cygpath -u "$JAVA_HOME")/bin:$PATH"
npx firebase-tools@15 emulators:exec --project demo-emergency --only auth,firestore,functions "node --test test/*.test.mjs"
```

In PowerShell:

```powershell
$env:JAVA_HOME = 'C:/Users/uie03244/AppData/Local/Temp/claude/f--Projects-Personal-MyPortfolio-Main/61fb1844-7a6f-48a6-9594-3cef1d524fb8/scratchpad/jdk/jdk-21.0.13+9'
$env:Path = "$env:JAVA_HOME\bin;$env:Path"
npx firebase-tools@15 emulators:exec --project demo-emergency --only auth,firestore,functions "node --test test/*.test.mjs"
```

That `JAVA_HOME` is the JDK this was set up with; point it at any Java 21+ install. `emulators:exec`
starts the emulators, runs the tests and throws the emulator data away afterwards.

Use `test/*.test.mjs`, not `test/`: Node 22 and later read a bare folder as a file name and fail.
Node expands the pattern itself, so it works from cmd, PowerShell and Git Bash alike.

Other ways to run:

- Emulators already running (`npx firebase-tools@15 emulators:start --project demo-emergency --only auth,firestore,functions`):
  `node --test test/*.test.mjs` from `firebase/`.
- One file: `node --test test/unlock.test.mjs`.
- One at a time, if a slow machine times out: add `--test-concurrency=1`.
- Emulators on other ports: set `FIREBASE_AUTH_EMULATOR_HOST`, `FIRESTORE_EMULATOR_HOST` and
  `FUNCTIONS_EMULATOR_HOST` (each `host:port`). The defaults are 9099, 8080 and 5001 on 127.0.0.1.

## What each file covers

| File | Covers |
| --- | --- |
| `admin.test.mjs` | `claimAdmin` for the listed Google account, another Google account, a password sign-in on the admin's address, a signed-out caller. The admin claim counting only in a Google session, without the refusal costing the real admin the claim. `adminCreateMember`: returned fields (with the tidied email), the `members` and `profiles` docs, the PIN kept in `secrets/` and the temporary password kept nowhere, no email sent, the `created` log (visitor `admin`, no browser), ID tidy-up, PIN length, duplicate ID (`already-exists`), malformed ID |
| `member.test.mjs` | Signing in with the temporary password, read-only until it's changed, weak new passwords, `changeTempPassword` then signing in again (other temporary-password sessions end, the fresh sign-in doesn't), editing your own page (and a responder seeing it), other members' pages, admin functions refused |
| `unlock.test.mjs` | `unlockProfile`: malformed link code or PIN, unknown link, right PIN, tries left, five wrong PINs lock that card while another card still opens |
| `adminActions.test.mjs` | `adminSetDisabled` (scan looks like an unknown link, sign-in fails, and back on without the old sessions), `adminNewLink` (old QR dead), `adminResetPin`, `adminResetPassword` (sessions from before it end at once, a fresh sign-in carries on), what a member's access log shows of the admin |
| `rules.test.mjs` | Firestore rules for `members`, `profiles`, `links`, `secrets` (with `secrets/_visitor`), `pinAttempts`, `accessLogs` and everything else, for the admin, members, a Google account that's neither, and a signed-out browser. The admin claim outside a Google session, and the `members.tokensValidAfter` cutoff to the second |
| `limiter.test.mjs` | The rate limiter from many addresses: IPv6 counted per /64, only the last `X-Forwarded-For` entry counts, one try per visitor while a card is under attack. The logged visitor is a keyed hash of the address, not a plain one |
| `card.test.mjs` | `getCard`: the PIN kept in `secrets/` and replaced by a PIN reset, the whole card for the admin and for the member themself (`card-viewed` log), refused for another member, a stranger, a signed-out browser, a member still on the temporary password, a switched-off member and a cut-off session (to the second). Members from before PINs were kept (`pin: null`). `adminCreateMember`'s optional email; `adminUpdateMember`: email set, tidied, cleared and validated, rename (the page's name only when blank), admin only |
| `email.test.mjs` | Emails through the emulator's `outbox`: creating sends nothing, the welcome (ID, temporary password, sign-in link, card link, attached card, HTML escaping), the password reset (sent on reset when there's an address, not with `email: false` or without one), the new card. Card images that aren't a PNG of up to 1.5 MB, bad temporary passwords and templates, no address on file (`failed-precondition`), admin only. `emailed` logs with no secrets in them |
| `mail.test.mjs` | `functions/mail.js` on its own in production mode, with a stand-in for Gmail: SMTPS to smtp.gmail.com:465 with the App Password, nothing filed in `outbox`, nothing sent without `GMAIL_USER`, failures reported as a short reason with the connection closed, and no message, address or password in the error log. The three templates |

`helpers.mjs` holds the shared setup. It isn't a test file, so the `*.test.mjs` pattern skips it.

## Good to know

- Every test makes its own members with fresh login IDs, so tests don't depend on each other and
  you can rerun against emulators that are still running.
- Every client-SDK call comes from the same address. That's fine because the limiter counts per
  card, and it's what the "other card still opens" test relies on. `limiter.test.mjs` sends raw
  callable requests instead, so it can set `X-Forwarded-For` and play different visitors.
- The Auth emulator accepts a fake Google sign-in: unsigned JSON claims in place of the ID token,
  `GoogleAuthProvider.credential(JSON.stringify({ sub, email, email_verified: true }))`.
- Some token shapes can't come from a real sign-in here: a password session on the admin's address
  (not without changing the admin's account, which every file shares), or a session that signed in
  at a chosen second.
  `forgedActor` makes those by hand (`forgeIdToken`). The emulators don't check signatures, so the
  rules and the functions see exactly those claims. The same files also send a forged token that
  should get through (a Google one, or one from the cutoff's own second) and check it does, so a
  refusal isn't just the forged token being turned away.
- Sign-in times (`auth_time`) and `members.tokensValidAfter` are whole seconds, and a sign-in in the
  cutoff's own second still counts. Tests that need an earlier session cut off call `nextSecond()`
  between that sign-in and the reset, so each of those tests takes about a second longer.
- The Auth emulator doesn't refuse a revoked refresh token, and it stamps every new token with the
  account's latest sign-in time. So these tests never refresh a session they expect to be cut off:
  in the emulator that would let it back in, where real Firebase refuses the refresh.
- Access logs are checked with a short retry, in case a log write lands just after the call returns.
- In the emulator (`FUNCTIONS_EMULATOR=true`) the functions never contact Gmail: each email is
  written to `outbox/` with its recipient, subject, text, HTML and attachment names and sizes, and
  counts as sent. The rules close `outbox/` (and `secrets/`) to every browser, so the tests read them
  through the Firestore emulator's REST API as `Bearer owner` (`ownerGet`, `outbox` in
  `helpers.mjs`), which skips the rules the way the functions' Admin SDK does.
