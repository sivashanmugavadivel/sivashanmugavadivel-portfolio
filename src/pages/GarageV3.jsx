/**
 * The Garage — V3 "WOW" Design
 * Inspired by: Apple product pages, Ducati, BMW Motorrad, Porsche storytelling
 * Design principles:
 *   - Massive whitespace — let content breathe
 *   - ONE accent colour used sparingly (not everywhere)
 *   - Full-viewport cinematic sections with depth
 *   - Typography-led hierarchy (size contrast not just colour)
 *   - Scroll-driven storytelling — each section earns attention
 *   - Dark → Light → Dark rhythm to give eyes a rest
 */

import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  motion, AnimatePresence,
  useScroll, useTransform, useInView, useMotionValue, useSpring,
} from 'framer-motion'
import Lightbox from 'yet-another-react-lightbox'
import 'yet-another-react-lightbox/styles.css'
import {
  bike, accessories, recommendedAccessories, vlogs,
  routes, dreamGarage, wishlist,
  rideStats, costTracker, maintenance,
} from '../data/garage'
import cfg from '../data/config.json'

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  ink:    '#0a0a0f',       // near-black for dark sections
  inkSub: '#111118',
  inkCard:'#16151e',
  white:  '#ffffff',
  offWhite:'#f8f6f2',
  smoke:  '#e8e4dd',
  mist:   '#c8c4bc',
  dim:    'rgba(248,246,242,0.45)',
  dimmer: 'rgba(248,246,242,0.22)',
  accent: '#ff4d00',       // single accent: Ducati/RE orange-red — used SPARINGLY
  accentDim:'rgba(255,77,0,0.1)',
  accentGlow:'rgba(255,77,0,0.25)',
  gold:   '#d4a843',       // secondary — used only for premium moments
}

// Spacing scale
const S = (n) => `${n * 8}px`   // 8px grid

// Type scale
const T = {
  disp:  'clamp(5rem, 12vw, 11rem)',
  h1:    'clamp(3rem, 7vw, 7rem)',
  h2:    'clamp(2rem, 4vw, 4rem)',
  h3:    'clamp(1.4rem, 2.5vw, 2.2rem)',
  lead:  'clamp(1rem, 1.6vw, 1.25rem)',
  body:  '0.95rem',
  sm:    '0.82rem',
  xs:    '0.72rem',
  label: '0.65rem',
}

// Reusable motion presets
const reveal = (delay = 0) => ({
  initial: { opacity: 0, y: 48 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] },
})

const fadeReveal = (delay = 0) => ({
  initial: { opacity: 0 },
  whileInView: { opacity: 1 },
  viewport: { once: true, margin: '-40px' },
  transition: { duration: 1.2, delay, ease: 'easeOut' },
})

// ─── Utility components ───────────────────────────────────────────────────────
const Eyebrow = ({ children, light, centered }) => (
  <p style={{
    fontSize: T.label, letterSpacing: '0.22em', textTransform: 'uppercase',
    fontWeight: 600, fontFamily: 'var(--sans)',
    color: light ? 'rgba(248,246,242,0.4)' : 'rgba(10,10,15,0.4)',
    margin: `0 0 ${S(2)}`,
    textAlign: centered ? 'center' : 'left',
  }}>{children}</p>
)

const Display = ({ children, light, centered }) => (
  <h2 style={{
    fontSize: T.h1,
    fontFamily: 'var(--heading)',
    fontWeight: 700,
    color: light ? C.offWhite : C.ink,
    margin: 0,
    lineHeight: 1.0,
    letterSpacing: '-0.03em',
    textAlign: centered ? 'center' : 'left',
  }}>{children}</h2>
)

const Lead = ({ children, light, centered, style: sx }) => (
  <p style={{
    fontSize: T.lead,
    color: light ? C.dim : 'rgba(10,10,15,0.55)',
    lineHeight: 1.75,
    fontWeight: 300,
    margin: 0,
    letterSpacing: '0.01em',
    textAlign: centered ? 'center' : 'left',
    ...sx,
  }}>{children}</p>
)

const AccentLine = () => (
  <div style={{ width: 40, height: 2, background: C.accent, margin: `${S(3)} 0` }} />
)

const AccentLineCentered = () => (
  <div style={{ width: 40, height: 2, background: C.accent, margin: `${S(3)} auto` }} />
)

// Counter that counts up on scroll-into-view
function Counter({ end, suffix = '', prefix = '', decimals = 0 }) {
  const [val, setVal] = useState(0)
  const ref = useRef(null)
  const seen = useRef(false)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  useEffect(() => {
    if (!inView || seen.current) return
    seen.current = true
    const duration = 1600
    const steps = 60
    const inc = end / steps
    let cur = 0
    const id = setInterval(() => {
      cur = Math.min(cur + inc, end)
      setVal(decimals ? parseFloat(cur.toFixed(decimals)) : Math.floor(cur))
      if (cur >= end) clearInterval(id)
    }, duration / steps)
    return () => clearInterval(id)
  }, [inView, end, decimals])
  return <span ref={ref}>{prefix}{typeof val === 'number' ? val.toLocaleString('en-IN') : val}{suffix}</span>
}

// ─── 01 HERO — Full viewport cinematic ───────────────────────────────────────
const HERO_BG = 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=1920&q=90'

function Hero() {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const imgY = useTransform(scrollYProgress, [0, 1], ['0%', '25%'])
  const textY = useTransform(scrollYProgress, [0, 1], ['0%', '60%'])
  const fade  = useTransform(scrollYProgress, [0, 0.6], [1, 0])

  return (
    <section ref={ref} id="v3-hero" style={{
      height: '100svh', minHeight: 700,
      position: 'relative', overflow: 'hidden',
      display: 'flex', alignItems: 'center',
    }}>
      {/* Parallax photo */}
      <motion.div style={{ position: 'absolute', inset: '-15%', y: imgY }}>
        <img src={HERO_BG} alt="Shotgun 650" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </motion.div>

      {/* Layered dark gradients */}
      <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(105deg, ${C.ink} 0%, rgba(10,10,15,0.75) 45%, rgba(10,10,15,0.1) 100%)` }} />
      <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to top, ${C.ink} 0%, transparent 40%)` }} />

      {/* Content */}
      <motion.div style={{ position: 'relative', zIndex: 2, y: textY, opacity: fade,
        padding: 'clamp(24px,5vw,96px)', maxWidth: '100%', width: '100%' }}>

        <motion.div {...reveal(0)}>
          <Eyebrow light>Royal Enfield Shotgun 650 · Graphite Black · Chennai, India</Eyebrow>
        </motion.div>

        <motion.h1 {...reveal(0.1)} style={{
          fontSize: T.disp,
          fontFamily: 'var(--heading)',
          fontWeight: 700,
          color: C.offWhite,
          lineHeight: 0.92,
          letterSpacing: '-0.04em',
          margin: `${S(2)} 0 ${S(5)}`,
        }}>
          The<br />
          <em style={{ fontStyle: 'italic', color: C.offWhite }}>Garage</em>
          <span style={{ color: C.accent }}>.</span>
        </motion.h1>

        <motion.p {...reveal(0.2)} style={{
          fontSize: T.lead, color: C.dim,
          maxWidth: 480, lineHeight: 1.8,
          fontWeight: 300, marginBottom: S(7),
        }}>
          Every machine tells a story.<br />
          This is mine.
        </motion.p>

        <motion.div {...reveal(0.3)} style={{ display: 'flex', gap: S(2), flexWrap: 'wrap' }}>
          <button
            onClick={() => document.getElementById('v3-bike')?.scrollIntoView({ behavior: 'smooth' })}
            style={{
              padding: `${S(2)} ${S(5)}`,
              background: C.accent, color: C.white,
              border: 'none', cursor: 'pointer',
              fontFamily: 'var(--sans)', fontWeight: 700,
              fontSize: T.xs, letterSpacing: '0.14em', textTransform: 'uppercase',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.03)'; e.currentTarget.style.boxShadow = `0 12px 40px ${C.accentGlow}` }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none' }}
          >
            Explore the Machine
          </button>
          <button
            onClick={() => document.getElementById('v3-vlogs')?.scrollIntoView({ behavior: 'smooth' })}
            style={{
              padding: `${S(2)} ${S(5)}`,
              background: 'transparent', color: C.offWhite,
              border: `1px solid rgba(248,246,242,0.25)`,
              cursor: 'pointer',
              fontFamily: 'var(--sans)', fontWeight: 500,
              fontSize: T.xs, letterSpacing: '0.14em', textTransform: 'uppercase',
              backdropFilter: 'blur(12px)',
            }}
          >
            Watch Rides
          </button>
        </motion.div>
      </motion.div>

      {/* Scroll cue */}
      <motion.div
        animate={{ y: [0, 12, 0] }} transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
        style={{ position: 'absolute', bottom: 40, left: '50%', transform: 'translateX(-50%)', zIndex: 3,
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}
      >
        <div style={{ width: 1, height: 52, background: `linear-gradient(to bottom, transparent, ${C.offWhite}60)` }} />
        <div style={{ width: 5, height: 5, borderRadius: '50%', background: C.offWhite, opacity: 0.4 }} />
      </motion.div>

      {/* Year watermark */}
      <div style={{
        position: 'absolute', bottom: 44, right: 'clamp(24px,5vw,96px)',
        fontSize: '0.6rem', letterSpacing: '0.25em', textTransform: 'uppercase',
        color: 'rgba(248,246,242,0.25)', zIndex: 3,
      }}>
        Since {bike.purchaseDate}
      </div>
    </section>
  )
}

