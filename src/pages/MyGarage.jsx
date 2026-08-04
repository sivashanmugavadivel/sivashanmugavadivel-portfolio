/* ════════════════════════════════════════════════════════════════
   MY GARAGE — Royal Enfield Bear 650 · scroll-driven 360° spin
   Route: /mygarage  (the "My Garage" item in the navbar)

   37 product frames in /public/bear650 are preloaded, then swapped
   in sequence from scroll position while background layers move at
   different speeds to give the parallax depth.

   Riding on top of the spin is a spec walkthrough: each stop in
   ../data/bear650Specs is tied to one frame, so its callouts pin
   themselves to parts of the bike exactly while those parts face the
   camera — front end on the way past the head-on frames, engine on
   the profile, exhaust as the tail comes round.
   ════════════════════════════════════════════════════════════════ */

import { Fragment, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import MaintenanceLog from '../components/garage/MaintenanceLog'
import FollowTheJourney from '../components/garage/FollowTheJourney'
import BearFireworks from '../components/garage/BearFireworks'
import RouteReel from '../components/garage/RouteReel'
import {
  RecommendedAccessories, RideGallery, RidesAndRoutes, DreamGarageJourney,
} from '../components/garage/ShowcaseSections'
import {
  FRAME_COUNT, LOOPS, HOLD, FADE, SPEC_LAYOUT, SPEC_STOPS,
} from '../data/bear650Specs'

const TRACK_VH = 520     // height of the scroll track, in vh

/* How long the fireworks run for once the bike is on screen. The two
   lettered shells are scheduled inside this window — see BearFireworks. */
const FIREWORKS_MS = 10000

const frameSrc = (i) =>
  `${import.meta.env.BASE_URL}bear650/wild-honey${String(i + 1).padStart(2, '0')}.png`

const FRAMES = Array.from({ length: FRAME_COUNT }, (_, i) => frameSrc(i))

/* the spin runs backwards (37 → 01), so the last frame is what sits on
   screen before the first scroll */
const START_FRAME = FRAME_COUNT - 1

/* Wild Honey tank yellow, sampled from the badge in the frames */
const HONEY = '#e0bb3c'

/* ── Bear 650 marque ──────────────────────────────────────────────
   Machine-traced from the official bear artwork: the outline was
   contour-traced off the source pixels and reduced with
   Douglas-Peucker, so the geometry is exact rather than eyeballed.

   Three subpaths, because the artwork itself is three shapes — the
   body with its two inner legs, plus the fore and hind legs as
   detached wedges.

   No background, filled with `currentColor`, so it takes the colour
   of whatever it sits in and follows the light/dark theme.
   ──────────────────────────────────────────────────────────────── */
const BEAR_VIEWBOX = '27 21 667 362'

/* body+head with the two inner legs, then the detached fore and hind legs */
const BEAR_PATHS = [
  `M263 21 L348 52 L409 43 L412 41 L436 38 L445 35 L457 34 L460 32 L470 32 L549 67
   L572 79 L594 87 L671 122 L672 124 L657 139 L657 141 L687 205 L691 217 L694 218
   L694 220 L681 225 L672 226 L655 233 L630 239 L575 205 L497 206 L424 296 L424 380
   L422 382 L322 382 L321 262 L330 233 L253 178 L252 182 L272 224 L287 261 L286 383
   L181 383 L180 280 L81 181 L38 192 L29 196 L27 195 L79 119 L98 87 L104 81 L105 77
   L123 52 L262 22 Z`,
  'M511 250 L513 252 L515 266 L522 288 L525 306 L528 312 L543 382 L457 381 L457 310 L510 251 Z',
  'M107 256 L150 299 L150 383 L77 383 L92 333 L104 300 L107 257 Z',
]

function BearMark({ height = '1em', style }) {
  return (
    <svg
      viewBox={BEAR_VIEWBOX}
      aria-hidden="true"
      focusable="false"
      style={{ height, width: 'auto', display: 'block', fill: 'currentColor', ...style }}
    >
      {BEAR_PATHS.map((d, i) => <path key={i} d={d} />)}
    </svg>
  )
}

/* ── Loading state ────────────────────────────────────────────────
   The bear draws itself as an outline, then floods with fill, then
   breathes gently until every frame has finished downloading.
   Each of the three shapes is staggered so the body leads and the
   legs follow.
   ──────────────────────────────────────────────────────────────── */
const DRAW_MS = 1500     // outline draw
const FILL_MS = 700      // fill flood, starts as the outline completes
const STAGGER = 120      // per-shape offset

/* Routing unmounts this page when you open a sub-page (the storefront, a ride)
   and remounts it on the way back, so component state can't survive the trip.
   The draw-in is a first-impression flourish, not something to sit through
   every time — this module-level flag outlives the unmount, so a return visit
   skips the deliberate hold and shows the bike as soon as the frames are in
   (which is immediate, since they're already in the browser cache). */
let introPlayed = false

/* Same reasoning, for the fireworks. They mark arriving at the garage, and you
   have not arrived again by pressing back out of a ride page — going off a
   second time reads as the page having reset, which is precisely what a reader
   returning to where they left off does not want to be told. */
let fireworksShown = false

function BearDrawLoader({ height }) {
  const reduce = useReducedMotion()

  return (
    <motion.div
      role="status"
      animate={reduce ? undefined : { opacity: [1, 0.55, 1] }}
      transition={{
        duration: 1.8,
        repeat: Infinity,
        ease: 'easeInOut',
        delay: (DRAW_MS + FILL_MS) / 1000,
      }}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}
    >
      <svg
        viewBox={BEAR_VIEWBOX}
        aria-hidden="true"
        focusable="false"
        style={{ height, width: 'auto', display: 'block', overflow: 'visible' }}
      >
        {BEAR_PATHS.map((d, i) => (
          <motion.path
            key={i}
            d={d}
            fill={HONEY}
            stroke={HONEY}
            strokeWidth={5}
            strokeLinejoin="round"
            initial={reduce ? false : { pathLength: 0, fillOpacity: 0 }}
            animate={{ pathLength: 1, fillOpacity: 1 }}
            transition={{
              pathLength: {
                duration: DRAW_MS / 1000,
                delay: (i * STAGGER) / 1000,
                ease: 'easeInOut',
              },
              fillOpacity: {
                duration: FILL_MS / 1000,
                delay: (DRAW_MS + i * STAGGER) / 1000,
                ease: 'easeOut',
              },
            }}
          />
        ))}
      </svg>
      <span
        style={{
          position: 'absolute',
          width: 1,
          height: 1,
          overflow: 'hidden',
          clip: 'rect(0 0 0 0)',
          clipPath: 'inset(50%)',
        }}
      >
        Loading
      </span>
    </motion.div>
  )
}

