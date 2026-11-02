# Emergency page

A PIN-protected emergency page at **https://sivashanmugavadivel.in/emergency**, for you and the people you make cards for. Each member carries a QR card or NFC tag with their own link and PIN. Someone scans it, enters the PIN, and sees that member's medical info, contacts, a live map of nearby help, first-aid steps, vehicles and about-me details. You (the admin) sign in with Google to make members; each member signs in with an ID and password to keep their own page.

## How access works

| Who | How they get in | What they can do |
| --- | --- | --- |
| Anyone with a card link | Nothing | Call 112 / 108 from the locked screen. Nothing personal is shown. |
| Responder (helper, paramedic, family) | Scans the card (`/emergency?id=<link code>`), enters the PIN printed on it, taps **Unlock** | Read that one member's page. Nothing is saved on their phone; **Lock** or a refresh clears it. |
| Member | `/emergency` → ID and password from the admin (by email, or handed over), then their own password | View, edit and preview their own page; under **My card** see their PIN and download their QR code or the card with the PIN; write an NFC tag; see who opened it; change their password. Not the PIN: only the admin sets PINs. |
| You (admin) | `/emergency` → **Admin? Sign in with Google**, with an address on `ADMIN_EMAILS` | Make members (ID, temporary password, PIN, card link, optional email), see any member's **Card details** again (ID, PIN, link, QR, card), email members their welcome and their card, edit their email, reset passwords and PINs, make a new link, switch a member off or on, delete a member for good, open and edit any page, see any access log. |

Why it's built this way:

- **The PIN is checked on the server, never in the browser.** A Cloud Function (`unlockProfile`) compares it with a salted scrypt hash and returns the profile only on a match. Next to the hash, in the same Firestore collection (`secrets/`, which no browser can read), the server keeps the PIN itself, so that the admin (**Card details**) and the member (**My card**) can see it again through the `getCard` function. Only the admin and that member, once they've chosen their own password, can get it. It's printed on the card anyway, so this exposes nothing a card doesn't.
- **Temporary passwords are never stored.** The admin sees each one once, when the member is made or the password reset, and the page can email it to the member. After that it exists only in that email and on the admin's screen until **Done**. A copy of each email also lands in the sending Gmail's **Sent** folder, so keep that account well protected.
- **Pages are locked by Firestore rules**: a member can read and write only their own, and only after replacing the temporary password; the admin can read all of them and write any current member's (so an editor left open on someone just deleted can't put their page back). Responders only ever receive a page through the function.
- **Old sessions end straight away** when the admin resets a member's password or switches them off, and when a member chooses or changes their own password: every device signed in before that loses access to the page at once, not when its sign-in token runs out an hour later.
- **A scan never loads sign-in code.** The card link opens the keypad with only Firebase's app, App Check and Functions code; Auth and Firestore come with the sign-in page, loaded only at `/emergency`.
- **Guessing is rate-limited per card.** 5 wrong PINs from one visitor (one IPv4 address, or one IPv6 /64) locks that visitor out of that card for 15 minutes. Across everyone, 60 wrong PINs on one card within an hour trips a lock on that card for 30–60 minutes; right PINs never count, and other cards aren't affected. While a card is locked, each visitor still gets **one try every 15 minutes**, so someone else's guessing can't keep a paramedic with the printed PIN out. The trade-off: those tries have no overall cap. Someone who has a card's link (not its PIN) and many addresses gets one guess per address every 15 minutes. An IPv6 /48, free from tunnel brokers, is 65,536 /64s: about 2 hours to find a 6-digit PIN, and a 4-digit one inside the first 15 minutes. The limiter doesn't stop that; App Check does, so turn it on before you hand out cards (see **Hardening**).
- **Every unlock, lockout and admin change is logged** per member, so a member sees under **Who opened my page** (and the admin under **Access log**) if their page has been opened. So is each look at the card (by the admin or the member) and each email sent or failed; the log says which email, never what was in it.
- **Emails go through Gmail from your own account** (an App Password, kept in Secret Manager), so there's no mail service to sign up for. If sending fails, the admin panel says why and still shows everything on screen.
- **A switched-off member's card looks like an unknown link**, and a new link makes the old QR code stop working, so a lost card can be retired.
- **Deleting a member can't be undone.** **Delete member** removes everything stored about them, nothing is kept to restore it from, and their printed card then answers like an unknown link. Switch a member off instead if they might come back.
- **It keeps working when parts fail.** `emergency.html` shows 112 / 108 call links before any JavaScript loads. Each section is isolated, so a broken map can't take the medical info with it. If Google Maps doesn't load, the section falls back to "Search in Google Maps" links.

