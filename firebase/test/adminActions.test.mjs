/** The admin's per-member buttons: switch off/on, new link, reset PIN, reset password. */
import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { deleteUser } from 'firebase/auth';
import {
  accessLogs,
  createMember,
  deleteActors,
  denied,
  eventually,
  expectLog,
  getMember,
  getProfile,
  isWeakPin,
  LINK_CODE_PATTERN,
  newActor,
  newAdmin,
  nextSecond,
  NOT_ACTIVE,
  readyMember,
  rejectsWith,
  saveProfile,
  signInMember,
  strongPassword,
  TEMP_PASSWORD_PATTERN,
  unknownLinkCode,
  wrongPin,
  WRONG_PASSWORD,
} from './helpers.mjs';

let admin;
let responder;
before(async () => {
  admin = await newAdmin();
  responder = newActor('responder', { account: false });
});
after(deleteActors);

const unlock = (id, pin) => responder.call('unlockProfile', { id, pin });

test('switching a member off makes their card look like an unknown link and stops sign-in', async () => {
  const m = await readyMember(admin, { name: 'Switched Off' });
  const current = (await getProfile(m.actor, m.uid)).data();
  assert.deepEqual(await admin.call('adminSetDisabled', { uid: m.uid, disabled: true }), { ok: true });

  // Same code and text as a link that never existed, so a scan gives nothing away.
  await rejectsWith(unlock(m.linkCode, m.pin), 'functions/not-found', NOT_ACTIVE);
  await rejectsWith(unlock(unknownLinkCode(), m.pin), 'functions/not-found', NOT_ACTIVE);

  await rejectsWith(signInMember(newActor('member-phone'), m.loginId, m.password), 'auth/user-disabled');
  // Their ID token stays valid for up to an hour, but the rules check the switch, so no more edits.
  // (Beyond the spec's table: firestore.rules canEditOwn checks members.disabled.)
  await denied(saveProfile(m.actor, m.uid, current));
  // The session they already had can't be renewed either.
  await rejectsWith(m.actor.auth.currentUser.getIdToken(true), ['auth/user-disabled', 'auth/user-token-expired']);
  assert.equal((await getMember(admin, m.uid)).get('disabled'), true);
  await expectLog(admin, m.uid, 'disabled');

  // And back on: same link, same PIN, same password.
  assert.deepEqual(await admin.call('adminSetDisabled', { uid: m.uid, disabled: false }), { ok: true });
  const { profile } = await unlock(m.linkCode, m.pin);
  assert.equal(profile.profile.name, 'Switched Off');
  await signInMember(newActor('member-phone'), m.loginId, m.password);
  assert.equal((await getMember(admin, m.uid)).get('disabled'), false);
  await expectLog(admin, m.uid, 'enabled');
});

test('a new link retires the old QR code', async () => {
  const m = await createMember(admin, { name: 'New Link' });
  const { linkCode } = await admin.call('adminNewLink', { uid: m.uid });
  assert.match(linkCode, LINK_CODE_PATTERN);
  assert.notEqual(linkCode, m.linkCode);

  await rejectsWith(unlock(m.linkCode, m.pin), 'functions/not-found', NOT_ACTIVE);
  const { profile } = await unlock(linkCode, m.pin);
  assert.equal(profile.profile.name, 'New Link');

  assert.equal((await getMember(admin, m.uid)).get('linkCode'), linkCode);
  await expectLog(admin, m.uid, 'link-changed');
});

test('resetting the PIN retires the old one', async () => {
  const m = await createMember(admin, { name: 'New PIN' });
  const firstSetAt = (await getMember(admin, m.uid)).get('pinSetAt');

  const { pin } = await admin.call('adminResetPin', { uid: m.uid, pinLength: 8 });
  assert.match(pin, /^\d{8}$/);
  assert.ok(!isWeakPin(pin), `weak PIN ${pin}`);

  await rejectsWith(unlock(m.linkCode, m.pin), 'functions/permission-denied', /^Incorrect PIN\./);
  const { profile } = await unlock(m.linkCode, pin);
  assert.equal(profile.profile.name, 'New PIN');
  // A typo of the new PIN is still wrong.
  await rejectsWith(unlock(m.linkCode, wrongPin(pin)), 'functions/permission-denied', /^Incorrect PIN\./);

  const resetAt = (await getMember(admin, m.uid)).get('pinSetAt');
  assert.ok(resetAt.toMillis() > firstSetAt.toMillis(), 'pinSetAt not updated');
  await expectLog(admin, m.uid, 'pin-reset');
});

