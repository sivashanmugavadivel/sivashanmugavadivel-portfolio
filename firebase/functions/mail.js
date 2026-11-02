/**
 * Email to members: the welcome (ID, temporary password, card), a password reset, and a changed
 * card. Sent through Gmail SMTP with an App Password, from the admin's own Gmail (GMAIL_USER).
 *
 * In the Functions emulator nothing reaches SMTP: the whole message lands in outbox/ for the tests
 * to read. In production nothing is written there, and neither a temporary password nor a message
 * body is ever logged.
 */
const { defineSecret, defineString } = require('firebase-functions/params');
const { FieldValue, getFirestore } = require('firebase-admin/firestore');
const nodemailer = require('nodemailer');

// Read with .value() only inside a function: at deploy time they aren't known yet.
const GMAIL_USER = defineString('GMAIL_USER', {
  description: 'The Gmail address the emergency page sends member emails from. Empty: no emails.',
});
const MAIL_FROM_NAME = defineString('MAIL_FROM_NAME', {
  default: 'Emergency page',
  description: 'The sender name members see on emails from the emergency page.',
});
// A Google App Password for GMAIL_USER, kept in Secret Manager. Every function that may send
// lists it in its `secrets`, or it can't read it.
const GMAIL_APP_PASSWORD = defineSecret('GMAIL_APP_PASSWORD');

// The live page, also from the emulator: a link in an email is for the member's phone.
const PAGE_URL = 'https://sivashanmugavadivel.in/emergency';
const LINK_CODE_PATTERN = /^[a-hjkmnp-z2-9]{10}$/;

const SMTP = {
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  // A hung connection mustn't outlast the callable (60 s): the admin gets a reason, not a timeout.
  connectionTimeout: 10_000,
  greetingTimeout: 10_000,
  socketTimeout: 20_000,
  // Attachments are always bytes we hold; never let a message read a file or fetch a URL.
  disableFileAccess: true,
  disableUrlAccess: true,
};

const INK = '#14202b';
const RED = '#c8102e';
const MUTED = '#5b6670';

const cardLink = (code) => `${PAGE_URL}?id=${code}`;
const cardFileName = (loginId) => `emergency-card-${loginId}.png`;

