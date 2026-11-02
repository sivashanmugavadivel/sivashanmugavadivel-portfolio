// Emails from the admin panel: the welcome after a member is made, and their card after it
// changes. The page draws the card itself (qr.js) and sends it with emailMember; the server
// emails a reset password on its own. The senders resolve to the state MailStatus shows and
// never reject, so a failed email never takes a password or PIN off the screen.
//
// A mail state: null (nothing sent yet) or { status: 'sending' | 'sent' | 'failed', to, text?, noCard? }.
import { emailMember, getCard } from '../accountApi';
import { memberCardDataUrl } from './qr';

const NO_PIN = 'Their PIN isn’t on file, so there’s no card to send. Reset the PIN first.';
const NO_LINK = 'They don’t have a card link, so there’s no card to send. Make a new link first.';
const NO_DRAWING = 'Couldn’t draw the card on this device. Try again.';

/** The words for the mail server's "no" (the reason sendMemberEmail gives). */
export function mailFailureText(reason) {
  const text = String(reason || '').trim();
  if (!text) return 'The email didn’t go out. Try again in a moment.';
  if (/not configured/i.test(text)) return 'Email isn’t set up on the server yet, so nothing was sent.';
  return `The email didn’t go out: ${text.length > 200 ? `${text.slice(0, 200)}…` : text}`;
}

/** The server's { sent, to, reason } as a mail state; null stays null (no address on file). */
export function mailState(emailed, to) {
  if (!emailed) return null;
  const address = emailed.to || to;
  return emailed.sent ? { status: 'sent', to: address } : { status: 'failed', to: address, text: mailFailureText(emailed.reason) };
}

export const sendingTo = (to) => ({ status: 'sending', to });

/** The temporary password on this credentials card exists only on screen: it wasn't emailed (yet). */
export const passwordAtRisk = (result) => Boolean(result.tempPassword) && result.passwordMail?.status !== 'sent';

/**
 * The welcome: ID, temporary password and the card, drawn here. If the card can't be drawn the
 * welcome still goes without it (noCard), since the password matters more; the card can follow
 * from Card details.
 */
export async function sendWelcome({ uid, email, linkCode, pin, tempPassword }) {
  let cardPng;
  try {
    if (linkCode && pin) cardPng = await memberCardDataUrl(linkCode, pin);
  } catch {
    cardPng = undefined;
  }
  try {
    const state = mailState(await emailMember(uid, 'welcome', { tempPassword, cardPng }), email);
    return state.status === 'sent' && !cardPng ? { ...state, noCard: true } : state;
  } catch (err) {
    return { status: 'failed', to: email, text: err.message };
  }
}

/**
 * The member's card, drawn from `linkCode` and `pin` as shown on screen. A new link doesn't come
 * with the PIN, so then the card is looked up first.
 */
export async function sendCard(uid, { email, linkCode, pin }) {
  try {
    const card = linkCode && pin ? { linkCode, pin } : await getCard(uid);
    if (!card.linkCode) return { status: 'failed', to: email, text: NO_LINK };
    if (!card.pin) return { status: 'failed', to: email, text: NO_PIN };
    let cardPng;
    try {
      cardPng = await memberCardDataUrl(card.linkCode, card.pin);
    } catch {
      return { status: 'failed', to: email, text: NO_DRAWING };
    }
    return mailState(await emailMember(uid, 'card', { cardPng }), email);
  } catch (err) {
    return { status: 'failed', to: email, text: err.message };
  }
}
