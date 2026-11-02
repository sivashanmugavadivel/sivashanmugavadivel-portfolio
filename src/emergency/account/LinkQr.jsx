import { useEffect, useRef, useState } from 'react';
import { Download, IdCard, Nfc } from 'lucide-react';
import { linkUrl } from '../config';
import CopyButton from './CopyButton';
import { cardFileName, downloadDataUrl, pinCardDataUrl, qrDataUrl, qrFileName } from './qr';

/** Why a printed code with this link wouldn't work for a stranger, or '' if it looks fine. */
function linkProblem(link) {
  let parsed;
  try {
    parsed = new URL(link);
  } catch {
    return 'This link isn’t complete. Set VITE_EMERGENCY_PAGE_URL to the public address of the page.';
  }
  const { protocol, hostname } = parsed;
  if (/^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|\[::1\])/.test(hostname) || hostname.endsWith('.local')) {
    return 'This link only opens on this computer or your home network, so don’t print it. Make cards from the live site.';
  }
  if (protocol !== 'https:') return 'This link isn’t https. Phones block location sharing on plain http pages.';
  return '';
}

/**
 * The QR code for one member's card link: preview, PNG download, copy, and an NFC tag where the
 * browser can write one. With `pin` (when it's on file) it also offers a printable card with the
 * PIN under the code.
 */
export default function LinkQr({ code, loginId, pin, compact = false }) {
  const url = linkUrl(code);
  const [qr, setQr] = useState({ url: '', data: '', failed: false });
  const [cardMsg, setCardMsg] = useState('');
  const [nfcMsg, setNfcMsg] = useState('');
  const nfcWrite = useRef(null);
  const canWriteNfc = typeof window !== 'undefined' && 'NDEFReader' in window;
  const problem = linkProblem(url);
  const image = qr.url === url ? qr.data : '';

  // A pending write outlives the component and would overwrite the next tag the phone touches.
  useEffect(() => () => nfcWrite.current?.abort(), []);

  useEffect(() => {
    let alive = true;
    qrDataUrl(url)
      .then((data) => alive && setQr({ url, data, failed: false }))
      .catch(() => alive && setQr({ url, data: '', failed: true }));
    return () => {
      alive = false;
    };
  }, [url]);

  const downloadCard = async () => {
    setCardMsg('');
    try {
      downloadDataUrl(await pinCardDataUrl(image, pin), cardFileName(loginId));
    } catch {
      setCardMsg('Couldn’t make the card. Download the QR code and write the PIN next to it instead.');
    }
  };

  const writeTag = async () => {
    nfcWrite.current?.abort();
    const ctrl = new AbortController();
    nfcWrite.current = ctrl;
    try {
      setNfcMsg('Hold the tag against the back of your phone…');
      const writer = new window.NDEFReader();
      await writer.write({ records: [{ recordType: 'url', data: url }] }, { signal: ctrl.signal });
      setNfcMsg('Tag written. Tap it with your phone to test.');
    } catch (err) {
      if (ctrl.signal.aborted) return; // replaced by a newer write, or the screen closed
      // The browser also aborts a pending write when the page is hidden (screen locked, app switched).
      setNfcMsg(
        err?.name === 'AbortError'
          ? 'The write was cancelled because the page was hidden. Tap “Write NFC tag” again.'
          : `Couldn’t write the tag: ${err.message}`,
      );
    }
  };

  return (
    <div className="em-share">
      {image ? (
        <img src={image} alt={`QR code that opens ${url}`} className="em-qr" />
      ) : (
        <div className="em-qr em-qr--empty">{qr.failed && qr.url === url ? 'Couldn’t draw the code' : 'Drawing…'}</div>
      )}
      <div className="em-share__actions">
        <p className="em-hint">
          The code opens <strong>{url}</strong>
          {compact ? '' : '. Scan it with another phone before you print it.'}
        </p>
        {problem && <p className="em-msg em-msg--error">{problem}</p>}
        <div className="em-btnrow">
          {image && (
            <a className="em-btn" href={image} download={qrFileName(loginId)}>
              <Download aria-hidden="true" /> Download QR (PNG)
            </a>
          )}
          {image && pin && (
            <button type="button" className="em-btn" onClick={downloadCard}>
              <IdCard aria-hidden="true" /> Download card with PIN
            </button>
          )}
          <CopyButton text={url} label="Copy link" />
          {canWriteNfc && (
            <button type="button" className="em-btn" onClick={writeTag}>
              <Nfc aria-hidden="true" /> Write NFC tag
            </button>
          )}
        </div>
        {cardMsg && <p className="em-msg em-msg--error">{cardMsg}</p>}
        {nfcMsg && (
          <p className="em-hint" role="status">
            {nfcMsg}
          </p>
        )}
        {!compact && !canWriteNfc && (
          <p className="em-hint">
            To write an NFC tag, open this page in Chrome on Android, or use an app like NFC Tools to write the link above as a
            URL record.
          </p>
        )}
      </div>
    </div>
  );
}
