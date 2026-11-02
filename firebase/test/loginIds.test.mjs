/**
 * adminCheckLoginIds, behind the Add member form's "available / taken": who may ask, what counts
 * as taken, and that adminCreateMember refuses the same IDs.
 */
import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { deleteUser } from 'firebase/auth';
import {
  createMember,
  deleteActors,
  newActor,
  newAdmin,
  ownerWhere,
  readyMember,
  rejectsWith,
  signInGoogle,
  signInMember,
  uniqueLoginId,
} from './helpers.mjs';

const ID_TAKEN = 'That ID is taken. Pick another.';

let admin;
before(async () => {
  admin = await newAdmin();
});
after(deleteActors);

const check = (actor, loginIds) => actor.call('adminCheckLoginIds', { loginIds });

test('adminCheckLoginIds: only the admin may ask', async () => {
  const stranger = newActor('stranger');
  await signInGoogle(stranger, 'someone@example.com');
  await rejectsWith(check(stranger, [uniqueLoginId()]), 'functions/permission-denied');

  const member = await createMember(admin);
  const signedIn = newActor('member');
  await signInMember(signedIn, member.loginId, member.tempPassword);
  await rejectsWith(check(signedIn, [member.loginId]), 'functions/permission-denied');

  await rejectsWith(check(newActor('nobody'), [uniqueLoginId()]), 'functions/permission-denied');
});

test('adminCheckLoginIds: a member’s ID is taken, a new one free, in the order asked', async () => {
  const member = await createMember(admin);
  const [a, b] = [uniqueLoginId(), uniqueLoginId()];
  assert.deepEqual(await check(admin, [a, member.loginId, b]), { free: [a, b], taken: [member.loginId] });
  // Typed the way a phone keyboard likes it, and twice: the same ID, once.
  assert.deepEqual(await check(admin, [` ${member.loginId.toUpperCase()} `, member.loginId]), {
    free: [],
    taken: [member.loginId],
  });
});

test('adminCheckLoginIds: refuses anything but 1 to 20 valid IDs', async () => {
  const many = Array.from({ length: 21 }, () => uniqueLoginId());
  for (const loginIds of [undefined, 'ravi', [], many, [uniqueLoginId(), 'no spaces'], [42], ['ab']]) {
    await rejectsWith(check(admin, loginIds), 'functions/invalid-argument');
  }
  assert.equal((await check(admin, many.slice(0, 20))).free.length, 20);
});

test('an ID stays taken while a members doc names it, even with its account gone', async () => {
  // A member can delete their own sign-in account; the admin still sees them in the list.
  const m = await readyMember(admin, { name: 'Self Removed' });
  await deleteUser(m.actor.auth.currentUser);
  assert.deepEqual(await check(admin, [m.loginId]), { free: [], taken: [m.loginId] });
  await rejectsWith(
    admin.call('adminCreateMember', { loginId: m.loginId, name: 'Second Claim', pinLength: 6 }),
    'functions/already-exists',
    ID_TAKEN,
  );

  // Deleted for good, it's free again, and can be given to someone new.
  await admin.call('adminDeleteMember', { uid: m.uid, confirmLoginId: m.loginId });
  assert.deepEqual(await check(admin, [m.loginId]), { free: [m.loginId], taken: [] });
  const again = await admin.call('adminCreateMember', { loginId: m.loginId, name: 'New Owner', pinLength: 6 });
  assert.equal(again.loginId, m.loginId);
  assert.notEqual(again.uid, m.uid);
});

test('adminCreateMember: a taken ID is refused with the same words, and nothing is made', async () => {
  const member = await createMember(admin);
  await rejectsWith(
    admin.call('adminCreateMember', { loginId: member.loginId, name: 'Copy Cat', pinLength: 6 }),
    'functions/already-exists',
    ID_TAKEN,
  );
  const named = await ownerWhere('members', 'loginId', member.loginId);
  assert.deepEqual(named.map((d) => d.id), [member.uid]);
});
