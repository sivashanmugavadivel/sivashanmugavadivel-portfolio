import { useCallback, useEffect, useRef, useState } from 'react';

/** Live position via watchPosition. Starts automatically when `autoStart` is true. */
export function useGeolocation(autoStart = true) {
  const [state, setState] = useState({ status: 'idle', coords: null, error: '' });
  const watchId = useRef(null);

  const stop = useCallback(() => {
    if (watchId.current != null && 'geolocation' in navigator) navigator.geolocation.clearWatch(watchId.current);
    watchId.current = null;
  }, []);

  const start = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setState((s) => ({ ...s, status: 'unsupported', error: 'This device can’t share its location.' }));
      return;
    }
    if (!window.isSecureContext) {
      setState((s) => ({ ...s, status: 'error', error: 'Location only works on a secure (https) page.' }));
      return;
    }
    stop();
    setState((s) => ({ ...s, status: s.coords ? 'tracking' : 'locating', error: '' }));
    watchId.current = navigator.geolocation.watchPosition(
      (p) =>
        setState({
          status: 'tracking',
          error: '',
          coords: { lat: p.coords.latitude, lng: p.coords.longitude, accuracy: Math.round(p.coords.accuracy), at: p.timestamp },
        }),
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          stop();
          setState((s) => ({ ...s, status: 'denied', error: 'Location access is blocked. Allow it in the browser settings, then try again.' }));
        } else {
          setState((s) =>
            s.coords
              ? s
              : { ...s, status: 'error', error: 'No location fix yet. Moving near a window or outdoors helps.' },
          );
        }
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 },
    );
  }, [stop]);

  useEffect(() => {
    // Starting the watch marks it 'locating' once; every fix after that arrives from the browser.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (autoStart) start();
    return stop;
  }, [autoStart, start, stop]);

  return { ...state, retry: start };
}

/** Keeps the emergency page out of search engines while it's mounted. */
export function useNoIndex() {
  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow';
    document.head.appendChild(meta);
    return () => meta.remove();
  }, []);
}

/** Keeps the screen on while `on` is true, where the browser supports the Screen Wake Lock API. */
export function useWakeLock(on) {
  useEffect(() => {
    if (!on || !navigator.wakeLock) return undefined;
    let lock = null;
    let busy = false;
    let stopped = false;
    const acquire = () => {
      if (lock || busy || document.visibilityState !== 'visible') return;
      busy = true;
      navigator.wakeLock
        .request('screen')
        .then((l) => {
          if (stopped) {
            l.release().catch(() => {});
            return;
          }
          lock = l;
          l.addEventListener('release', () => {
            if (lock === l) lock = null;
          });
        })
        .catch(() => {}) // refused (e.g. battery saver): the page still works, the screen may just dim
        .finally(() => {
          busy = false;
        });
    };
    // The browser drops the lock whenever the page is hidden, so take it again on return.
    acquire();
    document.addEventListener('visibilitychange', acquire);
    return () => {
      stopped = true;
      document.removeEventListener('visibilitychange', acquire);
      lock?.release().catch(() => {});
    };
  }, [on]);
}

/** Audible click at a fixed tempo (used for the CPR rhythm). Keeps the screen on while it runs. */
export function useMetronome(on, bpm, onBeat) {
  const beatRef = useRef(onBeat);
  useEffect(() => {
    beatRef.current = onBeat;
  }, [onBeat]);

  // Hands are on the chest during CPR, so the phone mustn't auto-lock and hide the count.
  useWakeLock(on);

  useEffect(() => {
    if (!on) return undefined;
    // iOS plays web audio as "ambient" by default, which the silent switch mutes; "playback" isn't.
    const session = navigator.audioSession;
    const prevType = session?.type;
    if (session) session.type = 'playback';
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    const ctx = AudioCtx ? new AudioCtx() : null;
    const wake = () => ctx?.resume?.()?.catch?.(() => {});
    wake();

    const click = () => {
      beatRef.current?.();
      if (!ctx) return;
      // iOS suspends the audio while the page is hidden (e.g. to make the call); pick it back up.
      if (ctx.state !== 'running') wake();
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = 1000;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.5, t + 0.004);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.08);
    };

    click();
    const id = setInterval(click, 60000 / bpm);
    return () => {
      clearInterval(id);
      ctx?.close?.();
      if (session) session.type = prevType;
    };
  }, [on, bpm]);
}

export function useToast(duration = 3500) {
  const [message, setMessage] = useState('');
  const timer = useRef(null);
  const show = useCallback(
    (text) => {
      setMessage(text);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setMessage(''), duration);
    },
    [duration],
  );
  useEffect(() => () => clearTimeout(timer.current), []);
  return [message, show];
}

export function usePrefersReducedMotion() {
  const query = '(prefers-reduced-motion: reduce)';
  const [reduced, setReduced] = useState(() => typeof window !== 'undefined' && window.matchMedia?.(query).matches);
  useEffect(() => {
    const mq = window.matchMedia?.(query);
    if (!mq) return undefined;
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);
  return reduced;
}
