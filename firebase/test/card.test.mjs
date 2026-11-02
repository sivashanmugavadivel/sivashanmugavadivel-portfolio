/**
 * The card details again (getCard): the PIN kept next to its hash, who may see it, and the
 * admin's edits to a member's email address and name (adminUpdateMember).
 */
import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import {
  createMember,
  deleteActors,
  forgedActor,
  getMember,
  getProfile,
  LINK_CODE_PATTERN,
  loginEmail,
  logEntries,
  newActor,
  newAdmin,
  nextSecond,
  outbox,
  ownerDeleteField,
  ownerGet,
  readyMember,
  rejectsWith,
  saveProfile,
  signInGoogle,
  signInMember,
  uniqueEmail,
  uniqueLoginId,
} from './helpers.mjs';

let admin;
before(async () => {
  admin = await newAdmin();
});
after(deleteActors);

const getCard = (actor, uid) => actor.call('getCard', { uid });
const unlock = (id, pin) => newActor('responder', { account: false }).call('unlockProfile', { id, pin });

test('the PIN is kept next to its hash, and getCard shows the admin the whole card', async () => {
  const email = uniqueEmail();
  const m = await createMember(admin, { name: 'Card Holder', email });
  const secret = await ownerGet(`secrets/${m.uid}`);
  assert.equal(secret.pin, m.pin);
  assert.match(secret.hash, /^[0-9a-f]{128}$/);
  assert.match(secret.salt, /^[0-9a-f]{32}$/);

  const card = await getCard(admin, m.uid);
  assert.deepEqual(Object.keys(card).sort(), ['email', 'linkCode', 'loginId', 'name', 'pin', 'pinSetAt', 'uid']);
  assert.equal(card.uid, m.uid);
  assert.equal(card.loginId, m.loginId);
  assert.equal(card.name, 'Card Holder');
  assert.equal(card.email, email);
  assert.equal(card.linkCode, m.linkCode);
  assert.match(card.linkCode, LINK_CODE_PATTERN);
  assert.equal(card.pin, m.pin);
  assert.equal(card.pinSetAt, (await getMember(admin, m.uid)).get('pinSetAt').toMillis());

  const [entry] = await logEntries(admin, m.uid, 'card-viewed');
  assert.ok(entry, 'no card-viewed log');
  assert.equal(entry.detail, 'admin');
  assert.equal(entry.visitor, 'admin');
  assert.equal(entry.userAgent, '');
  assert.ok(!JSON.stringify(entry).includes(m.pin), 'PIN in the access log');
});

test('a PIN reset replaces the kept PIN, and the old one stops opening the card', async () => {
  const m = await createMember(admin, { name: 'Pin Swap' });
  const before = await getCard(admin, m.uid);
  const { pin } = await admin.call('adminResetPin', { uid: m.uid, pinLength: 8 });

  assert.equal((await ownerGet(`secrets/${m.uid}`)).pin, pin);
  const card = await getCard(admin, m.uid);
  assert.equal(card.pin, pin);
  assert.ok(card.pinSetAt > before.pinSetAt, 'pinSetAt not moved on');
  // The kept PIN and the hash agree.
  assert.equal((await unlock(m.linkCode, pin)).profile.profile.name, 'Pin Swap');
  await rejectsWith(unlock(m.linkCode, m.pin), 'functions/permission-denied', /^Incorrect PIN\./);
  assert.equal(card.email, null);
});

test('a member sees their own card once they’ve chosen a password', async () => {
  const m = await readyMember(admin, { name: 'Own Card' });
  const card = await getCard(m.actor, m.uid);
  assert.equal(card.pin, m.pin);
  assert.equal(card.linkCode, m.linkCode);
  assert.equal(card.loginId, m.loginId);

  const [entry] = await logEntries(m.actor, m.uid, 'card-viewed');
  assert.ok(entry, 'no card-viewed log');
  assert.equal(entry.detail, 'member');
  assert.equal(entry.visitor, 'member');
  assert.equal(entry.userAgent, '');
});

