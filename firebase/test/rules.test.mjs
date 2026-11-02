/**
 * Firestore rules, collection by collection, for everyone who might try: the admin, two members,
 * a Google account that's neither, and a browser that isn't signed in at all.
 */
import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import {
  accessLogs,
  ADMIN_EMAIL,
  createMember,
  deleteActors,
  denied,
  expectLog,
  forgedActor,
  getMember,
  getProfile,
  loginEmail,
  newActor,
  newAdmin,
  outbox,
  readyMember,
  rejectsWith,
  saveProfile,
  signInGoogle,
  signInMember,
  uniqueEmail,
  unknownLinkCode,
  wrongPin,
} from './helpers.mjs';

let admin;
let stranger;
let signedOut;
before(async () => {
  admin = await newAdmin();
  stranger = newActor('stranger');
  await signInGoogle(stranger, 'stranger@example.com');
  signedOut = newActor('signed-out');
});
after(deleteActors);

test('members: a member reads only their own record, the admin reads all, no browser writes', async () => {
  const [a, b] = await Promise.all([readyMember(admin), readyMember(admin)]);

  assert.equal((await getMember(a.actor, a.uid)).get('loginId'), a.loginId);
  assert.equal((await getMember(admin, b.uid)).get('loginId'), b.loginId);
  await denied(getMember(a.actor, b.uid));
  await denied(getMember(stranger, a.uid));
  await denied(getMember(signedOut, a.uid));

  await getDocs(query(collection(admin.db, 'members'), orderBy('createdAt', 'desc'), limit(5)));
  await denied(getDocs(collection(a.actor.db, 'members')));
  await denied(getDocs(collection(stranger.db, 'members')));

  // Only the functions write here: nobody switches themselves back on or makes up a member.
  await denied(updateDoc(doc(a.actor.db, 'members', a.uid), { name: 'Changed' }));
  await denied(updateDoc(doc(a.actor.db, 'members', a.uid), { disabled: false, mustChangePassword: false }));
  await denied(setDoc(doc(admin.db, 'members', a.uid), { disabled: true }, { merge: true }));
  await denied(setDoc(doc(admin.db, 'members', 'made-up-uid'), { loginId: 'made-up' }));
  await denied(deleteDoc(doc(admin.db, 'members', b.uid)));
});

test('a member who still has the temporary password can’t write to their record either', async () => {
  const m = await createMember(admin);
  const phone = newActor('member');
  await signInMember(phone, m.loginId, m.tempPassword);
  await denied(updateDoc(doc(phone.db, 'members', m.uid), { mustChangePassword: false }));
});

test('profiles: members read and write only their own, the admin any, and only the known keys', async () => {
  const [a, b] = await Promise.all([readyMember(admin), readyMember(admin)]);
  const own = (await getProfile(a.actor, a.uid)).data();

  await saveProfile(a.actor, a.uid, { ...own, medical: { ...own.medical, notes: 'Inhaler in the bag' } });
  assert.equal((await getProfile(a.actor, a.uid)).get('medical.notes'), 'Inhaler in the bag');

  await denied(getProfile(a.actor, b.uid));
  await denied(saveProfile(a.actor, b.uid, own));
  await denied(saveProfile(a.actor, a.uid, { ...own, pin: '123456' }));
  for (const outsider of [stranger, signedOut]) {
    await denied(getProfile(outsider, a.uid));
    await denied(saveProfile(outsider, a.uid, own));
  }
  // A signed-in account the admin didn't make has no members doc, so it can't store a page either.
  // (Beyond the spec's table: firestore.rules canEditOwn requires the members doc.)
  await denied(saveProfile(stranger, stranger.auth.currentUser.uid, own));

  // The admin can open and edit anyone's page, within the same keys.
  const theirs = (await getProfile(admin, b.uid)).data();
  await saveProfile(admin, b.uid, { ...theirs, about: { ...theirs.about, headline: 'Edited by the admin' } });
  assert.equal((await getProfile(b.actor, b.uid)).get('about.headline'), 'Edited by the admin');
  await denied(saveProfile(admin, b.uid, { ...theirs, linkCode: unknownLinkCode() }));
});