> **About the PIN in a real emergency:** whoever finds a member needs the PIN. Print it next to the QR code (**Download card with PIN** does this), or share it with family. The PIN mainly protects members from people who come across a link online. The page also tells search engines not to index it.

## Where things are

```
emergency.html               the QR / NFC landing page: its own Vite entry, so it skips the
                             portfolio's bundle, fonts and analytics. GitHub Pages serves it at /emergency
src/emergency/
  main.jsx                   mounts the page for emergency.html
  EmergencyPage.jsx          a card link → keypad → read-only page; otherwise the sign-in page (lazy);
                             also the "link isn't valid" and "not set up" screens
  emergency.css              all styles, scoped under .em-root (and shielded from the portfolio's)
  config.js                  settings read from .env (PIN length, page URL, Maps keys, region),
                             login ID and link code rules, the password check
  firebase.js                Firebase app, App Check and Functions: all a scan loads; demo mode, emulators
  firebaseAccount.js         Auth and Firestore, for the sign-in side only
  scanApi.js                 unlockByLink: the responder's PIN check
  accountApi.js              sign-in, passwords, pages, access logs and the admin's actions
  apiErrors.js               Firebase errors → short messages
  demoStore.js               in-memory stand-in for both APIs, dev server only
  account/                   the sign-in side, one lazily loaded chunk:
    AccountPage.jsx          picks the screen: sign-in, choose a password, member home or admin panel
    LoginForm.jsx, ChangePasswordForm.jsx, MemberHome.jsx, AdminPanel.jsx
    MemberCredentials.jsx    the result after making or resetting: ID, temporary password, PIN, link,
                             QR, and how the email went
    CardDetails.jsx          Card details (admin) and My card (member): PIN, link, QR, card with the PIN
    mail.js, MailStatus.jsx  drawing and emailing the welcome and the card; the "Emailed to …" line
    LinkQr.jsx, qr.js        QR code PNG, card with the PIN, copy link, NFC
    AccessLog.jsx, ProfilePages.jsx, Layout.jsx, CopyButton.jsx, useLoad.js
  nearby.js                  Google Maps loader and the Places nearby search
  sampleData.js              demo data (fake numbers) and the blank template the editor starts from
  firstAidData.js            first-aid steps
  editorSchema.js            fields in the owner editor
  hooks.js, utils.js
  components/
    PinGate.jsx              locked screen with keypad and "Is this your card? Sign in"
    EmergencyView.jsx        the 8 sections, each in a SectionBoundary
    ProfileHeader.jsx        1  Profile and critical info
    EmergencyActions.jsx     2  Emergency numbers, call contact, share location, SOS text
    MedicalInfo.jsx          3  Medical info
    EmergencyContacts.jsx    4  Contacts with call / text / WhatsApp
    NearbyHelp.jsx           5  Google map and nearby services, with Google Maps links as fallback
    FirstAid.jsx             6  First-aid guidance (+ firstaid/: one animated scene per step)
    VehicleInfo.jsx          7  Vehicles
    AboutMe.jsx              8  About me
    TopBar.jsx               Lock / Back for responders; Edit and a Menu for members and the admin
    OwnerEditor.jsx          the edit form (fields from editorSchema.js)
firebase/
  firebase.json              rules, indexes, functions and the emulator ports
  firestore.rules            who may read and write what
  firestore.indexes.json     the access-log index and the pinAttempts clean-up (TTL)
  functions/index.js         Cloud Functions (Node.js 22): unlockProfile, claimAdmin, changeTempPassword,
                             passwordChanged, getCard, adminCreateMember, adminResetPassword, adminResetPin,
                             adminNewLink, adminSetDisabled, adminEmailMember, adminUpdateMember,
                             adminDeleteMember
  functions/mail.js          the three emails (welcome, password reset, new card) and sending them through Gmail
  functions/.env.example     ADMIN_EMAILS, GMAIL_USER, MAIL_FROM_NAME, and how to set the App Password secret
  test/                      integration tests against the emulators (see test/README.md)
.env.example                 every setting, with notes
```

