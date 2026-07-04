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
import { Link, useNavigate } from 'react-router-dom'
import { motion, useInView, AnimatePresence, useScroll, useTransform, useSpring, useMotionValueEvent } from 'framer-motion'
import {
  bike, accessories, recommendedAccessories, vlogs,
  routes, dreamGarage, wishlist, rideStats,
} from '../data/garage'
import cfg from '../data/config.json'

// ─── Tokens ───────────────────────────────────────────────────────────────────
const BG   = '#08070e'
const PANEL = '#0e0c17'
const CARD = '#141220'
const CARD2 = '#1a1828'
const BD   = 'rgba(255,255,255,0.07)'
const BD2  = 'rgba(255,255,255,0.12)'
const W    = '#ffffff'
const OFF  = '#f0eef6'
const D1   = 'rgba(240,238,246,0.65)'
const D2   = 'rgba(240,238,246,0.4)'
const D3   = 'rgba(240,238,246,0.22)'
const ACC  = '#8b5cf6'
const ACC2 = '#a78bfa'
const ACCBG = 'rgba(139,92,246,0.12)'

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

// ─── Donut progress ───────────────────────────────────────────────────────────
function Donut({ percent, size = 130, color = ACC, label }) {
  const r = size / 2 - 10
  const circ = 2 * Math.PI * r
  const [anim, setAnim] = useState(0)
  const ref = useRef(null)
  const inView = useInView(ref, { once: false })
  useEffect(() => {
    if (!inView) { setAnim(0); return }   // reset out of view, re-fill when back in view
    let s = null, raf
    const step = ts => {
      if (!s) s = ts
      const p = Math.min((ts - s) / 1300, 1)
      setAnim(p * percent)
      if (p < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [inView, percent])
  return (
    <div ref={ref} style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="9" />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="9" strokeLinecap="round"
          strokeDasharray={`${(circ * anim) / 100} ${circ}`} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: '1.6rem', fontWeight: 800, color: OFF, lineHeight: 1 }}>{Math.round(anim)}%</div>
        {label && <div style={{ fontSize: '0.58rem', color: D2, letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 4 }}>{label}</div>}
      </div>
    </div>
  )
}

// ─── Card shell ───────────────────────────────────────────────────────────────
function Card({ children, style: sx, pad = true }) {
  return (
    <div style={{ background: CARD, border: `1px solid ${BD}`, borderRadius: 16, overflow: 'hidden', padding: pad ? 24 : 0, ...sx }}>
      {children}
    </div>
  )
}

// ─── Leaflet loader (shared) ──────────────────────────────────────────────────
function loadLeaflet() {
  return new Promise(resolve => {
    if (window.L) { resolve(window.L); return }
    if (!document.getElementById('lf-css')) {
      const l = document.createElement('link')
      l.id = 'lf-css'; l.rel = 'stylesheet'
      l.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(l)
    }
    const s = document.createElement('script')
    s.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
    s.onload = () => resolve(window.L)
    document.head.appendChild(s)
  })
}
function ensureMapStyle() {
  if (document.getElementById('v8-map-style')) return
  const s = document.createElement('style')
  s.id = 'v8-map-style'
  s.textContent = `
    @keyframes v8pulse{0%{transform:scale(1);opacity:.7}100%{transform:scale(2.4);opacity:0}}
    .v8tip{background:transparent!important;border:none!important;box-shadow:none!important;padding:0!important}
    .v8tip::before{display:none!important}
    .leaflet-container{background:#08070e!important}
  `
  document.head.appendChild(s)
}

const MAP_CITIES = {
  chennai:    { lat: 13.0827, lng: 80.2707, label: 'Chennai',    home: true },
  yelagiri:   { lat: 12.5793, lng: 78.6393, label: 'Yelagiri'             },
  pondy:      { lat: 11.9416, lng: 79.8083, label: 'Pondicherry'          },
  coimbatore: { lat: 11.0168, lng: 76.9558, label: 'Coimbatore'           },
  rameswaram: { lat:  9.2876, lng: 79.3129, label: 'Rameswaram'           },
}
const MAP_ROUTES = [
  { from: 'chennai',    to: 'yelagiri',   color: '#a78bfa', rid: 'r1' },
  { from: 'chennai',    to: 'pondy',       color: '#f97316', rid: 'r2' },
  { from: 'chennai',    to: 'rameswaram',  color: '#facc15', rid: 'r4' },
  { from: 'coimbatore', to: 'chennai',     color: '#22c55e', rid: 'r3' },
]

function MiniMap({ navigate }) {
  const mapRef = useRef(null)
  const lMap = useRef(null)
  const ioRef = useRef(null)     // intersection observer handle
  const pending = useRef([])     // route line elements that can animate

  // (Re)play the stroke-dash draw animation on all loaded route lines
  const playAnimation = () => {
    pending.current.forEach(({ el, i }) => {
      if (!el || !el.getTotalLength) return
      const len = el.getTotalLength()
      // Reset to hidden (no transition), then animate to drawn
      el.style.transition = 'none'
      el.style.strokeDasharray = len
      el.style.strokeDashoffset = len
      // Force reflow so the reset takes effect before the transition
      void el.getBoundingClientRect()
      el.style.transition = `stroke-dashoffset 1.1s ${0.15 * i}s ease-out`
      requestAnimationFrame(() => { el.style.strokeDashoffset = '0' })
    })
  }

  useEffect(() => {
    let mounted = true
    loadLeaflet().then(L => {
      if (!mounted || !mapRef.current || lMap.current) return
      ensureMapStyle()
      const map = L.map(mapRef.current, { center: [11.4, 78.9], zoom: 7, zoomControl: false, attributionControl: false, scrollWheelZoom: false })
      lMap.current = map
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { subdomains: 'abcd', maxZoom: 19 }).addTo(map)

      // Observe map visibility — replay the route draw every time it enters view
      ioRef.current = new IntersectionObserver(entries => {
        if (entries[0]?.isIntersecting) playAnimation()
      }, { threshold: 0.35 })
      if (mapRef.current) ioRef.current.observe(mapRef.current)

      // Fetch all routes in parallel; draw fully but keep hidden until in view
      MAP_ROUTES.forEach((r, i) => {
        const fc = MAP_CITIES[r.from], tc = MAP_CITIES[r.to]
        const url = `https://router.project-osrm.org/route/v1/driving/${fc.lng},${fc.lat};${tc.lng},${tc.lat}?overview=full&geometries=geojson`
        fetch(url).then(res => res.json()).then(data => {
          if (!mounted || !data.routes?.[0]) return
          const coords = data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng])
          // Glow line behind
          L.polyline(coords, { color: r.color, weight: 7, opacity: 0.12, interactive: false }).addTo(map)
          // Main line — drawn fully at once
          const poly = L.polyline(coords, { color: r.color, weight: 2.5, opacity: 0.9, lineCap: 'round' }).addTo(map)
          poly.on('click', () => navigate(`/garage/v7/rides/${r.rid}`))
          // Pre-hide the line (dash fully offset) so it can animate when in view
          const el = poly.getElement()
          if (el && el.getTotalLength) {
            const len = el.getTotalLength()
            el.style.strokeDasharray = len
            el.style.strokeDashoffset = len
            pending.current.push({ el, i })
            // Play immediately if the map is already in view when data arrives
            const rect = mapRef.current?.getBoundingClientRect()
            if (rect && rect.top < window.innerHeight && rect.bottom > 0) {
              el.style.transition = `stroke-dashoffset 1.1s ${0.15 * i}s ease-out`
              requestAnimationFrame(() => { el.style.strokeDashoffset = '0' })
            }
          }
        }).catch(() => {})
      })
      Object.entries(MAP_CITIES).forEach(([key, c]) => {
        const col = c.home ? '#a78bfa' : '#c4b5fd'
        const sz = c.home ? 14 : 11
        const icon = L.divIcon({ className: '', html: `<div style="position:relative;display:flex;align-items:center;justify-content:center;width:${sz+12}px;height:${sz+12}px">
          <div style="width:${sz}px;height:${sz}px;border-radius:50%;background:${col};border:2px solid rgba(255,255,255,0.85);box-shadow:0 0 8px ${col}88;z-index:2"></div>
          <div style="position:absolute;width:${sz+12}px;height:${sz+12}px;border-radius:50%;background:${col}28;animation:v8pulse 2.2s ease-out infinite;z-index:1"></div></div>`, iconSize: [sz+12, sz+12], iconAnchor: [(sz+12)/2, (sz+12)/2] })
        const dir = ['chennai','pondy','rameswaram'].includes(key) ? 'right' : 'left'
        L.marker([c.lat, c.lng], { icon }).addTo(map).bindTooltip(
          `<div style="background:rgba(8,7,14,0.95);border:1px solid rgba(167,139,250,0.35);color:#f0eef6;font-family:system-ui,sans-serif;font-size:10px;font-weight:700;padding:2px 7px;border-radius:4px;white-space:nowrap">${c.home?'🏍️ ':''}${c.label}</div>`,
          { permanent: true, direction: dir, offset: [dir==='right'?8:-8, 0], className: 'v8tip' })
      })
    })
    return () => {
      mounted = false
      if (ioRef.current) { ioRef.current.disconnect(); ioRef.current = null }
      if (lMap.current) { lMap.current.remove(); lMap.current = null }
    }
  }, [])
  return <div ref={mapRef} style={{ position: 'absolute', inset: 0 }} />
}

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