test('the admin claim opens nothing outside a Google session', async () => {
  const m = await readyMember(admin);
  const theirs = (await getProfile(admin, m.uid)).data();
  // The admin's own account and claims, signed in two ways (forgeIdToken). The password one is an
  // account that also has a password login on the admin's address; see isAdmin().
  const claims = { sub: admin.auth.currentUser.uid, email: ADMIN_EMAIL, email_verified: true, admin: true };
  const google = forgedActor('admin-google', { ...claims, firebase: { sign_in_provider: 'google.com' } });
  const password = forgedActor('admin-password', { ...claims, firebase: { sign_in_provider: 'password' } });
  const allMembers = (actor) => getDocs(query(collection(actor.db, 'members'), orderBy('createdAt', 'desc'), limit(5)));
  const allLogs = (actor) => getDocs(query(collection(actor.db, 'accessLogs'), orderBy('at', 'desc'), limit(5)));

  // The Google one gets everything the admin gets, so the forged token itself isn't what's refused...
  await allMembers(google);
  assert.equal((await getMember(google, m.uid)).get('loginId'), m.loginId);
  await getProfile(google, m.uid);
  await saveProfile(google, m.uid, theirs);
  await accessLogs(google, m.uid);
  await allLogs(google);
  // ...and the password one gets none of it.
  await denied(allMembers(password));
  await denied(getMember(password, m.uid));
  await denied(getProfile(password, m.uid));
  await denied(saveProfile(password, m.uid, theirs));
  await denied(accessLogs(password, m.uid));
  await denied(allLogs(password));
});

test('members.tokensValidAfter: a session from that second on counts, one from the second before doesn’t', async () => {
  const m = await readyMember(admin);
  const current = (await getProfile(m.actor, m.uid)).data();
  // Switching off and on again sets the cutoff and leaves the member able to write.
  await admin.call('adminSetDisabled', { uid: m.uid, disabled: true });
  await admin.call('adminSetDisabled', { uid: m.uid, disabled: false });
  const cutoff = (await getMember(admin, m.uid)).get('tokensValidAfter');
  assert.ok(Number.isInteger(cutoff), `tokensValidAfter ${cutoff}`);

  // The member's own token (forgeIdToken), signed in one second apart.
  const member = { sub: m.uid, email: loginEmail(m.loginId), email_verified: false };
  const earlier = forgedActor('earlier', { ...member, auth_time: cutoff - 1 });
  const sameSecond = forgedActor('same-second', { ...member, auth_time: cutoff });

  await denied(getMember(earlier, m.uid));
  await denied(getProfile(earlier, m.uid));
  await denied(saveProfile(earlier, m.uid, current));
  await denied(accessLogs(earlier, m.uid));
  // The page signs in again straight after changeTempPassword, often within that same second.
  assert.equal((await getMember(sameSecond, m.uid)).get('loginId'), m.loginId);
  await getProfile(sameSecond, m.uid);
  await saveProfile(sameSecond, m.uid, current);
  await accessLogs(sameSecond, m.uid);
});

