import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import '../framer/styles.css'
import DocumentCard from '../framer/document-card'
import { hintDismissed, dismissHint } from '../hooks/useOnboarding'
import cfg from '../data/config.json'

// Matches Home's TypingName timing (400ms start + 65ms per character) so the
// tour can appear a beat after the "SIVA SHANMUGA VADIVEL" name finishes typing.
const HERO_NAME = (cfg.hero?.headline || cfg.personal?.name || '').toString()
export const HERO_TYPE_MS = 400 + HERO_NAME.length * 65
const TOUR_AFTER_TYPE_MS = 2000   // tour appears 2s after the name finishes typing

/*
 * WelcomeTour — first-visit onboarding using the REAL Framer "Document Card"
 * (exported via unframer, design untouched). Its text is prop-driven, so each
 * PAGE is the same card with different content.
 *
 * The component keeps ALL its native behaviour: hover peeks the folder open,
 * click opens/rotates it, click again closes. We only step in to add paging:
 *   • Click the open document (not the last page) → PAGE-TURN flip to the next
 *     page. We block the native tap (which would close) via a capture-phase
 *     pointerdown stop, then flip the card ourselves and swap the text.
 *   • On the LAST page we DON'T block, so the native click folds it shut.
 * No arrows, no dots — the document itself is the control.
 */

const COVER = { coverTitle: 'Welcome to my world of design', coverSub: 'Open to begin' }