// ─── Ride Pass helpers ───────────────────────────────────────────────────────
const RP_FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=600&q=80&auto=format',
  'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=600&q=80&auto=format',
  'https://images.unsplash.com/photo-1609630875171-b1321377ee65?w=600&q=80&auto=format',
  'https://images.unsplash.com/photo-1547549082-6bc09f2049ae?w=600&q=80&auto=format',
]
const rpIcon = c =>
    c === 'Navigation'    ? '🗺️'
  : c === 'Camera'        ? '📷'
  : c === 'Safety'        ? '🛡️'
  : c === 'Protection'    ? '🦺'
  : c === 'Touring'       ? '🧳'
  : c === 'Communication' ? '🎧'
  : c === 'Comfort'       ? '🛥'
  :                          '🔧'
const rpImage = (a, i) => a.image || RP_FALLBACK_IMAGES[i % RP_FALLBACK_IMAGES.length]
const rpDate  = a => a.installDate || a.installed || ''
const rpCode  = a => a.code || a.name.toUpperCase().split(' ').slice(0, 2).join(' · ')
const rpLoc   = a => a.location || a.mountLocation || ''
const rpSpec  = a => a.spec || a.quickSpec || ''
const MONO    = "ui-monospace, 'JetBrains Mono', SFMono-Regular, Menlo, monospace"

