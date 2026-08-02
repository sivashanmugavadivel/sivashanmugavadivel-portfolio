/**
 * The Garage — V8 "Showcase Dashboard"
 *
 * Matches the reference: a vertical showcase where each section is a numbered
 * row — left column has the number + label + short description, right column
 * has a full, rich preview card for that section.
 *
 * Dark cinematic. Purple accent. Every preview is a real working mini-dashboard.
 *
 * Sections:
 *   01 Hero            — cinematic banner with bike photo + CTAs
 *   02 Bike Dashboard  — bike + 4 animated stat cards with sparklines
 *   03 What's On My Bike — accessory icon grid with category tabs
 *   04 Recommended     — product cards carousel with coupons
 *   05 Vlogs           — video thumbnail row
 *   06 Ride Map        — Leaflet map + stats + ride list (links to detail)
 *   07 Dream Build     — phase roadmap cards
 *   08 Wishlist        — progress ring + wishlist items
 */

import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, useInView, useScroll, useTransform, useSpring, useMotionValueEvent } from 'framer-motion'
import { bike } from '../data/garage'
import cfg from '../data/config.json'
import RidePassDeck from '../components/garage/RidePassDeck'
import {
  RecommendedAccessories, LatestVlogs, RidesAndRoutes, DreamBuildRoadmap,
  DreamGarageProgress,
} from '../components/garage/ShowcaseSections'

// ─── Tokens (shared with the extracted showcase sections) ────────────────────
import { BG, BD, D2, D3, ACC, ACC2 } from '../components/garage/showcaseTokens'

// Hero background slideshow — auto-rotates every 5s. Replace these later.
const HERO_IMAGES = [
  'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=1920&q=90&auto=format',
  'https://images.unsplash.com/photo-1609630875171-b1321377ee65?w=1920&q=90&auto=format',
  'https://images.unsplash.com/photo-1547549082-6bc09f2049ae?w=1920&q=90&auto=format',
]

// ─── Section row wrapper — replays its reveal every time it scrolls into view ─
function ShowcaseRow({ children, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 32 }}
      viewport={{ once: false, margin: '-80px' }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      style={{ marginBottom: 40 }}
      className="v8-row"
    >
      <div style={{ minWidth: 0 }}>{children}</div>
    </motion.div>
  )
}

// ─── Animated counter — replays each time it scrolls into view ───────────────
function Counter({ end, suffix = '', prefix = '' }) {
  const [v, setV] = useState(0)
  const ref = useRef(null)
  const inView = useInView(ref, { once: false, margin: '-40px' })
  useEffect(() => {
    if (!inView) { setV(0); return }   // reset when out of view, count up when in view
    const steps = 50, inc = end / steps
    let cur = 0
    const id = setInterval(() => {
      cur = Math.min(cur + inc, end)
      setV(Math.floor(cur))
      if (cur >= end) clearInterval(id)
    }, 24)
    return () => clearInterval(id)
  }, [inView, end])
  return <span ref={ref}>{prefix}{v.toLocaleString('en-IN')}{suffix}</span>
}

