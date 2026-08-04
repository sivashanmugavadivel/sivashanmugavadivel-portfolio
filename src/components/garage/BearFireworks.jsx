/**
 * BearFireworks — the display that goes up behind the bear while /mygarage
 * preloads its 37 spin frames.
 *
 * Rockets climb from the bottom of the stage, stall, and burst into a ring of
 * embers that fall and fade. The palette is the Wild Honey tank yellow the
 * loader itself is drawn in, so the display reads as part of the bear rather
 * than a generic effect.
 *
 * Two things shape the implementation:
 *
 *   - The canvas sits over a themed page, so it can't own its background.
 *     Trails come from erasing a little alpha each frame with
 *     `destination-out` rather than washing the canvas with a dark colour,
 *     which would paint a black rectangle over the light theme.
 *
 *   - This runs while ~11 MB of frames are downloading, so it stays cheap:
 *     three rockets in the air at most, a hard particle cap, and every ember
 *     stamped from a handful of pre-rendered glow sprites instead of being
 *     drawn with shadowBlur.
 *
 * Nothing renders under prefers-reduced-motion.
 */

import { useEffect, useRef } from 'react'
import { useReducedMotion } from 'framer-motion'

/* Wild Honey and its neighbours, plus the site accent for the odd cool burst */
const COLOURS = ['#e0bb3c', '#f3d071', '#ffa63d', '#fff0c4', '#a78bfa']

/* The display sits behind the bike and under the stage's amber glow layer,
   both of which wash it out — hence the fairly generous counts and slow
   decay. It only runs for a few seconds, so the cost is bounded. */
const MAX_ROCKETS = 4
const MAX_EMBERS = 420
const SPRITE = 34        // px box each glow sprite is drawn into

/** One soft radial glow per colour, rendered once and stamped per ember. */
function makeSprites() {
  return COLOURS.map((c) => {
    const s = document.createElement('canvas')
    s.width = s.height = SPRITE
    const g = s.getContext('2d')
    const half = SPRITE / 2
    const grad = g.createRadialGradient(half, half, 0, half, half, half)
    grad.addColorStop(0, '#fff')
    grad.addColorStop(0.35, c)
    grad.addColorStop(1, 'transparent')
    g.fillStyle = grad
    g.beginPath()
    g.arc(half, half, half, 0, Math.PI * 2)
    g.fill()
    return s
  })
}

const rand = (a, b) => a + Math.random() * (b - a)

/* ── the two shells that spell something ──────────────────────────
   Timed from the first frame of the display. Sequenced rather than
   side by side: both form in the same place above the bike, so the
   second only goes up once the first has fallen. */
const TEXT_SHOWS = [
  { at: 400, text: 'Interceptor' },
  { at: 4200, text: 'Bear 650' },
]

/* Rocket gravity, px/frame². Climb time is sqrt(2·distance/g), so this is
   really the pacing dial: the lettered shells use a much stronger pull so
   they reach the top in ~1s, which is what lets both words form, hold and
   fall inside the five seconds. */
const G = 0.22
const G_TEXT = 0.42
const TEXT_FORM = 22      // frames spent flying into the glyph shape
const TEXT_HOLD = 104     // frames held legible before it drops (~1.7s)

/* On-screen gap between lettered embers. Small enough that the strokes read
   as solid glyphs rather than dotted outlines — legibility here comes from
   density, so this is sampled at a fixed *final* spacing rather than by
   decimating to a point count, which left the letters too sparse to read. */
const TEXT_GAP = 4.6
const TEXT_MAX = 950

/** Ember targets that spell `text`, as offsets from the burst centre. */
function textPoints(text, targetW) {
  const off = document.createElement('canvas')
  const g = off.getContext('2d')
  const FONT = px => `900 ${px}px Inter, system-ui, sans-serif`
  const size = 130

  g.font = FONT(size)
  const w = Math.ceil(g.measureText(text).width) + 12
  const h = Math.ceil(size * 1.35)
  off.width = w
  off.height = h
  /* resizing resets the context, so the font has to be set again */
  g.font = FONT(size)
  g.textBaseline = 'middle'
  g.fillStyle = '#fff'
  g.fillText(text, 6, h / 2)

  const { data } = g.getImageData(0, 0, w, h)
  const s = targetW / w
  /* step in source pixels that lands TEXT_GAP apart once scaled */
  const step = Math.max(2, Math.round(TEXT_GAP / s))
  const pts = []
  for (let y = 0; y < h; y += step) {
    for (let x = 0; x < w; x += step) {
      if (data[(y * w + x) * 4 + 3] > 130) {
        pts.push({ x: (x - w / 2) * s, y: (y - h / 2) * s })
      }
    }
  }
  /* backstop for a very wide stage; thins evenly rather than truncating */
  if (pts.length > TEXT_MAX) {
    const keep = Math.ceil(pts.length / TEXT_MAX)
    return { pts: pts.filter((_, i) => i % keep === 0) }
  }
  return { pts }
}