test('getCard turns away another member, a stranger and a signed-out browser', async () => {
  const [a, b] = await Promise.all([readyMember(admin), readyMember(admin)]);
  await rejectsWith(getCard(a.actor, b.uid), 'functions/permission-denied');

  const stranger = newActor('stranger');
  await signInGoogle(stranger, 'card-stranger@example.com');
  await rejectsWith(getCard(stranger, a.uid), 'functions/permission-denied');
  // Their own uid isn't a member's.
  await rejectsWith(getCard(stranger, stranger.auth.currentUser.uid), 'functions/not-found');

  await rejectsWith(getCard(newActor('signed-out', { account: false }), a.uid), 'functions/unauthenticated');
  await rejectsWith(admin.call('getCard', { uid: '../secrets' }), 'functions/invalid-argument');
  await rejectsWith(admin.call('getCard', {}), 'functions/invalid-argument');
});

test('getCard waits until a new member has chosen their own password', async () => {
  const m = await createMember(admin);
  const phone = newActor('member');
  await signInMember(phone, m.loginId, m.tempPassword);
  await rejectsWith(getCard(phone, m.uid), 'functions/failed-precondition', 'Choose your own password first.');
  assert.deepEqual(await logEntries(admin, m.uid, 'card-viewed'), []);
});

test('getCard turns away a session that was cut off, and a switched-off member', async () => {
  const m = await readyMember(admin, { name: 'Cut Off' });
  await nextSecond();
  // Off and on again: sets the cutoff and leaves the member able to sign in.
  await admin.call('adminSetDisabled', { uid: m.uid, disabled: true });
  await rejectsWith(getCard(m.actor, m.uid), 'functions/permission-denied');
  await admin.call('adminSetDisabled', { uid: m.uid, disabled: false });
  await rejectsWith(getCard(m.actor, m.uid), 'functions/unauthenticated');

  // To the second, as in firestore.rules (forgeIdToken).
  const cutoff = (await getMember(admin, m.uid)).get('tokensValidAfter');
  const claims = { sub: m.uid, email: loginEmail(m.loginId), email_verified: false };
  await rejectsWith(forgedActor('earlier', { ...claims, auth_time: cutoff - 1 }).call('getCard', { uid: m.uid }), 'functions/unauthenticated');
  assert.equal((await forgedActor('same-second', { ...claims, auth_time: cutoff }).call('getCard', { uid: m.uid })).pin, m.pin);

  const phone = newActor('member-phone');
  await signInMember(phone, m.loginId, m.password);
  assert.equal((await getCard(phone, m.uid)).pin, m.pin);
});

test('a member made before PINs were kept gets pin: null, and their card still opens', async () => {
  const m = await readyMember(admin, { name: 'Older Card' });
  await ownerDeleteField(`secrets/${m.uid}`, 'pin');

  assert.equal((await getCard(admin, m.uid)).pin, null);
  assert.equal((await getCard(m.actor, m.uid)).pin, null);
  assert.equal((await unlock(m.linkCode, m.pin)).profile.profile.name, 'Older Card');

  const { pin } = await admin.call('adminResetPin', { uid: m.uid, pinLength: 6 });
  assert.equal((await getCard(admin, m.uid)).pin, pin);
});

test('adminCreateMember takes an optional email, tidied up, and refuses a bad one before making anything', async () => {
  const loginId = uniqueLoginId();
  await rejectsWith(
    admin.call('adminCreateMember', { loginId, name: 'Bad Email', pinLength: 6, email: 'not-an-email' }),
    'functions/invalid-argument',
  );
  // Nothing was made, so the ID is still free.
  const created = await admin.call('adminCreateMember', {
    loginId,
    name: 'Good Email',
    pinLength: 6,
    email: `  ${loginId.toUpperCase()}@Example.COM `,
  });
  assert.equal(created.email, `${loginId}@example.com`);
  assert.equal((await getMember(admin, created.uid)).get('email'), `${loginId}@example.com`);

  const without = await createMember(admin);
  assert.equal(without.email, null);
  assert.equal((await getMember(admin, without.uid)).get('email'), null);
});