// ─── Sparkline SVG ────────────────────────────────────────────────────────────
function Sparkline({ data, color = ACC2, height = 40 }) {
  const max = Math.max(...data), min = Math.min(...data)
  const range = max - min || 1
  const w = 120
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * w
    const y = height - ((d - min) / range) * height
    return `${x},${y}`
  }).join(' ')
  const ref = useRef(null)
  const inView = useInView(ref, { once: false })
  return (
    <svg ref={ref} width="100%" height={height} viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="none" style={{ display: 'block' }}>
      <defs>
        <linearGradient id={`spark-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <motion.polyline
        points={pts} fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
        initial={{ pathLength: 0 }} animate={inView ? { pathLength: 1 } : { pathLength: 0 }} transition={{ duration: 1.2, ease: 'easeOut' }}
      />
      <polygon points={`0,${height} ${pts} ${w},${height}`} fill={`url(#spark-${color})`} opacity={inView ? 1 : 0} style={{ transition: 'opacity 0.8s 0.4s' }} />
    </svg>
  )
}

// The Card shell and the Leaflet mini-map moved to
// components/garage/ShowcaseCard.jsx and ShowcaseMiniMap.jsx.

// ════════════════════════════════════════════════════════════════════════════
//  PREVIEW CARDS — one per section
// ════════════════════════════════════════════════════════════════════════════

// 01 · HERO — pinned parallax word flow
// ─────────────────────────────────────────────────────────────────────────────
// A tall scroll TRACK pins a 100vh viewport; background stays static while pinned.
// Each word travels VERTICALLY: it starts far below the viewport (hidden), rises
// up through the centre (big, sharp, purple) and exits over the top (fading).
// On load all words are below the fold → only the background shows. When the
// last word has flowed out, the pin releases and the next section follows — no gap.
const HERO_WORDS = ['RIDE', 'EXPLORE', 'STORIES', 'EXCITEMENT', 'JOURNEY']

const SLOT_VH = 52    // vertical spacing between consecutive words, in vh (smaller = tighter)
const TRACK_VH = 220  // total hero scroll-track height in vh (controls overall pacing)

// One word. `head` = scroll-driven active position (in slot units).
// rel = index - head:
//   rel > 0  → word is still BELOW, rising up toward the centre
//   rel = 0  → centred at normal size
//   rel < 0  → word has been "released": it stays put, EXPANDS and fades out
//              (zooms toward the viewer and disappears — it does NOT travel up).
function FlowWord({ word, index, head, fontSize }) {
  const rel = useTransform(head, h => index - h)

  // Vertical travel: only while incoming (rel > 0) does it sit below and rise to 0.
  // Once released (rel < 0) it holds at the centre (0vh).
  const y = useTransform(rel, r => `${Math.max(r, 0) * SLOT_VH}vh`)

  // (input ranges must be ascending → ordered -0.8 .. 1.2)
  // Scale: released (rel<0) EXPANDS big as it fades; incoming (rel>0) grows into place.
  const scale = useTransform(rel, [-0.8, 0, 1.2], [1.6, 1, 0.78])

  // Incoming tilts up from below; centred & released stay flat.
  const rotateX = useTransform(rel, [0, 1.2], [0, 42])

  // Fade: expanded-away (rel<0) → visible at centre → hidden below (rel>0).
  const opacity = useTransform(rel, [-0.55, 0, 0.5, 1.1], [0, 1, 0.55, 0])

  // Blur: sharp at centre, blurred while expanding away and while incoming.
  const filter = useTransform(rel, [-0.7, 0, 1.0], ['blur(7px)', 'blur(0px)', 'blur(6px)'])

  // Gray glass fill — brightest at the centre.
  const fill = useTransform(rel, [-0.4, 0, 0.4], ['rgba(180,180,190,0.16)', 'rgba(210,210,218,0.32)', 'rgba(180,180,190,0.18)'])

  return (
    <motion.div
      style={{
        position: 'absolute', left: '50%', top: '50%',
        translateX: '-50%', translateY: '-50%',
        width: '100vw', textAlign: 'center',
        y, scale, rotateX, opacity, filter,
        transformPerspective: 1200,
        whiteSpace: 'nowrap', willChange: 'transform, opacity',
      }}
    >
      <motion.span style={{
        display: 'inline-block',
        fontFamily: "'Lilita One', cursive",
        fontSize, fontWeight: 700, letterSpacing: '-0.01em',
        // ── Gray glass: translucent gray fill + soft light edge + glow ──
        color: fill,
        WebkitTextStroke: '1.5px rgba(200,200,210,0.5)',
        textShadow: '0 2px 30px rgba(0,0,0,0.5), 0 0 50px rgba(160,160,175,0.3), 0 1px 0 rgba(255,255,255,0.2)',
        WebkitBackdropFilter: 'blur(2px)',
        backdropFilter: 'blur(2px)',
      }}>
        {word}
      </motion.span>
    </motion.div>
  )
}

function HeroPreview({ fullBleed }) {
  const [bgIndex, setBgIndex] = useState(0)
  const trackRef = useRef(null)
  const words = HERO_WORDS

  // 0 at top of track, 1 exactly when the sticky releases — no gap.
  const { scrollYProgress } = useScroll({ target: trackRef, offset: ['start start', 'end start'] })

  // The sticky child (100vh) inside a TRACK_VH track stays PINNED until the track
  // has scrolled (TRACK_VH-100)vh, i.e. scrollYProgress ≈ (TRACK_VH-100)/TRACK_VH.
  // We want the LAST word centred exactly at that unpin point, so it's fully
  // visible & pinned when it lands — then it expands & fades as the section
  // scrolls away to reveal the next section.
  const UNPIN = (TRACK_VH - 100) / TRACK_VH
  const last = words.length - 1
  const head = useTransform(scrollYProgress, [0, UNPIN, 1], [-1.2, last, last + 0.7])

  // Background slideshow (static, just crossfades)
  useEffect(() => {
    const id = setInterval(() => setBgIndex(i => (i + 1) % HERO_IMAGES.length), 6000)
    return () => clearInterval(id)
  }, [])

  return (
    <div
      ref={trackRef}
      style={{
        position: 'relative',
        width: '100vw',
        marginLeft: 'calc(50% - 50vw)',
        height: `${TRACK_VH}vh`,  // track length → how long the word journey lasts
        background: '#06060c',
      }}
    >
      {/* Sticky viewport — pinned for the whole track, releases cleanly at the end */}
      <div style={{ position: 'sticky', top: 0, height: '100vh', overflow: 'hidden' }}>
        {/* Static background */}
        <div style={{ position: 'absolute', inset: 0 }}>
          {HERO_IMAGES.map((src, i) => (
            <img key={i} src={src} alt="" style={{
              position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
              opacity: i === bgIndex ? 0.42 : 0, transition: 'opacity 1.6s ease-in-out',
            }} />
          ))}
        </div>
        {/* Glow + vignette */}
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 70% 55% at 50% 50%, rgba(139,92,246,0.16) 0%, transparent 60%)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 110% 100% at 50% 50%, transparent 30%, rgba(6,6,12,0.9) 100%)' }} />

        {/* Flowing words */}
        <div style={{ position: 'absolute', inset: 0, perspective: 1200, perspectiveOrigin: '50% 50%' }}>
          {words.map((word, i) => (
            <FlowWord key={i} word={word} index={i} head={head} fontSize="clamp(3.5rem, 14vw, 13rem)" />
          ))}
        </div>

        {/* Scroll hint — fades out once scrolling starts */}
        <motion.div
          style={{ position: 'absolute', bottom: 28, left: '50%', transform: 'translateX(-50%)', zIndex: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, opacity: useTransform(scrollYProgress, [0, 0.06], [1, 0]) }}>
          <div style={{ fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: D2 }}>Scroll</div>
          <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 1.6, repeat: Infinity }}
            style={{ width: 1, height: 36, background: `linear-gradient(to bottom, ${ACC2}, transparent)` }} />
        </motion.div>
      </div>
    </div>
  )
}

