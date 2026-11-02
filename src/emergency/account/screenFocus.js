import { useEffect } from 'react';

// When one account screen replaces another, the button that was pressed goes with it and focus
// drops to <body>: a screen reader says nothing about where the person landed, and Tab starts
// over from the top. So whatever opens a new screen asks for focus, and the new screen takes it
// once it's drawn: its notice (data-screen-focus) if it has one, otherwise its heading.

let wanted = false;

/** Call from whatever opens another screen: a button, a finished sign-in, a save. */
export function requestScreenFocus() {
  wanted = true;
}

/** Focuses `preferred`, else the screen's notice, else its h1. False when there's nothing to focus yet. */
export function focusScreen(preferred) {
  const target =
    preferred || document.querySelector('.em-root [data-screen-focus]') || document.querySelector('.em-root h1');
  if (!target) return false;
  // Headings in the shared components (the profile, the editor) aren't focusable by themselves.
  if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
  target.focus({ preventScroll: true });
  return true;
}

/**
 * Scrolls to the top whenever `screen` changes and, if the change was asked for, moves focus to
 * the new screen. A loading screen has no heading, so the request waits for the screen after it.
 * The first screen after a page load isn't asked for, so it leaves focus where the browser put it.
 */
export function useScreenFocus(screen) {
  useEffect(() => {
    window.scrollTo(0, 0);
    if (wanted && focusScreen()) wanted = false;
  }, [screen]);
}
