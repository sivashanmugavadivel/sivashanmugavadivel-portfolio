import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Runs `loader(arg)` and keeps its result. `retry` loads again; `setValue` replaces the result
 * after a save (a value, or a function of the old one) without another round trip; `update`
 * changes a loaded result in place (see below).
 * `loader` should be a module-level function, so it doesn't restart the load on every render.
 */
export function useLoad(loader, arg) {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState({ status: 'loading', value: undefined, error: '' });
  // For update(), which runs from event handlers and awaited callbacks, after the render.
  const latest = useRef(state);

  useEffect(() => {
    latest.current = state;
  });

  useEffect(() => {
    let alive = true;
    Promise.resolve()
      .then(() => loader(arg))
      .then(
        (value) => alive && setState({ status: 'ready', value, error: '' }),
        (error) => alive && setState({ status: 'error', value: undefined, error: error?.message || 'Couldn’t load. Try again.' }),
      );
    return () => {
      alive = false;
    };
  }, [loader, arg, attempt]);

  const retry = useCallback(() => {
    setState((s) => ({ ...s, status: 'loading', error: '' }));
    setAttempt((n) => n + 1);
  }, []);

  const setValue = useCallback(
    (next) => setState((s) => ({ status: 'ready', error: '', value: typeof next === 'function' ? next(s.value) : next })),
    [],
  );

  /**
   * `fn(value)` on a loaded result. A load that failed or is still running loads again instead:
   * the server already has the change, but a result already on its way may not, and patching
   * the error state would pass a partial list off as the whole one.
   */
  const update = useCallback(
    (fn) => {
      if (latest.current.status !== 'ready') {
        retry();
        return;
      }
      setState((s) => (s.status === 'ready' ? { ...s, value: fn(s.value) } : s));
    },
    [retry],
  );

  return { ...state, retry, setValue, update };
}
