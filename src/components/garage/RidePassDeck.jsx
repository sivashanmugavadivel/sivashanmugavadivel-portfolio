/**
 * Ride Pass deck — the "What's On My Bike?" accessory carousel.
 *
 * Extracted from GarageV8 so the Bear 650 page can reuse it instead of
 * duplicating the deck. GarageV8 imports it too, so there is one copy.
 *
 * A stack of four ticket-style cards; the top one is draggable and clicking
 * it opens that accessory's detail page. Auto-advances every 5s, but only
 * while the section is actually on screen.
 */

import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import { accessories } from '../../data/garage'

// ─── Tokens (mirrors GarageV8's palette) ─────────────────────────────────────
const CARD = '#141220'
const BD   = 'rgba(255,255,255,0.07)'
const BD2  = 'rgba(255,255,255,0.12)'
const W    = '#ffffff'
const OFF  = '#f0eef6'
const D1   = 'rgba(240,238,246,0.65)'
const D3   = 'rgba(240,238,246,0.22)'
const ACC2 = '#a78bfa'

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

/**
 * @param {string}  [title]      heading above the deck; pass null to omit it
 * @param {string}  [titleColor] heading colour, for pages with their own palette
 */
export default function RidePassDeck({ title = "What's On My Bike?", titleColor = OFF }) {
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
      {title && (
        <div style={{ textAlign: 'center', marginBottom: 22 }}>
          <h3 style={{ fontSize: '1.2rem', fontFamily: "'Playfair Display', serif", color: titleColor, margin: 0, fontWeight: 500 }}>
            {title}
          </h3>
        </div>
      )}

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
