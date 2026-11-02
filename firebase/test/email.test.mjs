/**
 * Member emails through the emulator: it never contacts Gmail, it files every message in outbox/
 * instead, and these tests read it there (ownerGet/outbox in helpers.mjs). Welcome, password reset
 * and new card, what each carries, and when nothing is sent at all.
 */
import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import {
  createMember,
  deleteActors,
  GMAIL_USER,
  logEntries,
  newActor,
  newAdmin,
  outbox,
  PAGE_URL,
  readyMember,
  rejectsWith,
  signInMember,
  TEMP_PASSWORD_PATTERN,
  TINY_PNG,
  TINY_PNG_URL,
  uniqueEmail,
} from './helpers.mjs';

let admin;
before(async () => {
  admin = await newAdmin();
});
after(deleteActors);

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const CARD_MAX_BYTES = 1.5 * 1024 * 1024;
/** A "PNG" of exactly `size` bytes: the signature, then zeros. Only the start is checked. */
const pngOfSize = (size) => Buffer.concat([PNG_SIGNATURE, Buffer.alloc(size - PNG_SIGNATURE.length)]).toString('base64');

const emailMember = (uid, template, extra) => admin.call('adminEmailMember', { uid, template, ...extra });
const cardLink = (code) => `${PAGE_URL}?id=${code}`;

test('creating a member sends nothing by itself, even with an email address', async () => {
  const m = await createMember(admin, { email: uniqueEmail() });
  assert.deepEqual(await outbox(m.uid), []);
  assert.deepEqual(await logEntries(admin, m.uid, 'emailed'), []);
});

test('the welcome email carries the ID, the temporary password, the sign-in link and the card', async () => {
  const email = uniqueEmail();
  const m = await createMember(admin, { name: 'Asha <Welcome>', email });
  const result = await emailMember(m.uid, 'welcome', { tempPassword: m.tempPassword, cardPng: TINY_PNG_URL });
  assert.deepEqual(result, { sent: true, to: email });

  const [mail, ...more] = await outbox(m.uid);
  assert.equal(more.length, 0, 'more than one email');
  assert.equal(mail.template, 'welcome');
  assert.equal(mail.to, email);
  assert.equal(mail.from, `"Emergency page" <${GMAIL_USER}>`);
  assert.equal(mail.subject, 'Your emergency page is ready');
  for (const body of [mail.text, mail.html]) {
    assert.ok(body.includes(m.loginId), 'ID missing');
    assert.ok(body.includes(m.tempPassword), 'temporary password missing');
    assert.ok(body.includes(PAGE_URL), 'sign-in link missing');
    assert.ok(body.includes(cardLink(m.linkCode)), 'card link missing');
    assert.ok(body.includes(`emergency-card-${m.loginId}.png`), 'card line missing');
    assert.ok(body.includes('call 112'), '112 line missing');
    // The card's PIN is on the image only.
    assert.ok(!body.includes(m.pin), 'PIN in the body');
  }
  assert.match(mail.text, /choose your own password the first time/);
  // The name is the admin's typing: escaped in the HTML.
  assert.ok(mail.html.includes('Asha &lt;Welcome&gt;'), 'name not escaped');
  assert.ok(!mail.html.includes('<Welcome>'), 'raw name in the HTML');
  assert.deepEqual(mail.attachments, [
    { filename: `emergency-card-${m.loginId}.png`, contentType: 'image/png', size: Buffer.from(TINY_PNG, 'base64').length },
  ]);

  // Logged by name only, and the password still works (emailing it didn't change it).
  const [entry] = await logEntries(admin, m.uid, 'emailed');
  assert.equal(entry.detail, 'welcome');
  assert.equal(entry.visitor, 'admin');
  assert.equal(entry.userAgent, '');
  assert.ok(!JSON.stringify(entry).includes(m.tempPassword), 'temporary password in the access log');
  await signInMember(newActor('member'), m.loginId, m.tempPassword);
});

test('a welcome without a card has no attachment and no card line, but still the card link', async () => {
  const m = await createMember(admin, { email: uniqueEmail() });
  // An empty card means none.
  assert.equal((await emailMember(m.uid, 'welcome', { tempPassword: m.tempPassword, cardPng: '' })).sent, true);
  const [mail] = await outbox(m.uid);
  assert.deepEqual(mail.attachments, []);
  assert.ok(!mail.text.includes('attached'), 'card line without a card');
  assert.ok(mail.text.includes(cardLink(m.linkCode)), 'card link missing');
  assert.ok(mail.text.includes(m.tempPassword));
});

test('a password reset emails the new temporary password when the member has an address', async () => {
  const email = uniqueEmail();
  const m = await readyMember(admin, { email });
  const { tempPassword, emailed } = await admin.call('adminResetPassword', { uid: m.uid });
  assert.match(tempPassword, TEMP_PASSWORD_PATTERN);
  assert.deepEqual(emailed, { sent: true, to: email });

  const [mail, ...more] = await outbox(m.uid);
  assert.equal(more.length, 0, 'more than one email');
  assert.equal(mail.template, 'password-reset');
  assert.equal(mail.to, email);
  assert.equal(mail.subject, 'Your emergency page password was reset');
  for (const body of [mail.text, mail.html]) {
    assert.ok(body.includes(m.loginId), 'ID missing');
    assert.ok(body.includes(tempPassword), 'temporary password missing');
    assert.ok(body.includes(PAGE_URL), 'sign-in link missing');
  }
  assert.deepEqual(mail.attachments, []);
  assert.equal((await logEntries(admin, m.uid, 'emailed'))[0].detail, 'password-reset');
  await signInMember(newActor('member'), m.loginId, tempPassword);
});