test('resetting the password makes the member choose their own again', async () => {
  const m = await readyMember(admin);
  const { tempPassword } = await admin.call('adminResetPassword', { uid: m.uid });
  assert.match(tempPassword, TEMP_PASSWORD_PATTERN);

  const phone = newActor('member-phone');
  await rejectsWith(signInMember(phone, m.loginId, m.password), WRONG_PASSWORD);
  await signInMember(phone, m.loginId, tempPassword);
  assert.equal((await phone.claims()).mustChangePassword, true);
  assert.equal((await getMember(admin, m.uid)).get('mustChangePassword'), true);

  // Back to read-only until they pick a password.
  const current = await getProfile(phone, m.uid);
  await denied(saveProfile(phone, m.uid, current.data()));

  const password = strongPassword();
  assert.deepEqual(await phone.call('changeTempPassword', { newPassword: password }), { ok: true });
  await signInMember(phone, m.loginId, password);
  await saveProfile(phone, m.uid, current.data());
  await expectLog(admin, m.uid, 'password-reset');
});

test('a password reset ends the sessions signed in before it, and a fresh sign-in carries on', async () => {
  const m = await readyMember(admin, { name: 'Old Session' });
  const current = (await getProfile(m.actor, m.uid)).data();
  await nextSecond();
  const { tempPassword } = await admin.call('adminResetPassword', { uid: m.uid });
  assert.ok(Number.isInteger((await getMember(admin, m.uid)).get('tokensValidAfter')), 'tokensValidAfter');

  // The session from before still holds an ID token within its hour, and Firestore doesn't check
  // revocation: the rules turn it away (members.tokensValidAfter).
  await denied(getProfile(m.actor, m.uid));
  await denied(saveProfile(m.actor, m.uid, { ...current, profile: { ...current.profile, bloodGroup: 'AB-' } }));
  await denied(getMember(m.actor, m.uid));
  await denied(accessLogs(m.actor, m.uid));

  // Signing in afresh with the temporary password reads again; once the member has chosen a
  // password and signed in again straight after (as the page does), they write again too.
  const phone = newActor('member-phone');
  await signInMember(phone, m.loginId, tempPassword);
  assert.equal((await getProfile(phone, m.uid)).get('profile.name'), 'Old Session');
  const password = strongPassword();
  assert.deepEqual(await phone.call('changeTempPassword', { newPassword: password }), { ok: true });
  await signInMember(phone, m.loginId, password);
  await saveProfile(phone, m.uid, current);
  await accessLogs(phone, m.uid);
  // The old session stays out.
  await denied(getProfile(m.actor, m.uid));
});

test('switching a member back on doesn’t bring back the sessions from before they were switched off', async () => {
  const m = await readyMember(admin, { name: 'Back On' });
  const current = (await getProfile(m.actor, m.uid)).data();
  await nextSecond();
  assert.deepEqual(await admin.call('adminSetDisabled', { uid: m.uid, disabled: true }), { ok: true });
  assert.deepEqual(await admin.call('adminSetDisabled', { uid: m.uid, disabled: false }), { ok: true });

  await denied(getProfile(m.actor, m.uid));
  await denied(saveProfile(m.actor, m.uid, current));
  await denied(getMember(m.actor, m.uid));

  const phone = newActor('member-phone');
  await signInMember(phone, m.loginId, m.password);
  await saveProfile(phone, m.uid, { ...current, medical: { ...current.medical, notes: 'Back on' } });
  assert.equal((await getProfile(phone, m.uid)).get('medical.notes'), 'Back on');
});

test('a member’s access log says only “admin” for the admin’s actions, and a short hash for a scan', async () => {
  const m = await readyMember(admin);
  const { pin } = await admin.call('adminResetPin', { uid: m.uid, pinLength: 6 });
  const { linkCode } = await admin.call('adminNewLink', { uid: m.uid });
  await newActor('responder', { account: false }).call('unlockProfile', { id: linkCode, pin });

  const adminTypes = ['created', 'pin-reset', 'link-changed'];
  const entries = await eventually(async () => {
    const docs = (await accessLogs(m.actor, m.uid)).docs.map((d) => d.data());
    const types = docs.map((d) => d.type);
    for (const type of [...adminTypes, 'unlock']) assert.ok(types.includes(type), `no '${type}' (have: ${types})`);
    return docs;
  });
  for (const entry of entries) {
    if (adminTypes.includes(entry.type)) {
      assert.equal(entry.visitor, 'admin', `${entry.type} visitor`);
      assert.equal(entry.userAgent, '', `${entry.type} userAgent`);
    } else {
      assert.match(entry.visitor, /^[0-9a-f]{10}$/, `${entry.type} visitor`);
    }
  }
});

test('switching off a member who deleted their own sign-in account still works', async () => {
  const m = await readyMember(admin, { name: 'Gone Away' });
  await deleteUser(m.actor.auth.currentUser);

  assert.deepEqual(await admin.call('adminSetDisabled', { uid: m.uid, disabled: true }), { ok: true });
  assert.equal((await getMember(admin, m.uid)).get('disabled'), true);
  await rejectsWith(unlock(m.linkCode, m.pin), 'functions/not-found', NOT_ACTIVE);
  assert.deepEqual(await admin.call('adminSetDisabled', { uid: m.uid, disabled: false }), { ok: true });
});
