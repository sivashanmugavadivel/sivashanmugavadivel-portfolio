/**
 * Deleting a member for good (adminDeleteMember): everything stored about them goes, their card and
 * sign-in stop working, nobody else's data is touched, and a delete that stopped part-way can be run
 * again. What's left is checked past the rules, the way the functions see it (owner* in helpers.mjs).
 */
import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { deleteUser } from 'firebase/auth';
import {
  accessLogs,
  ADMIN_EMAIL,
  createMember,
  deleteActors,
  denied,
  eventually,
  forgedActor,
  FUNCTIONS_HOST,
  getMember,
  getProfile,
  newActor,
  newAdmin,
  NOT_ACTIVE,
  outbox,
  ownerDelete,
  ownerGet,
  ownerIds,
  ownerWhere,
  PROJECT_ID,
  readyMember,
  REGION,
  rejectsWith,
  saveProfile,
  signInGoogle,
  signInMember,
  uniqueEmail,
  uniqueLoginId,
  wrongPin,
  WRONG_PASSWORD,
} from './helpers.mjs';

const CONFIRM = 'Type the member’s ID to confirm.';
const NO_MEMBER = 'There’s no member with that ID.';
// An account that's gone: the Auth emulator says so, or answers as for a wrong password.
const NO_ACCOUNT = ['auth/user-not-found', ...WRONG_PASSWORD];
const NOTHING = { member: null, profile: null, secret: null, link: null, links: [], attempts: [], logs: [], emails: [] };

let admin;
before(async () => {
  admin = await newAdmin();
});
after(deleteActors);

const deleteMember = (actor, uid, confirmLoginId) => actor.call('adminDeleteMember', { uid, confirmLoginId });
const unlock = (id, pin) => newActor('responder', { account: false }).call('unlockProfile', { id, pin });

/**
 * One wrong PIN on a member's card from `address` (the last X-Forwarded-For entry, as in
 * limiter.test.mjs): a rate-limit bucket for that visitor on that card, and the card's global one.
 */
