/**
 * functions/mail.js on its own, in production mode: the paths the emulator never takes. Gmail is
 * replaced by a stand-in transport, so nothing leaves this machine; the outbox is read through the
 * Firestore emulator to show production never files a copy there.
 */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { after, beforeEach, test } from 'node:test';
import { outbox, PAGE_URL } from './helpers.mjs';

// The same module instances the functions use, so the stand-in transport is the one mail.js calls.
const require = createRequire(new URL('../functions/package.json', import.meta.url));
const nodemailer = require('nodemailer');
const { deliverEmail, renderEmail } = require('./mail.js');

const SENDER = 'sender@example.com';
const APP_PASSWORD = 'abcd efgh ijkl mnop';
const TEMP_PASSWORD = 'Kq7mWx3pRt9z';
const SAVED_ENV = { ...process.env };

beforeEach(() => {
  // Production: no emulator flag. The values the deploy reads from .env and Secret Manager.
  delete process.env.FUNCTIONS_EMULATOR;
  process.env.GMAIL_USER = SENDER;
  process.env.MAIL_FROM_NAME = 'Test Page';
  process.env.GMAIL_APP_PASSWORD = APP_PASSWORD;
});
after(() => {
  process.env = SAVED_ENV;
});

let uidSeq = 0;
const uid = () => `MailUnit${Date.now()}x${(uidSeq += 1)}`;

function welcome(card = Buffer.from('card-bytes')) {
  return renderEmail('welcome', { name: 'Ravi', loginId: 'ravi', linkCode: 'abcdefghjk', tempPassword: TEMP_PASSWORD, card });
}

/** A stand-in for nodemailer's SMTP transport that records what it was given. */
function fakeTransport(t, sendMail = async () => ({ accepted: ['x'], rejected: [] })) {
  const seen = { options: null, messages: [], closed: 0 };
  t.mock.method(nodemailer, 'createTransport', (options) => {
    seen.options = options;
    return {
      sendMail: async (message) => {
        seen.messages.push(message);
        return sendMail(message);
      },
      close: () => {
        seen.closed += 1;
      },
    };
  });
  return seen;
}

test('in production a message goes to Gmail over SMTPS and nowhere else', async (t) => {
  const seen = fakeTransport(t);
  const id = uid();
  const message = welcome();
  assert.deepEqual(await deliverEmail({ to: 'ravi@example.com', ...message }, { uid: id, template: 'welcome' }), {
    sent: true,
  });

  assert.equal(seen.options.host, 'smtp.gmail.com');
  assert.equal(seen.options.port, 465);
  assert.equal(seen.options.secure, true);
  assert.deepEqual(seen.options.auth, { user: SENDER, pass: 'abcdefghijklmnop' });
  assert.equal(seen.options.disableFileAccess, true);
  assert.equal(seen.options.disableUrlAccess, true);
  assert.ok(seen.options.connectionTimeout <= 15_000, 'connection timeout');

  const [sent] = seen.messages;
  assert.deepEqual(sent.from, { name: 'Test Page', address: SENDER });
  assert.equal(sent.to, 'ravi@example.com');
  assert.equal(sent.subject, message.subject);
  assert.equal(sent.text, message.text);
  assert.equal(sent.html, message.html);
  assert.deepEqual(sent.attachments.map((a) => [a.filename, a.contentType]), [['emergency-card-ravi.png', 'image/png']]);
  assert.equal(seen.closed, 1);
  // Production never files a copy.
  assert.deepEqual(await outbox(id), []);
});

test('with no GMAIL_USER nothing is sent, in production or in the emulator', async (t) => {
  const seen = fakeTransport(t);
  for (const user of ['', '   ']) {
    process.env.GMAIL_USER = user;
    for (const emulator of [undefined, 'true']) {
      if (emulator) process.env.FUNCTIONS_EMULATOR = emulator;
      else delete process.env.FUNCTIONS_EMULATOR;
      const id = uid();
      assert.deepEqual(await deliverEmail({ to: 'ravi@example.com', ...welcome() }, { uid: id, template: 'welcome' }), {
        sent: false,
        reason: 'email not configured',
      });
      assert.deepEqual(await outbox(id), []);
    }
  }
  assert.equal(nodemailer.createTransport.mock.callCount(), 0);
  assert.equal(seen.messages.length, 0);
});