// ─── Outlined line icons for the bike dashboard stat cards ───────────────────
const StatIcon = ({ type, color = ACC2 }) => {
  const common = { width: 30, height: 30, fill: 'none', stroke: color, strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round' }
  if (type === 'speedo') return (
    <svg {...common} viewBox="0 0 24 24"><path d="M5 17a8 8 0 1 1 14 0" /><path d="M12 14l3-3" /><circle cx="12" cy="14" r="1" fill={color} /></svg>
  )
  if (type === 'gear') return (
    <svg {...common} viewBox="0 0 24 24"><circle cx="12" cy="12" r="3.2" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
  )
  if (type === 'gauge') return (
    <svg {...common} viewBox="0 0 24 24"><path d="M5 16a8 8 0 1 1 14 0" /><path d="M12 12l4-2.5" /><circle cx="12" cy="13" r="1" fill={color} /></svg>
  )
  if (type === 'camera') return (
    <svg {...common} viewBox="0 0 24 24"><rect x="3" y="7" width="18" height="13" rx="2.5" /><path d="M8 7l1.5-2.5h5L16 7" /><circle cx="12" cy="13.5" r="3.2" /></svg>
  )
  return null
}

// ─── Circular dial gauge (C-shape open at bottom) — for Rides Completed ──────
function DialGauge({ percent = 65, color = ACC2, size = 88 }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: false })
  const cx = 50, cy = 50, r = 38
  const toRad = d => (d * Math.PI) / 180
  // Dial spans 270° — open 90° gap at the bottom. Start 135°, end 405° (=45°).
  const startA = 135, sweep = 270
  const pt = (a) => [cx + r * Math.cos(toRad(a)), cy + r * Math.sin(toRad(a))]
  const [tx, ty] = pt(startA)
  const [ex, ey] = pt(startA + sweep)
  const fullPath = `M ${tx} ${ty} A ${r} ${r} 0 1 1 ${ex} ${ey}`
  const arcLen = (sweep / 360) * 2 * Math.PI * r
  const needleA = startA + sweep * (percent / 100)
  const [nx, ny] = pt(needleA)
  const [nxi, nyi] = [cx + (r - 12) * Math.cos(toRad(needleA)), cy + (r - 12) * Math.sin(toRad(needleA))]
  return (
    <svg ref={ref} width={size} height={size} viewBox="0 0 100 100" style={{ display: 'block', margin: '0 auto', overflow: 'visible' }}>
      {/* Track */}
      <path d={fullPath} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="6" strokeLinecap="round" />
      {/* Value arc */}
      <motion.path d={fullPath} fill="none" stroke={color} strokeWidth="6" strokeLinecap="round"
        strokeDasharray={arcLen}
        initial={{ strokeDashoffset: arcLen }}
        animate={inView ? { strokeDashoffset: arcLen * (1 - percent / 100) } : { strokeDashoffset: arcLen }}
        transition={{ duration: 1.3, ease: 'easeOut' }}
      />
      {/* Needle */}
      <motion.line x1={cx} y1={cy} stroke={color} strokeWidth="2.5" strokeLinecap="round"
        initial={{ x2: pt(startA)[0], y2: pt(startA)[1] }}
        animate={inView ? { x2: nxi, y2: nyi } : { x2: pt(startA)[0], y2: pt(startA)[1] }}
        transition={{ duration: 1.3, ease: 'easeOut' }}
      />
      <circle cx={cx} cy={cy} r="4" fill={color} />
    </svg>
  )
}