test('adminUpdateMember sets, tidies and clears the email, which the member reads too', async () => {
  const m = await readyMember(admin);
  const email = uniqueEmail();
  assert.deepEqual(await admin.call('adminUpdateMember', { uid: m.uid, email: ` ${email.toUpperCase()} ` }), { ok: true });
  assert.equal((await getMember(m.actor, m.uid)).get('email'), email);
  assert.equal((await getCard(m.actor, m.uid)).email, email);

  await admin.call('adminUpdateMember', { uid: m.uid, email: '' });
  assert.equal((await getMember(admin, m.uid)).get('email'), null);
  await admin.call('adminUpdateMember', { uid: m.uid, email });
  await admin.call('adminUpdateMember', { uid: m.uid, email: null });
  assert.equal((await getCard(admin, m.uid)).email, null);
  // Changing the address sends nothing.
  assert.deepEqual(await outbox(m.uid), []);
});

test('adminUpdateMember refuses a malformed email and changes nothing', async () => {
  const email = uniqueEmail();
  const m = await createMember(admin, { email });
  const malformed = [
    'not-an-email',
    'no-dot@example',
    'two@example.com, three@example.com',
    'two@example.com;three@example.com',
    'has space@example.com',
    '"Quoted" <quoted@example.com>',
    '@example.com',
    'someone@',
    `${'x'.repeat(250)}@example.com`,
    `${m.loginId}@id.sivashanmugavadivel.in`,
    42,
    true,
  ];
  for (const bad of malformed) {
    await rejectsWith(admin.call('adminUpdateMember', { uid: m.uid, email: bad }), 'functions/invalid-argument');
  }
  assert.equal((await getMember(admin, m.uid)).get('email'), email);
});

test('adminUpdateMember renames, and fills in the page’s name only where the member left it blank', async () => {
  const m = await readyMember(admin, { name: 'Old Name' });
  await admin.call('adminUpdateMember', { uid: m.uid, name: '  New   Name ' });
  assert.equal((await getMember(admin, m.uid)).get('name'), 'New Name');
  assert.equal((await getCard(admin, m.uid)).name, 'New Name');
  // The page already says Old Name, as the member left it.
  assert.equal((await getProfile(admin, m.uid)).get('profile.name'), 'Old Name');

  const page = (await getProfile(m.actor, m.uid)).data();
  await saveProfile(m.actor, m.uid, { ...page, profile: { ...page.profile, name: '' } });
  await admin.call('adminUpdateMember', { uid: m.uid, name: 'Filled In', email: uniqueEmail() });
  assert.equal((await getProfile(admin, m.uid)).get('profile.name'), 'Filled In');
  assert.equal((await getMember(admin, m.uid)).get('name'), 'Filled In');
});

test('adminUpdateMember: bad names, nothing to change, unknown members, and only for the admin', async () => {
  const m = await readyMember(admin, { name: 'Stays Put' });
  // (Line breaks and runs of spaces are tidied into one space, so they're no test here.)
  for (const name of ['', '   ', 'x'.repeat(81), 'Bell\u0007', 7]) {
    await rejectsWith(admin.call('adminUpdateMember', { uid: m.uid, name }), 'functions/invalid-argument');
  }
  await rejectsWith(admin.call('adminUpdateMember', { uid: m.uid }), 'functions/invalid-argument', 'Nothing to change.');
  await rejectsWith(admin.call('adminUpdateMember', { uid: 'NoSuchMember123', name: 'Nobody' }), 'functions/not-found');
  await rejectsWith(m.actor.call('adminUpdateMember', { uid: m.uid, name: 'Self Made' }), 'functions/permission-denied');
  await rejectsWith(m.actor.call('adminUpdateMember', { uid: m.uid, email: uniqueEmail() }), 'functions/permission-denied');
  assert.equal((await getMember(admin, m.uid)).get('name'), 'Stays Put');
  assert.equal((await getMember(admin, m.uid)).get('email'), null);
});
