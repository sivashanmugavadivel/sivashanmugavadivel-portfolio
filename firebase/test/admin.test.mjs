/** claimAdmin and adminCreateMember: who can become admin, and what a new member gets. */
import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, getDocs, orderBy, query, Timestamp } from 'firebase/firestore';
import {
  accessLogs,
  ADMIN_EMAIL,
  createMember,
  deleteActors,
  expectLog,
  forgedActor,
  getMember,
  getProfile,
  isWeakPin,
  LINK_CODE_PATTERN,
  newActor,
  newAdmin,
  outbox,
  ownerGet,
  PROFILE_KEYS,
  rejectsWith,
  SERVICE_NUMBERS,
  signInGoogle,
  signInMember,
  strongPassword,
  TEMP_PASSWORD_PATTERN,
  TINY_PNG,
  uniqueLoginId,
} from './helpers.mjs';

let admin;
before(async () => {
  admin = await newAdmin();
});
after(deleteActors);

test('claimAdmin gives the listed Google account the admin claim', async () => {
  assert.equal((await admin.claims()).admin, true);
});

test('claimAdmin turns away a Google account that isn’t on the list', async () => {
  const stranger = newActor('stranger');
  await signInGoogle(stranger, 'someone@example.com');
  await rejectsWith(stranger.call('claimAdmin'), 'functions/permission-denied');
  assert.notEqual((await stranger.claims(true)).admin, true);
  await rejectsWith(
    stranger.call('adminCreateMember', { loginId: uniqueLoginId(), name: 'Nope', pinLength: 6 }),
    'functions/permission-denied',
  );
});

test('claimAdmin turns away a password sign-in on the admin’s address, even a verified one', async () => {
  // Someone who registered the admin's address with Email/Password before the admin's first Google
  // sign-in ends up in the admin's account, in a session like this one: the address, verified,
  // signed in by password. The Auth emulator keeps one account per address and the admin's Google
  // account already holds it, so the token is made by hand (forgeIdToken), for a real account of
  // its own: if claimAdmin said yes, that account would really get the claim.
  const squatter = newActor('squatter');
  const email = `squat-${uniqueLoginId()}@example.com`;
  const { uid } = (await createUserWithEmailAndPassword(squatter.auth, email, strongPassword())).user;
  const session = forgedActor('squatter-session', { sub: uid, email: ADMIN_EMAIL, email_verified: true });

  await rejectsWith(session.call('claimAdmin'), 'functions/permission-denied');
  assert.notEqual((await squatter.claims(true)).admin, true);
});

test('the admin claim counts only in a Google session, and refusing another one costs the admin nothing', async () => {
  const m = await createMember(admin, { name: 'Untouched' });
  // The admin's own account and claims, signed in two ways.
  const claims = { sub: admin.auth.currentUser.uid, email: ADMIN_EMAIL, email_verified: true, admin: true };
  const google = forgedActor('admin-google', { ...claims, firebase: { sign_in_provider: 'google.com' } });
  const password = forgedActor('admin-password', { ...claims, firebase: { sign_in_provider: 'password' } });

  // The Google one gets through, so it's only the sign-in method the password one is refused for.
  assert.deepEqual(await google.call('claimAdmin'), { admin: true });
  assert.equal((await google.call('getCard', { uid: m.uid })).pin, m.pin);
  const calls = [
    ['claimAdmin', undefined],
    ['adminCreateMember', { loginId: uniqueLoginId(), name: 'Nope', pinLength: 6 }],
    ['adminResetPassword', { uid: m.uid }],
    ['adminResetPin', { uid: m.uid, pinLength: 6 }],
    ['adminNewLink', { uid: m.uid }],
    ['adminSetDisabled', { uid: m.uid, disabled: true }],
    ['adminUpdateMember', { uid: m.uid, name: 'Nope' }],
    ['adminEmailMember', { uid: m.uid, template: 'card', cardPng: TINY_PNG }],
    ['adminDeleteMember', { uid: m.uid, confirmLoginId: m.loginId }],
    ['getCard', { uid: m.uid }],
  ];
  for (const [name, data] of calls) {
    await rejectsWith(password.call(name, data), 'functions/permission-denied');
  }

  // Nothing changed: same link and PIN, same temporary password, still switched on, same name.
  const responder = newActor('responder', { account: false });
  const { profile } = await responder.call('unlockProfile', { id: m.linkCode, pin: m.pin });
  assert.equal(profile.profile.name, 'Untouched');
  assert.equal((await getMember(admin, m.uid)).get('name'), 'Untouched');
  await signInMember(newActor('member'), m.loginId, m.tempPassword);
  // The refusals didn't take the claim off the account or sign the real admin out.
  assert.equal((await admin.claims(true)).admin, true);
  await createMember(admin);
});

test('claimAdmin and the admin functions turn away a signed-out caller', async () => {
  const responder = newActor('responder', { account: false });
  const refused = ['functions/permission-denied', 'functions/unauthenticated'];
  await rejectsWith(responder.call('claimAdmin'), refused);
  await rejectsWith(
    responder.call('adminCreateMember', { loginId: uniqueLoginId(), name: 'Nope', pinLength: 6 }),
    refused,
  );
});