// ─── Ride pass card (single ticket in the deck) ──────────────────────────────
function RidePassCard({ a, depth, idx, total, exitDir, isTop, onSwipe, onClick }) {
  const num      = String(idx + 1).padStart(2, '0')
  const totalStr = String(total).padStart(2, '0')
  const loc      = rpLoc(a)
  const spec     = rpSpec(a)

  return (
    <motion.div
      initial={{ y: depth * 10 + 30, scale: 1 - depth * 0.04, opacity: 0 }}
      animate={{ y: depth * 10,      scale: 1 - depth * 0.04, opacity: 1 - depth * 0.24 }}
      exit={{ x: 320 * exitDir, opacity: 0, rotate: 18 * exitDir, transition: { duration: 0.4 } }}
      transition={{ type: 'spring', stiffness: 280, damping: 28 }}
      drag={isTop ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.7}
      onDragEnd={(_, info) => {
        if (Math.abs(info.offset.x) > 110) onSwipe(info.offset.x > 0 ? 1 : -1)
      }}
      onClick={isTop ? onClick : undefined}
      style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(135deg, #1a1828 0%, #16131f 100%)',
        border: `1px solid ${BD2}`,
        borderRadius: 14,
        display: 'grid',
        gridTemplateColumns: '220px 1fr 130px',
        overflow: 'hidden',
        cursor: isTop ? 'grab' : 'default',
        zIndex: 10 - depth,
        boxShadow: '0 18px 40px rgba(0,0,0,0.5)',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        pointerEvents: isTop ? 'auto' : 'none',
      }}
      whileTap={isTop ? { cursor: 'grabbing' } : undefined}
    >
      {/* ── Image area ─────────────────────────────────────────── */}
      <div style={{
        position: 'relative',
        backgroundImage: `url(${rpImage(a, idx)})`,
        backgroundSize: 'cover', backgroundPosition: 'center',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(135deg, rgba(20,18,32,0.35) 0%, rgba(20,18,32,0.85) 100%)',
        }} />
        <div style={{
          position: 'absolute', top: 14, left: 14, zIndex: 2,
          fontFamily: MONO, fontSize: 10, letterSpacing: '0.18em',
          color: W, textTransform: 'uppercase', fontWeight: 700,
          background: 'rgba(0,0,0,0.4)',
          backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
          padding: '4px 9px', borderRadius: 4,
          border: '1px solid rgba(255,255,255,0.15)',
        }}>
          {(a.category || 'ACC').slice(0, 4).toUpperCase()} · {num}
        </div>
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 74, height: 74, borderRadius: 18,
          background: 'rgba(139,92,246,0.22)',
          backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid rgba(167,139,250,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '2.2rem', color: W, zIndex: 2,
          boxShadow: '0 8px 20px rgba(0,0,0,0.4)',
        }}>
          {rpIcon(a.category)}
        </div>
        {(loc || spec) && (
          <div style={{
            position: 'absolute', bottom: 14, left: 14, right: 14, zIndex: 2,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            fontFamily: MONO, fontSize: 9.5, letterSpacing: '0.16em',
            color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', fontWeight: 600,
          }}>
            <span>{loc}</span>
            {spec && <span>◆ {spec}</span>}
          </div>
        )}
      </div>

      {/* ── Main: category, name, subtitle, barcode ──────────────── */}
      <div style={{
        padding: '22px 26px', position: 'relative',
        display: 'flex', flexDirection: 'column',
        borderRight: '2px dashed rgba(167,139,250,0.25)',
      }}>
        {/* Perforation cutouts where the dashed line meets the edges */}
        <div style={{ position: 'absolute', right: -9, top: -9, width: 18, height: 18, borderRadius: '50%', background: CARD, border: `1px solid ${BD2}`, zIndex: 3 }} />
        <div style={{ position: 'absolute', right: -9, bottom: -9, width: 18, height: 18, borderRadius: '50%', background: CARD, border: `1px solid ${BD2}`, zIndex: 3 }} />

        <div style={{
          fontFamily: MONO, fontSize: 10.5, letterSpacing: '0.2em',
          color: ACC2, textTransform: 'uppercase', fontWeight: 700, marginBottom: 8,
        }}>
          {a.category}
        </div>
        <div style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: '1.55rem', fontWeight: 500, color: W,
          lineHeight: 1.15, marginBottom: 6, letterSpacing: '-0.01em',
        }}>
          {a.name}
        </div>
        <div style={{ fontSize: 13, color: D1, lineHeight: 1.5, marginBottom: 'auto' }}>
          {a.subtitle || ''}
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', gap: 14,
          paddingTop: 14, borderTop: `1px solid ${BD}`, marginTop: 14,
        }}>
          <div style={{
            height: 32, flex: 1, maxWidth: 280, opacity: 0.9,
            background: 'repeating-linear-gradient(90deg, #f0eef6 0 2px, transparent 2px 3px, #f0eef6 3px 5px, transparent 5px 7px, #f0eef6 7px 8px, transparent 8px 11px, #f0eef6 11px 13px, transparent 13px 14px)',
          }} />
          <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.14em', color: D1, fontWeight: 500 }}>
            {rpCode(a)}
          </div>
        </div>
      </div>

      {/* ── Stub: number / date / status ───────────────────────── */}
      <div style={{
        background: 'rgba(139,92,246,0.05)',
        padding: '18px 14px',
        display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center',
        textAlign: 'center', gap: 14,
      }}>
        <div style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: '2.4rem', color: W, fontWeight: 500, lineHeight: 1,
          fontVariantNumeric: 'tabular-nums',
        }}>
          {num}
          <small style={{ fontFamily: 'var(--sans)', fontSize: '0.9rem', color: D3, fontWeight: 400, marginLeft: 2 }}>
            /{totalStr}
          </small>
        </div>
        {rpDate(a) && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <div style={{
              fontFamily: MONO, fontSize: 8.5, letterSpacing: '0.2em',
              color: D3, textTransform: 'uppercase', fontWeight: 600,
            }}>
              Install
            </div>
            <div style={{
              fontFamily: MONO, fontSize: 13,
              color: OFF, fontWeight: 600, letterSpacing: '0.06em',
            }}>
              {rpDate(a)}
            </div>
          </div>
        )}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 5,
          fontFamily: MONO, fontSize: 10, color: '#22c55e',
          letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700,
        }}>
          <span style={{
            width: 7, height: 7, borderRadius: '50%',
            background: '#22c55e', boxShadow: '0 0 8px #22c55e',
          }} />
          Active
        </div>
      </div>
    </motion.div>
  )
}

