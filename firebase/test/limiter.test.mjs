/**
 * The PIN limiter keys on the caller's address, which the client SDK can't set. These tests speak
 * the callable protocol directly so they can play visitors on different addresses, reported the
 * way Google's front end does it: as the last X-Forwarded-For entry.
 */
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { after, before, test } from 'node:test';
import {
  accessLogs,
  createMember,
  deleteActors,
  eventually,
  FUNCTIONS_HOST,
  newAdmin,
  PROJECT_ID,
  REGION,
  wrongPin,
} from './helpers.mjs';

let admin;
before(async () => {
  admin = await newAdmin();
});
after(deleteActors);

/** POSTs { data } like httpsCallable; the reply is { result } or { error: { status, message } }. */
async function unlockFrom(forwardedFor, id, pin) {
  const res = await fetch(`http://${FUNCTIONS_HOST}/${PROJECT_ID}/${REGION}/unlockProfile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': forwardedFor },
    body: JSON.stringify({ data: { id, pin } }),
  });
  return res.json();
}

async function expectError(reply, status, message) {
  const body = await reply;
  assert.ok(body.error, `expected ${status}, got a profile`);
  assert.equal(body.error.status, status, body.error.message);
  if (message) assert.match(body.error.message, message);
}

async function expectProfile(reply, name) {
  const body = await reply;
  assert.ok(body.result, `expected a profile, got ${body.error?.status}: ${body.error?.message}`);
  assert.equal(body.result.profile.profile.name, name);
}

test('IPv6 visitors count per /64, and only the last forwarded address counts', async () => {
  const m = await createMember(admin, { name: 'Six Four' });
  const bad = wrongPin(m.pin);
  const net = '2001:db8:64:1';

  // Five addresses, one /64: one visitor.
  await expectError(unlockFrom(`${net}::1`, m.linkCode, bad), 'PERMISSION_DENIED', /4 tries left/);
  await expectError(unlockFrom(`${net}::2`, m.linkCode, bad), 'PERMISSION_DENIED', /3 tries left/);
  await expectError(unlockFrom(`${net}:aaaa::3`, m.linkCode, bad), 'PERMISSION_DENIED', /2 tries left/);
  await expectError(unlockFrom(`${net}:ffff:ffff:ffff:ffff`, m.linkCode, bad), 'PERMISSION_DENIED', /1 try left/);
  await expectError(unlockFrom(`${net}::5`, m.linkCode, bad), 'RESOURCE_EXHAUSTED', /Too many incorrect tries/);

  // Anywhere in that /64 is locked out, right PIN or not, and a made-up address in front doesn't help.
  await expectError(unlockFrom(`${net}:1234::9`, m.linkCode, m.pin), 'RESOURCE_EXHAUSTED');
  await expectError(unlockFrom(`198.51.100.9, ${net}::6`, m.linkCode, m.pin), 'RESOURCE_EXHAUSTED');

  // The next /64 and an IPv4 address are different visitors.
  await expectProfile(unlockFrom('2001:db8:64:2::1', m.linkCode, m.pin), 'Six Four');
  await expectProfile(unlockFrom('198.51.100.4', m.linkCode, m.pin), 'Six Four');
});

test('the access log names a visitor by a keyed hash: the same for one address, no plain hash of it', async () => {
  const m = await createMember(admin, { name: 'Keyed' });
  const [one, two] = ['198.51.100.77', '198.51.100.78'];
  await expectProfile(unlockFrom(one, m.linkCode, m.pin), 'Keyed');
  await expectProfile(unlockFrom(one, m.linkCode, m.pin), 'Keyed');
  await expectProfile(unlockFrom(two, m.linkCode, m.pin), 'Keyed');

  const visitors = await eventually(async () => {
    const found = (await accessLogs(admin, m.uid)).docs.filter((d) => d.get('type') === 'unlock');
    assert.equal(found.length, 3);
    return found.map((d) => d.get('visitor'));
  });
  for (const visitor of visitors) assert.match(visitor, /^[0-9a-f]{10}$/);
  assert.equal(new Set(visitors).size, 2, `one visitor per address (have: ${visitors})`);

  // Members read this field. An unkeyed hash of an IPv4 address is undone by hashing all 2^32;
  // this one needs the key in secrets/_visitor, which no browser can read.
  const plain = (text) => crypto.createHash('sha256').update(text).digest('hex').slice(0, 10);
  for (const ip of [one, two]) {
    for (const text of [ip, `emergency-page:${ip}`]) {
      assert.ok(!visitors.includes(plain(text)), `visitor is the plain hash of '${text}'`);
    }
  }
});

test('when a card is under attack from many addresses, each new visitor still gets one try', { timeout: 300_000 }, async () => {
  const [m, other] = await Promise.all([
    createMember(admin, { name: 'Under Attack' }),
    createMember(admin, { name: 'Bystander' }),
  ]);
  const bad = wrongPin(m.pin);

  // 12 addresses x 5 wrong PINs use up the card's budget of 60 wrong PINs an hour.
  for (let host = 1; host <= 12; host += 1) {
    for (let n = 1; n <= 5; n += 1) {
      const body = await unlockFrom(`203.0.113.${host}`, m.linkCode, bad);
      assert.equal(body.error?.status, n < 5 ? 'PERMISSION_DENIED' : 'RESOURCE_EXHAUSTED', `host ${host}, try ${n}`);
    }
  }

  // The 61st trips the card-wide lock. It wasn't checked, so it doesn't say the PIN was wrong...
  await expectError(unlockFrom('203.0.113.13', m.linkCode, bad), 'RESOURCE_EXHAUSTED', /too many PIN attempts/);
  // ...and it wasn't charged to that visitor, who still has their one try.
  await expectProfile(unlockFrom('203.0.113.13', m.linkCode, m.pin), 'Under Attack');
  // A responder holding the printed PIN gets in during the lock.
  await expectProfile(unlockFrom('203.0.113.14', m.linkCode, m.pin), 'Under Attack');
  // A wrong one-try uses up that visitor's allowance.
  await expectError(
    unlockFrom('203.0.113.15', m.linkCode, bad),
    'RESOURCE_EXHAUSTED',
    /^Incorrect PIN\..*too many PIN attempts/,
  );
  await expectError(unlockFrom('203.0.113.15', m.linkCode, m.pin), 'RESOURCE_EXHAUSTED');

  // Other cards aren't affected, even from an address that's locked out of this one.
  await expectProfile(unlockFrom('203.0.113.1', other.linkCode, other.pin), 'Bystander');
});