// ─── 02 STATS BAR — dark stripe ───────────────────────────────────────────────
function StatsBar() {
  const items = [
    { value: 12547, suffix: '', label: 'KM Ridden' },
    { value: 47, suffix: '', label: 'Rides' },
    { value: 15, suffix: '', label: 'Accessories' },
    { value: 50, suffix: '+', label: 'Videos' },
    { value: 28.4, suffix: ' km/l', label: 'Avg Mileage', decimals: 1 },
    { value: 142, suffix: ' km/h', label: 'Top Speed' },
  ]

  return (
    <section style={{ background: C.inkSub, padding: `${S(5)} clamp(24px,5vw,96px)` }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 0 }}>
        {items.map((item, i) => (
          <motion.div key={i} {...fadeReveal(i * 0.08)}
            style={{
              flex: '1 1 140px',
              padding: `${S(4)} ${S(5)}`,
              borderLeft: i > 0 ? `1px solid rgba(248,246,242,0.06)` : 'none',
              textAlign: 'center',
            }}>
            <div style={{ fontSize: 'clamp(1.8rem,3vw,2.6rem)', fontWeight: 800, color: C.offWhite, lineHeight: 1, letterSpacing: '-0.03em' }}>
              <Counter end={item.value} suffix={item.suffix} decimals={item.decimals || 0} />
            </div>
            <div style={{ fontSize: T.label, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(248,246,242,0.3)', marginTop: S(1) }}>{item.label}</div>
          </motion.div>
        ))}
      </div>
    </section>
  )
}

// ─── 03 MY BIKE — Light section, full-bleed image ─────────────────────────────
const BIKE_IMG = 'https://images.unsplash.com/photo-1609630875171-b1321377ee65?auto=format&fit=crop&w=1400&q=90'

function BikeSection() {
  const [tab, setTab] = useState('Overview')
  const tabs = ['Overview', 'Performance', 'Dimensions', 'Technology']

  return (
    <section id="v3-bike" style={{ background: C.offWhite }}>
      {/* Intro — light bg, big type */}
      <div style={{ padding: `${S(14)} clamp(24px,5vw,96px) ${S(10)}` }}>
        <motion.div {...reveal()}>
          <Eyebrow>My Machine</Eyebrow>
          <AccentLine />
        </motion.div>
        <motion.div {...reveal(0.1)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: S(6) }}>
          <Display>
            Royal Enfield<br />
            <span style={{ color: C.accent }}>Shotgun 650</span>
          </Display>
          <div style={{ maxWidth: 380 }}>
            <Lead style={{ marginBottom: S(4) }}>{bike.story}</Lead>
            <div style={{ display: 'flex', gap: S(3), flexWrap: 'wrap' }}>
              {[['Color', bike.color], ['Purchased', bike.purchaseDate], ['Odometer', `${bike.odometer.toLocaleString('en-IN')} KM`]].map(([k, v]) => (
                <div key={k} style={{ paddingRight: S(3), borderRight: `1px solid rgba(10,10,15,0.1)` }}>
                  <div style={{ fontSize: T.label, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(10,10,15,0.38)', marginBottom: 3 }}>{k}</div>
                  <div style={{ fontSize: T.sm, fontWeight: 600, color: C.ink }}>{v}</div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Full-bleed image */}
      <motion.div {...fadeReveal()} style={{ width: '100%', height: '72vh', minHeight: 480, overflow: 'hidden', position: 'relative' }}>
        <motion.img
          src={BIKE_IMG} alt="Shotgun 650"
          initial={{ scale: 1.06 }} whileInView={{ scale: 1 }}
          viewport={{ once: true }} transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        {/* Overlay text */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: `${S(8)} clamp(24px,5vw,96px)`,
          background: 'linear-gradient(to top, rgba(248,246,242,1) 0%, rgba(248,246,242,0.6) 40%, transparent 100%)' }}>
          <div style={{ display: 'flex', gap: S(8), flexWrap: 'wrap' }}>
            {bike.quickMetrics.map((m, i) => (
              <div key={i}>
                <div style={{ fontSize: 'clamp(1.4rem,2.5vw,2rem)', fontWeight: 800, color: C.ink, lineHeight: 1 }}>{m.value}</div>
                <div style={{ fontSize: T.label, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(10,10,15,0.4)', marginTop: 4 }}>{m.label}</div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Specs tabs */}
      <div style={{ padding: `${S(10)} clamp(24px,5vw,96px) ${S(14)}` }}>
        {/* Tab bar */}
        <div style={{ display: 'flex', gap: 0, borderBottom: `1px solid rgba(10,10,15,0.1)`, marginBottom: S(7), overflowX: 'auto' }}>
          {tabs.map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: `${S(2)} ${S(5)}`, background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: 'var(--sans)', fontWeight: tab === t ? 700 : 400,
              fontSize: T.sm, letterSpacing: '0.06em',
              color: tab === t ? C.ink : 'rgba(10,10,15,0.38)',
              borderBottom: `2px solid ${tab === t ? C.accent : 'transparent'}`,
              transition: 'all 0.25s', whiteSpace: 'nowrap', marginBottom: -1,
            }}>{t}</button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 1, background: 'rgba(10,10,15,0.08)' }}>
              {(bike.specs[tab.toLowerCase()] || bike.specs.overview).map((s, i) => (
                <div key={i} style={{ padding: `${S(4)} ${S(4)}`, background: C.offWhite }}>
                  <div style={{ fontSize: T.label, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(10,10,15,0.35)', marginBottom: S(1) }}>{s.label}</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 700, color: C.ink }}>{s.value}</div>
                  {s.unit && <div style={{ fontSize: T.xs, color: 'rgba(10,10,15,0.4)', marginTop: 2 }}>{s.unit}</div>}
                </div>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Config comparison */}
        <div style={{ marginTop: S(10) }}>
          <motion.div {...reveal()}>
            <Eyebrow>Configuration</Eyebrow>
            <h3 style={{ fontSize: T.h3, fontFamily: 'var(--heading)', color: C.ink, margin: `${S(1)} 0 ${S(7)}` }}>Factory vs Current vs Future</h3>
          </motion.div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 1, background: 'rgba(10,10,15,0.08)' }}>
            {[
              { title: 'Factory', data: bike.comparison.factory, accent: 'rgba(10,10,15,0.15)' },
              { title: 'Current', data: bike.comparison.current, accent: C.accent },
              { title: 'Future', data: bike.comparison.future, accent: C.gold },
            ].map(({ title, data, accent }) => (
              <div key={title} style={{ background: C.offWhite, padding: S(5) }}>
                <div style={{ width: 28, height: 2, background: accent, marginBottom: S(3) }} />
                <div style={{ fontSize: T.xs, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(10,10,15,0.45)', marginBottom: S(4) }}>{title}</div>
                {data.map(({ field, value }) => (
                  <div key={field} style={{ display: 'flex', justifyContent: 'space-between', gap: S(2), padding: `${S(2)} 0`, borderBottom: `1px solid rgba(10,10,15,0.07)` }}>
                    <span style={{ fontSize: T.sm, color: 'rgba(10,10,15,0.5)' }}>{field}</span>
                    <span style={{ fontSize: T.sm, fontWeight: 600, color: C.ink, textAlign: 'right' }}>{value}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── 04 SETUP — Dark, left-right interactive ──────────────────────────────────
function SetupSection() {
  const [active, setActive] = useState(0)
  const acc = accessories[active]

  return (
    <section id="v3-setup" style={{ background: C.ink, padding: `${S(16)} 0` }}>
      <div style={{ padding: `0 clamp(24px,5vw,96px)`, marginBottom: S(10) }}>
        <motion.div {...reveal()}>
          <Eyebrow light>The Setup</Eyebrow>
          <AccentLine />
          <Display light>What's On<br />My Bike</Display>
        </motion.div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: '60vh' }} className="setup-v3">

        {/* Left — list */}
        <div style={{ borderRight: `1px solid rgba(248,246,242,0.06)` }}>
          {accessories.map((a, i) => (
            <motion.div
              key={a.id} {...reveal(i * 0.05)}
              onClick={() => setActive(i)}
              style={{
                display: 'grid', gridTemplateColumns: '1fr auto',
                padding: `${S(4)} clamp(24px,5vw,96px)`,
                cursor: 'pointer',
                background: active === i ? C.inkCard : 'transparent',
                borderLeft: `3px solid ${active === i ? C.accent : 'transparent'}`,
                transition: 'all 0.25s',
                gap: S(2), alignItems: 'center',
              }}
            >
              <div>
                <div style={{ fontSize: T.xs, letterSpacing: '0.16em', textTransform: 'uppercase', color: active === i ? C.accent : C.dimmer, marginBottom: 4, transition: 'color 0.25s' }}>{a.category}</div>
                <div style={{ fontSize: '1.05rem', fontWeight: 700, color: active === i ? C.offWhite : 'rgba(248,246,242,0.5)', transition: 'color 0.25s' }}>{a.name}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: T.sm, fontWeight: 700, color: active === i ? C.offWhite : C.dimmer }}>₹{a.price.toLocaleString('en-IN')}</div>
                <div style={{ fontSize: T.label, color: C.dimmer, marginTop: 2 }}>{a.purchaseDate}</div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Right — detail */}
        <div style={{ position: 'sticky', top: 80, height: 'fit-content' }}>
          <AnimatePresence mode="wait">
            <motion.div key={acc.id}
              initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              style={{ padding: `${S(8)} clamp(24px,4vw,64px)` }}
            >
              <div style={{ aspectRatio: '4/3', background: C.inkCard, marginBottom: S(6), overflow: 'hidden', position: 'relative' }}>
                <img
                  src={`https://images.unsplash.com/photo-${['1558981806-ec527fa84c39','1609630875171-b1321377ee65','1449426468159-d96dbf08f19f','1558618666-fcd25c85cd64','1547549082-6bc09f2049ae','1571068316344-75bc76f77890','1568772585407-9361f9bf3a87','1558618047-3c8c76ca7d13'][active]}?auto=format&fit=crop&w=800&q=80`}
                  alt={acc.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.7 }}
                />
                <div style={{ position: 'absolute', top: S(3), left: S(3), fontSize: T.label, letterSpacing: '0.16em', textTransform: 'uppercase', padding: `${S(1)} ${S(2)}`, background: C.accent, color: C.white, fontWeight: 700 }}>{acc.category}</div>
              </div>

              <div style={{ fontSize: T.label, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.dimmer, marginBottom: S(1) }}>Installed {acc.purchaseDate}</div>
              <h3 style={{ fontSize: T.h3, fontFamily: 'var(--heading)', color: C.offWhite, margin: `0 0 ${S(3)}`, lineHeight: 1.15 }}>{acc.name}</h3>
              <p style={{ fontSize: T.sm, color: C.dimmer, lineHeight: 1.8, marginBottom: S(5) }}>{acc.reason}</p>

              {/* Rating stars */}
              <div style={{ display: 'flex', gap: 3, marginBottom: S(4) }}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <span key={i} style={{ fontSize: '1rem', color: i < Math.round(acc.rating) ? C.gold : 'rgba(248,246,242,0.15)' }}>★</span>
                ))}
                <span style={{ fontSize: T.xs, color: C.dimmer, marginLeft: 6, alignSelf: 'center' }}>{acc.rating} / 5</span>
              </div>

              <blockquote style={{ borderLeft: `2px solid ${C.accent}`, paddingLeft: S(3), margin: 0 }}>
                <p style={{ fontSize: T.sm, color: C.dimmer, fontStyle: 'italic', lineHeight: 1.7, margin: 0 }}>"{acc.review}"</p>
              </blockquote>

              {acc.coupon && (
                <div style={{ marginTop: S(4), display: 'inline-flex', alignItems: 'center', gap: S(3), padding: `${S(2)} ${S(3)}`, border: `1px solid rgba(248,246,242,0.1)` }}>
                  <span style={{ fontSize: T.xs, color: C.dimmer }}>Coupon</span>
                  <span style={{ fontSize: T.sm, fontWeight: 800, color: C.offWhite, letterSpacing: '0.1em' }}>{acc.coupon}</span>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Summary row */}
      <div style={{ padding: `${S(8)} clamp(24px,5vw,96px) 0`, display: 'flex', gap: S(8), flexWrap: 'wrap', borderTop: `1px solid rgba(248,246,242,0.06)`, marginTop: S(8) }}>
        {[
          ['Total Accessories', `${accessories.length} Installed`],
          ['Total Investment', `₹${accessories.reduce((s, a) => s + a.price, 0).toLocaleString('en-IN')}`],
          ['Favourite', 'Chigee AIO-6'],
        ].map(([k, v]) => (
          <div key={k}>
            <div style={{ fontSize: T.label, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.dimmer, marginBottom: 4 }}>{k}</div>
            <div style={{ fontSize: '1.15rem', fontWeight: 700, color: C.offWhite }}>{v}</div>
          </div>
        ))}
      </div>

      <style>{`@media (max-width: 860px) { .setup-v3 { grid-template-columns: 1fr !important; } }`}</style>
    </section>
  )
}

// ─── 05 RECOMMENDED — Light, horizontal editorial ─────────────────────────────
function RecommendedSection() {
  const [cat, setCat] = useState('favorites')
  const ref = useRef(null)
  const items = recommendedAccessories.filter(a => a.section === cat)

  return (
    <section id="v3-recommended" style={{ background: C.smoke, padding: `${S(16)} 0 ${S(12)}` }}>
      <div style={{ padding: `0 clamp(24px,5vw,96px)`, marginBottom: S(8) }}>
        <motion.div {...reveal()}>
          <Eyebrow>Gear I Trust</Eyebrow>
          <AccentLine />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: S(4) }}>
            <Display>Recommended<br /><span style={{ color: C.accent }}>Accessories</span></Display>
            <div style={{ display: 'flex', gap: 2 }}>
              {[['favorites','My Picks'],['budget','Budget'],['premium','Premium']].map(([id, label]) => (
                <button key={id} onClick={() => setCat(id)} style={{
                  padding: `${S(1.5)} ${S(3)}`, cursor: 'pointer',
                  background: cat === id ? C.ink : 'transparent',
                  color: cat === id ? C.offWhite : 'rgba(10,10,15,0.5)',
                  border: `1px solid ${cat === id ? C.ink : 'rgba(10,10,15,0.15)'}`,
                  fontFamily: 'var(--sans)', fontSize: T.xs, letterSpacing: '0.12em',
                  textTransform: 'uppercase', fontWeight: 600, transition: 'all 0.2s',
                }}>{label}</button>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Horizontal scroll rail */}
      <div ref={ref} style={{ display: 'flex', gap: S(3), overflowX: 'auto', scrollbarWidth: 'none', paddingLeft: 'clamp(24px,5vw,96px)', paddingRight: 'clamp(24px,5vw,96px)', paddingBottom: S(2) }}>
        {items.map((item, i) => (
          <motion.div key={item.id} {...reveal(i * 0.07)}
            style={{
              minWidth: 300, maxWidth: 300, flexShrink: 0,
              background: C.offWhite,
              display: 'flex', flexDirection: 'column',
            }}
          >
            {/* Image */}
            <div style={{ aspectRatio: '4/3', overflow: 'hidden', position: 'relative', background: C.smoke }}>
              <img
                src={`https://images.unsplash.com/photo-${['1547234935-80c7145ec969','1593352216840-4aa2f4e4b671','1558618047-3c8c76ca7d13','1449426468159-d96dbf08f19f','1609630875171-b1321377ee65','1547549082-6bc09f2049ae','1558981803-85e42d2e8d0e','1568772585407-9361f9bf3a87'][i % 8]}?auto=format&fit=crop&w=600&q=80`}
                alt={item.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease' }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              />
              {item.badge && (
                <div style={{ position: 'absolute', top: S(2), left: S(2), background: C.accent, color: C.white, fontSize: T.label, fontWeight: 800, padding: `${S(0.5)} ${S(2)}`, letterSpacing: '0.12em', textTransform: 'uppercase' }}>{item.badge}</div>
              )}
            </div>

            {/* Content */}
            <div style={{ padding: `${S(4)} ${S(4)} ${S(5)}`, flex: 1, display: 'flex', flexDirection: 'column', gap: S(2) }}>
              <div>
                <div style={{ fontSize: T.label, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(10,10,15,0.35)', marginBottom: 4 }}>{item.subtitle}</div>
                <h4 style={{ margin: 0, fontSize: '1.15rem', fontFamily: 'var(--heading)', color: C.ink, fontWeight: 700 }}>{item.name}</h4>
              </div>
              <p style={{ fontSize: T.xs, color: 'rgba(10,10,15,0.5)', lineHeight: 1.7, margin: 0 }}>{item.description}</p>

              <div style={{ flex: 1 }}>
                {item.features.map(f => (
                  <div key={f} style={{ fontSize: T.xs, color: 'rgba(10,10,15,0.55)', display: 'flex', gap: S(1.5), alignItems: 'flex-start', marginBottom: 5 }}>
                    <span style={{ color: C.accent, flexShrink: 0 }}>—</span>{f}
                  </div>
                ))}
              </div>

              {/* Price + coupon */}
              <div style={{ borderTop: `1px solid rgba(10,10,15,0.08)`, paddingTop: S(3), display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '1.15rem', fontWeight: 800, color: C.ink }}>₹{item.price.toLocaleString('en-IN')}</span>
                  <span style={{ marginLeft: S(1), fontSize: T.xs, color: 'rgba(10,10,15,0.35)', textDecoration: 'line-through' }}>₹{item.originalPrice.toLocaleString('en-IN')}</span>
                </div>
                <div style={{ fontSize: T.label, fontWeight: 800, padding: `${S(0.5)} ${S(2)}`, border: `1px solid rgba(10,10,15,0.12)`, color: 'rgba(10,10,15,0.5)', letterSpacing: '0.1em' }}>{item.coupon}</div>
              </div>

              <a href={item.buyUrl} style={{
                display: 'block', padding: `${S(2)} 0`, textAlign: 'center',
                background: C.ink, color: C.offWhite,
                fontFamily: 'var(--sans)', fontWeight: 700,
                fontSize: T.xs, letterSpacing: '0.16em', textTransform: 'uppercase',
                textDecoration: 'none',
                transition: 'background 0.2s',
              }}
                onMouseEnter={e => e.currentTarget.style.background = C.accent}
                onMouseLeave={e => e.currentTarget.style.background = C.ink}
              >
                Buy Now
              </a>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  )
}

// ─── 06 QUOTE BREAK — full-bleed dark ─────────────────────────────────────────
const RIDE_IMG = 'https://images.unsplash.com/photo-1547549082-6bc09f2049ae?auto=format&fit=crop&w=1920&q=85'

function QuoteBreak() {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const s = useTransform(scrollYProgress, [0, 0.5, 1], [1.08, 1.0, 1.08])

  return (
    <section ref={ref} style={{ position: 'relative', height: '65vh', minHeight: 440, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <motion.div style={{ position: 'absolute', inset: '-12%', scale: s }}>
        <img src={RIDE_IMG} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </motion.div>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(10,10,15,0.72)' }} />
      <motion.div {...reveal()} style={{ position: 'relative', zIndex: 2, textAlign: 'center', padding: '0 clamp(24px,8vw,120px)', maxWidth: 800, margin: '0 auto' }}>
        <AccentLineCentered />
        <blockquote style={{ margin: 0 }}>
          <p style={{ fontSize: 'clamp(1.6rem,4vw,3.2rem)', fontFamily: 'var(--heading)', fontStyle: 'italic', color: C.offWhite, lineHeight: 1.25, fontWeight: 500, letterSpacing: '-0.02em' }}>
            "Not all those who wander are lost — some of them just found a better road."
          </p>
        </blockquote>
        <div style={{ marginTop: S(4), fontSize: T.label, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(248,246,242,0.4)' }}>
          Siva Shanmugavadivel · Rider · Explorer
        </div>
      </motion.div>
    </section>
  )
}

// ─── 07 VLOGS — Dark, editorial magazine ──────────────────────────────────────
function VlogsSection() {
  const [playing, setPlaying] = useState(null)
  const latest = vlogs.filter(v => v.category === 'Latest').slice(0, 4)
  const popular = vlogs.filter(v => v.category === 'Popular').slice(0, 5)
  const shorts  = vlogs.filter(v => v.category === 'Shorts').slice(0, 7)

  const thumbErr = (e, fallback) => { e.target.src = fallback }

  return (
    <section id="v3-vlogs" style={{ background: C.ink, padding: `${S(16)} clamp(24px,5vw,96px)` }}>
      <motion.div {...reveal()} style={{ marginBottom: S(10) }}>
        <Eyebrow light>On the Road · Documented</Eyebrow>
        <AccentLine />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: S(4) }}>
          <Display light>Vlogs &<br /><span style={{ color: C.accent }}>Ride Videos</span></Display>
          <a href={cfg.social?.youtube?.href || '#'} target="_blank" rel="noopener noreferrer"
            style={{ fontSize: T.xs, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.dimmer, textDecoration: 'none', borderBottom: `1px solid rgba(248,246,242,0.2)`, paddingBottom: 2, transition: 'color 0.2s, border-color 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.color = C.offWhite; e.currentTarget.style.borderColor = C.offWhite }}
            onMouseLeave={e => { e.currentTarget.style.color = C.dimmer; e.currentTarget.style.borderColor = 'rgba(248,246,242,0.2)' }}
          >Subscribe on YouTube ↗</a>
        </div>
      </motion.div>

      {/* Hero + 3 side */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 2, marginBottom: 2 }} className="vlogs-grid-v3">
        {latest[0] && (
          <motion.div {...fadeReveal()} onClick={() => setPlaying(latest[0])}
            style={{ position: 'relative', aspectRatio: '16/9', cursor: 'pointer', overflow: 'hidden', background: C.inkCard }}>
            <img src={`https://img.youtube.com/vi/${latest[0].id}/maxresdefault.jpg`} alt={latest[0].title}
              style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.6s ease' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.03)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              onError={e => thumbErr(e, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=900&q=80')}
            />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(10,10,15,0.95) 0%, rgba(10,10,15,0.15) 55%, transparent 100%)' }} />
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 68, height: 68, borderRadius: '50%', background: 'rgba(255,77,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.2s', cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                <span style={{ fontSize: '1.5rem', marginLeft: 5 }}>▶</span>
              </div>
            </div>
            <div style={{ position: 'absolute', bottom: S(4), left: S(5), right: S(5) }}>
              <div style={{ fontSize: T.label, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.accent, marginBottom: 6 }}>Latest · {latest[0].date}</div>
              <h3 style={{ margin: `0 0 ${S(1)}`, fontSize: 'clamp(1rem,2vw,1.6rem)', fontFamily: 'var(--heading)', color: C.offWhite, lineHeight: 1.2 }}>{latest[0].title}</h3>
              <div style={{ display: 'flex', gap: S(3), fontSize: T.xs, color: C.dimmer }}>
                {latest[0].distance && <span>📍 {latest[0].distance}</span>}
                <span>⏱ {latest[0].duration}</span>
                <span>👁 {(latest[0].views / 1000).toFixed(1)}K</span>
              </div>
            </div>
          </motion.div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {latest.slice(1, 4).map((v, i) => (
            <motion.div key={i} {...fadeReveal(0.1 + i * 0.08)}
              onClick={() => setPlaying(v)}
              style={{ flex: 1, position: 'relative', cursor: 'pointer', overflow: 'hidden', background: C.inkCard, minHeight: 120 }}>
              <img src={`https://img.youtube.com/vi/${v.id}/mqdefault.jpg`} alt={v.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s' }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                onError={e => thumbErr(e, 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=600&q=80')}
              />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(10,10,15,0.9) 0%, transparent 55%)' }} />
              <div style={{ position: 'absolute', bottom: S(2), left: S(3), right: S(3) }}>
                <div style={{ fontSize: T.xs, fontWeight: 700, color: C.offWhite, lineHeight: 1.3 }}>{v.title}</div>
                <div style={{ fontSize: T.label, color: C.accent, marginTop: 4 }}>{v.duration} · {(v.views / 1000).toFixed(1)}K</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Popular */}
      <div style={{ marginTop: S(10) }}>
        <div style={{ fontSize: T.label, letterSpacing: '0.22em', textTransform: 'uppercase', color: C.dimmer, marginBottom: S(5) }}>Most Watched</div>
        <div style={{ display: 'flex', gap: S(4), overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: S(2) }}>
          {popular.map((v, i) => (
            <motion.div key={i} {...reveal(i * 0.07)} onClick={() => setPlaying(v)}
              style={{ minWidth: 220, cursor: 'pointer', flexShrink: 0 }}>
              <div style={{ position: 'relative', aspectRatio: '16/9', overflow: 'hidden', marginBottom: S(2), background: C.inkCard }}>
                <img src={`https://img.youtube.com/vi/${v.id}/mqdefault.jpg`} alt={v.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s' }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                  onError={e => thumbErr(e, 'https://images.unsplash.com/photo-1547549082-6bc09f2049ae?w=400&q=80')}
                />
                <div style={{ position: 'absolute', top: S(1), left: S(1), width: 24, height: 24, background: C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontWeight: 800, color: C.white }}>#{i + 1}</div>
                <div style={{ position: 'absolute', bottom: S(1), right: S(1), background: 'rgba(10,10,15,0.85)', fontSize: T.label, color: C.offWhite, padding: `2px ${S(1)}` }}>{v.duration}</div>
              </div>
              <div style={{ fontSize: T.sm, color: 'rgba(248,246,242,0.65)', lineHeight: 1.4, marginBottom: 4 }}>{v.title}</div>
              <div style={{ fontSize: T.label, color: C.dimmer }}>{(v.views / 1000).toFixed(1)}K · {v.date}</div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Shorts row */}
      <div style={{ marginTop: S(10) }}>
        <div style={{ fontSize: T.label, letterSpacing: '0.22em', textTransform: 'uppercase', color: C.dimmer, marginBottom: S(5) }}>Shorts</div>
        <div style={{ display: 'flex', gap: 2 }}>
          {shorts.map((v, i) => (
            <motion.div key={i} {...fadeReveal(i * 0.05)} onClick={() => setPlaying(v)}
              style={{ flex: 1, minWidth: 100, aspectRatio: '9/16', position: 'relative', overflow: 'hidden', cursor: 'pointer', background: C.inkCard }}>
              <img src={`https://img.youtube.com/vi/${v.id}/mqdefault.jpg`} alt={v.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s' }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.06)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                onError={e => thumbErr(e, 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=300&q=80')}
              />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(10,10,15,0.85) 0%, transparent 50%)' }} />
              <div style={{ position: 'absolute', bottom: S(2), left: S(2), right: S(2), fontSize: T.label, color: C.offWhite, fontWeight: 600, lineHeight: 1.3 }}>{v.title}</div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Video modal */}
      <AnimatePresence>
        {playing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setPlaying(null)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: S(3) }}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9 }}
              onClick={e => e.stopPropagation()}
              style={{ width: '100%', maxWidth: 1000, position: 'relative' }}>
              <button onClick={() => setPlaying(null)}
                style={{ position: 'absolute', top: -44, right: 0, background: 'none', border: `1px solid rgba(248,246,242,0.2)`, color: C.offWhite, padding: `${S(1)} ${S(3)}`, cursor: 'pointer', fontFamily: 'var(--sans)', fontSize: T.xs, letterSpacing: '0.12em' }}>
                CLOSE ✕
              </button>
              <div style={{ aspectRatio: '16/9' }}>
                <iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${playing.id}?autoplay=1`}
                  title={playing.title} frameBorder="0" allow="autoplay; fullscreen" allowFullScreen style={{ display: 'block' }} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`@media (max-width: 768px) { .vlogs-grid-v3 { grid-template-columns: 1fr !important; } }`}</style>
    </section>
  )
}

// ─── 08 RIDE MAP ──────────────────────────────────────────────────────────────
const MAP_IMG = 'https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=1600&q=85'

function MapSection() {
  const [mode, setMode] = useState('completed')
  const modeAccent = { completed: '#22c55e', planned: C.gold, dream: '#818cf8' }
  const filtered = routes.filter(r => r.mode === mode)

  return (
    <section id="v3-map" style={{ background: C.offWhite }}>
      {/* Header on light bg */}
      <div style={{ padding: `${S(14)} clamp(24px,5vw,96px) ${S(8)}` }}>
        <motion.div {...reveal()}>
          <Eyebrow>Every Road Has a Story</Eyebrow>
          <AccentLine />
          <Display>Rides &<br /><span style={{ color: C.accent }}>Journeys</span></Display>
        </motion.div>
      </div>

      {/* Full-bleed map with overlay stats */}
      <motion.div {...fadeReveal()} style={{ position: 'relative', height: '55vh', minHeight: 400, overflow: 'hidden' }}>
        <img src={MAP_IMG} alt="Map" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(10,10,15,0.6)' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: `${S(6)} clamp(24px,5vw,96px)`, background: 'linear-gradient(to top, rgba(248,246,242,1) 0%, transparent 100%)', paddingTop: S(12) }}>
          <div style={{ display: 'flex', gap: S(8), flexWrap: 'wrap' }}>
            {[['12,547+ KM', 'Total Ridden'], ['24', 'Trips Done'], ['3', 'States Covered'], ['342h', 'On the Road']].map(([v, l]) => (
              <div key={l}>
                <div style={{ fontSize: 'clamp(1.4rem,2.5vw,2.2rem)', fontWeight: 800, color: C.ink, lineHeight: 1 }}>{v}</div>
                <div style={{ fontSize: T.label, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(10,10,15,0.4)', marginTop: 5 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Route cards */}
      <div style={{ padding: `${S(8)} clamp(24px,5vw,96px) ${S(14)}` }}>
        <div style={{ display: 'flex', gap: 2, marginBottom: S(7) }}>
          {[['completed','✓ Completed'],['planned','↗ Planned'],['dream','♡ Dream']].map(([id, label]) => (
            <button key={id} onClick={() => setMode(id)} style={{
              padding: `${S(1.5)} ${S(4)}`, cursor: 'pointer',
              background: mode === id ? C.ink : 'transparent',
              color: mode === id ? C.offWhite : 'rgba(10,10,15,0.45)',
              border: `1px solid ${mode === id ? C.ink : 'rgba(10,10,15,0.12)'}`,
              fontFamily: 'var(--sans)', fontSize: T.xs,
              letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600,
              transition: 'all 0.2s',
            }}>{label}</button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 1, background: 'rgba(10,10,15,0.08)' }}>
          {filtered.map((r, i) => (
            <motion.div key={r.id} {...reveal(i * 0.07)}
              style={{ background: C.offWhite, padding: S(5), borderTop: `3px solid ${modeAccent[r.mode]}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: S(2), alignItems: 'flex-start' }}>
                <h4 style={{ margin: 0, fontSize: '1.05rem', fontFamily: 'var(--heading)', color: C.ink, lineHeight: 1.3 }}>{r.name}</h4>
                {r.rating && <span style={{ fontSize: T.xs, color: C.gold, fontWeight: 700, flexShrink: 0, marginLeft: S(2) }}>★ {r.rating}</span>}
              </div>
              <p style={{ margin: `0 0 ${S(3)}`, fontSize: T.xs, color: 'rgba(10,10,15,0.5)', lineHeight: 1.6 }}>{r.description}</p>
              <div style={{ display: 'flex', gap: S(4), fontSize: T.xs, color: 'rgba(10,10,15,0.45)' }}>
                <span>📍 {r.distance}</span><span>⏱ {r.time}</span><span>📅 {r.date}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── 09 STATS — Dark, data-art ────────────────────────────────────────────────
function StatsSection() {
  const chartRef = useRef(null)
  const chartInView = useInView(chartRef, { once: true })
  const max = Math.max(...rideStats.monthlyData.map(d => d.km))

  return (
    <section id="v3-stats" style={{ background: C.inkSub, padding: `${S(16)} clamp(24px,5vw,96px)` }}>
      {/* Top — big number + chart */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: S(10), marginBottom: S(14), alignItems: 'start' }} className="stats-top-v3">
        <motion.div {...reveal()}>
          <Eyebrow light>Measured in Kilometres</Eyebrow>
          <AccentLine />
          <Display light>Ride<br /><span style={{ color: C.accent }}>Statistics</span></Display>
          <div style={{ marginTop: S(8), display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: 'rgba(248,246,242,0.04)' }}>
            {[
              ['Total Rides', rideStats.summary.totalRides],
              ['Total KM', rideStats.summary.totalDistance.toLocaleString('en-IN')],
              ['Riding Hours', rideStats.summary.rideHours + 'h'],
              ['Top Speed', rideStats.summary.topSpeed + ' km/h'],
              ['Avg Mileage', rideStats.summary.avgMileage + ' km/l'],
              ['Avg Speed', rideStats.summary.avgSpeed + ' km/h'],
            ].map(([k, v]) => (
              <div key={k} style={{ padding: S(4), background: C.inkCard }}>
                <div style={{ fontSize: T.label, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(248,246,242,0.25)', marginBottom: S(1) }}>{k}</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: C.offWhite, lineHeight: 1 }}>{v}</div>
              </div>
            ))}
          </div>
        </motion.div>

        <div ref={chartRef}>
          <motion.div {...reveal(0.1)}>
            <div style={{ fontSize: T.label, letterSpacing: '0.2em', textTransform: 'uppercase', color: C.dimmer, marginBottom: S(5) }}>Monthly Distance (KM)</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, height: 180 }}>
              {rideStats.monthlyData.map((d, i) => {
                const h = Math.round((d.km / max) * 160)
                return (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }} title={`${d.month}: ${d.km} km`}>
                    <motion.div
                      initial={{ height: 0 }} animate={chartInView ? { height: h } : { height: 0 }}
                      transition={{ duration: 0.7, delay: i * 0.05, ease: 'easeOut' }}
                      style={{ width: '100%', background: i === rideStats.monthlyData.length - 1 ? C.accent : 'rgba(248,246,242,0.25)', minHeight: 2, cursor: 'default' }}
                      title={`${d.month}: ${d.km} km`}
                    />
                    <span style={{ fontSize: '0.55rem', color: 'rgba(248,246,242,0.25)', textAlign: 'center' }}>{d.month}</span>
                  </div>
                )
              })}
            </div>
          </motion.div>

          {/* Ride types */}
          <motion.div {...reveal(0.2)} style={{ marginTop: S(8) }}>
            <div style={{ fontSize: T.label, letterSpacing: '0.2em', textTransform: 'uppercase', color: C.dimmer, marginBottom: S(5) }}>Ride Breakdown</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: S(3) }}>
              {rideStats.rideTypes.map((rt, i) => (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: S(1), fontSize: T.xs }}>
                    <span style={{ color: 'rgba(248,246,242,0.5)' }}>{rt.type}</span>
                    <span style={{ color: C.offWhite, fontWeight: 700 }}>{rt.percent}%</span>
                  </div>
                  <div style={{ height: 2, background: 'rgba(248,246,242,0.06)' }}>
                    <motion.div
                      initial={{ width: 0 }} whileInView={{ width: `${rt.percent}%` }} viewport={{ once: true }}
                      transition={{ duration: 0.9, delay: i * 0.12, ease: 'easeOut' }}
                      style={{ height: '100%', background: rt.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Rides table */}
      <motion.div {...reveal()}>
        <div style={{ fontSize: T.label, letterSpacing: '0.2em', textTransform: 'uppercase', color: C.dimmer, marginBottom: S(5) }}>Recent Rides</div>
        <div style={{ borderTop: `1px solid rgba(248,246,242,0.06)`, overflowX: 'auto' }}>
          {/* Header */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr auto', gap: S(2), padding: `${S(2)} 0`, borderBottom: `1px solid rgba(248,246,242,0.04)` }} className="rides-table-row">
            {['Route','Distance','Time','Avg Speed','Mileage','Type'].map(h => (
              <div key={h} style={{ fontSize: T.label, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(248,246,242,0.2)', fontWeight: 600 }}>{h}</div>
            ))}
          </div>
          {rideStats.recentRides.map((ride, i) => (
            <motion.div key={i} {...reveal(i * 0.06)}
              style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr auto', gap: S(2), padding: `${S(3)} 0`, borderBottom: `1px solid rgba(248,246,242,0.04)`, alignItems: 'center' }}
              className="rides-table-row"
            >
              <div>
                <div style={{ fontSize: T.sm, fontWeight: 600, color: C.offWhite }}>{ride.route}</div>
                <div style={{ fontSize: T.label, color: C.dimmer, marginTop: 3 }}>{ride.date}</div>
              </div>
              <div style={{ fontSize: T.sm, color: 'rgba(248,246,242,0.55)' }}>{ride.km} km</div>
              <div style={{ fontSize: T.sm, color: 'rgba(248,246,242,0.55)' }}>{ride.time}</div>
              <div style={{ fontSize: T.sm, color: 'rgba(248,246,242,0.55)' }}>{ride.avgSpeed}</div>
              <div style={{ fontSize: T.sm, color: 'rgba(248,246,242,0.55)' }}>{ride.mileage}</div>
              <span style={{ fontSize: T.label, padding: `${S(0.5)} ${S(2)}`, border: `1px solid rgba(248,246,242,0.12)`, color: C.dimmer, letterSpacing: '0.1em', fontWeight: 600, whiteSpace: 'nowrap' }}>{ride.type}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <style>{`
        @media (max-width: 860px) { .stats-top-v3 { grid-template-columns: 1fr !important; } }
        @media (max-width: 640px) { .rides-table-row { grid-template-columns: 1fr auto !important; } .rides-table-row > *:not(:first-child):not(:last-child) { display: none; } }
      `}</style>
    </section>
  )
}

// ─── 10 DREAM + WISHLIST — Light section ─────────────────────────────────────
function DreamSection() {
  const statusStyle = {
    completed: { bar: '#22c55e', text: '#22c55e' },
    active:    { bar: C.accent, text: C.accent },
    planned:   { bar: C.gold,   text: C.gold },
    future:    { bar: 'rgba(10,10,15,0.12)', text: 'rgba(10,10,15,0.35)' },
  }

  return (
    <section id="v3-dream" style={{ background: C.smoke, padding: `${S(16)} clamp(24px,5vw,96px)` }}>
      <motion.div {...reveal()} style={{ marginBottom: S(12) }}>
        <Eyebrow>The Vision Ahead</Eyebrow>
        <AccentLine />
        <Display>Dream<br /><span style={{ color: C.accent }}>Garage</span></Display>
      </motion.div>

      {/* Phase timeline */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 1, background: 'rgba(10,10,15,0.08)', marginBottom: S(14) }} className="phases-v3">
        {dreamGarage.phases.map((p, i) => {
          const st = statusStyle[p.status]
          return (
            <motion.div key={p.id} {...reveal(i * 0.1)}
              style={{ background: C.smoke, padding: `${S(6)} ${S(5)}`, borderTop: `3px solid ${st.bar}` }}>
              <div style={{ fontSize: T.label, letterSpacing: '0.16em', textTransform: 'uppercase', color: st.text, marginBottom: S(1), fontWeight: 700 }}>{p.label}</div>
              <h3 style={{ margin: `0 0 ${S(4)}`, fontSize: '1.15rem', fontFamily: 'var(--heading)', color: C.ink }}>{p.title}</h3>
              {p.items.map((item, j) => (
                <div key={j} style={{ display: 'flex', gap: S(1.5), marginBottom: S(1.5), fontSize: T.xs, color: 'rgba(10,10,15,0.6)', alignItems: 'flex-start' }}>
                  <span style={{ color: st.text, flexShrink: 0 }}>{p.status === 'completed' ? '✓' : '○'}</span>
                  {item}
                </div>
              ))}
            </motion.div>
          )
        })}
      </div>

      {/* Wishlist */}
      <motion.div {...reveal()} style={{ marginBottom: S(8) }}>
        <Eyebrow>What's Next</Eyebrow>
        <AccentLine />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: S(4), marginBottom: S(8) }}>
          <Display>Wishlist</Display>
          <div style={{ fontSize: 'clamp(2rem,4vw,3rem)', fontWeight: 800, color: C.ink }}>
            <Counter end={65} suffix="%" />
            <span style={{ fontSize: T.sm, fontWeight: 400, color: 'rgba(10,10,15,0.4)', marginLeft: S(2), letterSpacing: '0.1em', textTransform: 'uppercase' }}>Build Progress</span>
          </div>
        </div>
      </motion.div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 1, background: 'rgba(10,10,15,0.08)' }}>
        {wishlist.filter(w => w.status !== 'dreaming').map((w, i) => {
          const pc = { high: C.accent, medium: C.gold, low: '#22c55e' }[w.priority]
          return (
            <motion.div key={w.id} {...reveal(i * 0.05)}
              style={{ background: C.smoke, padding: `${S(5)} ${S(5)}`, borderTop: `2px solid ${pc}40` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: S(2), marginBottom: S(2) }}>
                <div>
                  <div style={{ fontSize: T.label, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(10,10,15,0.35)', marginBottom: 3 }}>{w.category}</div>
                  <h4 style={{ margin: 0, fontSize: '0.95rem', fontFamily: 'var(--heading)', color: C.ink, fontWeight: 700 }}>{w.name}</h4>
                </div>
                <span style={{ fontSize: T.label, fontWeight: 800, padding: `${S(0.5)} ${S(2)}`, color: pc, border: `1px solid ${pc}40`, letterSpacing: '0.1em', textTransform: 'uppercase', height: 'fit-content', flexShrink: 0 }}>{w.priority}</span>
              </div>
              <p style={{ margin: `0 0 ${S(3)}`, fontSize: T.xs, color: 'rgba(10,10,15,0.5)', lineHeight: 1.6 }}>{w.reason}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: T.xs, color: 'rgba(10,10,15,0.35)' }}>🗓 {w.targetMonth}</span>
                <span style={{ fontSize: '1.05rem', fontWeight: 800, color: C.ink }}>{w.price >= 100000 ? `₹${(w.price / 100000).toFixed(1)}L` : `₹${w.price.toLocaleString('en-IN')}`}</span>
              </div>
            </motion.div>
          )
        })}
      </div>

      <style>{`@media (max-width: 900px) { .phases-v3 { grid-template-columns: 1fr 1fr !important; } } @media (max-width: 520px) { .phases-v3 { grid-template-columns: 1fr !important; } }`}</style>
    </section>
  )
}

// ─── 11 COST + MAINTENANCE — Dark ────────────────────────────────────────────
function CostSection() {
  const total = costTracker.categories.reduce((s, c) => s + c.amount, 0)

  return (
    <section id="v3-cost" style={{ background: C.ink, padding: `${S(16)} clamp(24px,5vw,96px)` }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: S(12), alignItems: 'start' }} className="cost-grid-v3">

        {/* Cost */}
        <div>
          <motion.div {...reveal()}>
            <Eyebrow light>Investment Breakdown</Eyebrow>
            <AccentLine />
            <Display light>Cost<br /><span style={{ color: C.accent }}>Tracker</span></Display>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 1, background: 'rgba(248,246,242,0.04)', margin: `${S(8)} 0` }}>
            {[['₹3.1L','Total'],['₹8.2K','Monthly'],['₹24.9','Per KM']].map(([v, l]) => (
              <div key={l} style={{ padding: S(4), background: C.inkCard, textAlign: 'center' }}>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: C.offWhite, lineHeight: 1 }}>{v}</div>
                <div style={{ fontSize: T.label, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.dimmer, marginTop: S(1) }}>{l}</div>
              </div>
            ))}
          </div>

          {costTracker.categories.map((c, i) => {
            const pct = (c.amount / total) * 100
            return (
              <motion.div key={i} {...reveal(i * 0.07)} style={{ marginBottom: S(4) }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: S(1.5), fontSize: T.sm }}>
                  <span style={{ color: 'rgba(248,246,242,0.6)' }}>{c.icon} {c.name}</span>
                  <span style={{ color: C.offWhite, fontWeight: 700 }}>₹{c.amount.toLocaleString('en-IN')}</span>
                </div>
                <div style={{ height: 1, background: 'rgba(248,246,242,0.06)' }}>
                  <motion.div
                    initial={{ width: 0 }} whileInView={{ width: `${pct}%` }} viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: i * 0.1 }}
                    style={{ height: '100%', background: i === 0 ? C.accent : 'rgba(248,246,242,0.35)' }}
                  />
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Maintenance */}
        <div>
          <motion.div {...reveal(0.1)}>
            <Eyebrow light>Keep It Running</Eyebrow>
            <AccentLine />
            <Display light>Maintenance<br /><span style={{ color: C.accent }}>Log</span></Display>
          </motion.div>

          <div style={{ marginTop: S(8) }}>
            <div style={{ fontSize: T.label, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.dimmer, marginBottom: S(4) }}>Upcoming</div>
            {maintenance.upcoming.map((item, i) => {
              const pct = item.dueKm ? Math.min((item.currentKm / item.dueKm) * 100, 100) : null
              const pc = item.priority === 'high' ? '#ef4444' : item.priority === 'medium' ? C.gold : '#22c55e'
              return (
                <motion.div key={i} {...reveal(i * 0.08)}
                  style={{ padding: `${S(3)} 0`, borderBottom: `1px solid rgba(248,246,242,0.05)` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: S(2) }}>
                    <span style={{ fontSize: T.sm, color: C.offWhite, fontWeight: 600 }}>{item.icon} {item.type}</span>
                    <span style={{ fontSize: T.label, fontWeight: 700, color: pc, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{item.priority}</span>
                  </div>
                  {pct !== null && (
                    <>
                      <div style={{ height: 1, background: 'rgba(248,246,242,0.06)', marginBottom: S(1) }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: pct > 85 ? '#ef4444' : C.gold }} />
                      </div>
                      <div style={{ fontSize: T.label, color: C.dimmer }}>{(item.dueKm - item.currentKm).toLocaleString('en-IN')} KM remaining</div>
                    </>
                  )}
                  {item.dueDate && <div style={{ fontSize: T.xs, color: C.dimmer }}>Due: {item.dueDate}</div>}
                </motion.div>
              )
            })}

            <div style={{ marginTop: S(6), fontSize: T.label, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.dimmer, marginBottom: S(4) }}>Service History</div>
            {maintenance.history.slice(0, 4).map((h, i) => (
              <motion.div key={i} {...reveal(i * 0.07)}
                style={{ padding: `${S(3)} 0`, borderBottom: `1px solid rgba(248,246,242,0.05)`, display: 'flex', justifyContent: 'space-between', gap: S(3), alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: T.sm, color: C.offWhite, fontWeight: 500, marginBottom: 3 }}>{h.work}</div>
                  <div style={{ fontSize: T.label, color: C.dimmer }}>{h.date} · {h.km.toLocaleString('en-IN')} KM</div>
                </div>
                <div style={{ fontSize: T.sm, fontWeight: 800, color: h.cost === 0 ? '#22c55e' : C.offWhite, flexShrink: 0 }}>{h.cost === 0 ? 'Free' : `₹${h.cost.toLocaleString('en-IN')}`}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <style>{`@media (max-width: 860px) { .cost-grid-v3 { grid-template-columns: 1fr !important; } }`}</style>
    </section>
  )
}

// ─── 12 GALLERY — Light, edge-to-edge grid ────────────────────────────────────
const GALLERY = [
  { src: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=900&q=85', loc: 'Yelagiri Hills', date: 'May 2024', span: 'col 1 / span 2 / row 1 / span 2' },
  { src: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=700&q=85', loc: 'East Coast Road', date: 'Apr 2024', span: '' },
  { src: 'https://images.unsplash.com/photo-1609630875171-b1321377ee65?w=700&q=85', loc: 'Chennai', date: 'May 2024', span: '' },
  { src: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=900&q=85', loc: 'Highway Run', date: 'Mar 2024', span: 'col span 2' },
  { src: 'https://images.unsplash.com/photo-1547549082-6bc09f2049ae?w=700&q=85', loc: 'Mountain Pass', date: 'Apr 2024', span: '' },
  { src: 'https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=700&q=85', loc: 'Coastal Route', date: 'Apr 2024', span: '' },
  { src: 'https://images.unsplash.com/photo-1449426468159-d96dbf08f19f?w=700&q=85', loc: 'Engine Bay', date: 'Aug 2024', span: '' },
  { src: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=700&q=85', loc: 'Night Ride', date: 'Feb 2024', span: '' },
]

function GallerySection() {
  const [lbOpen, setLbOpen] = useState(false)
  const [lbIdx, setLbIdx] = useState(0)
  const slides = GALLERY.map(g => ({ src: g.src }))

  return (
    <section id="v3-gallery" style={{ background: C.offWhite, padding: `${S(14)} 0 ${S(4)}` }}>
      <div style={{ padding: `0 clamp(24px,5vw,96px)`, marginBottom: S(10) }}>
        <motion.div {...reveal()}>
          <Eyebrow>Captured Moments</Eyebrow>
          <AccentLine />
          <Display>The<br /><span style={{ color: C.accent }}>Gallery</span></Display>
        </motion.div>
      </div>

      {/* Masonry-style uneven grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gridAutoRows: '240px', gap: 3, padding: `0 clamp(24px,5vw,96px) ${S(10)}` }} className="gallery-v3">
        {GALLERY.map((g, i) => (
          <motion.div key={i} {...fadeReveal(i * 0.06)}
            onClick={() => { setLbIdx(i); setLbOpen(true) }}
            style={{
              position: 'relative', overflow: 'hidden', cursor: 'pointer', background: C.smoke,
              gridColumn: i === 0 ? 'span 2' : i === 3 ? 'span 2' : 'span 1',
              gridRow: i === 0 ? 'span 2' : 'span 1',
            }}>
            <motion.img src={g.src} alt={g.loc}
              style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.6s ease' }}
              whileHover={{ scale: 1.06 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            />
            <motion.div
              initial={{ opacity: 0 }} whileHover={{ opacity: 1 }} transition={{ duration: 0.25 }}
              style={{ position: 'absolute', inset: 0, background: 'rgba(10,10,15,0.55)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: `${S(3)} ${S(3)}` }}
            >
              <div style={{ fontSize: T.sm, fontWeight: 700, color: C.offWhite }}>{g.loc}</div>
              <div style={{ fontSize: T.label, color: C.dimmer, marginTop: 3 }}>{g.date}</div>
            </motion.div>
          </motion.div>
        ))}
      </div>

      <Lightbox open={lbOpen} close={() => setLbOpen(false)} slides={slides} index={lbIdx} />

      <style>{`
        @media (max-width: 768px) { .gallery-v3 { grid-template-columns: repeat(2,1fr) !important; grid-auto-rows: 180px !important; } }
        @media (max-width: 480px) { .gallery-v3 { grid-template-columns: 1fr !important; } }
      `}</style>
    </section>
  )
}

// ─── 13 CONNECT — Dark, full-screen closer ───────────────────────────────────
const CONNECT_BG = 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=1920&q=85'

function ConnectSection() {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '20%'])

  return (
    <section ref={ref} id="v3-connect" style={{ position: 'relative', minHeight: '80vh', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <motion.div style={{ position: 'absolute', inset: '-12%', y }}>
        <img src={CONNECT_BG} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </motion.div>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(10,10,15,0.86)' }} />

      <div style={{ position: 'relative', zIndex: 2, width: '100%', padding: `${S(16)} clamp(24px,5vw,96px)`, textAlign: 'center' }}>
        <motion.div {...reveal()}>
          <Eyebrow light centered>Ride Together</Eyebrow>
          <AccentLineCentered />
          <Display light centered>Let's<br /><span style={{ color: C.accent }}>Connect</span></Display>
          <Lead light centered style={{ maxWidth: 440, margin: `${S(4)} auto ${S(10)}` }}>
            Follow the journey. Join the community.<br />Every ride is better with good people.
          </Lead>
        </motion.div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap', marginBottom: S(14) }}>
          {[
            { label: 'Instagram', handle: cfg.social?.instagram?.handle || '@sivashanmugavadivelv', href: cfg.social?.instagram?.href || '#' },
            { label: 'YouTube',   handle: 'Vlogs & Ride Videos', href: cfg.social?.youtube?.href || '#' },
            { label: 'Blog',      handle: 'Read Ride Stories',    href: '/blog' },
            { label: 'Email',     handle: 'Get in Touch',          href: '/contact' },
          ].map((s, i) => (
            <motion.a key={i} href={s.href}
              target={s.href.startsWith('http') ? '_blank' : undefined}
              rel="noopener noreferrer"
              {...reveal(i * 0.1)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                padding: `${S(5)} ${S(6)}`,
                minWidth: 200,
                background: 'rgba(248,246,242,0.04)',
                border: `1px solid rgba(248,246,242,0.08)`,
                textDecoration: 'none',
                transition: 'background 0.25s, border-color 0.25s',
              }}
              whileHover={{ background: 'rgba(255,77,0,0.08)', borderColor: 'rgba(255,77,0,0.3)' }}
            >
              <div style={{ fontSize: T.label, letterSpacing: '0.2em', textTransform: 'uppercase', color: C.dimmer, marginBottom: S(2) }}>{s.label}</div>
              <div style={{ fontSize: T.sm, fontWeight: 600, color: C.offWhite }}>{s.handle}</div>
            </motion.a>
          ))}
        </div>

        <motion.div {...reveal(0.4)}>
          <div style={{ width: 1, height: 60, background: `linear-gradient(to bottom, transparent, rgba(248,246,242,0.2))`, margin: '0 auto 32px' }} />
          <p style={{ fontFamily: 'var(--heading)', fontStyle: 'italic', fontSize: 'clamp(1.3rem,2.5vw,2rem)', color: 'rgba(248,246,242,0.5)', margin: `0 0 ${S(2)}` }}>
            "Thanks for visiting my garage."
          </p>
          <p style={{ fontSize: T.xs, letterSpacing: '0.2em', textTransform: 'uppercase', color: C.accent, margin: 0, fontWeight: 600 }}>
            See you on the next ride. 🏍
          </p>
        </motion.div>
      </div>
    </section>
  )
}

// ─── Fixed dot nav ────────────────────────────────────────────────────────────
const NAV = [
  ['v3-hero','Hero'],['v3-bike','Bike'],['v3-setup','Setup'],
  ['v3-recommended','Gear'],['v3-vlogs','Vlogs'],['v3-map','Map'],
  ['v3-stats','Stats'],['v3-dream','Dream'],['v3-cost','Cost'],
  ['v3-gallery','Gallery'],['v3-connect','Connect'],
]

function DotNav() {
  const [active, setActive] = useState('v3-hero')
  useEffect(() => {
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) setActive(e.target.id) }),
      { rootMargin: '-45% 0px -45% 0px' }
    )
    NAV.forEach(([id]) => { const el = document.getElementById(id); if (el) obs.observe(el) })
    return () => obs.disconnect()
  }, [])

  return (
    <div style={{ position: 'fixed', right: 20, top: '50%', transform: 'translateY(-50%)', zIndex: 50, display: 'flex', flexDirection: 'column', gap: 10 }} className="dot-nav-v3">
      {NAV.map(([id, label]) => (
        <button key={id}
          onClick={() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })}
          title={label}
          style={{
            width: active === id ? 8 : 4,
            height: active === id ? 8 : 4,
            borderRadius: '50%',
            background: active === id ? C.accent : 'rgba(128,128,128,0.4)',
            border: 'none', cursor: 'pointer', padding: 0,
            transition: 'all 0.3s ease',
            alignSelf: 'center',
          }}
        />
      ))}
      <style>{`@media (max-width: 768px) { .dot-nav-v3 { display: none !important; } }`}</style>
    </div>
  )
}

// ─── View switcher pill ───────────────────────────────────────────────────────
function Switcher() {
  return (
    <div style={{
      position: 'fixed', top: 72, left: '50%', transform: 'translateX(-50%)',
      zIndex: 60, display: 'flex',
      background: 'rgba(10,10,15,0.75)', backdropFilter: 'blur(20px)',
      border: '1px solid rgba(248,246,242,0.1)',
      overflow: 'hidden',
    }} className="switcher-v3">
      {[
        { label: 'Standard', to: '/garage' },
        { label: 'Premium',  to: '/garage/premium' },
        { label: 'V3 ✦',    to: null },
      ].map(({ label, to }) => (
        to ? (
          <Link key={label} to={to} style={{
            padding: '8px 18px', fontSize: '0.65rem', letterSpacing: '0.12em', textTransform: 'uppercase',
            fontWeight: 600, fontFamily: 'var(--sans)', color: 'rgba(248,246,242,0.4)', textDecoration: 'none',
            transition: 'color 0.2s', whiteSpace: 'nowrap',
          }}>{label}</Link>
        ) : (
          <div key={label} style={{
            padding: '8px 18px', fontSize: '0.65rem', letterSpacing: '0.12em', textTransform: 'uppercase',
            fontWeight: 700, fontFamily: 'var(--sans)', background: C.accent, color: C.white, whiteSpace: 'nowrap',
          }}>{label}</div>
        )
      ))}
      <style>{`@media (max-width: 480px) { .switcher-v3 { display: none !important; } }`}</style>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function GarageV3() {
  return (
    <div style={{ background: C.ink, overflowX: 'hidden' }}>
      <Switcher />
      <DotNav />
      <Hero />
      <StatsBar />
      <BikeSection />
      <SetupSection />
      <RecommendedSection />
      <QuoteBreak />
      <VlogsSection />
      <MapSection />
      <StatsSection />
      <DreamSection />
      <CostSection />
      <GallerySection />
      <ConnectSection />
    </div>
  )
}
