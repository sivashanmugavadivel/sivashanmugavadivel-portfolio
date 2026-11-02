/**
 * unlockProfile, as a responder's phone calls it after scanning a card: no sign-in, only the
 * link code from the QR and the PIN printed beside it. All these calls come from one address,
 * which is the point of the last test: the limiter counts per card, so one card's lockout
 * leaves every other card open.
 */
import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import {
  createMember,
  deleteActors,
  expectLog,
  newActor,
  newAdmin,
  NOT_ACTIVE,
  PROFILE_KEYS,
  rejectsWith,
  SERVICE_NUMBERS,
  unknownLinkCode,
  wrongPin,
} from './helpers.mjs';

let admin;
let responder;
before(async () => {
  admin = await newAdmin();
  responder = newActor('responder', { account: false });
});
after(deleteActors);

const unlock = (id, pin) => responder.call('unlockProfile', { id, pin });
const triesLeft = (n) => new RegExp(`^Incorrect PIN\\. ${n} ${n === 1 ? 'try' : 'tries'} left\\.`);

test('a malformed link code or PIN is refused before it costs a try', async () => {
  const m = await createMember(admin);
  for (const id of ['', 'abc', 'abcdefghjkm', 'abcdefghi0', '../members']) {
    await rejectsWith(unlock(id, m.pin), 'functions/invalid-argument');
  }
  await rejectsWith(responder.call('unlockProfile', { pin: m.pin }), 'functions/invalid-argument');
  for (const pin of ['', '123', '123456789', '12ab56']) {
    await rejectsWith(unlock(m.linkCode, pin), 'functions/invalid-argument');
  }
  await rejectsWith(responder.call('unlockProfile', { id: m.linkCode }), 'functions/invalid-argument');
  // None of those counted against the card.
  await rejectsWith(unlock(m.linkCode, wrongPin(m.pin)), 'functions/permission-denied', triesLeft(4));
});

test('an unknown link says it isn’t active', async () => {
  await rejectsWith(unlock(unknownLinkCode(), '483920'), 'functions/not-found', NOT_ACTIVE);
});

test('the right PIN opens the profile and logs the unlock', async () => {
  const m = await createMember(admin, { name: 'Asha Rao' });
  const result = await unlock(m.linkCode, m.pin);
  assert.deepEqual(Object.keys(result), ['profile']);

  const { profile } = result;
  for (const key of Object.keys(profile)) assert.ok(PROFILE_KEYS.includes(key), `unexpected key ${key}`);
  assert.equal(profile.profile.name, 'Asha Rao');
  assert.deepEqual(profile.services.map((s) => s.number), SERVICE_NUMBERS);
  // Timestamps come back as plain milliseconds (toPlain).
  assert.equal(typeof profile.updatedAt, 'number');

  await expectLog(admin, m.uid, 'unlock');
});

test('a wrong PIN says how many tries are left, and the right one starts the count again', async () => {
  const m = await createMember(admin);
  const bad = wrongPin(m.pin);
  await rejectsWith(unlock(m.linkCode, bad), 'functions/permission-denied', triesLeft(4));
  await rejectsWith(unlock(m.linkCode, bad), 'functions/permission-denied', triesLeft(3));
  await unlock(m.linkCode, m.pin);
  await rejectsWith(unlock(m.linkCode, bad), 'functions/permission-denied', triesLeft(4));
});

test('five wrong PINs lock that card for this visitor, while other cards still open', async () => {
  const [a, b] = await Promise.all([
    createMember(admin, { name: 'Locked Card' }),
    createMember(admin, { name: 'Other Card' }),
  ]);
  const bad = wrongPin(a.pin);
  for (const left of [4, 3, 2, 1]) {
    await rejectsWith(unlock(a.linkCode, bad), 'functions/permission-denied', triesLeft(left));
  }
  await rejectsWith(unlock(a.linkCode, bad), 'functions/resource-exhausted', /^Too many incorrect tries\./);
  // Locked means locked, even with the right PIN.
  await rejectsWith(unlock(a.linkCode, a.pin), 'functions/resource-exhausted', /Too many incorrect tries/);

  // Same phone, same address, another member's card: untouched.
  const { profile } = await unlock(b.linkCode, b.pin);
  assert.equal(profile.profile.name, 'Other Card');

  await expectLog(admin, a.uid, 'lockout');
});