// 03 · WHAT'S ON MY BIKE — Ride Pass deck
function SetupPreview() {
  const navigate = useNavigate()
  const [idx, setIdx]         = useState(0)
  const [exitDir, setExitDir] = useState(1)
  const total = accessories.length

  // Only auto-play while the section is actually on screen
  const sectionRef = useRef(null)
  const inView = useInView(sectionRef, { margin: '-25% 0px -25% 0px' })

  // Lock navigation while a card is flying out, so rapid clicks can't stack
  // multiple exit animations (which overflow the layout and collide card keys).
  const lockRef = useRef(false)
  const advance = dir => {
    if (lockRef.current) return
    lockRef.current = true
    setExitDir(dir)
    setIdx(i => (i + 1) % total)
    setTimeout(() => { lockRef.current = false }, 450)
  }
  const retreat = () => {
    if (lockRef.current) return
    lockRef.current = true
    setExitDir(-1)
    setIdx(i => (i - 1 + total) % total)
    setTimeout(() => { lockRef.current = false }, 450)
  }

  // Auto-advance every 5s — but ONLY when the section is in view. The timer is
  // keyed on idx so it resets after each switch (manual nav restarts it too).
  // When the section scrolls out of view, reset back to the first card.
  useEffect(() => {
    if (!inView) { setIdx(0); return }
    const id = setTimeout(() => advance(1), 5000)
    return () => clearTimeout(id)
  }, [idx, total, inView])

  // Build the visible stack — top card + 3 behind, depth 0 is the focused one
  const stack = []
  for (let depth = 3; depth >= 0; depth--) {
    const i = (idx + depth) % total
    stack.push({ a: accessories[i], depth, idx: i })
  }

  const btnBase = {
    width: 52, height: 52, borderRadius: '50%',
    border: `1px solid ${BD2}`,
    background: 'rgba(255,255,255,0.04)',
    color: W,
    cursor: 'pointer',
    fontSize: '1.4rem',
    transition: 'background 0.2s, border-color 0.2s, color 0.2s, transform 0.2s',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: 'var(--sans)',
    zIndex: 30,
  }
  const onBtnEnter = e => {
    e.currentTarget.style.background = 'rgba(139,92,246,0.2)'
    e.currentTarget.style.borderColor = 'rgba(139,92,246,0.5)'
    e.currentTarget.style.color = ACC2
    e.currentTarget.style.transform = 'scale(1.08)'
  }
  const onBtnLeave = e => {
    e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
    e.currentTarget.style.borderColor = BD2
    e.currentTarget.style.color = W
    e.currentTarget.style.transform = 'scale(1)'
  }

  return (
    <div ref={sectionRef}>
      <div style={{ textAlign: 'center', marginBottom: 22 }}>
        <h3 style={{ fontSize: '1.2rem', fontFamily: "'Playfair Display', serif", color: OFF, margin: 0, fontWeight: 500 }}>
          What&apos;s On My Bike?
        </h3>
      </div>

      <div style={{
        position: 'relative',
        display: 'grid',
        gridTemplateColumns: '52px 1fr 52px',
        gap: 24,
        alignItems: 'center',
        width: '100%',
        margin: '0 auto',
        perspective: 1500,
      }} className="ridepass-stage">

        <button onClick={retreat} aria-label="Previous accessory"
                style={btnBase} onMouseEnter={onBtnEnter} onMouseLeave={onBtnLeave}>
          ‹
        </button>

        <div style={{ position: 'relative', height: 215 }} className="ridepass-deck">
          <AnimatePresence mode="popLayout">
            {stack.map(({ a, depth, idx: i }) => (
              <RidePassCard
                key={a.id}
                a={a}
                depth={depth}
                idx={i}
                total={total}
                exitDir={exitDir}
                isTop={depth === 0}
                onSwipe={dir => advance(dir)}
                onClick={() => navigate(`/garage/accessories/${a.id}`)}
              />
            ))}
          </AnimatePresence>
        </div>

        <button onClick={() => advance(1)} aria-label="Next accessory"
                style={btnBase} onMouseEnter={onBtnEnter} onMouseLeave={onBtnLeave}>
          ›
        </button>
      </div>

      {/* Mobile: stack the three columns vertically so cards stay readable */}
      <style>{`
        @media (max-width: 760px) {
          .ridepass-stage { grid-template-columns: 42px 1fr 42px !important; gap: 10px !important; }
          .ridepass-deck  { height: 380px !important; }
          .ridepass-deck > div { grid-template-columns: 1fr !important; grid-template-rows: 140px 1fr 90px !important; }
        }
      `}</style>
    </div>
  )
}