export default function BearFireworks({ active = true }) {
  const canvasRef = useRef(null)
  const rafRef = useRef(0)
  const reduce = useReducedMotion()

  useEffect(() => {
    if (!active || reduce) return
    const cvs = canvasRef.current
    if (!cvs) return
    const ctx = cvs.getContext('2d')
    const sprites = makeSprites()

    let w = 0, h = 0, dpr = 1, scale = 1
    const resize = () => {
      const r = cvs.getBoundingClientRect()
      if (!r.width || !r.height) return
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = r.width
      h = r.height
      cvs.width = Math.round(w * dpr)
      cvs.height = Math.round(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)   // work in CSS pixels
      /* burst radius tracks the stage, so a desktop stage gets big shells
         and a phone doesn't get one burst covering the whole screen */
      scale = Math.max(0.75, Math.min(1.9, Math.min(w, h) / 620))
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(cvs)

    const rockets = []
    const embers = []
    const texts = []

    /* Launch speed is solved from the height it has to reach, so a shell
       actually arrives at its planned altitude instead of stalling early
       and bursting near the floor. */
    const liftFor = (fromY, stopY, g) => -Math.sqrt(2 * g * Math.max(1, fromY - stopY))

    /* true while a lettered shell is climbing or its word is still on screen */
    const wordUp = () => texts.length > 0 || rockets.some(r => r.text)

    const launch = () => {
      if (rockets.length >= MAX_ROCKETS) return
      /* keep the upper band clear while a word is up, so ambient shells
         don't burst straight through the letters and scramble them */
      const stopY = wordUp() ? rand(h * 0.52, h * 0.68) : rand(h * 0.14, h * 0.42)
      rockets.push({
        x: rand(w * 0.1, w * 0.9),
        y: h + 8,
        vx: rand(-0.5, 0.5),
        vy: liftFor(h + 8, stopY, G),
        g: G,
        stopY,
        ci: Math.floor(Math.random() * COLOURS.length),
      })
    }

    /* A shell that spells something. It goes up the middle and bursts high,
       above where the bike sits, so the word isn't hidden behind it. */
    const launchText = (text) => {
      const stopY = h * 0.17
      rockets.push({
        x: w / 2,
        y: h + 8,
        vx: 0,
        vy: liftFor(h + 8, stopY, G_TEXT),
        g: G_TEXT,
        stopY,
        ci: 3,
        text,
      })
    }

    const burst = (x, y, ci) => {
      const n = Math.floor(rand(32, 48))
      const spin = Math.random() * Math.PI
      /* a fast ring plus a slower inner puff reads fuller than one ring */
      for (let i = 0; i < n; i++) {
        if (embers.length >= MAX_EMBERS) break
        const a = spin + (i / n) * Math.PI * 2 + rand(-0.09, 0.09)
        const sp = rand(2.9, 7.8) * scale * (i % 4 === 0 ? 0.55 : 1)
        embers.push({
          x, y,
          vx: Math.cos(a) * sp,
          vy: Math.sin(a) * sp,
          life: 1,
          /* big shells need longer to open, or they fade mid-expansion */
          decay: rand(0.0045, 0.011),
          size: rand(4.4, 9.5) * Math.min(scale, 1.35),
          /* mostly the rocket's colour, with a few sparks off-palette */
          ci: Math.random() < 0.82 ? ci : Math.floor(Math.random() * COLOURS.length),
        })
      }
    }

    /* Embers that fly out of the burst and settle into the glyph shape,
       hold there, then let go and fall like the rest. */
    const burstText = (x, y, text) => {
      const { pts } = textPoints(text, Math.min(w * 0.74, 620))
      for (const p of pts) {
        const a = Math.atan2(p.y, p.x) + rand(-0.3, 0.3)
        const sp = rand(2, 5) * scale
        texts.push({
          x, y,
          vx: Math.cos(a) * sp,
          vy: Math.sin(a) * sp,
          tx: x + p.x,
          ty: y + p.y,
          age: 0,
          life: 1,
          /* small: the glyphs are drawn by how close the embers sit, so fat
             sprites would just bleed the counters shut */
          size: rand(2.9, 3.8) * Math.min(scale, 1.25),
          /* mostly the warm near-white, so the word reads against the stage */
          ci: Math.random() < 0.78 ? 3 : (Math.random() < 0.6 ? 0 : 1),
        })
      }
    }

    let last = 0
    let nextLaunch = 0
    let shown = 0             // how many of TEXT_SHOWS have gone up
    let elapsed = 0

    const frame = (ts) => {
      rafRef.current = requestAnimationFrame(frame)
      if (!w || !h) return
      /* normalise to 60fps steps, and never let a background tab's huge
         first delta fling everything off screen */
      const dt = last ? Math.min(32, ts - last) / 16.667 : 1
      elapsed += last ? Math.min(32, ts - last) : 0
      last = ts

      /* fade what's already drawn instead of clearing, so embers streak.
         destination-out erases alpha, which keeps the canvas transparent —
         a coloured wash here would show as a block over the page. */
      ctx.globalCompositeOperation = 'destination-out'
      ctx.fillStyle = 'rgba(0,0,0,0.14)'
      ctx.fillRect(0, 0, w, h)
      ctx.globalCompositeOperation = 'lighter'

      if (ts > nextLaunch) {
        launch()
        nextLaunch = ts + rand(300, 680)
      }
      /* the lettered shells run to their own clock */
      while (shown < TEXT_SHOWS.length && elapsed >= TEXT_SHOWS[shown].at) {
        launchText(TEXT_SHOWS[shown].text)
        shown++
      }

      for (let i = rockets.length - 1; i >= 0; i--) {
        const r = rockets[i]
        r.x += r.vx * dt
        r.y += r.vy * dt
        r.vy += r.g * dt               // gravity
        const spr = sprites[r.ci]
        const s = 17
        ctx.globalAlpha = 0.95
        ctx.drawImage(spr, r.x - s / 2, r.y - s / 2, s, s)
        /* burst at the planned height, or as soon as it stalls */
        if (r.y <= r.stopY || r.vy >= -0.6) {
          if (r.text) burstText(r.x, r.y, r.text)
          else burst(r.x, r.y, r.ci)
          rockets.splice(i, 1)
        }
      }

      /* ── lettered embers ──
         fly out → settle onto the glyph → hold → let go and fall */
      for (let i = texts.length - 1; i >= 0; i--) {
        const p = texts[i]
        p.age += dt
        if (p.age < TEXT_FORM) {
          /* ease onto the target; the outward kick decays as it arrives */
          p.x += (p.tx - p.x) * 0.16 * dt + p.vx * dt * 0.35
          p.y += (p.ty - p.y) * 0.16 * dt + p.vy * dt * 0.35
          p.vx *= 0.86
          p.vy *= 0.86
        } else if (p.age < TEXT_FORM + TEXT_HOLD) {
          /* snap the last of the gap shut, then shimmer in place */
          p.x += (p.tx - p.x) * 0.3 * dt + rand(-0.16, 0.16)
          p.y += (p.ty - p.y) * 0.3 * dt + rand(-0.16, 0.16)
        } else {
          p.vx = (p.vx + rand(-0.16, 0.16)) * 0.99
          p.vy += 0.06 * dt
          p.x += p.vx * dt
          p.y += p.vy * dt
          p.life -= 0.016 * dt
          if (p.life <= 0) { texts.splice(i, 1); continue }
        }
        /* fade up over the first few frames so it doesn't pop into being */
        const inAlpha = Math.min(1, p.age / 8)
        ctx.globalAlpha = Math.min(1, p.life) * inAlpha
        ctx.drawImage(sprites[p.ci], p.x - p.size / 2, p.y - p.size / 2, p.size, p.size)
      }

      for (let i = embers.length - 1; i >= 0; i--) {
        const p = embers[i]
        p.x += p.vx * dt
        p.y += p.vy * dt
        p.vy += 0.052 * dt             // gravity
        p.vx *= 0.985                  // drag
        p.vy *= 0.985
        p.life -= p.decay * dt
        if (p.life <= 0) { embers.splice(i, 1); continue }
        /* ease the fade so embers hang, then go quickly */
        ctx.globalAlpha = p.life * p.life
        const s = p.size * (0.55 + p.life * 0.75)
        ctx.drawImage(sprites[p.ci], p.x - s / 2, p.y - s / 2, s, s)
      }

      ctx.globalAlpha = 1
    }

    /* one straight away so the display is already up when the bear appears */
    launch()
    nextLaunch = performance.now() + 260
    rafRef.current = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(rafRef.current)
      ro.disconnect()
    }
  }, [active, reduce])

  if (reduce) return null

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
    />
  )
}