/* ── Animated feature illustrations, shown at the top-center of each page ── */
function SphereArt({ accent = '#0e8fb0' }) {
  return (
    <div style={{ position: 'relative', width: 62, height: 62 }}>
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 9, repeat: Infinity, ease: 'linear' }} style={{ position: 'absolute', inset: 0 }}>
        {[...Array(8)].map((_, i) => (
          <div key={i} style={{ position: 'absolute', left: '50%', top: '50%', width: 5, height: 5, borderRadius: '50%', background: accent, margin: '-2.5px 0 0 -2.5px', transform: `rotate(${i * 45}deg) translateY(-26px)` }} />
        ))}
      </motion.div>
      <div style={{ position: 'absolute', inset: 16, borderRadius: '50%', border: `1.5px solid ${accent}`, opacity: 0.5 }} />
      <div style={{ position: 'absolute', inset: 16, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>🌐</div>
    </div>
  )
}
function ArcArt({ accent = '#c0398a' }) {
  return (
    <motion.div animate={{ rotate: [-9, 9, -9] }} transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut' }} style={{ position: 'relative', width: 80, height: 56 }}>
      {[{ x: 2, y: 20, r: -18 }, { x: 29, y: 4, r: 0 }, { x: 56, y: 20, r: 18 }].map((c, i) => (
        <div key={i} style={{ position: 'absolute', left: c.x, top: c.y, width: 22, height: 30, borderRadius: 4, transform: `rotate(${c.r}deg)`, background: `${accent}22`, border: `1.5px solid ${accent}` }} />
      ))}
    </motion.div>
  )
}
function MapArt({ accent = '#1f9d6b' }) {
  return (
    <div style={{ position: 'relative', width: 62, height: 58, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontSize: '1.9rem', opacity: 0.9 }}>🗺️</div>
      <motion.div animate={{ y: [-20, 0, 0, -20], opacity: [0, 1, 1, 0] }} transition={{ duration: 2.6, times: [0, 0.3, 0.8, 1], repeat: Infinity, ease: 'easeOut' }} style={{ position: 'absolute', top: 0, fontSize: '1rem' }}>📍</motion.div>
    </div>
  )
}
function BeatArt({ accent = '#c07a12' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, height: 50, padding: '0 3px' }}>
      {[0.9, 0.7, 1.1, 0.8, 1.0, 0.75].map((d, i) => (
        <motion.div key={i} animate={{ height: [8, 42, 8] }} transition={{ duration: d, repeat: Infinity, ease: 'easeInOut', delay: i * 0.12 }} style={{ width: 7, borderRadius: 3, background: accent }} />
      ))}
    </div>
  )
}
function SocialArt({ accent = '#6d43c7' }) {
  const dirs = [[-26, -5], [-20, -19], [-6, -26]]
  return (
    <div style={{ position: 'relative', width: 66, height: 56 }}>
      {dirs.map(([dx, dy], i) => (
        <motion.div key={i} animate={{ x: [0, dx, dx, 0], y: [0, dy, dy, 0], opacity: [0, 1, 1, 0], scale: [0.4, 1, 1, 0.4] }} transition={{ duration: 2.4, times: [0, 0.35, 0.75, 1], repeat: Infinity, ease: 'easeInOut', delay: i * 0.12 }} style={{ position: 'absolute', right: 18, bottom: 16, width: 10, height: 10, borderRadius: '50%', background: accent }} />
      ))}
      <div style={{ position: 'absolute', right: 10, bottom: 7, width: 26, height: 26, borderRadius: '50%', background: 'linear-gradient(120deg, #336CDC, #2859BD)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>👋</div>
    </div>
  )
}
function GalleryArt({ accent = '#2563c7' }) {
  return (
    <div style={{ position: 'relative', width: 90, height: 54, overflow: 'hidden', display: 'flex', alignItems: 'center' }}>
      <motion.div animate={{ x: [4, -30, -58] }} transition={{ duration: 3.6, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }} style={{ display: 'flex', gap: 7 }}>
        {[...Array(5)].map((_, i) => (
          <div key={i} style={{ width: 26, height: 36, borderRadius: 5, flexShrink: 0, background: `${accent}22`, border: `1.5px solid ${accent}` }} />
        ))}
      </motion.div>
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, #fff, transparent 22%, transparent 78%, #fff)', pointerEvents: 'none' }} />
    </div>
  )
}

const PAGES = [
  { ...COVER, pageIcon: <SphereArt />,
    line1: 'Photo sphere',
    line2: 'A spinning globe of my photos, up in the Writing section.',
    line3: 'Drag it in any direction to spin it around.',
    line4: 'Tap a photo to open the full gallery.' },
  { ...COVER, pageIcon: <ArcArt />,
    line1: 'Video arc',
    line2: 'Clips riding a curved arc in the Videos section.',
    line3: 'Drag the arc to bring a clip to the front.',
    line4: 'Tap a card to watch on the videos page.' },
  { ...COVER, pageIcon: <MapArt />,
    line1: 'Journeys map',
    line2: "Everywhere I've travelled, drawn as routes.",
    line3: 'Tap the gear to restyle it — views, pins, fullscreen.',
    line4: 'On mobile it opens fullscreen in landscape.' },
  { ...COVER, pageIcon: <BeatArt />,
    line1: 'Beat Maker',
    line2: 'A real step sequencer in the Music section.',
    line3: 'Tap the button to build your own beat.',
    line4: 'Play it, then download it as audio.' },
  { ...COVER, pageIcon: <SocialArt />,
    line1: 'Social button',
    line2: 'The floating button in the bottom-right corner.',
    line3: 'Tap it to fan out all my socials.',
    line4: 'Message me on WhatsApp right from there.' },
  { ...COVER, pageIcon: <GalleryArt />,
    line1: 'Gallery',
    line2: 'My photo collection — plus real 360° shots.',
    line3: 'Swipe the 3D carousel to browse.',
    line4: 'Step inside the 360° panoramas.' },
]

export default function WelcomeTour({ preview = false }) {
  const [open, setOpen] = useState(preview)
  const [idx, setIdx] = useState(0)
  const [resetKey, setResetKey] = useState(0)   // remount to snap the card closed (preview replay)

  const wrapRef = useRef(null)
  const idxRef = useRef(0)
  const turningRef = useRef(false)
  useEffect(() => { idxRef.current = idx }, [idx])

  // Read the component's REAL state from the DOM instead of tracking taps.
  // Framer swaps a framer-v-* class per variant; jx98nn / 1cz3u7p are the two
  // "document open & readable" variants. Tap-counting breaks on touch devices
  // (the first tap only triggers the hover-peek variant), so never guess.
  const isDocOpen = () => {
    const root = wrapRef.current?.querySelector('.framer-Tg3fG')
    return /framer-v-(jx98nn|1cz3u7p)/.test(root?.className || '')
  }

  useEffect(() => {
    if (preview) { setOpen(true); return }
    if (hintDismissed('welcome')) return
    // Mounts once contentReady is true (intro/loading done). Appear 2s after the
    // hero name finishes typing.
    const t = setTimeout(() => {
      setOpen(true)
      window.dispatchEvent(new Event('welcome-tour-shown'))   // cue the welcome toast
    }, HERO_TYPE_MS + TOUR_AFTER_TYPE_MS)
    return () => clearTimeout(t)
  }, [preview])

  // Last-page close: the component plays its NATIVE fold (same as the original).
  // Don't touch it — just clean up AFTER the fold has fully finished (~1s), so
  // the fold transition is never cut short.
  const finish = () => {
    const done = () => { if (!preview) dismissHint('welcome'); setOpen(false) }
    const sheet = wrapRef.current?.querySelector('.framer-1qsw93b')
    if (!sheet) { setTimeout(done, 1200); return }
    // Watch the paper's transform: wait until the fold actually STARTS moving
    // and then fully SETTLES (stable ~220ms) before fading the doc away.
    let last = '', started = false, stable = 0, elapsed = 0
    const tick = () => {
      const t = getComputedStyle(sheet).transform
      elapsed += 16
      if (t !== last) { last = t; started = true; stable = 0 }
      else if (started) { stable += 16 }
      if ((started && stable >= 220) || elapsed > 3500) { done(); return }
      requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }

  const dismiss = () => {
    if (preview) { setIdx(0); setResetKey((k) => k + 1); return }
    dismissHint('welcome'); setOpen(false)
  }

  // Paper stack "send-to-back" — like taking the top sheet off a stack and
  // tucking it behind so the next one becomes the top. We clone the current
  // sheet (pixel-perfect), reveal the next page underneath, then lift the clone
  // out (up + toward us), drop it BEHIND the sheet, and slide it back into the
  // stack. Only the paper moves; the blue folder stays still.
  const pageTurn = (next) => {
    const sheet = wrapRef.current?.querySelector('.framer-1qsw93b')
    if (!sheet) { setIdx(next); idxRef.current = next; return }
    turningRef.current = true

    const base = getComputedStyle(sheet).transform
    const baseT = base && base !== 'none' ? base : ''
    const clone = sheet.cloneNode(true)
    clone.style.transform = `${baseT} translate(0px,0px) scale(1)`
    clone.style.transformOrigin = 'center'
    clone.style.transition = 'transform 0.32s cubic-bezier(0.33,0,0.2,1)'
    clone.style.zIndex = '60'          // starts on top of the stack
    clone.style.pointerEvents = 'none'
    sheet.parentNode.appendChild(clone)

    // the next page is revealed underneath, hidden by the clone for now
    setIdx(next); idxRef.current = next

    // Phase 1: lift the top sheet up-and-out (peel it off the stack)
    requestAnimationFrame(() => {
      clone.style.transform = `${baseT} translate(-6px,-46px) scale(1.05)`
    })
    // Phase 2: drop it BEHIND the stack and slide it back down into place
    setTimeout(() => {
      clone.style.zIndex = '-1'        // now behind the real (next) sheet
      clone.style.transition = 'transform 0.34s cubic-bezier(0.33,0,0.2,1)'
      clone.style.transform = `${baseT} translate(0px,0px) scale(0.94)`
    }, 320)
    setTimeout(() => { clone.remove(); turningRef.current = false }, 700)
  }

  // Capture pointerdown BEFORE the component's own tap gesture sees it.
  // All decisions come from the LIVE variant class, so closed / hover-peek /
  // opening taps are always left to the component's native behaviour (this is
  // what mobile needs: its first tap only peeks, the second actually opens).
  const onPointerDownCapture = (e) => {
    if (!isDocOpen()) return                            // native open/peek — don't interfere
    const last = idxRef.current === PAGES.length - 1
    if (!last) {
      e.stopPropagation()             // stop the native tap → it won't close
      if (!turningRef.current) pageTurn(idxRef.current + 1)
      return
    }
    finish()                          // last page → native fold plays, then dismiss
  }

  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') dismiss() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Mobile only: the component's open animation slides the paper far to
              the right (right:-320px) which runs off a phone screen. Keep the
              paper on the card on small screens; desktop keeps the full slide. */}
          <style>{`
            @media (max-width: 768px) {
              .framer-Tg3fG.framer-v-3anvpa .framer-1qsw93b,
              .framer-Tg3fG.framer-v-eq2zab .framer-1qsw93b {
                right: 15px !important; left: unset !important; width: 288px !important;
              }
            }
          `}</style>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}
            onClick={dismiss}
            style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(4,6,12,0.6)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}
          />

          <div style={{ position: 'fixed', inset: 0, zIndex: 1001, pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, perspective: 1600 }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 16 }}
              transition={{ type: 'spring', duration: 1, bounce: 0.2 }}
              style={{ pointerEvents: 'auto' }}
            >
              {/* Card is static; only the cloned paper flips (see pageTurn).
                  The component keeps its native hover/open/close. */}
              <div
                ref={wrapRef}
                onPointerDownCapture={onPointerDownCapture}
                style={{ position: 'relative', transformStyle: 'preserve-3d', perspective: 1400 }}
              >
                <DocumentCard key={resetKey} {...PAGES[idx]} />
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