/* ── Royal Enfield logotype ────────────────────────────────────────
   The official wordmark vector (Wikimedia Commons, "Royal Enfield
   logo new.svg"), recoloured to `currentColor` instead of brand red
   so it follows the theme. Exact artwork, not a font imitation.
   ──────────────────────────────────────────────────────────────── */
function RELogotype({ height = '1em', style }) {
  return (
    <svg
      viewBox="0 0 306.7 41.1"
      aria-hidden="true"
      focusable="false"
      style={{ height, width: 'auto', display: 'block', fill: 'currentColor', ...style }}
    >
      <path d="M98.3,6.8H89v0.1c0.3,0.5,0.5,1.2,0.5,1.9c0,1.1-0.7,3.1-0.9,4l-5.9,17c-0.8,2.2-0.9,2.8-2.3,4.9v0.1h7.7v-0.1c-0.4-0.7-0.6-1.3-0.6-2c0-1.1,0.5-2.6,0.8-3.4l0.4-1.2h8.4c0,0,0.5,1.5,0.9,2.4c0.3,0.8,0.4,1.6,0.4,2.1c0,0.6-0.1,1.1-0.4,2.1v0.1h11.2v-0.1c-1.2-1.5-1.8-3.2-2.8-6L98.3,6.8z M90.2,23.5l2.6-7.8l0,0l2.7,7.8H90.2z M75.6,28.6c0,2.5,0.2,4.8,1,6.1v0.1h-11v-0.1c1.1-1.9,0.9-3.8,0.9-6v-4.6V23L65,20.1l-5.3-9.9c-0.7-1.4-1.3-2.3-2.4-3.3V6.8h9.6v0.1l5.7,11.6c0,0,1.3-2.6,1.6-3.2c0.6-1.2,1.3-2.6,1.6-3.2c0.5-0.9,1-2.2,1-3.2S76.5,7.4,76.2,7V6.8h7.6v0.1l-7.7,15.2l-0.6,1.1L75.6,28.6L75.6,28.6z M130.9,34.8h-19.7v-0.1c0.8-1.8,0.9-3.3,0.9-6V12.9c0-3.3-0.3-4.6-0.9-5.9V6.9h10.7V7c-0.7,1.9-0.8,3-0.8,6v16.1c1.2,0.2,2.6,0.4,4.1,0.4c3.2,0,4.9-0.3,6.1-0.8h0.3L130.9,34.8z M44.3,6.1c-8.7,0-14.7,5.4-14.7,13c0,11.1,11.8,12.7,15.9,9.1l-0.7-1.4c-3.6,0.7-6.8-2-6.8-8.1c0-4.9,2.6-8,6.2-8c4.2,0,6.8,4.2,6.8,10.3c0,6.9-4,12.1-11.4,12.1c-8.5,0-14.9-6.7-18.9-13.4c4.4-1.7,7-5,7-9.5c0-5.8-4.4-9.9-12.3-9.9h-15v0.1c0.6,1.3,0.9,3.7,0.9,7v21.3c0,2.7-0.1,4.2-0.9,6v0.1h11.1v-0.1c-0.7-1.7-0.9-4-0.9-6c0-3.3,0-5.9,0-5.9c0.1,0,1.2,0,1.4,0c7.7,11.3,16.5,16,25.9,16c13.6,0,21.6-8.6,21.6-18.1C59.5,12.6,53.4,6.1,44.3,6.1z M10.7,18.3V5.6h3.1c3.6,0,5.1,2.1,5.1,5.5c0,4.1-2.4,7.3-6.3,7.3C12,18.3,10.9,18.3,10.7,18.3z M197.2,6.9c-0.6,1.3-0.9,2.7-0.9,5.9v17.4c0.1,1.8,0.2,3,0.9,4.4v0.1h-0.9h-1.8h-3.8c-1.4-0.6-2.9-2.3-4.9-4.4c-1.6-1.7-9.1-10.4-9.1-10.4h-0.1c0,0,0,8.2,0,8.3c-2.2,0.2-4.8,0.8-6.8,1.3v-1.8v-15c0-3.3-0.3-4.6-0.9-5.9V6.7h5.6h2.3l12.7,15.4l0,0v-9.2c0-3.3-0.3-4.6-0.9-5.9V6.9h5.9H197.2L197.2,6.9z M184.1,34.8c-11.1,0.1-13.7,6.1-27.8,6.1c-6.8,0-12.8-1.8-12.8-1.8V39c0.8-1.8,0.9-3.2,0.9-5.9V7.4c0-3.3-0.3-5.7-0.9-7V0.3h22.7l0.7,6.3h0c-1.7-0.7-3.8-0.9-6.8-0.9h-6v10.9h2.9c4.5,0,7.1-0.3,7.8-0.5h0.2v6.6h-0.1c-0.9-0.3-4-0.6-7.7-0.6h-3V33c0,0,3.5,0.8,6.7,0.8c8.4,0,12-3,20.3-3c0.3,0,0.5,0,0.7,0c1.6,1.9,3,3.4,3.6,4C184.9,34.8,184.9,34.8,184.1,34.8z M232.4,12.9v15.9c0,2.7,0.1,4.2,0.9,6v0.1h-10.8v-0.1c0.8-1.8,0.9-3.3,0.9-6V12.9c0-3.3-0.3-4.6-0.9-5.9V6.9h10.8V7C232.7,8.3,232.4,9.6,232.4,12.9z M210.7,19L210.7,19h0.8c4,0,5.3-0.3,5.9-0.4h0.2v5.8h-0.2c-0.8-0.3-2.5-0.6-5.8-0.6h-0.9v3.4v1.4c0,2.8,0.1,4.7,1,6.1v0.1h-10.9v-0.1c0.8-1.8,0.9-3.3,0.9-6V12.9c0-3.3-0.3-4.6-0.9-5.9V6.9h18.6l0.7,5.7H220c-1.3-0.6-3-0.9-5.7-0.9h-3.6v4.6V19z M256.9,29l-0.7,5.8h-12.9l0,0H237v-0.1c0.8-1.8,0.9-3.3,0.9-6V12.9c0-3.3-0.3-4.6-0.9-5.9V6.9h18.6l0.7,5.7h-0.1c-1.3-0.6-3-0.9-5.7-0.9h-3.6v6.4l0,0l0,0h0.7c4,0,5.3-0.3,5.9-0.4h0.2v5.8h-0.2c-0.8-0.3-2.5-0.6-5.8-0.6h-0.9v6.6c1.3,0.2,2.2,0.3,3.7,0.3c3.4,0,4.6-0.2,6-0.8C256.5,29,256.9,29,256.9,29z M306.4,21.7c0,9.6-7,17.1-18.8,17.1c-9.1,0-12-4-23.3-4l0,0h-4.7v-0.1c0.8-1.8,0.9-3.3,0.9-6V12.8c0-3.3-0.3-4.6-0.9-5.9V6.8h10.8v0.1c-0.6,1.3-0.9,3.4-0.9,6v17c6.7,0,9.7,2,15.6,2c8.2,0,12.2-4.5,12.2-10.9c0-5.5-2.8-9.6-7.7-9.6c-0.9,0-2.2,0-3.2,0v17.3c-3,0.1-6.5-0.3-9-1.2V12.8c0-3.3-0.3-4.6-0.9-5.9V6.8h12.7C299.7,6.8,306.4,13.3,306.4,21.7z" />
    </svg>
  )
}