`src/App.jsx` also serves the page at `/emergency/` (trailing slash, and the dev server) without the portfolio's navbar, intro or cursor. A card's short link `/emergency/<code>` works too: on GitHub Pages `public/404.html` sends it on to `/emergency?id=<code>`.

## Running it locally

```bash
pnpm dev
```

Open http://localhost:5173/emergency. With the Firebase values empty, the dev server runs **demo mode** with test data, kept in memory until you refresh:

- Sign in as a member with ID `demo` and password `demo1234`, or tap **Admin? Sign in with Google** to try the admin panel without Google.
- The responder view is http://localhost:5173/emergency?id=testcard23 with PIN `123456`.
- Demo mode sends no email; it only says it did. An address ending in `@fail.test` always fails, to show the error and **Try again**. Member `meera` (password `meera1234`) is an older account with no email and no PIN on file.

Demo mode never ships: a production build without the Firebase values shows "This emergency page isn't set up yet" with only the call buttons, and the build log warns about it.

Settings go in `.env.local` (gitignored). `.env.example` lists them all.

### Against the Firebase emulators

To try the real functions and rules without touching your project. The Firestore emulator needs Java 21 or newer.

1. `cd firebase/functions && npm install`, and create two files there (both gitignored):
   - `.env.local`, with every setting from `.env.example`, or the emulator stops to ask for the missing ones:
     ```
     ADMIN_EMAILS=admin@example.com
     GMAIL_USER=gmail-user@example.com
     MAIL_FROM_NAME="Emergency page"
     ```
   - `.secret.local`, with a stand-in for the App Password: `GMAIL_APP_PASSWORD=emulator-placeholder`.

   The emulator never sends email: each message is saved to the `outbox` collection in the Firestore emulator instead, with its attachment's name and size.
2. From `firebase/`: `npx firebase-tools@15 emulators:start --project demo-emergency --only auth,firestore,functions`
3. Create `.env.development.local` at the repo root (gitignored):
   ```
   VITE_FIREBASE_EMULATORS=1
   VITE_FIREBASE_PROJECT_ID=demo-emergency
   VITE_FIREBASE_API_KEY=demo-key
   VITE_FIREBASE_AUTH_DOMAIN=localhost
   ```
4. `pnpm dev`, open `/emergency` and use **Admin? Sign in with Google**: the emulator's window lets you add an account; use `admin@example.com`. Then make a member and try their card.

The integration tests run the same way, from `firebase/`:

```bash
npx firebase-tools@15 emulators:exec --project demo-emergency --only auth,firestore,functions "node --test test/*.test.mjs"
```

(`test/*.test.mjs`, not `test/`: Node 22 and later read a bare folder as a file name.)

## Setting it up

### 1. Firebase

