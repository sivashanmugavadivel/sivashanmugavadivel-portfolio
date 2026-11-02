/** A member's own account: temporary password, choosing their own, editing their page. */
import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import { Timestamp } from 'firebase/firestore';
import {
  createMember,
  deleteActors,
  denied,
  expectLog,
  getMember,
  getProfile,
  newActor,
  newAdmin,
  nextSecond,
  readyMember,
  rejectsWith,
  saveProfile,
  signInMember,
  strongPassword,
  TINY_PNG,
  uniqueLoginId,
  WRONG_PASSWORD,
} from './helpers.mjs';

let admin;
before(async () => {
  admin = await newAdmin();
});
after(deleteActors);

test('a new member signs in with the temporary password and can read but not edit their page', async () => {
  const m = await createMember(admin, { name: 'Meera Iyer' });
  const phone = newActor('member');
  const user = await signInMember(phone, m.loginId, m.tempPassword);
  assert.equal(user.uid, m.uid);

  const claims = await phone.claims();
  assert.equal(claims.mustChangePassword, true);
  assert.notEqual(claims.admin, true);

  // Reading is allowed (the page shows who's signed in); writing waits for their own password.
  assert.equal((await getMember(phone, m.uid)).get('mustChangePassword'), true);
  const profile = await getProfile(phone, m.uid);
  assert.equal(profile.get('profile.name'), 'Meera Iyer');
  await denied(saveProfile(phone, m.uid, profile.data()));
  await expectLog(phone, m.uid, 'created');
});

test('a weak new password is turned away and changes nothing', async () => {
  const m = await createMember(admin);
  assert.ok(m.loginId.length >= 8, 'login ID too short to test the "same as ID" rule');
  const phone = newActor('member');
  await signInMember(phone, m.loginId, m.tempPassword);

  const weak = ['short1', 'x'.repeat(129), m.loginId, 'password', '12345678', 'qwerty123'];
  for (const newPassword of weak) {
    await rejectsWith(phone.call('changeTempPassword', { newPassword }), 'functions/invalid-argument');
  }
  await rejectsWith(phone.call('changeTempPassword', {}), 'functions/invalid-argument');

  assert.equal((await phone.claims(true)).mustChangePassword, true);
  assert.equal((await getMember(phone, m.uid)).get('mustChangePassword'), true);
  await signInMember(newActor('member-again'), m.loginId, m.tempPassword);
});

test('changeTempPassword swaps in the member’s own password and lifts the restriction', async () => {
  const m = await createMember(admin);
  const phone = newActor('member');
  await signInMember(phone, m.loginId, m.tempPassword);

  const password = strongPassword();
  assert.deepEqual(await phone.call('changeTempPassword', { newPassword: password }), { ok: true });
  // As the page does: sign in again, so the token no longer carries mustChangePassword.
  await signInMember(phone, m.loginId, password);
  assert.notEqual((await phone.claims()).mustChangePassword, true);

  const member = await getMember(phone, m.uid);
  assert.equal(member.get('mustChangePassword'), false);
  assert.ok(member.get('passwordSetAt') instanceof Timestamp, 'passwordSetAt');

  await rejectsWith(signInMember(newActor('old-password'), m.loginId, m.tempPassword), WRONG_PASSWORD);
  // There's no temporary password left to replace.
  await rejectsWith(phone.call('changeTempPassword', { newPassword: strongPassword() }), [
    'functions/failed-precondition',
    'functions/permission-denied',
  ]);

  const profile = await getProfile(phone, m.uid);
  await saveProfile(phone, m.uid, profile.data());
});

test('choosing a password ends the other temporary-password sessions, but not the page’s fresh sign-in', async () => {
  const m = await createMember(admin, { name: 'Two Phones' });
  const phone = newActor('member');
  const other = newActor('member-other'); // whoever else saw the temporary password
  await signInMember(other, m.loginId, m.tempPassword);
  await signInMember(phone, m.loginId, m.tempPassword);
  assert.equal((await getProfile(other, m.uid)).get('profile.name'), 'Two Phones');
  await nextSecond();

  const password = strongPassword();
  assert.deepEqual(await phone.call('changeTempPassword', { newPassword: password }), { ok: true });
  // Straight away, as the page does: likely the very second the sessions were ended.
  await signInMember(phone, m.loginId, password);
  assert.equal((await getMember(phone, m.uid)).get('mustChangePassword'), false);
  await saveProfile(phone, m.uid, (await getProfile(phone, m.uid)).data());

  // The other one's ID token is still within its hour, but its session is over.
  await denied(getProfile(other, m.uid));
  await denied(getMember(other, m.uid));
});