test('a password reset sends nothing with email: false, or when there’s no address', async () => {
  const withEmail = await readyMember(admin, { email: uniqueEmail() });
  const quiet = await admin.call('adminResetPassword', { uid: withEmail.uid, email: false });
  assert.equal(quiet.emailed, null);
  assert.match(quiet.tempPassword, TEMP_PASSWORD_PATTERN);

  const noEmail = await readyMember(admin);
  const reset = await admin.call('adminResetPassword', { uid: noEmail.uid });
  assert.equal(reset.emailed, null);
  // An explicit yes still finds no address.
  assert.equal((await admin.call('adminResetPassword', { uid: noEmail.uid, email: true })).emailed, null);

  await rejectsWith(admin.call('adminResetPassword', { uid: withEmail.uid, email: 'yes' }), 'functions/invalid-argument');
  assert.deepEqual(await outbox(withEmail.uid), []);
  assert.deepEqual(await outbox(noEmail.uid), []);
  assert.deepEqual(await logEntries(admin, withEmail.uid, 'emailed'), []);
});

test('the new card goes out after a PIN reset or a new link, and says the old card is done', async () => {
  const email = uniqueEmail();
  const m = await createMember(admin, { email });
  await admin.call('adminResetPin', { uid: m.uid, pinLength: 6 });
  const { linkCode } = await admin.call('adminNewLink', { uid: m.uid });
  assert.deepEqual(await emailMember(m.uid, 'card', { cardPng: TINY_PNG }), { sent: true, to: email });

  const [mail] = await outbox(m.uid);
  assert.equal(mail.template, 'card');
  assert.equal(mail.subject, 'Your emergency card has changed');
  for (const body of [mail.text, mail.html]) {
    assert.ok(body.includes('the old card no longer works'), 'old-card line missing');
    assert.ok(body.includes(cardLink(linkCode)), 'new card link missing');
    assert.ok(!body.includes(cardLink(m.linkCode)), 'old card link in the email');
  }
  assert.equal(mail.attachments.length, 1);
  assert.equal(mail.attachments[0].filename, `emergency-card-${m.loginId}.png`);
  assert.equal((await logEntries(admin, m.uid, 'emailed'))[0].detail, 'card');
});

test('a card image that isn’t a PNG of up to 1.5 MB is refused, and nothing is sent', async () => {
  const m = await createMember(admin, { email: uniqueEmail() });
  const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0x10, 0x4a, 0x46, 0x49, 0x46, 0, 1]).toString('base64');
  const bad = [
    undefined,
    '',
    42,
    'not base64 at all!',
    jpeg,
    `data:image/jpeg;base64,${TINY_PNG}`,
    `data:image/png;base64,${jpeg}`,
    PNG_SIGNATURE.toString('base64'), // the signature and nothing else
    pngOfSize(CARD_MAX_BYTES + 1),
  ];
  for (const cardPng of bad) {
    await rejectsWith(emailMember(m.uid, 'card', { cardPng }), 'functions/invalid-argument');
  }
  // Given, a welcome's card is checked the same way.
  await rejectsWith(emailMember(m.uid, 'welcome', { tempPassword: m.tempPassword, cardPng: jpeg }), 'functions/invalid-argument');
  assert.deepEqual(await outbox(m.uid), []);

  // Exactly the limit is fine.
  assert.equal((await emailMember(m.uid, 'card', { cardPng: pngOfSize(CARD_MAX_BYTES) })).sent, true);
  assert.equal((await outbox(m.uid))[0].attachments[0].size, CARD_MAX_BYTES);
});

test('the welcome needs the temporary password in its own format, and only two emails go by hand', async () => {
  const m = await createMember(admin, { email: uniqueEmail() });
  for (const tempPassword of [undefined, '', 'short', `${m.tempPassword}x`, 'O0O0O0O0O0O0', 'has space 12', 123456789012]) {
    await rejectsWith(emailMember(m.uid, 'welcome', { tempPassword }), 'functions/invalid-argument');
  }
  for (const template of [undefined, '', 'password-reset', 'Welcome', 'spam']) {
    await rejectsWith(emailMember(m.uid, template, { tempPassword: m.tempPassword, cardPng: TINY_PNG }), 'functions/invalid-argument');
  }
  assert.deepEqual(await outbox(m.uid), []);
});

test('emailing a member with no address on file is refused', async () => {
  const m = await createMember(admin);
  await rejectsWith(
    emailMember(m.uid, 'welcome', { tempPassword: m.tempPassword }),
    'functions/failed-precondition',
    'This member has no email address.',
  );
  await rejectsWith(emailMember(m.uid, 'card', { cardPng: TINY_PNG }), 'functions/failed-precondition');
  await rejectsWith(emailMember('NoSuchMember123', 'card', { cardPng: TINY_PNG }), 'functions/not-found');
  assert.deepEqual(await outbox(m.uid), []);
  assert.deepEqual(await logEntries(admin, m.uid, 'email-failed'), []);
});

test('only the admin sends email', async () => {
  const m = await readyMember(admin, { email: uniqueEmail() });
  await rejectsWith(m.actor.call('adminEmailMember', { uid: m.uid, template: 'card', cardPng: TINY_PNG }), 'functions/permission-denied');
  const responder = newActor('responder', { account: false });
  await rejectsWith(responder.call('adminEmailMember', { uid: m.uid, template: 'card', cardPng: TINY_PNG }), [
    'functions/permission-denied',
    'functions/unauthenticated',
  ]);
  assert.deepEqual(await outbox(m.uid), []);
});