/* ── BEAR650 model logotype ────────────────────────────────────────
   Built as geometry rather than type: a squared, condensed face on a
   46 × 100 glyph grid with a 12-unit stroke, matching the model's
   badge lettering. Every counter is a reverse-wound subpath so the
   whole word is one `currentColor` path.
   ──────────────────────────────────────────────────────────────── */
function Bear650Logotype({ height = '1em', style }) {
  return (
    <svg
      viewBox="0 0 382 100"
      aria-hidden="true"
      focusable="false"
      style={{ height, width: 'auto', display: 'block', fill: 'currentColor', ...style }}
    >
      <path
        d="M0 0 L46 0 L46 100 L0 100 Z M15 15 L15 44 L31 44 L31 15 Z M15 56 L15 85 L31 85 L31 56 Z
           M56 0 L71 0 L71 100 L56 100 Z M56 0 L102 0 L102 15 L56 15 Z M56 43 L91 43 L91 58 L56 58 Z
           M56 85 L102 85 L102 100 L56 100 Z
           M112 0 L158 0 L158 100 L112 100 Z M127 15 L127 40 L143 40 L143 15 Z M127 58 L127 100 L143 100 L143 58 Z
           M168 0 L214 0 L214 100 L168 100 Z M183 15 L183 40 L199 40 L199 15 Z M183 56 L183 100 L193 100 L199 56 Z
           M224 0 L270 0 L270 100 L224 100 Z M239 15 L239 43 L270 43 L270 15 Z M239 58 L239 85 L255 85 L255 58 Z
           M280 0 L326 0 L326 15 L280 15 Z M280 0 L295 0 L295 58 L280 58 Z M280 43 L326 43 L326 58 L280 58 Z
           M311 58 L326 58 L326 100 L311 100 Z M280 85 L326 85 L326 100 L280 100 Z
           M336 0 L382 0 L382 100 L336 100 Z M351 15 L351 85 L367 85 L367 15 Z"
      />
    </svg>
  )
}