// 02 · BIKE DASHBOARD — "Scrapbook" edition
function BikeDashPreview() {

  // ── Bike data ───────────────────────────────────────────────
  const BIKE = {
    marque:   'Royal Enfield',
    model:    'Shotgun 650.',
    color:    'Graphite Black',
    since:    'May 2024',
    location: 'Chennai, IN',
    img:      'https://images.unsplash.com/photo-1609630875171-b1321377ee65?w=1200&q=90&auto=format',
  }

  // ── Scrapbook palette (local to this section) ───────────────
  const PAPER = '#efe4d0'   // aged cream paper
  const INK   = '#2c2418'   // dark sepia text
  const NAVY  = '#1a3a5c'   // pen-ink blue
  const RED   = '#c44'      // stamp / accent red
  const GOLD  = '#5a4a30'   // tobacco brown for secondary text

  // ── Highlight pill (yellow marker underneath) ───────────────
  const hi = {
    background: 'linear-gradient(transparent 55%, #ffe066 55%, #ffe066 95%, transparent 95%)',
    padding: '0 3px',
  }

  // ── The four scattered sticky notes ─────────────────────────
  const stickies = [
    { v: 12500, sf: '+', l1: 'km',     l2: 'ridden',      bg: '#ffe48a', rot: -5, top: '4%',    right: '8%',                delay: 0.85 },
    { v: 15,    sf: '',  l1: 'bits &', l2: 'accessories', bg: '#ffb3a8', rot:  4, top: '38%',   right: '0%',                delay: 1.00 },
    { v: 24,    sf: '',  l1: 'rides',  l2: 'logged',      bg: '#b3e5d0', rot: -3,               right: '14%', bottom: '18%', delay: 1.15 },
    { v: 50,    sf: '+', l1: 'hrs of', l2: 'footage',     bg: '#c8d4f0', rot:  5,               left:  '36%', bottom: '2%',  delay: 1.30 },
  ]

  // ── Sticker rows on the left (color · date · location) ──────
  const stickers = [
    ['●', BIKE.color],
    ['◆', `Bought · ${BIKE.since}`],
    ['▼', BIKE.location],
  ]

  // Standard easings used throughout
  const EASE_POP = [0.4, 1.8, 0.6, 1]   // playful overshoot for stamps + stickies

  return (
    <section className="scrapbook-sec" style={{
      width: '100%', borderRadius: 24, background: PAPER, color: INK,
      padding: 36, position: 'relative', overflow: 'hidden', minHeight: 540,
      fontFamily: "'Special Elite', monospace",
      boxShadow: '0 30px 70px -20px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)',
    }}>

      {/* ── Fonts + texture overlays + media queries + interactions ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@500;600;700&family=Special+Elite&display=swap');

        /* Paper grain */
        .scrapbook-sec::before {
          content: ''; position: absolute; inset: 0; pointer-events: none;
          background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400'><filter id='n5'><feTurbulence baseFrequency='0.85' numOctaves='2'/></filter><rect width='400' height='400' filter='url(%23n5)' opacity='0.5'/></svg>");
          opacity: 0.15; mix-blend-mode: multiply;
        }
        /* Coffee stains */
        .scrapbook-sec::after {
          content: ''; position: absolute; inset: 0; pointer-events: none;
          background:
            radial-gradient(ellipse at 18% 28%, rgba(139,111,58,0.10), transparent 55%),
            radial-gradient(ellipse at 82% 78%, rgba(139,68,34,0.07), transparent 60%);
        }

        .scrapbook-sec .sb-grid {
          display: grid; grid-template-columns: 1fr 1.2fr; gap: 24px;
          position: relative; z-index: 1; min-height: 480px;
        }

        /* Hover interactions */
        .scrapbook-sec .sb-sticky { transition: transform 0.3s cubic-bezier(.4,1.8,.6,1); cursor: default; }
        .scrapbook-sec .sb-sticky:hover { transform: scale(1.08) rotate(var(--rot, 0deg)) !important; z-index: 5; }
        .scrapbook-sec .sb-polaroid { transition: transform 0.4s cubic-bezier(.4,1.8,.6,1); }
        .scrapbook-sec .sb-polaroid:hover { transform: rotate(0deg) scale(1.02) !important; }
        .scrapbook-sec .sb-cta { transition: transform 0.2s; cursor: pointer; }
        .scrapbook-sec .sb-cta:hover { transform: rotate(-1.5deg); }

        @media (max-width: 900px) {
          .scrapbook-sec .sb-grid { grid-template-columns: 1fr !important; }
          .scrapbook-sec .sb-photos { min-height: 460px; }
        }
        @media (max-width: 560px) {
          .scrapbook-sec { padding: 24px !important; }
        }
      `}</style>

      <div className="sb-grid">

        {/* ─────────── LEFT COLUMN ─────────── */}
        <div style={{ padding: '16px 8px', position: 'relative' }}>

          {/* Stamp */}
          <motion.div
            initial={{ opacity: 0, scale: 1.6, rotate: -3 }}
            whileInView={{ opacity: 1, scale: 1, rotate: -3 }}
            exit={{ opacity: 0 }}
            viewport={{ once: false, margin: '-40px' }}
            transition={{ duration: 0.6, delay: 0.1, ease: EASE_POP }}
            style={{
              display: 'inline-block', fontFamily: "'Special Elite', monospace",
              fontSize: '0.62rem', letterSpacing: '0.22em', padding: '6px 14px',
              border: `2px solid ${RED}`, color: RED, textTransform: 'uppercase',
              background: 'rgba(255,248,230,0.4)', marginBottom: 28,
            }}>
            My Garage · 2024
          </motion.div>

          {/* Title block */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, margin: '-40px' }}
              transition={{ duration: 0.6, delay: 0.25, ease: 'easeOut' }}
              style={{
                fontFamily: "'Caveat', cursive", fontSize: '1.3rem', color: GOLD,
                display: 'inline-block', transform: 'rotate(-1.5deg)', marginLeft: 4,
              }}>
              a small profile of
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 18, scale: 0.96 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: false, margin: '-40px' }}
              transition={{ duration: 0.7, delay: 0.30, ease: EASE_POP }}
              style={{
                fontFamily: "'Caveat', cursive", fontWeight: 700,
                fontSize: 'clamp(3rem, 5.5vw, 4.4rem)', lineHeight: 0.92,
                color: NAVY, margin: '2px 0 6px', letterSpacing: '-0.005em',
              }}>
              {BIKE.marque}
            </motion.h2>

            <motion.div
              initial={{ opacity: 0, y: 18, scale: 0.96 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: false, margin: '-40px' }}
              transition={{ duration: 0.7, delay: 0.50, ease: EASE_POP }}
              style={{
                fontFamily: "'Caveat', cursive", fontWeight: 600,
                fontSize: 'clamp(1.8rem, 3vw, 2.4rem)', color: RED,
                display: 'inline-block', transform: 'rotate(-1.5deg)',
                marginLeft: 18, lineHeight: 1,
              }}>
              {BIKE.model}
            </motion.div>
          </div>

          {/* Typewritten note */}
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, margin: '-40px' }}
            transition={{ duration: 0.7, delay: 0.65, ease: 'easeOut' }}
            style={{
              fontFamily: "'Special Elite', monospace", fontSize: '0.88rem',
              lineHeight: 1.65, color: '#4a3c28', marginTop: 28, maxWidth: 360,
            }}>
            Picked her up in <span style={hi}>{BIKE.since}</span>. Graphite black,
            chrome where it counts, garaged in {BIKE.location.split(',')[0]} but
            happiest north of the ghats. <span style={hi}>12,500 km</span> in and
            counting.
          </motion.p>

          {/* Sticker list — color · date · location */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, margin: '-40px' }}
            transition={{ duration: 0.7, delay: 0.80, ease: 'easeOut' }}
            style={{ marginTop: 22, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {stickers.map(([icon, text]) => (
              <div key={text} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                fontFamily: "'Special Elite', monospace",
                fontSize: '0.82rem', color: INK,
              }}>
                <span style={{ width: 22, fontSize: '1rem', textAlign: 'center' }}>{icon}</span>
                <span>{text}</span>
              </div>
            ))}
          </motion.div>

          {/* CTA — handwritten with wavy red underline */}
          <motion.button
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, margin: '-40px' }}
            transition={{ duration: 0.6, delay: 1.0, ease: 'easeOut' }}
            className="sb-cta"
            style={{
              marginTop: 28, fontFamily: "'Caveat', cursive",
              fontSize: '1.7rem', color: NAVY, border: 'none',
              background: 'transparent', padding: '0 2px 4px',
              position: 'relative', display: 'inline-block',
            }}>
            → see her full spec sheet
            <span style={{
              position: 'absolute', left: 0, right: 0, bottom: -4, height: 8,
              backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 8'><path d='M2,5 Q25,1 50,4 T100,5 T150,4 T198,6' stroke='%23c44' stroke-width='2' fill='none' stroke-linecap='round'/></svg>")`,
              backgroundRepeat: 'no-repeat', backgroundSize: '100% 100%',
            }} />
          </motion.button>
        </div>


        {/* ─────────── RIGHT COLUMN — Polaroid + Stickies ─────────── */}
        <div className="sb-photos" style={{ position: 'relative', padding: 10 }}>

          {/* Polaroid */}
          <motion.div
            className="sb-polaroid"
            initial={{ opacity: 0, y: -40, rotate: 10, scale: 0.9 }}
            whileInView={{ opacity: 1, y: 0, rotate: 2, scale: 1 }}
            viewport={{ once: false, margin: '-40px' }}
            transition={{ duration: 1.0, delay: 0.4, ease: EASE_POP }}
            style={{
              position: 'absolute', background: '#fdfbf3',
              padding: '12px 12px 44px',
              boxShadow: '0 16px 32px -8px rgba(60,40,20,0.3), 0 4px 10px -3px rgba(60,40,20,0.18)',
              width: '62%', top: '10%', left: '8%', zIndex: 1,
            }}>
            {/* masking tape */}
            <div style={{
              position: 'absolute', top: -10, left: '50%',
              transform: 'translateX(-50%) rotate(-3deg)',
              width: 90, height: 22, background: 'rgba(255,230,110,0.65)',
              borderLeft: '1px dashed rgba(0,0,0,0.08)',
              borderRight: '1px dashed rgba(0,0,0,0.08)',
            }} />
            <img src={BIKE.img} alt="" style={{
              width: '100%', height: 200, objectFit: 'cover',
              filter: 'saturate(0.85) contrast(0.95) sepia(0.05)', display: 'block',
            }} />
            <div style={{
              fontFamily: "'Caveat', cursive", fontSize: '1.15rem',
              textAlign: 'center', marginTop: 6, color: NAVY, lineHeight: 1,
            }}>
              — her first thousand km
            </div>
          </motion.div>

          {/* Scattered sticky notes */}
          {stickies.map((s, i) => (
            <motion.div key={i}
              className="sb-sticky"
              initial={{ opacity: 0, y: -20, scale: 0.7, rotate: s.rot }}
              whileInView={{ opacity: 1, y: 0, scale: 1, rotate: s.rot }}
              viewport={{ once: false, margin: '-40px' }}
              transition={{ duration: 0.55, delay: s.delay, ease: EASE_POP }}
              style={{
                position: 'absolute', padding: '12px 14px',
                fontFamily: "'Caveat', cursive",
                boxShadow: '0 8px 14px -4px rgba(60,40,20,0.25)',
                minWidth: 110, background: s.bg, zIndex: 2,
                top: s.top, right: s.right, left: s.left, bottom: s.bottom,
                ['--rot']: `${s.rot}deg`,   // used by the :hover rule
              }}>
              <div style={{ fontWeight: 700, fontSize: '1.9rem', lineHeight: 1, color: NAVY }}>
                <Counter end={s.v} suffix={s.sf} />
              </div>
              <div style={{
                fontFamily: "'Special Elite', monospace", fontSize: '0.58rem',
                textTransform: 'uppercase', letterSpacing: '0.08em', color: GOLD,
                marginTop: 4, lineHeight: 1.3,
              }}>
                {s.l1}<br/>{s.l2}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// Ride Pass deck (03 - What's On My Bike) now lives in
// components/garage/RidePassDeck.jsx so /mygarage can share it.


// Sections 04-07 (Recommended, Vlogs, Ride Map, Dream Build) now live in
// components/garage/ShowcaseSections.jsx so /mygarage can share them.

// Section 08 (Wishlist / Dream Garage Progress) also lives in
// components/garage/ShowcaseSections.jsx now.

// ════════════════════════════════════════════════════════════════════════════
//  MAIN PAGE
// ════════════════════════════════════════════════════════════════════════════
export default function GarageV8() {
  return (
    <div style={{ background: BG, minHeight: '100vh' }}>
      {/* Version switcher */}
      <div style={{ position: 'fixed', top: 72, left: '50%', transform: 'translateX(-50%)', zIndex: 60, display: 'flex', background: 'rgba(8,7,14,0.9)', backdropFilter: 'blur(20px)', border: `1px solid ${BD}`, overflow: 'hidden', borderRadius: 999 }} className="sw8">
        {[['Std','/garage'],['V6','/garage/v6'],['V7','/garage/v7'],['V8 ✦',null]].map(([l,to]) => (
          to ? <Link key={l} to={to} style={{ padding:'7px 13px', fontSize:'0.6rem', letterSpacing:'0.1em', textTransform:'uppercase', fontWeight:600, fontFamily:'var(--sans)', color:D3, textDecoration:'none', whiteSpace:'nowrap' }}>{l}</Link>
             : <div key={l} style={{ padding:'7px 13px', fontSize:'0.6rem', letterSpacing:'0.1em', textTransform:'uppercase', fontWeight:700, fontFamily:'var(--sans)', background:ACC, color:'#fff', whiteSpace:'nowrap' }}>{l}</div>
        ))}
        <style>{`@media(max-width:480px){.sw8{display:none!important}}`}</style>
      </div>

      {/* Full-bleed pinned hero — flows directly into the next section */}
      <HeroPreview fullBleed />

      <div style={{ maxWidth: 1440, margin: '0 auto', padding: '40px clamp(20px,4vw,48px) 80px' }}>
        <ShowcaseRow><BikeDashPreview /></ShowcaseRow>
        <ShowcaseRow><RidePassDeck /></ShowcaseRow>
        <ShowcaseRow><RecommendedAccessories /></ShowcaseRow>
        <ShowcaseRow><LatestVlogs /></ShowcaseRow>
        <ShowcaseRow><RidesAndRoutes /></ShowcaseRow>
        <ShowcaseRow><DreamBuildRoadmap /></ShowcaseRow>
        <ShowcaseRow><DreamGarageProgress /></ShowcaseRow>
      </div>

    </div>
  )
}