test('a member edits their own page, and a responder sees the change', async () => {
  const m = await readyMember(admin, { name: 'Kiran Das' });
  const current = (await getProfile(m.actor, m.uid)).data();
  const contact = { name: 'Test Contact', relation: 'Friend', phone: '+91 00000 00009', primary: true, notes: '' };
  await saveProfile(m.actor, m.uid, {
    ...current,
    profile: { ...current.profile, bloodGroup: 'B+' },
    contacts: [contact],
  });

  const saved = await getProfile(m.actor, m.uid);
  assert.equal(saved.get('profile.bloodGroup'), 'B+');
  assert.ok(saved.get('updatedAt') instanceof Timestamp, 'updatedAt');

  const responder = newActor('responder', { account: false });
  const { profile } = await responder.call('unlockProfile', { id: m.linkCode, pin: m.pin });
  assert.equal(profile.profile.name, 'Kiran Das');
  assert.equal(profile.profile.bloodGroup, 'B+');
  assert.deepEqual(profile.contacts, [contact]);
});

test('a member can’t read or write another member’s page, or add fields of their own', async () => {
  const [a, b] = await Promise.all([readyMember(admin), readyMember(admin)]);
  const own = (await getProfile(a.actor, a.uid)).data();

  await denied(getProfile(a.actor, b.uid));
  await denied(saveProfile(a.actor, b.uid, own));
  await denied(saveProfile(a.actor, a.uid, { ...own, pin: '123456' }));
  await denied(saveProfile(a.actor, a.uid, { ...own, linkCode: b.linkCode }));

  assert.equal((await getProfile(b.actor, b.uid)).get('profile.name'), b.name);
});

test('a member can’t use the admin functions, not even on themselves', async () => {
  const [a, b] = await Promise.all([readyMember(admin), createMember(admin)]);
  const calls = [
    ['claimAdmin', undefined],
    ['adminCreateMember', { loginId: uniqueLoginId(), name: 'Nope', pinLength: 6 }],
    ['adminResetPassword', { uid: b.uid }],
    ['adminResetPin', { uid: a.uid, pinLength: 6 }],
    ['adminNewLink', { uid: a.uid }],
    ['adminSetDisabled', { uid: b.uid, disabled: true }],
    ['adminUpdateMember', { uid: a.uid, email: 'me@example.com' }],
    ['adminEmailMember', { uid: a.uid, template: 'card', cardPng: TINY_PNG }],
    ['adminDeleteMember', { uid: a.uid, confirmLoginId: a.loginId }],
    ['adminDeleteMember', { uid: b.uid, confirmLoginId: b.loginId }],
    ['getCard', { uid: b.uid }],
  ];
  for (const [name, data] of calls) {
    await rejectsWith(a.actor.call(name, data), 'functions/permission-denied');
  }

  // Nothing changed: both cards still open with their original link and PIN.
  const responder = newActor('responder', { account: false });
  await responder.call('unlockProfile', { id: a.linkCode, pin: a.pin });
  await responder.call('unlockProfile', { id: b.linkCode, pin: b.pin });
  assert.notEqual((await a.actor.claims(true)).admin, true);
});

test('changing your own password ends your other devices’ sessions, and the page signs straight back in', async () => {
  const m = await readyMember(admin, { name: 'Own Password' });
  const laptop = newActor('member-laptop');
  await signInMember(laptop, m.loginId, m.password);
  assert.equal((await getProfile(laptop, m.uid)).get('profile.name'), 'Own Password');
  await nextSecond();

  // What the page does: reauthenticate, updatePassword, passwordChanged, then sign in again.
  const user = m.actor.auth.currentUser;
  await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, m.password));
  const password = strongPassword();
  await updatePassword(user, password);
  assert.deepEqual(await m.actor.call('passwordChanged'), { ok: true });
  await signInMember(m.actor, m.loginId, password);
  await saveProfile(m.actor, m.uid, (await getProfile(m.actor, m.uid)).data());

  // The laptop's ID token is still within its hour, but its session is over.
  await denied(getProfile(laptop, m.uid));
  await denied(getMember(laptop, m.uid));
  await rejectsWith(signInMember(laptop, m.loginId, m.password), WRONG_PASSWORD);
});

test('passwordChanged is only for a signed-in member', async () => {
  const stranger = newActor('stranger', { account: false });
  await rejectsWith(stranger.call('passwordChanged'), 'functions/unauthenticated');
  await rejectsWith(admin.call('passwordChanged'), 'functions/not-found');
});