test('links, secrets, pinAttempts and the outbox are closed to every browser', async () => {
  const a = await readyMember(admin, { email: uniqueEmail() });
  // One wrong PIN, so the rate-limit docs for this card exist.
  const responder = newActor('responder', { account: false });
  await rejectsWith(responder.call('unlockProfile', { id: a.linkCode, pin: wrongPin(a.pin) }), 'functions/permission-denied');
  // And a welcome email, so the emulator's outbox holds one with a temporary password in it.
  const welcome = { uid: a.uid, template: 'welcome', tempPassword: a.tempPassword };
  assert.equal((await admin.call('adminEmailMember', welcome)).sent, true);
  const mail = (await outbox(a.uid))[0].id;

  for (const actor of [admin, a.actor, stranger, signedOut]) {
    await denied(getDoc(doc(actor.db, 'links', a.linkCode)));
    // Holds the PIN itself as well as its hash.
    await denied(getDoc(doc(actor.db, 'secrets', a.uid)));
    // The key the visitor hashes are made with (made by that first unlock attempt).
    await denied(getDoc(doc(actor.db, 'secrets', '_visitor')));
    await denied(getDoc(doc(actor.db, 'pinAttempts', `${a.uid}__global`)));
    await denied(getDoc(doc(actor.db, 'outbox', mail)));
    await denied(getDocs(collection(actor.db, 'links')));
    await denied(getDocs(collection(actor.db, 'secrets')));
    await denied(getDocs(collection(actor.db, 'pinAttempts')));
    await denied(getDocs(collection(actor.db, 'outbox')));
    await denied(getDocs(query(collection(actor.db, 'outbox'), where('uid', '==', a.uid))));
  }

  // A writable link could point a card at someone else's page; a writable counter resets the limit.
  await denied(setDoc(doc(a.actor.db, 'links', unknownLinkCode()), { uid: a.uid, createdAt: serverTimestamp() }));
  await denied(setDoc(doc(admin.db, 'links', unknownLinkCode()), { uid: a.uid, createdAt: serverTimestamp() }));
  await denied(deleteDoc(doc(a.actor.db, 'links', a.linkCode)));
  await denied(setDoc(doc(a.actor.db, 'secrets', a.uid), { salt: '00', hash: '00' }));
  await denied(setDoc(doc(admin.db, 'secrets', a.uid), { salt: '00', hash: '00' }));
  await denied(setDoc(doc(admin.db, 'secrets', '_visitor'), { key: '00'.repeat(32) }));
  await denied(deleteDoc(doc(a.actor.db, 'pinAttempts', `${a.uid}__global`)));
  await denied(setDoc(doc(signedOut.db, 'pinAttempts', `${a.uid}__global`), { count: 0 }));
  await denied(setDoc(doc(admin.db, 'secrets', a.uid), { pin: '000000' }, { merge: true }));
  await denied(addDoc(collection(admin.db, 'outbox'), { uid: a.uid, to: 'x@example.com' }));
  await denied(deleteDoc(doc(a.actor.db, 'outbox', mail)));
});

test('access logs: the admin reads all, a member only their own, no browser writes or deletes', async () => {
  const [a, b] = await Promise.all([readyMember(admin), readyMember(admin)]);

  await expectLog(a.actor, a.uid, 'created');
  await expectLog(admin, b.uid, 'created');
  await getDocs(query(collection(admin.db, 'accessLogs'), orderBy('at', 'desc'), limit(5)));

  await denied(accessLogs(a.actor, b.uid));
  await denied(getDocs(collection(a.actor.db, 'accessLogs')));
  await denied(accessLogs(stranger, a.uid));
  await denied(accessLogs(signedOut, a.uid));

  const entry = { uid: a.uid, type: 'unlock', at: serverTimestamp(), visitor: 'x', userAgent: 'x' };
  await denied(addDoc(collection(a.actor.db, 'accessLogs'), entry));
  await denied(addDoc(collection(admin.db, 'accessLogs'), entry));

  const ownLog = (await accessLogs(a.actor, a.uid)).docs[0];
  await denied(deleteDoc(doc(a.actor.db, 'accessLogs', ownLog.id)));
  await denied(deleteDoc(doc(admin.db, 'accessLogs', ownLog.id)));
  await denied(updateDoc(doc(a.actor.db, 'accessLogs', ownLog.id), { type: 'created' }));
});

test('anything the rules don’t name is closed, including the old single-profile paths', async () => {
  const a = await readyMember(admin);
  for (const actor of [admin, a.actor]) {
    await denied(getDoc(doc(actor.db, 'emergencyProfiles', 'main')));
    await denied(setDoc(doc(actor.db, 'emergencyProfiles', 'main'), { profile: {} }));
    await denied(getDoc(doc(actor.db, 'emergencySecrets', 'main')));
    await denied(setDoc(doc(actor.db, 'somethingElse', 'x'), { a: 1 }));
    await denied(getDocs(collection(actor.db, 'somethingElse')));
  }
});