async function wrongPinFrom(address, m) {
  const res = await fetch(`http://${FUNCTIONS_HOST}/${PROJECT_ID}/${REGION}/unlockProfile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': address },
    body: JSON.stringify({ data: { id: m.linkCode, pin: wrongPin(m.pin) } }),
  });
  const body = await res.json();
  assert.equal(body.error?.status, 'PERMISSION_DENIED', `wrong PIN from ${address}: ${body.error?.message}`);
}

const byId = (rows) => rows.sort((a, b) => (a.id < b.id ? -1 : 1));

/** Everything stored about a member, past the rules. */
async function stored(m) {
  const [member, profile, secret, link, links, attempts, logs, emails] = await Promise.all([
    ownerGet(`members/${m.uid}`),
    ownerGet(`profiles/${m.uid}`),
    ownerGet(`secrets/${m.uid}`),
    ownerGet(`links/${m.linkCode}`),
    ownerWhere('links', 'uid', m.uid).then(byId),
    ownerIds('pinAttempts').then((ids) => ids.filter((id) => id.startsWith(`${m.uid}_`)).sort()),
    ownerWhere('accessLogs', 'uid', m.uid).then(byId),
    outbox(m.uid),
  ]);
  return { member, profile, secret, link, links, attempts, logs, emails };
}

/** stored(m) once every write `check` waits for has landed (log writes may trail a call). */
function settled(m, check) {
  return eventually(async () => {
    const now = await stored(m);
    check(now);
    return now;
  });
}

/** As if an earlier adminDeleteMember stopped after the card link and the members/profiles/secrets batch. */
async function stopAfterFirstSteps(m) {
  for (const path of [`links/${m.linkCode}`, `members/${m.uid}`, `profiles/${m.uid}`, `secrets/${m.uid}`]) {
    await ownerDelete(path);
  }
}

test('deleting a member removes everything stored about them, and nothing of anyone else’s', async () => {
  const [m, other] = await Promise.all([
    readyMember(admin, { name: 'Leaving Soon', email: uniqueEmail() }),
    readyMember(admin, { name: 'Staying Put', email: uniqueEmail() }),
  ]);
  // A bit of everything for both: rate-limit buckets from two addresses, a scan, card views, an email.
  for (const x of [m, other]) {
    await wrongPinFrom('198.51.100.31', x);
    await wrongPinFrom('198.51.100.32', x);
    await unlock(x.linkCode, x.pin);
    await admin.call('getCard', { uid: x.uid });
    await x.actor.call('getCard', { uid: x.uid });
    await admin.call('adminEmailMember', { uid: x.uid, template: 'welcome', tempPassword: x.tempPassword });
  }
  const full = (s) => {
    const types = s.logs.map((l) => l.type);
    for (const type of ['created', 'unlock', 'card-viewed', 'emailed']) {
      assert.ok(types.includes(type), `no '${type}' log (have: ${types})`);
    }
    // Two visitors and the card's global bucket; the scan's own bucket went when its PIN was right.
    assert.equal(s.attempts.length, 3, `attempts: ${s.attempts}`);
    assert.equal(s.emails.length, 1);
    assert.ok(s.member && s.profile && s.secret && s.link, 'docs missing before the delete');
  };
  const mBefore = await settled(m, full);
  const otherBefore = await settled(other, full);
  const visitorKey = await ownerGet('secrets/_visitor');
  assert.match(visitorKey.key, /^[0-9a-f]{64}$/);
  const page = (await getProfile(m.actor, m.uid)).data();

  assert.deepEqual(await deleteMember(admin, m.uid, m.loginId), {
    ok: true,
    removed: { logs: mBefore.logs.length, attempts: 3 },
  });

  // Nothing of theirs is left, and the delete itself wrote no access-log entry.
  assert.deepEqual(await stored(m), NOTHING);
  // The printed card answers like a link that never existed.
  await rejectsWith(unlock(m.linkCode, m.pin), 'functions/not-found', NOT_ACTIVE);
  // Their sign-in is gone...
  await rejectsWith(signInMember(newActor('member-phone'), m.loginId, m.password), NO_ACCOUNT);
  // ...and the session they were still in reads and writes nothing.
  await denied(getProfile(m.actor, m.uid));
  await denied(getMember(m.actor, m.uid));
  await denied(accessLogs(m.actor, m.uid));
  await denied(saveProfile(m.actor, m.uid, page));
  // The admin's editor, still open on their page, can't put it back.
  await denied(saveProfile(admin, m.uid, page));
  assert.equal((await getMember(admin, m.uid)).exists(), false);
  await rejectsWith(admin.call('getCard', { uid: m.uid }), 'functions/not-found', NO_MEMBER);
  // None of those knocks left anything behind.
  assert.deepEqual(await stored(m), NOTHING);

  // Everyone else's is exactly as it was, and so is the key visitors are hashed with.
  assert.deepEqual(await stored(other), otherBefore);
  assert.deepEqual(await ownerGet('secrets/_visitor'), visitorKey);
  // And it all still works: their card opens, they sign in and edit, the admin sees their card.
  const { profile } = await unlock(other.linkCode, other.pin);
  assert.equal(profile.profile.name, 'Staying Put');
  const phone = newActor('member-phone');
  await signInMember(phone, other.loginId, other.password);
  const theirs = (await getProfile(phone, other.uid)).data();
  await saveProfile(phone, other.uid, { ...theirs, medical: { ...theirs.medical, notes: 'Still here' } });
  assert.equal((await admin.call('getCard', { uid: other.uid })).pin, other.pin);
});

test('only the admin can delete a member', async () => {
  const [m, other] = await Promise.all([readyMember(admin, { name: 'Not Yours' }), readyMember(admin)]);
  const stranger = newActor('stranger');
  await signInGoogle(stranger, `stranger-${uniqueLoginId()}@example.com`);
  // The admin's own account and claim in a password session (forgeIdToken): not an admin session.
  const passwordSession = forgedActor('admin-password', {
    sub: admin.auth.currentUser.uid,
    email: ADMIN_EMAIL,
    email_verified: true,
    admin: true,
    firebase: { sign_in_provider: 'password' },
  });
  const before = await stored(m);

  for (const actor of [m.actor, other.actor, stranger, passwordSession]) {
    await rejectsWith(deleteMember(actor, m.uid, m.loginId), 'functions/permission-denied');
  }
  await rejectsWith(deleteMember(other.actor, other.uid, other.loginId), 'functions/permission-denied');
  await rejectsWith(deleteMember(newActor('signed-out', { account: false }), m.uid, m.loginId), [
    'functions/permission-denied',
    'functions/unauthenticated',
  ]);

  assert.deepEqual(await stored(m), before);
  await signInMember(newActor('member-phone'), m.loginId, m.password);
  assert.equal((await unlock(m.linkCode, m.pin)).profile.profile.name, 'Not Yours');
  await signInMember(newActor('member-phone'), other.loginId, other.password);
  // The refusals cost the real admin nothing.
  assert.equal((await admin.claims(true)).admin, true);
});

test('the wrong ID, or none, deletes nothing; the right one may be typed loosely', async () => {
  const [m, other] = await Promise.all([readyMember(admin, { name: 'Typed Wrong' }), createMember(admin)]);
  await wrongPinFrom('198.51.100.41', m);
  const before = await settled(m, (s) => {
    assert.equal(s.attempts.length, 2);
    assert.ok(s.logs.some((l) => l.type === 'created'), 'no created log');
  });

  const wrong = [`${m.loginId}x`, m.loginId.slice(0, -1), other.loginId, m.uid, '', '   ', null, 42, ['x']];
  for (const confirmLoginId of wrong) {
    await rejectsWith(deleteMember(admin, m.uid, confirmLoginId), 'functions/invalid-argument', CONFIRM);
  }
  await rejectsWith(admin.call('adminDeleteMember', { uid: m.uid }), 'functions/invalid-argument', CONFIRM);

  assert.deepEqual(await stored(m), before);
  await signInMember(newActor('member-phone'), m.loginId, m.password);
  assert.equal((await unlock(m.linkCode, m.pin)).profile.profile.name, 'Typed Wrong');

  // Trimmed and lowercased, like the ID at sign-in.
  const result = await deleteMember(admin, m.uid, `  ${m.loginId.toUpperCase()} `);
  assert.equal(result.ok, true);
  assert.deepEqual(await stored(m), NOTHING);
  assert.equal((await getMember(admin, other.uid)).get('loginId'), other.loginId);
  assert.equal((await unlock(other.linkCode, other.pin)).profile.profile.name, 'Test Member');
});

test('only members can be deleted: not an unknown uid, the admin’s own account or another Google account', async () => {
  const stranger = newActor('stranger');
  const strangerId = `stranger-${uniqueLoginId()}`;
  await signInGoogle(stranger, `${strangerId}@example.com`);

  await rejectsWith(deleteMember(admin, 'noSuchMember0000', 'nobody'), 'functions/not-found', NO_MEMBER);
  await rejectsWith(deleteMember(admin, 'not/a/uid', 'nobody'), 'functions/invalid-argument', NO_MEMBER);
  await rejectsWith(deleteMember(admin, '', 'nobody'), 'functions/invalid-argument', NO_MEMBER);
  // Neither has a members doc. The start of their address is the nearest thing to an ID they have,
  // and it's a well-formed one, but it still isn't a member's.
  await rejectsWith(deleteMember(admin, admin.auth.currentUser.uid, 'admin'), 'functions/not-found', NO_MEMBER);
  await rejectsWith(deleteMember(admin, stranger.auth.currentUser.uid, strangerId), 'functions/not-found', NO_MEMBER);

  // Both accounts carry on.
  await stranger.auth.currentUser.getIdToken(true);
  assert.equal((await admin.claims(true)).admin, true);
  await createMember(admin);
});

test('a retry after a delete that stopped part-way clears what was left', async () => {
  const m = await readyMember(admin, { name: 'Half Gone', email: uniqueEmail() });
  await wrongPinFrom('198.51.100.51', m);
  await admin.call('adminEmailMember', { uid: m.uid, template: 'welcome', tempPassword: m.tempPassword });
  await settled(m, (s) => {
    assert.equal(s.attempts.length, 2);
    assert.equal(s.emails.length, 1);
    for (const type of ['created', 'emailed']) assert.ok(s.logs.some((l) => l.type === type), `no '${type}' log`);
  });

  // Left: the rate-limit buckets, the access log, the email and the sign-in account.
  await stopAfterFirstSteps(m);
  const left = await stored(m);
  assert.equal(left.member, null);

  // The account still names the ID, so the retry is checked against it all the same.
  await rejectsWith(deleteMember(admin, m.uid, `${m.loginId}x`), 'functions/invalid-argument', CONFIRM);
  await rejectsWith(deleteMember(admin, m.uid, ''), 'functions/invalid-argument', CONFIRM);
  assert.deepEqual(await stored(m), left);
  await signInMember(newActor('member-phone'), m.loginId, m.password);

  assert.deepEqual(await deleteMember(admin, m.uid, m.loginId), {
    ok: true,
    removed: { logs: left.logs.length, attempts: left.attempts.length },
  });
  assert.deepEqual(await stored(m), NOTHING);
  await rejectsWith(signInMember(newActor('member-phone'), m.loginId, m.password), NO_ACCOUNT);
  // Once it's all gone there's no member left to delete.
  await rejectsWith(deleteMember(admin, m.uid, m.loginId), 'functions/not-found', NO_MEMBER);
});

test('a member who deleted their own sign-in account is deleted all the same, retry included', async () => {
  const [a, b] = await Promise.all([readyMember(admin, { name: 'Self Removed' }), readyMember(admin)]);
  for (const x of [a, b]) {
    await wrongPinFrom('198.51.100.61', x);
    await deleteUser(x.actor.auth.currentUser);
  }
  const ready = (s) => {
    assert.equal(s.attempts.length, 2);
    assert.ok(s.logs.some((l) => l.type === 'created'), 'no created log');
  };

  // a: the members doc is still there, so an ordinary delete with the account already gone.
  const aBefore = await settled(a, ready);
  assert.deepEqual(await deleteMember(admin, a.uid, a.loginId), {
    ok: true,
    removed: { logs: aBefore.logs.length, attempts: 2 },
  });
  assert.deepEqual(await stored(a), NOTHING);

  // b: as if a delete stopped part-way after that. Nothing names an ID any more and nobody owns
  // what's left, so the retry clears it.
  await settled(b, ready);
  await stopAfterFirstSteps(b);
  const left = await stored(b);
  assert.deepEqual(await deleteMember(admin, b.uid, b.loginId), {
    ok: true,
    removed: { logs: left.logs.length, attempts: 2 },
  });
  assert.deepEqual(await stored(b), NOTHING);
  await rejectsWith(deleteMember(admin, b.uid, b.loginId), 'functions/not-found', NO_MEMBER);
});