// 04 · RECOMMENDED
function RecommendedPreview() {
  const scroll = useRef(null)
  const items = recommendedAccessories.slice(0, 6)
  const by = dir => scroll.current?.scrollBy({ left: dir * 280, behavior: 'smooth' })
  return (
    <Card>
      <div style={{ textAlign: 'center', marginBottom: 18 }}>
        <h3 style={{ fontSize: '1.2rem', fontFamily: "'Playfair Display', serif", color: OFF, margin: 0 }}>Recommended Accessories</h3>
      </div>
      <div style={{ position: 'relative' }}>
        <button onClick={() => by(-1)} style={{ position: 'absolute', left: -12, top: '50%', transform: 'translateY(-50%)', zIndex: 5, width: 30, height: 30, borderRadius: '50%', background: CARD2, border: `1px solid ${BD}`, color: OFF, cursor: 'pointer' }}>‹</button>
        <button onClick={() => by(1)} style={{ position: 'absolute', right: -12, top: '50%', transform: 'translateY(-50%)', zIndex: 5, width: 30, height: 30, borderRadius: '50%', background: CARD2, border: `1px solid ${BD}`, color: OFF, cursor: 'pointer' }}>›</button>
        <div ref={scroll} style={{ display: 'flex', gap: 12, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 4 }}>
          {items.map((item, i) => (
            <div key={item.id} style={{ minWidth: 240, maxWidth: 240, flexShrink: 0, background: CARD2, border: `1px solid ${BD}`, borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ padding: '14px 14px 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: OFF }}>{item.name}</div>
                    <div style={{ fontSize: '0.62rem', color: D2 }}>{item.subtitle}</div>
                  </div>
                  {item.badge && <span style={{ fontSize: '0.52rem', fontWeight: 700, padding: '2px 7px', background: ACCBG, color: ACC2, borderRadius: 999, letterSpacing: '0.06em' }}>{item.badge}</span>}
                </div>
                <div style={{ height: 90, background: 'rgba(255,255,255,0.03)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', marginBottom: 10 }}>
                  {item.subtitle.includes('Camera') ? '📷' : item.subtitle.includes('Intercom') ? '🎧' : item.subtitle.includes('Box') ? '🧳' : '🗺️'}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginBottom: 10 }}>
                  {item.features.slice(0, 3).map(f => (
                    <div key={f} style={{ fontSize: '0.64rem', color: D1, display: 'flex', gap: 5 }}><span style={{ color: ACC2 }}>•</span>{f}</div>
                  ))}
                </div>
                <div style={{ fontSize: '0.62rem', color: '#f59e0b', marginBottom: 10 }}>{'★'.repeat(Math.round(item.rating))} <span style={{ color: D2 }}>{item.rating} ({item.reviews})</span></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderTop: `1px solid ${BD}` }}>
                <div style={{ padding: '9px', textAlign: 'center', borderRight: `1px solid ${BD}` }}>
                  <span style={{ fontSize: '0.58rem', color: D2 }}>Code: </span>
                  <span style={{ fontSize: '0.68rem', fontWeight: 700, color: ACC2 }}>{item.coupon}</span>
                </div>
                <a href={item.buyUrl} style={{ padding: '9px', textAlign: 'center', background: ACC, color: '#fff', fontSize: '0.68rem', fontWeight: 700, textDecoration: 'none', fontFamily: 'var(--sans)' }}>Buy Now</a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}

// 05 · VLOGS
function VlogsPreview() {
  const featured = vlogs.filter(v => v.category === 'Latest').slice(0, 4)
  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ fontSize: '1.2rem', fontFamily: "'Playfair Display', serif", color: OFF, margin: 0 }}>Latest Vlogs</h3>
        <Link to="/videos" style={{ fontSize: '0.72rem', color: ACC2, textDecoration: 'none' }}>View All →</Link>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 12 }}>
        {featured.map((v, i) => (
          <div key={i} style={{ borderRadius: 10, overflow: 'hidden', background: CARD2, border: `1px solid ${BD}`, cursor: 'pointer' }}>
            <div style={{ position: 'relative', aspectRatio: '16/9' }}>
              <img src={`https://img.youtube.com/vi/${v.id}/mqdefault.jpg`} alt={v.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={e => { e.target.src = 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=320&q=70' }} />
              <span style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(0,0,0,0.8)', color: '#fff', fontSize: '0.6rem', padding: '1px 6px', borderRadius: 3 }}>{v.duration}</span>
            </div>
            <div style={{ padding: '10px 12px' }}>
              <div style={{ fontSize: '0.76rem', fontWeight: 700, color: OFF, lineHeight: 1.3, marginBottom: 3 }}>{v.title}</div>
              <div style={{ fontSize: '0.62rem', color: D2 }}>{v.subtitle}</div>
              <div style={{ fontSize: '0.6rem', color: D3, marginTop: 5 }}>{v.distance ? `${v.distance} · ` : ''}{v.date}</div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

// 06 · RIDE MAP
function RideMapPreview({ navigate }) {
  const completed = routes.filter(r => r.mode === 'completed')
  return (
    <Card pad={false}>
      <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr 200px', minHeight: 280 }} className="ridemap-v8">
        {/* Stats */}
        <div style={{ padding: '20px 18px', borderRight: `1px solid ${BD}` }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: OFF, marginBottom: 16 }}>Rides &amp; Routes</div>
          {[['Total Rides', '24'], ['Total Distance', '12,500+ km'], ['Longest Ride', '570 km'], ['States Explored', '2']].map(([k, v]) => (
            <div key={k} style={{ marginBottom: 14 }}>
              <div style={{ fontSize: '0.58rem', color: D3, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 2 }}>{k}</div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: OFF }}>{v}</div>
            </div>
          ))}
        </div>
        {/* Map */}
        <div style={{ position: 'relative', background: BG }}>
          <MiniMap navigate={navigate} />
        </div>
        {/* List */}
        <div style={{ borderLeft: `1px solid ${BD}`, display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {completed.slice(0, 4).map(r => (
              <div key={r.id} onClick={() => navigate(`/garage/v7/rides/${r.id}`)}
                style={{ padding: '11px 14px', borderBottom: `1px solid ${BD}`, cursor: 'pointer', transition: 'background 0.18s' }}
                onMouseEnter={e => e.currentTarget.style.background = CARD2}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <div style={{ fontSize: '0.74rem', fontWeight: 600, color: OFF, marginBottom: 2 }}>{r.fromCity} → {r.toCity}</div>
                <div style={{ fontSize: '0.6rem', color: D2 }}>{r.distance} · {r.date}</div>
              </div>
            ))}
          </div>
          <button onClick={() => navigate('/garage/v7/rides')} style={{ margin: 12, padding: '8px', background: ACCBG, color: ACC2, border: `1px solid rgba(139,92,246,0.3)`, borderRadius: 8, fontFamily: 'var(--sans)', fontWeight: 600, fontSize: '0.7rem', cursor: 'pointer' }}>View All Rides</button>
        </div>
      </div>
      <style>{`@media(max-width:760px){.ridemap-v8{grid-template-columns:1fr!important}.ridemap-v8>*:first-child,.ridemap-v8>*:last-child{display:none!important}.ridemap-v8>*:nth-child(2){min-height:280px}}`}</style>
    </Card>
  )
}

// 07 · DREAM BUILD ROADMAP
function DreamPreview() {
  const statusC = { completed: '#22c55e', active: ACC2, planned: '#60a5fa', future: D2 }
  const phaseImgs = [
    'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=400&q=80',
    'https://images.unsplash.com/photo-1609630875171-b1321377ee65?w=400&q=80',
    'https://images.unsplash.com/photo-1547549082-6bc09f2049ae?w=400&q=80',
    'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=400&q=80',
  ]
  return (
    <Card>
      <div style={{ textAlign: 'center', marginBottom: 18 }}>
        <h3 style={{ fontSize: '1.2rem', fontFamily: "'Playfair Display', serif", color: OFF, margin: 0 }}>Dream Build Roadmap</h3>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12, position: 'relative' }}>
        {dreamGarage.phases.map((p, i) => {
          const c = statusC[p.status]
          return (
            <div key={p.id} style={{ background: CARD2, border: `1px solid ${p.status === 'active' ? 'rgba(139,92,246,0.4)' : BD}`, borderRadius: 12, overflow: 'hidden', position: 'relative' }}>
              <div style={{ position: 'relative', height: 80 }}>
                <img src={phaseImgs[i]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.55 }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(20,18,32,1), transparent)' }} />
                <div style={{ position: 'absolute', bottom: 8, left: 10 }}>
                  <span style={{ fontSize: '0.55rem', fontWeight: 700, color: c, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{p.status}</span>
                </div>
              </div>
              <div style={{ padding: '10px 12px 14px' }}>
                <div style={{ fontSize: '0.6rem', color: ACC2, fontWeight: 700, letterSpacing: '0.06em' }}>{p.label}</div>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: OFF, marginBottom: 2 }}>{p.title}</div>
                <div style={{ fontSize: '0.58rem', color: D2 }}>{p.items.length} items</div>
              </div>
              {p.status === 'completed' && <div style={{ position: 'absolute', top: 8, right: 8, width: 20, height: 20, borderRadius: '50%', background: c, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', color: '#fff' }}>✓</div>}
            </div>
          )
        })}
      </div>
    </Card>
  )
}

// 08 · WISHLIST
function WishlistPreview() {
  const items = wishlist.filter(w => w.status !== 'dreaming').slice(0, 4)
  const itemImgs = ['🧳', '💡', '🏍️', '🏔️']
  return (
    <Card>
      <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 24, alignItems: 'center' }} className="wishlist-v8-grid">
        {/* Progress ring */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <div style={{ fontSize: '0.7rem', color: D2, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>Dream Garage Progress</div>
          <Donut percent={65} color={ACC} size={130} />
          <div style={{ fontSize: '0.72rem', color: D1, marginTop: 12, fontStyle: 'italic' }}>Keep Riding.<br />Keep Dreaming.</div>
        </div>
        {/* Items */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: 10 }}>
          {items.map((w, i) => (
            <div key={w.id} style={{ background: CARD2, border: `1px solid ${BD}`, borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ height: 60, background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem' }}>{itemImgs[i]}</div>
              <div style={{ padding: '10px 12px' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: OFF, lineHeight: 1.3, marginBottom: 3 }}>{w.name}</div>
                <div style={{ fontSize: '0.78rem', fontWeight: 800, color: ACC2, marginBottom: 8 }}>{w.price >= 100000 ? `₹${(w.price/100000).toFixed(1)}L` : `₹${w.price.toLocaleString('en-IN')}`}</div>
                <button style={{ width: '100%', padding: '6px', background: 'transparent', color: ACC2, border: `1px solid rgba(139,92,246,0.3)`, borderRadius: 6, fontFamily: 'var(--sans)', fontWeight: 600, fontSize: '0.62rem', cursor: 'pointer' }}>Add to Wishlist</button>
              </div>
            </div>
          ))}
        </div>
      </div>
      <style>{`@media(max-width:640px){.wishlist-v8-grid{grid-template-columns:1fr!important}}`}</style>
    </Card>
  )
}

// ════════════════════════════════════════════════════════════════════════════
//  MAIN PAGE
// ════════════════════════════════════════════════════════════════════════════
export default function GarageV8() {
  const navigate = useNavigate()

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
        <ShowcaseRow><SetupPreview /></ShowcaseRow>
        <ShowcaseRow><RecommendedPreview /></ShowcaseRow>
        <ShowcaseRow><VlogsPreview /></ShowcaseRow>
        <ShowcaseRow><RideMapPreview navigate={navigate} /></ShowcaseRow>
        <ShowcaseRow><DreamPreview /></ShowcaseRow>
        <ShowcaseRow><WishlistPreview /></ShowcaseRow>
      </div>

    </div>
  )
}
