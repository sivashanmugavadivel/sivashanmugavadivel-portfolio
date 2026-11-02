import { useLayoutEffect, useSyncExternalStore } from 'react';

// Light or dark, as picked on this device. With nothing saved the page follows the device's own
// setting. emergency.html reads the same key before the first paint, so it doesn't flash.
const KEY = 'emergency_theme';
const DARK = '(prefers-color-scheme: dark)';
// --em-bg in emergency.css, for the browser's own bar.
const BAR = { light: '#edf1f4', dark: '#0b131a' };

function read() {
  try {
    const value = localStorage.getItem(KEY);
    return value === 'light' || value === 'dark' ? value : null;
  } catch {
    return null; // storage blocked (some private windows): follow the device
  }
}

let saved = read();
const listeners = new Set();
const deviceTheme = () => (window.matchMedia?.(DARK)?.matches ? 'dark' : 'light');
const current = () => saved || deviceTheme();

function subscribe(onChange) {
  const mq = window.matchMedia?.(DARK);
  listeners.add(onChange);
  mq?.addEventListener?.('change', onChange);
  return () => {
    listeners.delete(onChange);
    mq?.removeEventListener?.('change', onChange);
  };
}

/** Marks <html> for the stylesheet, and colours the browser's bar to match. */
function mark(choice) {
  const root = document.documentElement;
  if (choice) root.setAttribute('data-em-theme', choice);
  else root.removeAttribute('data-em-theme');
  // emergency.html's theme-color metas follow the device; the first one that applies wins, so a
  // choice goes in a meta of its own ahead of them.
  let meta = document.head.querySelector('meta[name="theme-color"][data-em-theme]');
  if (!choice) {
    meta?.remove();
    return;
  }
  if (!meta) {
    meta = document.createElement('meta');
    meta.name = 'theme-color';
    meta.setAttribute('data-em-theme', '');
    document.head.prepend(meta);
  }
  meta.content = BAR[choice];
}

/** Applies the saved choice while the page is up. EmergencyPage calls it once. */
export function useSavedTheme() {
  useLayoutEffect(() => {
    mark(saved);
    return () => mark(null);
  }, []);
}

/** The colours in use ('light' or 'dark'), and a switch to the other one, remembered on this device. */
export function useTheme() {
  const theme = useSyncExternalStore(subscribe, current, () => 'light');
  const toggle = () => {
    const next = current() === 'dark' ? 'light' : 'dark';
    // Picking what the device already uses goes back to following the device.
    saved = next === deviceTheme() ? null : next;
    try {
      if (saved) localStorage.setItem(KEY, saved);
      else localStorage.removeItem(KEY);
    } catch {
      // Not remembered, but it still applies until the page closes.
    }
    mark(saved);
    listeners.forEach((l) => l());
  };
  return { theme, toggle };
}