function escapeHtml(value) {
  const entities = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  return String(value).replace(/[&<>"']/g, (c) => entities[c]);
}

// ---------------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------------
// Each email is a list of blocks, so its plain-text and HTML versions always say the same thing:
//   { p }              a paragraph
//   { fields }         [label, value] lines: the ID and the temporary password
//   { button }         [label, url]: the sign-in link
//   { link }           [label, url]: a labelled link in the running text
//   { small }          small print

/** Blocks for the card link and, when there's a card image, the line that goes with it. */
function cardBlocks({ linkCode, loginId, card }, intro) {
  const blocks = [];
  if (card) {
    blocks.push({
      p: `${intro} (${cardFileName(loginId)}). Keep it with you: the PIN on it lets helpers open your page. In an emergency, call 112.`,
    });
  }
  if (LINK_CODE_PATTERN.test(linkCode || '')) blocks.push({ link: ['Your card’s link', cardLink(linkCode)] });
  return blocks;
}

const TEMPLATES = {
  welcome: (m) => ({
    subject: 'Your emergency page is ready',
    blocks: [
      { p: `Hi ${m.name},` },
      {
        p: 'Your emergency page is ready. It holds what helpers need if something happens to you: your medical details and the people to call. Sign in to fill it in.',
      },
      { fields: [['ID', m.loginId], ['Temporary password', m.tempPassword]] },
      { button: ['Sign in', PAGE_URL] },
      { p: 'You’ll choose your own password the first time you sign in.' },
      ...cardBlocks(m, 'Your emergency card is attached'),
      { small: 'Keep this email to yourself: anyone with the temporary password can sign in as you until you choose your own.' },
    ],
  }),
  'password-reset': (m) => ({
    subject: 'Your emergency page password was reset',
    blocks: [
      { p: `Hi ${m.name},` },
      { p: 'Your password for the emergency page was reset. Sign in with this temporary password, then choose your own.' },
      { fields: [['ID', m.loginId], ['Temporary password', m.tempPassword]] },
      { button: ['Sign in', PAGE_URL] },
      { small: 'If you didn’t ask for this, let the admin of your emergency page know.' },
    ],
  }),
  card: (m) => ({
    subject: 'Your emergency card has changed',
    blocks: [
      { p: `Hi ${m.name},` },
      { p: 'Your emergency card has changed: it has a new PIN or a new link, so the old card no longer works.' },
      ...cardBlocks(m, 'Your new card is attached'),
    ],
  }),
};

function toText(blocks) {
  return `${blocks
    .map((b) => {
      if (b.fields) return b.fields.map(([label, value]) => `${label}: ${value}`).join('\n');
      if (b.button) return `${b.button[0]}: ${b.button[1]}`;
      if (b.link) return `${b.link[0]}: ${b.link[1]}`;
      return b.p ?? b.small;
    })
    .join('\n\n')}\n`;
}

function toHtml(blocks) {
  const para = 'margin:0 0 16px';
  const body = blocks
    .map((b) => {
      if (b.fields) {
        const rows = b.fields
          .map(
            ([label, value]) =>
              `<tr><td style="padding:4px 16px 4px 0;color:${MUTED}">${escapeHtml(label)}</td>` +
              `<td style="padding:4px 0;font-family:Consolas,Menlo,monospace;font-size:18px;font-weight:bold">${escapeHtml(value)}</td></tr>`,
          )
          .join('');
        return `<table role="presentation" style="${para};border-collapse:collapse">${rows}</table>`;
      }
      if (b.button) {
        const [label, url] = b.button;
        return (
          `<p style="${para}"><a href="${escapeHtml(url)}" style="display:inline-block;background:${RED};color:#ffffff;` +
          `padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold">${escapeHtml(label)}</a></p>`
        );
      }
      if (b.link) {
        const [label, url] = b.link;
        return `<p style="${para}">${escapeHtml(label)}: <a href="${escapeHtml(url)}" style="color:${RED}">${escapeHtml(url)}</a></p>`;
      }
      if (b.small) return `<p style="${para};font-size:13px;color:${MUTED}">${escapeHtml(b.small)}</p>`;
      return `<p style="${para}">${escapeHtml(b.p)}</p>`;
    })
    .join('\n');
  return (
    `<div style="font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.5;color:${INK};max-width:560px;margin:0 auto">\n` +
    `<div style="background:${RED};color:#ffffff;font-weight:bold;letter-spacing:1px;padding:12px 20px;border-radius:6px 6px 0 0">EMERGENCY INFO</div>\n` +
    `<div style="padding:20px;border:1px solid #e3e6e8;border-top:0;border-radius:0 0 6px 6px">\n${body}\n</div>\n</div>\n`
  );
}

/**
 * The message for one template: { subject, text, html, attachments }. `card` is the card PNG's
 * bytes, attached as emergency-card-<loginId>.png.
 */
function renderEmail(template, { name, loginId, linkCode, tempPassword = null, card = null }) {
  const make = TEMPLATES[template];
  if (!make) throw new Error(`unknown email template ${template}`);
  const { subject, blocks } = make({ name: name || 'there', loginId, linkCode, tempPassword, card });
  const attachments = card ? [{ filename: cardFileName(loginId), content: card, contentType: 'image/png' }] : [];
  return { subject, text: toText(blocks), html: toHtml(blocks), attachments };
}

// ---------------------------------------------------------------------------
// Sending
// ---------------------------------------------------------------------------
/** What the admin sees when a send fails. Short, and never the server's own words. */
function failureReason(err) {
  switch (err?.code) {
    case 'EAUTH':
    case 'ENOAUTH':
      return 'Gmail didn’t accept the app password';
    case 'EENVELOPE':
      return 'Gmail didn’t accept the address';
    case 'ECONNECTION':
    case 'ETIMEDOUT':
    case 'ESOCKET':
    case 'EDNS':
    case 'ETLS':
      return 'couldn’t reach Gmail';
    default:
      return 'the email couldn’t be sent';
  }
}

/**
 * Sends one message, or in the emulator files it in outbox/. Returns { sent: true } or
 * { sent: false, reason } and never throws for mail trouble: whatever asked for it (a reset, say)
 * has happened either way, and the admin can send it again. `meta` ({ uid, template }) only labels
 * the outbox entry and the error log.
 */
async function deliverEmail({ to, subject, text, html, attachments = [] }, { uid, template }) {
  const user = GMAIL_USER.value().trim();
  if (!user) return { sent: false, reason: 'email not configured' };
  const from = { name: MAIL_FROM_NAME.value().trim() || 'Emergency page', address: user };

  try {
    if (process.env.FUNCTIONS_EMULATOR === 'true') {
      await getFirestore()
        .collection('outbox')
        .add({
          uid,
          template,
          to,
          from: `"${from.name}" <${from.address}>`,
          subject,
          text,
          html,
          attachments: attachments.map((a) => ({ filename: a.filename, contentType: a.contentType, size: a.content.length })),
          createdAt: FieldValue.serverTimestamp(),
        });
      return { sent: true };
    }
    // Google shows App Passwords in groups of four; the spaces aren't part of it.
    const pass = GMAIL_APP_PASSWORD.value().replace(/\s+/g, '');
    const transport = nodemailer.createTransport({ ...SMTP, auth: { user, pass } });
    try {
      await transport.sendMail({ from, to, subject, text, html, attachments });
    } finally {
      transport.close();
    }
    return { sent: true };
  } catch (err) {
    // The code and SMTP status only: the message carries the temporary password.
    console.error('email not sent', { uid, template, code: err?.code ?? null, responseCode: err?.responseCode ?? null });
    return { sent: false, reason: failureReason(err) };
  }
}

module.exports = { GMAIL_APP_PASSWORD, GMAIL_USER, MAIL_FROM_NAME, PAGE_URL, deliverEmail, renderEmail };