test('adminCreateMember creates the account, page, link and PIN, and shows the secrets once', async () => {
  const loginId = uniqueLoginId();
  // The admin's typing is tidied up: trimmed and lowercased.
  const created = await admin.call('adminCreateMember', {
    loginId: `  ${loginId.toUpperCase()} `,
    name: 'Ravi Kumar',
    pinLength: 6,
    email: ` Ravi.${loginId}@Example.com `,
  });

  assert.equal(typeof created.uid, 'string');
  assert.ok(created.uid.length > 0);
  assert.equal(created.loginId, loginId);
  assert.equal(created.name, 'Ravi Kumar');
  assert.equal(created.email, `ravi.${loginId}@example.com`);
  assert.match(created.tempPassword, TEMP_PASSWORD_PATTERN);
  assert.match(created.pin, /^\d{6}$/);
  assert.ok(!isWeakPin(created.pin), `weak PIN ${created.pin}`);
  assert.match(created.linkCode, LINK_CODE_PATTERN);

  const member = await getMember(admin, created.uid);
  assert.ok(member.exists(), 'members doc missing');
  assert.equal(member.get('loginId'), loginId);
  assert.equal(member.get('name'), 'Ravi Kumar');
  assert.equal(member.get('linkCode'), created.linkCode);
  assert.equal(member.get('disabled'), false);
  assert.equal(member.get('mustChangePassword'), true);
  assert.ok(member.get('createdAt') instanceof Timestamp, 'createdAt');
  assert.ok(member.get('pinSetAt') instanceof Timestamp, 'pinSetAt');
  assert.equal(member.get('email'), created.email);
  // The PIN is kept only in secrets/, next to its hash, where no browser reads it (getCard shows
  // it). The temporary password is kept nowhere.
  assert.equal(member.get('pin'), undefined);
  const secret = await ownerGet(`secrets/${created.uid}`);
  assert.equal(secret.pin, created.pin);
  for (const stored of [member.data(), secret]) {
    assert.ok(!JSON.stringify(stored).includes(created.tempPassword), 'temporary password stored');
  }
  // Creating doesn't email: the page sends the welcome once it has drawn the card.
  assert.deepEqual(await outbox(created.uid), []);

  const profile = await getProfile(admin, created.uid);
  assert.ok(profile.exists(), 'profiles doc missing');
  assert.ok(!JSON.stringify(profile.data()).includes(created.tempPassword), 'temporary password stored');
  for (const key of Object.keys(profile.data())) assert.ok(PROFILE_KEYS.includes(key), `unexpected profile key ${key}`);
  assert.equal(profile.get('profile.name'), 'Ravi Kumar');
  assert.deepEqual(profile.get('services').map((s) => s.number), SERVICE_NUMBERS);
  assert.deepEqual(profile.get('contacts'), []);
  assert.deepEqual(profile.get('medical.allergies'), []);

  await expectLog(admin, created.uid, 'created');
  // The member reads this entry too, so it says nothing about the admin's own address or browser.
  const entry = (await accessLogs(admin, created.uid)).docs.find((d) => d.get('type') === 'created');
  assert.equal(entry.get('visitor'), 'admin');
  assert.equal(entry.get('userAgent'), '');

  // listMembers' query.
  const list = await getDocs(query(collection(admin.db, 'members'), orderBy('createdAt', 'desc')));
  assert.ok(list.docs.some((d) => d.id === created.uid), 'new member missing from the members list');
});

test('adminCreateMember makes a PIN of the length asked for', async () => {
  const [short, long] = await Promise.all([
    createMember(admin, { pinLength: 4 }),
    createMember(admin, { pinLength: 8 }),
  ]);
  assert.match(short.pin, /^\d{4}$/);
  assert.match(long.pin, /^\d{8}$/);
  assert.ok(!isWeakPin(short.pin), `weak PIN ${short.pin}`);
  assert.ok(!isWeakPin(long.pin), `weak PIN ${long.pin}`);
});

test('adminCreateMember refuses a login ID that’s already taken', async () => {
  const first = await createMember(admin);
  await rejectsWith(
    admin.call('adminCreateMember', { loginId: first.loginId, name: 'Someone Else', pinLength: 6 }),
    'functions/already-exists',
  );
  await rejectsWith(
    admin.call('adminCreateMember', { loginId: first.loginId.toUpperCase(), name: 'Someone Else', pinLength: 6 }),
    'functions/already-exists',
  );
  // The first member is untouched.
  assert.equal((await getMember(admin, first.uid)).get('name'), first.name);
});

test('adminCreateMember refuses a malformed login ID', async () => {
  const malformed = ['', 'ab', 'has space', '-dash-first', '.dot-first', 'x'.repeat(31), 'name@example.com', 'slash/id'];
  for (const loginId of malformed) {
    await rejectsWith(
      admin.call('adminCreateMember', { loginId, name: 'Bad ID', pinLength: 6 }),
      'functions/invalid-argument',
    );
  }
});
