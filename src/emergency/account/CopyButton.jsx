import { useEffect, useRef, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { copyText } from '../utils';

/** Copies `text` and says so on the button for a moment (and to screen readers). */
export default function CopyButton({ text, label = 'Copy', ariaLabel, className = 'em-btn' }) {
  const [state, setState] = useState(''); // '' | 'ok' | 'failed'
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = async () => {
    const ok = await copyText(text);
    setState(ok ? 'ok' : 'failed');
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setState(''), 2500);
  };

  return (
    <>
      <button type="button" className={className} onClick={copy} aria-label={ariaLabel}>
        {state === 'ok' ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
        {state === 'ok' ? 'Copied' : state === 'failed' ? 'Couldn’t copy' : label}
      </button>
      <span className="em-sr-only" role="status">
        {state === 'ok' ? 'Copied' : state === 'failed' ? 'Couldn’t copy. Select the text and copy it instead.' : ''}
      </span>
    </>
  );
}