/* ── Royal Enfield · Bear 650 lockup ───────────────────────────────
   The official arrangement: brand logotype, bear marque, model name.
   ──────────────────────────────────────────────────────────────── */
function REWordmark({ gap = '0.3em' }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap }}>
      <RELogotype height="0.26em" style={{ flex: 'none' }} />
      <BearMark height="0.4em" style={{ flex: 'none' }} />
      <Bear650Logotype height="0.22em" style={{ flex: 'none' }} />
    </span>
  )
}

/* Scroll reveal for each showcase section below the spin. Spacing is owned by
   the parent's flex `gap`, so this only handles the animation. */
/**
 * `id` doubles as the anchor a sub-page can come back to, e.g. the storefront
 * returns to /mygarage#accessories. scrollMarginTop keeps the fixed navbar
 * from covering the section when it's jumped to.
 */
function RevealRow({ children, id }) {
  return (
    <motion.div
      id={id}
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      style={{ minWidth: 0, scrollMarginTop: 90 }}
    >
      {children}
    </motion.div>
  )
}

/* ── Spec stop visibility ──────────────────────────────────────────
   How far "on" a stop is at scroll position p: a flat plateau around
   its own frame with a smoothstepped ramp either side. Everything the
   callouts do — opacity, leader draw, label slide, panel rise — hangs
   off this one number, published to CSS as `--f`, so a stop costs a
   single style write per scroll frame rather than a React render.
   ──────────────────────────────────────────────────────────────── */
const STEPS = FRAME_COUNT * LOOPS
const HOLD_P = HOLD / STEPS
const FADE_P = FADE / STEPS

function stopFactor(p, at) {
  const d = Math.abs(p - at)
  if (d <= HOLD_P) return 1
  if (d >= HOLD_P + FADE_P) return 0
  const t = 1 - (d - HOLD_P) / FADE_P
  return t * t * (3 - 2 * t)
}

/* Tap a label to open its detail, and to close whichever sibling was open.
   Hover already does this on a mouse, but a phone has no hover, so the
   attribute is toggled directly on the node — no state, because a re-render
   here would fight the scroll loop writing to the same elements. */
function toggleDetail(e) {
  const el = e.currentTarget
  const open = el.hasAttribute('data-open')
  el.closest('.b6-stop')
    ?.querySelectorAll('.b6-chip[data-open]')
    .forEach((n) => n.removeAttribute('data-open'))
  if (!open) el.setAttribute('data-open', '')
}

/* Callouts for one stop — a leader, a dot and a label per pin. All of it
   sits inside the box that carries the bike's own transform, so the pins
   ride with the bike; the labels undo the box's scale via `--pin-inv` so
   their type stays the size it was drawn at. */
function StopPins({ stop, elRef }) {
  return (
    <div ref={elRef} className="b6-stop" style={{ visibility: 'hidden' }}>
      {stop.pins.map((pin, j) => (
        <Fragment key={j}>
          {/* leader line — one element pinned at the part, rotated towards
              the label and drawn outward with scaleX as the stop arrives */}
          <span
            className="b6-lead"
            style={{
              left: `${pin.x * 100}%`,
              top: `${pin.y * 100}%`,
              width: `${pin.lead * 100}%`,
              '--rot': `${pin.angle.toFixed(2)}deg`,
              '--d': j,
            }}
          />
          <span
            className="b6-dot"
            style={{ left: `${pin.x * 100}%`, top: `${pin.y * 100}%`, '--d': j }}
          />
          <span
            className="b6-chip"
            data-al={pin.align}
            data-dh={pin.dh}
            data-vd={pin.vdir}
            style={{ left: `${pin.lx * 100}%`, top: `${pin.ly * 100}%`, '--d': j }}
            onPointerDown={toggleDetail}
          >
            <span className="b6-chip-l">{pin.label}</span>
            <span className="b6-chip-v">{pin.value}</span>
            {/* absolutely positioned, so the collapsed label keeps its own
                width instead of being stretched to fit this. Swallows its own
                taps, or reading the text on a phone would close it. */}
            <span className="b6-chip-d" onPointerDown={(e) => e.stopPropagation()}>
              {pin.detail}
            </span>
          </span>
        </Fragment>
      ))}
    </div>
  )
}

