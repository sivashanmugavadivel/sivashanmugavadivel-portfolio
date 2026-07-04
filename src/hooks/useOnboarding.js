import { useState, useCallback } from 'react'

/*
 * First-visit onboarding state. One localStorage JSON map tracks which hints
 * the visitor has "earned past": the welcome popup (dismissed once) and each
 * interactive-section hint (dismissed the first time they actually interact
 * with that section). Until then a hint keeps re-appearing on every visit.
 */
const KEY = 'onboarding_hints'

function readAll() {
  try { return JSON.parse(localStorage.getItem(KEY)) || {} } catch { return {} }
}

export function hintDismissed(id) {
  return !!readAll()[id]
}

export function dismissHint(id) {
  try {
    const all = readAll()
    if (all[id]) return
    all[id] = true
    localStorage.setItem(KEY, JSON.stringify(all))
  } catch { /* storage unavailable (private mode) — hint just shows again */ }
}

/* Reactive variant for components that render the hint themselves. */
export function useHint(id) {
  const [show, setShow] = useState(() => !hintDismissed(id))
  const dismiss = useCallback(() => { dismissHint(id); setShow(false) }, [id])
  return [show, dismiss]
}