test('a failed send reports why, closes the connection and never logs the message or the password', async (t) => {
  const errors = t.mock.method(console, 'error', () => {});
  const cases = [
    ['EAUTH', 535, 'Gmail didn’t accept the app password'],
    ['EENVELOPE', 553, 'Gmail didn’t accept the address'],
    ['ETIMEDOUT', undefined, 'couldn’t reach Gmail'],
    ['ECONNECTION', undefined, 'couldn’t reach Gmail'],
    ['EMESSAGE', 552, 'the email couldn’t be sent'],
    [undefined, undefined, 'the email couldn’t be sent'],
  ];
  let failure = null;
  const seen = fakeTransport(t, async (message) => {
    // As nodemailer's own errors can: the server's reply, with what was sent echoed in it.
    throw Object.assign(new Error(`Refused: ${message.text}`), { ...failure, response: message.text });
  });
  for (const [code, responseCode, reason] of cases) {
    failure = { code, responseCode };
    const closed = seen.closed;
    const result = await deliverEmail({ to: 'ravi@example.com', ...welcome() }, { uid: uid(), template: 'welcome' });
    assert.deepEqual(result, { sent: false, reason }, code);
    assert.equal(seen.closed, closed + 1, `${code}: connection left open`);
  }

  assert.equal(errors.mock.callCount(), cases.length);
  const logged = JSON.stringify(errors.mock.calls.map((c) => c.arguments));
  for (const secret of [TEMP_PASSWORD, APP_PASSWORD, 'abcdefghijklmnop', 'Your emergency page is ready', 'ravi@example.com']) {
    assert.ok(!logged.includes(secret), `logged: ${secret}`);
  }
  assert.match(logged, /EAUTH/);
});

test('the templates: plain text and HTML say the same, the HTML escapes, links point at the live page', () => {
  const card = Buffer.from('png');
  const m = { name: '<b>Ravi</b> & Co', loginId: 'ravi.k', linkCode: 'abcdefghjk', tempPassword: TEMP_PASSWORD, card };
  const link = `${PAGE_URL}?id=abcdefghjk`;

  const w = renderEmail('welcome', m);
  assert.equal(w.subject, 'Your emergency page is ready');
  for (const piece of ['ravi.k', TEMP_PASSWORD, PAGE_URL, link, 'emergency-card-ravi.k.png']) {
    assert.ok(w.text.includes(piece), `text lacks ${piece}`);
    assert.ok(w.html.includes(piece), `html lacks ${piece}`);
  }
  assert.ok(w.text.includes('Hi <b>Ravi</b> & Co,'), 'text name');
  assert.ok(w.html.includes('Hi &lt;b&gt;Ravi&lt;/b&gt; &amp; Co,'), 'html name not escaped');
  assert.ok(!w.html.includes('<b>Ravi'), 'raw name in the HTML');
  assert.deepEqual(w.attachments, [{ filename: 'emergency-card-ravi.k.png', content: card, contentType: 'image/png' }]);

  const r = renderEmail('password-reset', { ...m, card: null });
  assert.equal(r.subject, 'Your emergency page password was reset');
  assert.ok(r.text.includes(TEMP_PASSWORD) && r.text.includes('ravi.k') && r.text.includes(PAGE_URL));
  assert.deepEqual(r.attachments, []);

  const c = renderEmail('card', { ...m, tempPassword: null });
  assert.equal(c.subject, 'Your emergency card has changed');
  assert.ok(c.text.includes('the old card no longer works'));
  assert.ok(c.text.includes(link));
  assert.ok(!c.text.includes(TEMP_PASSWORD));
  assert.equal(c.attachments.length, 1);

  // No name: a friendly fallback. No usable link code: no card link rather than a broken one.
  assert.ok(renderEmail('card', { ...m, name: '', linkCode: undefined }).text.startsWith('Hi there,'));
  assert.ok(!renderEmail('card', { ...m, linkCode: undefined }).text.includes('?id='));
  assert.throws(() => renderEmail('nope', m), /unknown email template/);
});