1. **Create a project** at console.firebase.google.com and add a **Web app**. Copy its config values into `.env.local`.
2. **Authentication → Sign-in method:** enable **Google** (you, the admin) only. **Email/Password** (members) comes in step 7, after your first sign-in. Under **Settings → Authorized domains**, add `sivashanmugavadivel.in` (localhost is there already).
3. **Firestore Database → Create database** in production mode, region `asia-south1` (Mumbai), the same as the functions.
4. **Upgrade to the Blaze plan.** Cloud Functions need a billing account. A few personal pages stay inside the free allowance (see **Costs**).
5. **Name the admin and the email sender:** copy `firebase/functions/.env.example` to `firebase/functions/.env` (gitignored) and set:
   - `ADMIN_EMAILS`: your Google address (several, comma-separated, are fine; capital letters don't matter).
   - `GMAIL_USER`: the Gmail address member emails come from, normally your own. Leave it empty and nothing is ever sent: the admin panel says email isn't set up and shows everything on screen instead.
   - `MAIL_FROM_NAME`: the sender name members see, like `"Emergency page"`.

   They stay out of the public repo. If one is missing at deploy time, the CLI asks for it and saves it to `.env.<project-id>`, which is gitignored too (a deploy that can't ask, such as one from CI, fails instead).

   **A Gmail App Password**, which lets the functions send as `GMAIL_USER`. It's a secret, so it goes in Google Secret Manager (step 6), never in a file:
   1. Turn on **2-Step Verification** for that Google account (myaccount.google.com → **Security**). Google offers App Passwords only with it on.
   2. Open https://myaccount.google.com/apppasswords, type a name such as `Emergency page` and tap **Create**. Google shows a 16-letter password once; keep it for step 6.
6. **Store the App Password, then deploy the rules, indexes and functions** with a current `firebase-tools` (Google retired Node.js 20 on 2026-10-30; these run on Node.js 22):
   ```bash
   npm install -g firebase-tools
   firebase login
   cd firebase
   firebase use --add              # pick your project
   cd functions && npm install && cd ..
   firebase functions:secrets:set GMAIL_APP_PASSWORD   # paste it, with or without its spaces
   firebase deploy --only firestore,functions
   ```
   (`npx firebase-tools@15` in place of `firebase` works the same, without the global install.) The first time, `secrets:set` may offer to enable the Secret Manager API: say yes. The deploy refuses the functions that send email until the secret exists, so even if you leave `GMAIL_USER` empty, set it to any placeholder text. A new value reaches the functions only when they're deployed again, so redeploy after changing it (the CLI offers to). Changing that Google account's password revokes its App Passwords: emails then fail with "Gmail didn’t accept the app password" until you create a new one, set it again and redeploy.

   The deploy also creates the access-log index and the clean-up (TTL) policy for old rate-limit records. If the CLI offers a cleanup policy for old function images, say yes. If it offers to delete the old `setPin` function (from the single-owner version), say yes. If the project already has Firestore rules, merge the `match` blocks instead of overwriting.
7. **Right after your first admin sign-in** (step 4.1 below), in this order:
   1. Authentication → Settings → User actions → turn off **Enable create (sign-up)**. Then only the admin panel can make accounts. Not before your first Google sign-in, which it would block too.
   2. Authentication → Sign-in method → enable **Email/Password** for members.

   Both are required. With sign-up on, anyone can register an address before you use it: a member ID you're about to hand out (adding that member then fails with "That ID is taken"), or your own Google address before your first sign-in, which then joins their account. The admin panel and the rules accept only a Google session, so that second case gets them nothing, but it still leaves a stranger's sign-in on your account. If Email/Password was already on before your first sign-in, check Authentication → Users first: your address should have no account yet, or only one whose provider is Google.

### 2. Google Maps

The map and the list of nearby places use Google Maps Platform, which needs a billing account (the same one as Firebase). Without a key, **Nearby help** shows only the "Search in Google Maps" buttons, which need nothing.

1. In the Google Cloud console, open the **same project as Firebase** and enable **Maps JavaScript API** and **Places API (New)**.
2. **Keys & Credentials → Create credentials → API key.** Under *Application restrictions* pick **Websites** and add `https://sivashanmugavadivel.in/*`, `http://localhost:5173/*` and `http://localhost:4173/*` (for `pnpm preview`). Under *API restrictions* allow only those two APIs.
3. **Map management → Create map ID**: type JavaScript, **Vector**. Map IDs are free.
4. Put both in `.env.local` as `VITE_GOOGLE_MAPS_API_KEY` and `VITE_GOOGLE_MAPS_MAP_ID`.
5. **Cap it so it can never bill** (APIs & Services → each API → Quotas): Places API (New) *SearchNearby requests per day* **200**, Maps JavaScript API *map loads per day* **300**. If your billing account isn't on India pricing, use **30** for SearchNearby. When a cap is reached the section falls back to the Google Maps buttons.

The key ships in the page like every `VITE_` setting. That's how Maps keys work: the website restriction and the quotas protect it.

### 3. The live site

GitHub Actions builds the site, and `.env.local` never reaches it. Add each setting from `.env.example` that you use as a **repository variable** (Settings → Secrets and variables → Actions → **Variables**): the six `VITE_FIREBASE_…` values, `VITE_FIREBASE_FUNCTIONS_REGION`, `VITE_EMERGENCY_PIN_LENGTH`, `VITE_GOOGLE_MAPS_API_KEY`, `VITE_GOOGLE_MAPS_MAP_ID`, and later `VITE_RECAPTCHA_SITE_KEY`. They're public web config, not secrets. `deploy.yml` writes the ones that are set into the build.

Push, then open https://sivashanmugavadivel.in/emergency and check it shows the sign-in page. If it says "isn't set up yet", a Firebase variable is missing; the Actions build log says which.

### 4. Members and their cards

1. Open `/emergency` and tap **Admin? Sign in with Google** with the address from `ADMIN_EMAILS`. The first time, finish step 7 of **Firebase** before adding anyone.
2. Under **Add a member**, enter the ID they'll sign in with (like `ravi`), their name and, if you have it, their email. The result shows their **ID, temporary password, PIN and card link**, with the QR code, **Download QR** and **Download card with PIN** (a printable card with the QR code and the PIN). PINs have `VITE_EMERGENCY_PIN_LENGTH` digits (6 by default).
   - **With an email**, the page draws their card and emails them the welcome: their ID, the temporary password, the sign-in link, the card as `emergency-card-<ID>.png` and its link. The result says "Emailed … to …", or why it didn't go, with **Try again**. Once it has gone, **Done** closes the result without asking.
   - **Without one** (or if the email failed), the temporary password exists only on your screen: **Copy all** and pass it on yourself. **Done**, **Sign out** and closing the tab ask first, because it can't be shown again; you'd have to reset it.
3. At their first sign-in the member chooses their own password, then fills in their page. Under **My card** they see their PIN and can download their QR code and card. Make yourself a member the same way for your own card.
4. Each card link looks like `https://sivashanmugavadivel.in/emergency?id=<code>` (set `VITE_EMERGENCY_PAGE_URL` only if the address changes). **Test-scan the QR code with another phone**, then print it on a card, sticker, phone case or helmet with the PIN. On Android Chrome a member can write an NFC tag from **My card**; otherwise write the link as a URL record with an app like NFC Tools.
5. Later, for each member:
   - **Card details** shows their ID, email, PIN, card link and QR code again, with **Download card with PIN** and, when they have an email, **Email card to member**.
   - Under **Manage**: **Edit email** (empty removes it, and they get no more emails), **Reset password** (every device they're signed in on is signed out at once and they choose a new password at next sign-in; with an email on file, the new temporary password is emailed to them), **Reset PIN** and **New link** (the old card stops working; the result offers **Email the new card**), **Switch off / on**, **Access log**, **Download QR**, **Delete member**. **Open profile** shows and edits their page.
   - **Delete member** deletes a member permanently. Type their ID to confirm, then **Delete permanently**. It can't be undone. It removes:
     - their sign-in account (Firebase Authentication), so the ID and password stop working;
     - their record (`members/`: ID, name, email, status) and their page (`profiles/`);
     - their card link (`links/`), so the printed card or NFC tag says the link isn't active, and their PIN (the hash and the stored PIN, `secrets/`);
     - their PIN-try counters (`pinAttempts/`) and their whole access log (`accessLogs/`).

     The deletion itself isn't logged in any access log; only a line with their uid and ID goes into the Cloud Functions log. It doesn't reach emails already sent (their inbox, and your Gmail's **Sent** folder) or anyone else's data. To have them back, add them again: they get a new card link, PIN and password. If it stops part-way (a dropped connection), the member stays in the list: press **Delete permanently** again and it clears what's left.

Gmail lets a personal account send about 500 emails a day, far more than this needs. Emails come from `GMAIL_USER` and show in its **Sent** folder. Their links, and the QR code on the attached card, always open the live site, even when you send them from `pnpm dev`.

Location features need https (localhost is fine for testing).

### Adding email and Card details to a page that's already running

The version before this one showed PINs and temporary passwords once and sent no email. To update:

1. In `firebase/functions/.env`, add `GMAIL_USER` and `MAIL_FROM_NAME` next to `ADMIN_EMAILS` (step 5 of **Firebase**).
2. Turn on 2-Step Verification for that Gmail and create an App Password at https://myaccount.google.com/apppasswords (also step 5).
3. From `firebase/`, store the App Password, then deploy the rules and functions. This adds `getCard`, `adminEmailMember` and `adminUpdateMember`:
   ```bash
   npx firebase-tools@15 functions:secrets:set GMAIL_APP_PASSWORD
   npx firebase-tools@15 deploy --only firestore,functions
   ```
4. Push the site, so the admin panel gets the new screens.
5. Check it: give yourself an email with **Edit email**, then **Card details → Email card to member**. The email should arrive within a minute.

Members made before this have no email on file (add one with **Edit email**), and their **Card details** say "PIN not on file": the server only ever had a hash of their PIN. Their card keeps working. To see a PIN there, **Reset PIN**, which also means a new card for them (**Email the new card**, or print it).

### Adding Delete member to a page that's already running

The site's GitHub deploy doesn't touch Firebase, so deploy the new function and the rules first. From `firebase/`:

```bash
npx firebase-tools@15 deploy --only firestore,functions
```

This adds `adminDeleteMember`, and a rule that the admin can write a page only for a current member. Then push the site, so the admin panel gets **Delete member**. Until the function is deployed, **Delete member** only shows an error and deletes nothing.

### Moving from the single-owner version

Earlier versions kept one page in `emergencyProfiles/main`. Nothing is moved over: make yourself a member (step 4), fill in your page and print your new card, since the old QR link without `?id=` now opens the sign-in page. Then delete the old `emergencyProfiles`, `emergencySecrets` and `emergencyMeta` collections in the Firebase console.

## Hardening

- **App Check** (do this before you hand out cards): blocks scripted calls, which is what closes the rate-limit trade-off above. In this order, or every visitor gets refused:
  1. Create a reCAPTCHA Enterprise key for `sivashanmugavadivel.in` (add `localhost` only if you want it on the dev server).
  2. Firebase console → **App Check**: register the web app with that key.
  3. Set `VITE_RECAPTCHA_SITE_KEY` (repository variable) and redeploy the site. Check the PIN unlock, member sign-in and admin sign-in still work.
  4. Only then set `ENFORCE_APP_CHECK = true` in `firebase/functions/index.js` and redeploy the functions. It applies to every function, the admin's and members' included.
- **Removing an admin** takes both steps: take the address off `ADMIN_EMAILS` and redeploy the functions, **and** delete (or disable) that account in Authentication → Users. The list alone isn't enough. The functions drop the admin claim only when that person next calls one (adding a member, a reset, a new link, switching someone off). The panel reads members, pages and access logs straight from Firestore, whose rules go by the claim, so until then they can still read and edit every page.
- **Longer PIN:** set `VITE_EMERGENCY_PIN_LENGTH=8` locally and as a repository variable and redeploy. New members get 8 digits; **Reset PIN** gives an existing member one, then reprint their card. Until then the old PIN still works: the keypad accepts any 4–8 digits.

## Customising

- **Emergency numbers** are data: change them in the editor (**Emergency numbers** tab). In "Get help now" each is drawn as what it sends (`components/ServiceButton.jsx`): an emergency beacon for 112, an ambulance for 108, a police SUV for 100 and a fire engine for 101, chosen by the service's name (or, failing that, its number). Anything else, such as a helpline you add, shows as a plain tile. The first one becomes the red call button at the bottom and the number the first-aid steps tell people to call, so keep your main emergency number first. The two numbers on the locked screen are `PUBLIC_NUMBERS` in `config.js`; the same two are hard-coded in `emergency.html` and the `/emergency/` loading screen in `App.jsx`, which show before the page's code loads.
- **First-aid content** is in `firstAidData.js`. Write `{number}` for the emergency number. Each topic has 5 steps and each step has its own animated scene, matched by position, in `components/firstaid/<topic>.jsx` (shared drawing parts in `kit.jsx` and `people.jsx`). If you add, remove or reorder steps, change the scenes to match.
- **Editor fields** come from `editorSchema.js`. Add a field there and it appears in the editor; then show it in the matching section component.
- **Colours** are CSS variables at the top of `emergency.css`. The page follows the phone's light/dark setting, not the portfolio's theme toggle. Fonts (Atkinson Hyperlegible, designed for low-vision readability, and Barlow Condensed for numbers) are loaded by `emergency.html` and `EmergencyPage`, without holding up the first paint.
- **Portfolio styles:** `emergency.css` cancels the portfolio's bare `h1`–`h4`, `p` and `a` rules inside the page. If `src/index.css` gains new bare element rules, add them to that reset at the top of the Base section.
- **Photo:** paste a link to an image in the Profile tab. To upload instead, add Firebase Storage and store the download URL in `profile.photoUrl`.

## Costs

| Part | Cost |
| --- | --- |
| GitHub Pages | Free |
| Firebase (Blaze plan) | Free allowance: 2 million function calls a month, 50,000 Firestore reads a day. Stored function images may cost a few cents a month. |
| Google Maps (map + nearby places) | Free each month up to 10,000 map loads and 1,000 place searches with phone numbers (India billing accounts: 70,000 and 7,000). Each page open is 1 map load + 4 searches. The quota caps above keep it inside. See [pricing](https://developers.google.com/maps/billing-and-pricing/pricing) and the [India price list](https://developers.google.com/maps/billing-and-pricing/pricing-india). |
| "Search in Google Maps" buttons, directions links | Free, no key |
| App Check (reCAPTCHA Enterprise) | Free up to 10,000 checks a month |
| Emails (Gmail SMTP) | Free, within Gmail's daily sending limit |
| Secret Manager (the App Password) | Free: one secret is well inside the 6 secret versions and 10,000 reads a month that cost nothing |

## Medical content

The first-aid steps are short reminders for a stranger, not training. They were checked against current lay-rescuer guidance in November 2026 (Resuscitation Council UK / ERC 2025, AHA and American Red Cross first aid 2024): call first for anyone unresponsive and send for an AED if there is one; check breathing after a seizure and start CPR if it isn't normal; a tourniquet as soon as pressure fails on a limb; for electrical burns, power off before touching and stay at least 20 metres from fallen power lines. They have **not** been reviewed by a clinician: have a qualified first-aid trainer read them, and keep your own medical details current. "Details last updated" at the bottom of the page shows responders how fresh they are.
