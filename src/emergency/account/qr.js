// QR images for member cards. Only the account chunk imports this, so the scan path never loads qrcode.
import QRCode from 'qrcode';
import { liveLinkUrl } from '../config';

// Black on white at print size, and 'Q' error correction so a scratched card still scans.
const QR_OPTIONS = { width: 1024, margin: 2, errorCorrectionLevel: 'Q', color: { dark: '#000000', light: '#ffffff' } };

const DISPLAY_FONT = '"Barlow Condensed", "Arial Narrow", Arial, sans-serif';
const TEXT_FONT = '"Atkinson Hyperlegible", Arial, sans-serif';

export const qrDataUrl = (url) => QRCode.toDataURL(url, QR_OPTIONS);

export const qrFileName = (loginId) => `emergency-${loginId}.png`;

export const cardFileName = (loginId) => `emergency-${loginId}-with-pin.png`;

export function downloadDataUrl(href, filename) {
  const a = document.createElement('a');
  a.href = href;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
}

/**
 * A printable card: the QR code with the PIN under it, so whoever finds the person needs nothing
 * else. Drawn in the browser; it leaves the device only when the admin emails it to the member.
 */
export async function pinCardDataUrl(qr, pin) {
  const img = new Image();
  img.src = qr;
  await img.decode();
  try {
    await Promise.all([document.fonts?.load(`700 84px ${DISPLAY_FONT}`), document.fonts?.load(`400 44px ${TEXT_FONT}`)]);
  } catch {
    // Not loaded on this page: the fallbacks in the font lists are drawn instead.
  }

  const width = QR_OPTIONS.width;
  const band = 150;
  const foot = 380;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = band + width + foot;
  const ctx = canvas.getContext('2d');
  const centre = width / 2;
  const fit = width - 80;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, canvas.height);
  ctx.fillStyle = '#c8102e';
  ctx.fillRect(0, 0, width, band);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffffff';
  ctx.font = `700 84px ${DISPLAY_FONT}`;
  ctx.fillText('EMERGENCY INFO', centre, band / 2, fit);

  ctx.drawImage(img, 0, band, width, width);

  const top = band + width;
  ctx.fillStyle = '#14202b';
  ctx.font = `400 44px ${TEXT_FONT}`;
  ctx.fillText('Scan the code, then enter this PIN', centre, top + 40, fit);
  ctx.font = `700 160px ${DISPLAY_FONT}`;
  ctx.fillText(pin.split('').join(' '), centre, top + 170, fit);
  ctx.fillStyle = '#c8102e';
  ctx.font = `700 44px ${TEXT_FONT}`;
  ctx.fillText('In danger? Call 112', centre, top + 320, fit);

  return canvas.toDataURL('image/png');
}

/**
 * The card for a member's link code and PIN, from scratch: what the welcome and card emails attach.
 * Always for the live page: an email sent from the dev server still goes to a real phone.
 */
export async function memberCardDataUrl(linkCode, pin) {
  return pinCardDataUrl(await qrDataUrl(liveLinkUrl(linkCode)), pin);
}