export default function MyGarage() {
  const [loaded, setLoaded] = useState(0)
  const [minElapsed, setMinElapsed] = useState(introPlayed)
  /* Fireworks go up once the bike is actually on screen, not during the
     loader — the display is for the reveal, not the wait. Only the ending is
     held in state, so the effect below never sets state synchronously. */
  /* Read at mount, and only at mount: StrictMode mounts twice but both reads
     happen before the effect below writes, so a first visit still gets them. */
  const [fireworksDone, setFireworksDone] = useState(fireworksShown)
  /* hold the loader until BOTH the frames are in and the draw+fill has
     played out, so a warm cache doesn't flash the animation away */
  const revealed = loaded >= FRAME_COUNT && minElapsed

  /* refs driven imperatively inside rAF — no React re-render per frame */
  const trackRef   = useRef(null)
  const imgsRef    = useRef([])
  const bikeRef    = useRef(null)
  const glowRef    = useRef(null)
  const gridRef    = useRef(null)
  const wordRef    = useRef(null)
  const shadowRef  = useRef(null)
  const hintRef    = useRef(null)
  const curFrame   = useRef(-1)
  const pinsRef    = useRef([])
  const curF       = useRef(SPEC_LAYOUT.map(() => -1))

  /* ── fireworks: five seconds from the reveal, then they fade out ── */
  useEffect(() => {
    if (!revealed) return
    /* Marked as soon as they go up, not when they finish — someone who clicks
       into a ride three seconds in has still seen them arrive. */
    fireworksShown = true
    const t = setTimeout(() => setFireworksDone(true), FIREWORKS_MS)
    return () => clearTimeout(t)
  }, [revealed])

  /* ── let the draw + fill finish before revealing (first visit only) ── */
  useEffect(() => {
    if (introPlayed) return
    const t = setTimeout(
      () => { introPlayed = true; setMinElapsed(true) },
      DRAW_MS + FILL_MS + STAGGER * (BEAR_PATHS.length - 1) + 250,
    )
    return () => clearTimeout(t)
  }, [])

  /* ── preload every frame so the swap never shows a gap ── */
  useEffect(() => {
    let alive = true
    const bump = () => { if (alive) setLoaded((n) => n + 1) }
    const imgs = FRAMES.map((src) => {
      const img = new Image()
      img.onload = bump
      img.onerror = bump
      img.src = src
      return img
    })
    return () => {
      alive = false
      imgs.forEach((img) => { img.onload = null; img.onerror = null })
    }
  }, [])

  /* ── scroll → frame index + parallax offsets ── */
  useEffect(() => {
    if (!revealed) return

    /* The frame stack has just mounted with START_FRAME visible and the rest
       at opacity 0, so that's what `curFrame` has to say — otherwise the first
       paint has nothing to hide and leaves START_FRAME lit underneath whatever
       frame it turns on. Harmless at the top of the page, where the first
       frame computed IS START_FRAME, but arriving deep in the page (e.g.
       /mygarage#accessories coming back from the storefront) lands on a
       different frame and you get two bikes stacked — one static, one
       spinning — until the spin happens to pass frame 36 again. */
    curFrame.current = START_FRAME

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let raf = 0

    const paint = () => {
      raf = 0
      const track = trackRef.current
      if (!track) return

      const span = track.offsetHeight - window.innerHeight
      const p = span > 0
        ? Math.min(1, Math.max(0, -track.getBoundingClientRect().top / span))
        : 0

      /* frame — looped progress wrapped into 0..35, then flipped so the spin
         runs 37 → 01 as you scroll down. Nudged just inside the end so
         scrolling to the very bottom rests on the final frame rather than
         wrapping back round to the first. */
      const steps = FRAME_COUNT * LOOPS
      const forward = Math.floor(Math.min(p * steps, steps - 1e-4)) % FRAME_COUNT
      const frame = FRAME_COUNT - 1 - forward
      if (frame !== curFrame.current) {
        const imgs = imgsRef.current
        if (imgs[curFrame.current]) imgs[curFrame.current].style.opacity = '0'
        if (imgs[frame]) imgs[frame].style.opacity = '1'
        curFrame.current = frame
      }

      if (hintRef.current) hintRef.current.style.opacity = String(Math.max(0, 1 - p * 8))

      /* spec stops — one `--f` per stop drives its whole reveal from CSS.
         Runs before the reduced-motion bail-out: the specs are content,
         so they still appear, just without the movement. */
      for (let i = 0; i < SPEC_LAYOUT.length; i++) {
        const f = stopFactor(p, SPEC_LAYOUT[i].at)
        if (f === curF.current[i]) continue
        const wasOff = curF.current[i] <= 0   // -1 on the very first pass
        curF.current[i] = f
        const el = pinsRef.current[i]
        if (!el) continue
        el.style.setProperty('--f', f.toFixed(3))
        if (f === 0) el.style.visibility = 'hidden'
        else if (wasOff) el.style.visibility = 'visible'
      }

      if (reduce) return

      /* parallax — each layer gets its own speed / direction */
      if (glowRef.current)
        glowRef.current.style.transform = `translate3d(0, ${-p * 160}px, 0) scale(${1 + p * 0.45})`
      if (gridRef.current)
        gridRef.current.style.transform = `translate3d(0, ${p * 220}px, 0)`
      if (wordRef.current)
        wordRef.current.style.transform = `translate3d(${-p * 46}%, ${-p * 30}px, 0)`
      if (shadowRef.current)
        shadowRef.current.style.transform = `translate3d(0, ${p * 90}px, 0) scaleX(${1 - p * 0.25})`
      if (bikeRef.current) {
        /* the pins live inside this box so they track the bike, which means
           they inherit this scale — hand the labels its reciprocal so their
           type stays the size it was drawn at */
        const s = 1 + Math.sin(p * Math.PI) * 0.07
        bikeRef.current.style.transform = `translate3d(0, ${(0.5 - p) * 54}px, 0) scale(${s})`
        bikeRef.current.style.setProperty('--pin-inv', (1 / s).toFixed(4))
      }
    }

    const onScroll = () => { if (!raf) raf = requestAnimationFrame(paint) }

    paint()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      if (raf) cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [revealed])

  return (
    <div style={{ background: 'var(--bg)' }}>
      {/* ─────────── scroll track ─────────── */}
      <div ref={trackRef} style={{ height: `${TRACK_VH}vh`, position: 'relative' }}>
        <div
          style={{
            position: 'sticky',
            top: 0,
            height: '100svh',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Fireworks behind the bike once the loader has handed over —
              they mark the reveal, not the wait. First in the stage so they
              paint behind the bike box and the layers around it, and they
              fade out rather than stopping dead. */}
          <AnimatePresence>
            {revealed && !fireworksDone && (
              <motion.div
                key="fireworks"
                aria-hidden
                exit={{ opacity: 0 }}
                transition={{ duration: 0.7, ease: 'easeOut' }}
                style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
              >
                <BearFireworks />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Every decorative layer is held back while loading so the stage
              stays blank behind the bear, then eases in together.
              Only opacity is animated here — the layers inside own their
              own `transform`, written imperatively from the scroll loop. */}
          <motion.div
            aria-hidden
            initial={false}
            animate={{ opacity: revealed ? 1 : 0 }}
            transition={{ duration: 1.1, ease: 'easeOut', delay: revealed ? 0.3 : 0 }}
            style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
          >
            {/* layer 1 — ambient glow, slowest, drifts up */}
            <div
              ref={glowRef}
              aria-hidden
              style={{
                position: 'absolute',
                inset: '-20% -10%',
                background:
                  'radial-gradient(circle at 50% 55%, rgba(214,141,49,0.32), rgba(214,141,49,0.08) 42%, transparent 68%)',
                willChange: 'transform',
              }}
            />

            {/* layer 2 — grid floor, moves down (opposite direction = depth) */}
            <div
              ref={gridRef}
              aria-hidden
              style={{
                position: 'absolute',
                inset: '-30% -10% -10%',
                backgroundImage:
                  'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)',
                backgroundSize: '64px 64px',
                opacity: 0.35,
                maskImage: 'radial-gradient(ellipse at 50% 60%, #000 20%, transparent 72%)',
                WebkitMaskImage: 'radial-gradient(ellipse at 50% 60%, #000 20%, transparent 72%)',
                willChange: 'transform',
              }}
            />

            {/* layer 3 — oversized wordmark sliding sideways */}
            <div
              ref={wordRef}
              aria-hidden
              style={{
                position: 'absolute',
                top: '50%',
                left: 0,
                marginTop: '-0.42em',
                whiteSpace: 'nowrap',
                fontSize: 'clamp(7rem, 26vw, 23rem)',
                lineHeight: 1,
                color: 'var(--text-h)',
                opacity: 0.07,
                willChange: 'transform',
              }}
            >
              {[0, 1, 2].map((i) => (
                <span key={i} style={{ display: 'inline-flex', alignItems: 'center' }}>
                  <REWordmark />
                  <span style={{ fontSize: '0.4em', opacity: 0.5, padding: '0 0.22em' }}>·</span>
                </span>
              ))}
            </div>

            {/* layer 4 — ground shadow, fastest */}
            <div
              ref={shadowRef}
              aria-hidden
              style={{
                position: 'absolute',
                top: '68%',
                left: '50%',
                width: 'min(70vw, 560px)',
                height: 70,
                marginLeft: 'min(-35vw, -280px)',
                borderRadius: '50%',
                background: 'radial-gradient(ellipse, rgba(0,0,0,0.34), transparent 70%)',
                filter: 'blur(10px)',
                willChange: 'transform',
              }}
            />
          </motion.div>

          {/* ── the 360 frame stack ── */}
          <div
            ref={bikeRef}
            style={{
              position: 'relative',
              width: 'min(88vw, 900px)',
              aspectRatio: '800 / 501',
              willChange: 'transform',
            }}
          >
            {/* loader and bike overlap briefly so one hands over to the other
                instead of popping */}
            <AnimatePresence>
              {!revealed && (
                <motion.div
                  key="loader"
                  exit={{ opacity: 0, scale: 1.35, filter: 'blur(6px)' }}
                  transition={{ duration: 0.6, ease: 'easeIn' }}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <BearDrawLoader height="min(30vw, 190px)" />
                </motion.div>
              )}
            </AnimatePresence>

            {revealed && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
                animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
                style={{ position: 'absolute', inset: 0 }}
              >
                {FRAMES.map((src, i) => (
                  <img
                    key={src}
                    ref={(el) => { imgsRef.current[i] = el }}
                    src={src}
                    alt={i === START_FRAME ? 'Royal Enfield Bear 650 in Wild Honey, 360° view' : ''}
                    aria-hidden={i !== START_FRAME}
                    draggable={false}
                    style={{
                      position: 'absolute',
                      inset: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      opacity: i === START_FRAME ? 1 : 0,
                      userSelect: 'none',
                      filter: 'drop-shadow(0 24px 40px rgba(0,0,0,0.28))',
                    }}
                  />
                ))}
              </motion.div>
            )}

            {/* ── spec callouts ──
                Inside the frame box, so the dots sit at fixed fractions of
                the product image and ride along with the bike's parallax
                drift. Screen readers get the same content as plain text
                further down the page instead. */}
            {revealed && (
              <div className="b6-pins" aria-hidden>
                {SPEC_LAYOUT.map((stop, i) => (
                  <StopPins
                    key={stop.id}
                    stop={stop}
                    elRef={(el) => { pinsRef.current[i] = el }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* The lockup lives in the background layer, so the page title is
              carried invisibly here for assistive tech and search engines. */}
          <h1
            style={{
              position: 'absolute',
              width: 1,
              height: 1,
              margin: 0,
              overflow: 'hidden',
              clip: 'rect(0 0 0 0)',
              clipPath: 'inset(50%)',
              whiteSpace: 'nowrap',
            }}
          >
            Royal Enfield Bear 650
          </h1>

          {/* scroll hint — only once scrolling actually does something.
              The outer element owns the entrance, the inner one owns the
              scroll-driven fade, so the two never fight over `opacity`. */}
          {revealed && (
            <motion.div
              initial={{ opacity: 0, x: '-50%', y: 10 }}
              animate={{ opacity: 1, x: '-50%', y: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut', delay: 0.9 }}
              style={{
                position: 'absolute',
                bottom: 'clamp(20px, 4vh, 40px)',
                left: '50%',
                pointerEvents: 'none',
              }}
            >
              <div
                ref={hintRef}
                style={{
                  fontSize: '0.66rem',
                  letterSpacing: '0.24em',
                  textTransform: 'uppercase',
                  color: 'var(--text)',
                  transition: 'opacity 0.2s',
                }}
              >
                Scroll to spin ↓
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* The callouts above only exist at particular scroll positions, so the
          same figures are carried here as ordinary prose for screen readers,
          for search engines, and for anyone printing the page. */}
      <section className="b6-sr">
        <h2>Royal Enfield Bear 650 specifications</h2>
        {SPEC_STOPS.map((stop) => (
          <div key={stop.id}>
            <h3>{stop.title}</h3>
            <p>{stop.blurb}</p>
            <dl>
              {stop.pins.map((pin, j) => (
                <Fragment key={`pin-${j}`}>
                  <dt>{pin.label}</dt>
                  <dd>{`${pin.value} — ${pin.detail}`}</dd>
                </Fragment>
              ))}
              {stop.stats.map(([k, v], j) => (
                <Fragment key={`stat-${j}`}>
                  <dt>{k}</dt>
                  <dd>{v}</dd>
                </Fragment>
              ))}
            </dl>
          </div>
        ))}
      </section>

      {/* ─────────── garage showcase sections, shared with /garage/v8 ─────────── */}
      <div
        className="mygarage-sections"
        style={{
          width: '90%',
          margin: '0 auto',
          padding: 'clamp(56px, 10vh, 110px) 0 clamp(80px, 14vh, 140px)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'clamp(40px, 7vh, 76px)',
        }}
      >
        <RevealRow id="accessories"><RecommendedAccessories title="Accessories & Add-ons" /></RevealRow>
        {/* The vlogs as stops on a road — see RouteReel. It drives its own
            scroll loop, so it wants the reveal's transform to have settled;
            the component repaints across that first second itself. */}
        <RevealRow id="vlogs"><RouteReel /></RevealRow>
        <RevealRow id="gallery"><RideGallery /></RevealRow>
        <RevealRow id="rides"><RidesAndRoutes /></RevealRow>
        <RevealRow id="journey"><DreamGarageJourney /></RevealRow>
        <RevealRow id="maintenance"><MaintenanceLog /></RevealRow>
        <RevealRow id="follow"><FollowTheJourney /></RevealRow>
      </div>

      <style>{`
        /* a phone has no side space to spare, so give it very nearly all of it */
        @media (max-width: 760px) {
          .mygarage-sections { width: 92% !important; }
        }

        /* ════ spec callouts ════
           Every animated property below reads --f, the 0…1 "how far on is
           this stop" value written by the scroll loop. Nothing here has a
           keyframe timeline: the scroll position *is* the timeline. The
           short transitions only smooth the per-pin stagger (--d) and take
           the steps out of a fast flick of the wheel. */

        .b6-pins { position: absolute; inset: 0; pointer-events: none; }
        .b6-stop { position: absolute; inset: 0; }

        .b6-lead {
          position: absolute;
          height: 1px;
          margin-top: -0.5px;
          background: linear-gradient(90deg,
            color-mix(in srgb, ${HONEY} 35%, transparent), ${HONEY});
          transform-origin: 0 50%;
          transform: rotate(var(--rot)) scaleX(var(--f, 0));
          opacity: calc(var(--f, 0) * 0.9);
          transition:
            transform .42s cubic-bezier(.22, 1, .36, 1) calc(var(--d, 0) * .07s),
            opacity .28s linear calc(var(--d, 0) * .07s);
        }

        .b6-dot {
          position: absolute;
          width: 9px;
          height: 9px;
          margin: -4.5px 0 0 -4.5px;
          border-radius: 50%;
          background: ${HONEY};
          box-shadow: 0 0 0 2px color-mix(in srgb, var(--bg) 70%, transparent),
                      0 0 14px 2px color-mix(in srgb, ${HONEY} 55%, transparent);
          opacity: var(--f, 0);
          transform: scale(calc(var(--pin-inv, 1) * var(--f, 0)));
          transition:
            transform .4s cubic-bezier(.34, 1.56, .64, 1) calc(var(--d, 0) * .07s),
            opacity .24s linear calc(var(--d, 0) * .07s);
        }

        /* the ring only rides along once its dot is actually up, so a stop
           that is scrolled past does not leave a pulse behind */
        .b6-dot::after {
          content: '';
          position: absolute;
          inset: -5px;
          border-radius: 50%;
          border: 1px solid ${HONEY};
          opacity: 0;
          animation: b6-ping 2.4s cubic-bezier(.22, 1, .36, 1) infinite;
        }
        @keyframes b6-ping {
          0%        { transform: scale(.55); opacity: .7; }
          70%, 100% { transform: scale(2.1); opacity: 0; }
        }

        .b6-chip {
          --slide: 14px;
          position: absolute;
          display: flex;
          flex-direction: column;
          gap: 1px;
          padding: 6px 10px 7px;
          border-radius: 9px;
          white-space: nowrap;
          background: color-mix(in srgb, var(--bg) 82%, transparent);
          border: 1px solid color-mix(in srgb, ${HONEY} 32%, var(--border));
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.22);
          backdrop-filter: blur(9px);
          -webkit-backdrop-filter: blur(9px);
          opacity: var(--f, 0);
          transition:
            transform .46s cubic-bezier(.22, 1, .36, 1) calc(var(--d, 0) * .08s),
            opacity .3s linear calc(var(--d, 0) * .08s),
            border-color .2s linear;
          /* the layer around it stays click-through; only the labels
             themselves take the pointer, and only while they are up —
             visibility:hidden takes a faded-out stop out of hit testing */
          pointer-events: auto;
          cursor: help;
        }
        .b6-chip:hover,
        .b6-chip[data-open] {
          border-color: color-mix(in srgb, ${HONEY} 75%, var(--border));
        }

        /* the detail, revealed on hover or on a tap */
        .b6-chip-d {
          position: absolute;
          width: 224px;
          padding: 9px 11px 10px;
          border-radius: 9px;
          white-space: normal;
          font-size: 0.72rem;
          line-height: 1.45;
          color: var(--text);
          background: color-mix(in srgb, var(--bg) 92%, transparent);
          border: 1px solid var(--border);
          box-shadow: 0 14px 34px rgba(0, 0, 0, 0.3);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          opacity: 0;
          pointer-events: none;
          transition: opacity .2s linear, transform .28s cubic-bezier(.22, 1, .36, 1);
        }
        /* hangs off whichever edge of the label has room for it */
        .b6-chip[data-dh="r"] .b6-chip-d { left: -1px; }
        .b6-chip[data-dh="l"] .b6-chip-d { right: -1px; }
        /* and drops or rises depending on how low the label already is */
        .b6-chip[data-vd="d"] .b6-chip-d { top: calc(100% + 7px); transform: translateY(-5px); }
        .b6-chip[data-vd="u"] .b6-chip-d { bottom: calc(100% + 7px); transform: translateY(5px); }

        /* Bridges the gap back to the label. Without it, moving the pointer
           off the label to go and read the detail crosses dead space, the
           label loses :hover, and the detail closes in your face. The detail
           is a descendant of the label, so once the pointer can land on
           either the bridge or the detail, the hover holds. */
        .b6-chip-d::before {
          content: '';
          position: absolute;
          left: 0;
          right: 0;
          height: 10px;
        }
        .b6-chip[data-vd="d"] .b6-chip-d::before { top: -10px; }
        .b6-chip[data-vd="u"] .b6-chip-d::before { bottom: -10px; }

        .b6-chip:hover .b6-chip-d,
        .b6-chip[data-open] .b6-chip-d {
          opacity: 1;
          transform: translateY(0);
          pointer-events: auto;
        }
        .b6-chip[data-al="r"] {
          transform-origin: left center;
          transform: translate(calc((1 - var(--f, 0)) * var(--slide)), -50%)
                     scale(var(--pin-inv, 1));
        }
        .b6-chip[data-al="l"] {
          transform-origin: right center;
          transform: translate(calc(-100% - (1 - var(--f, 0)) * var(--slide)), -50%)
                     scale(var(--pin-inv, 1));
        }
        /* the dotted rule is the affordance: it, plus cursor:help, is what
           says there is more behind this label */
        .b6-chip-l {
          align-self: flex-start;
          padding-bottom: 1px;
          border-bottom: 1px dotted color-mix(in srgb, var(--text) 60%, transparent);
          font-family: var(--mono);
          font-size: 0.56rem;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--text);
          transition: border-color .2s linear, color .2s linear;
        }
        .b6-chip:hover .b6-chip-l,
        .b6-chip[data-open] .b6-chip-l {
          border-bottom-color: ${HONEY};
          color: color-mix(in srgb, ${HONEY} 80%, var(--text));
        }
        .b6-chip-v {
          font-size: 0.82rem;
          font-weight: 600;
          color: var(--text-h);
        }

        /* Shrink the callouts to suit a phone-sized bike. */
        @media (max-width: 700px) {
          .b6-chip { padding: 4px 8px 5px; border-radius: 7px; }
          .b6-chip-v { font-size: 0.72rem; }
          .b6-chip-l { font-size: 0.5rem; }
          .b6-chip-d { width: min(200px, 62vw); font-size: 0.68rem; }
          .b6-dot { width: 7px; height: 7px; margin: -3.5px 0 0 -3.5px; }
        }

        /* The specs are content, so they still arrive — they just stop
           sliding and pulsing their way in. */
        @media (prefers-reduced-motion: reduce) {
          .b6-lead { transform: rotate(var(--rot)) scaleX(1); }
          .b6-dot  { transform: scale(1); }
          .b6-dot::after { animation: none; }
          .b6-chip { --slide: 0px; }
          .b6-chip[data-vd] .b6-chip-d { transform: none; }
        }

        /* ════ the same specs as plain text, for screen readers ════ */
        .b6-sr {
          position: absolute;
          width: 1px;
          height: 1px;
          overflow: hidden;
          clip: rect(0 0 0 0);
          clip-path: inset(50%);
          white-space: nowrap;
        }
      `}</style>
    </div>
  )
}
