/**
 * The Garage — V6 "Dark Cinematic"
 *
 * Design direction: BMW Motorrad / Ducati feel
 * — One unified dark world. Sections flow, not stack.
 * — Single accent: #e8630a (RE orange). Used ONCE per section max.
 * — Typography does the heavy lifting. Not animations.
 * — Every section has ONE hero moment. Then it breathes.
 * — No gimmicks. No speedometers. No clip-path circles.
 *   Just light, shadow, space, and beautiful type.
 *
 * Rhythm: every section alternates between:
 *   (A) Dark immersive — full-bleed image, light text
 *   (B) Dark structured — card/grid content on dark bg
 *   No light sections at all — this is a night ride.
 */

import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  motion, AnimatePresence,
  useScroll, useTransform, useInView,
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
const D = {
  bg:      '#08070e',
  bg1:     '#0d0c15',
  bg2:     '#12101b',
  bg3:     '#181622',
  border:  'rgba(255,255,255,0.07)',
  borderM: 'rgba(255,255,255,0.12)',
  white:   '#ffffff',
  offW:    '#f0eee8',
  dim1:    'rgba(240,238,232,0.6)',
  dim2:    'rgba(240,238,232,0.35)',
  dim3:    'rgba(240,238,232,0.18)',
  accent:  '#e8630a',        // RE orange — used once per section
  accentD: 'rgba(232,99,10,0.15)',
}

// Images — high quality Unsplash motorcycle photography
const P = {
  hero:   'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=1920&q=90&auto=format',
  bike1:  'https://images.unsplash.com/photo-1609630875171-b1321377ee65?w=1400&q=90&auto=format',
  bike2:  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1400&q=85&auto=format',
  road:   'https://images.unsplash.com/photo-1547549082-6bc09f2049ae?w=1600&q=85&auto=format',
  sunset: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=1600&q=85&auto=format',
  night:  'https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=1600&q=85&auto=format',
  coast:  'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=1600&q=85&auto=format',
  mtn:    'https://images.unsplash.com/photo-1449426468159-d96dbf08f19f?w=1400&q=85&auto=format',
  g1:     'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=900&q=85&auto=format',
  g2:     'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=900&q=85&auto=format',
  g3:     'https://images.unsplash.com/photo-1609630875171-b1321377ee65?w=900&q=85&auto=format',
  g4:     'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=900&q=85&auto=format',
  g5:     'https://images.unsplash.com/photo-1547549082-6bc09f2049ae?w=900&q=85&auto=format',
  g6:     'https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=900&q=85&auto=format',
  g7:     'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=900&q=85&auto=format',
  g8:     'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=900&q=85&auto=format',
}

// Shared fade-up on scroll
const up = (delay = 0) => ({
  initial: { opacity: 0, y: 36 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-64px' },
  transition: { duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] },
})

// Section eyebrow label
const Eyebrow = ({ n, label }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
    {n && <span style={{ fontFamily: 'var(--mono)', fontSize: '0.65rem', color: D.accent, letterSpacing: '0.12em' }}>{n}</span>}
    {n && <div style={{ width: 32, height: 1, background: D.accent }} />}
    <span style={{ fontSize: '0.65rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: D.dim2, fontFamily: 'var(--sans)' }}>{label}</span>
  </div>
)

// Big section title
const Title = ({ children, size = '3.2rem', style: sx }) => (
  <h2 style={{
    fontSize: `clamp(2rem, 4.5vw, ${size})`,
    fontFamily: "'Playfair Display', serif",
    fontWeight: 700,
    color: D.offW,
    margin: 0,
    lineHeight: 1.08,
    letterSpacing: '-0.025em',
    ...sx,
  }}>{children}</h2>
)

// Animated count-up
function CountUp({ end, suffix = '', decimals = 0 }) {
  const [v, setV] = useState(0)
  const ref = useRef(null)
  const started = useRef(false)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  useEffect(() => {
    if (!inView || started.current) return
    started.current = true
    const steps = 60, dur = 1400, inc = end / steps
    let cur = 0
    const id = setInterval(() => {
      cur = Math.min(cur + inc, end)
      setV(decimals ? parseFloat(cur.toFixed(decimals)) : Math.floor(cur))
      if (cur >= end) clearInterval(id)
    }, dur / steps)
    return () => clearInterval(id)
  }, [inView, end, decimals])
  return <span ref={ref}>{typeof v === 'number' ? v.toLocaleString('en-IN') : v}{suffix}</span>
}

// ─── 01 · HERO ────────────────────────────────────────────────────────────────
function Hero() {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const imgY = useTransform(scrollYProgress, [0, 1], ['0%', '22%'])
  const fade = useTransform(scrollYProgress, [0, 0.65], [1, 0])
  const textY = useTransform(scrollYProgress, [0, 0.65], ['0%', '18%'])

  return (
    <section ref={ref} id="v6-hero" style={{
      position: 'relative', height: '100svh', minHeight: 680,
      overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
    }}>
      {/* Photo layer */}
      <motion.div style={{ position: 'absolute', inset: '-15% 0', y: imgY }}>
        <img src={P.hero} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </motion.div>

      {/* Gradient layers */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(8,7,14,0.92) 0%, rgba(8,7,14,0.55) 55%, rgba(8,7,14,0.08) 100%)' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(8,7,14,1) 0%, transparent 50%)' }} />

      {/* Content */}
      <motion.div style={{ position: 'relative', zIndex: 2, y: textY, opacity: fade, padding: 'clamp(32px,5vw,88px)', paddingBottom: 'clamp(48px,7vw,108px)' }}>

        <motion.div {...up(0.1)}>
          <Eyebrow n="001" label="Royal Enfield Shotgun 650 · Graphite Black · Chennai" />
        </motion.div>

        {/* Main title — very large */}
        <motion.div {...up(0.2)}>
          <h1 style={{
            fontSize: 'clamp(4.5rem, 12vw, 11rem)',
            fontFamily: "'Playfair Display', serif",
            fontWeight: 700,
            color: D.white,
            lineHeight: 0.92,
            letterSpacing: '-0.04em',
            margin: '0 0 32px',
          }}>
            The<br />
            <span style={{ color: D.accent }}>Garage</span>
            <span style={{ color: D.dim3 }}>.</span>
          </h1>
        </motion.div>

        <motion.div {...up(0.3)} style={{ display: 'flex', alignItems: 'center', gap: 40, flexWrap: 'wrap' }}>
          <p style={{ fontSize: 'clamp(0.9rem,1.4vw,1.1rem)', color: D.dim1, maxWidth: 400, lineHeight: 1.8, margin: 0, fontWeight: 300 }}>
            Where machines become stories and every kilometre earns its place.
          </p>
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={() => document.getElementById('v6-bike')?.scrollIntoView({ behavior: 'smooth' })}
              style={{ padding: '13px 32px', background: D.accent, color: '#fff', border: 'none', fontFamily: 'var(--sans)', fontWeight: 700, fontSize: '0.78rem', letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer', transition: 'opacity 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
              The Machine
            </button>
            <button
              onClick={() => document.getElementById('v6-rides')?.scrollIntoView({ behavior: 'smooth' })}
              style={{ padding: '13px 32px', background: 'transparent', color: D.offW, border: `1px solid ${D.borderM}`, fontFamily: 'var(--sans)', fontWeight: 500, fontSize: '0.78rem', letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer', backdropFilter: 'blur(8px)', transition: 'border-color 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.35)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = D.borderM}>
              Rides
            </button>
          </div>
        </motion.div>

        {/* Stat row — at the bottom */}
        <motion.div {...up(0.4)} style={{ marginTop: 52, display: 'flex', gap: 40, flexWrap: 'wrap', paddingTop: 32, borderTop: `1px solid ${D.border}` }}>
          {[['12,547', 'KM Ridden'], ['47', 'Rides'], ['15', 'Accessories'], ['50+', 'Videos']].map(([v, l]) => (
            <div key={l}>
              <div style={{ fontSize: 'clamp(1.4rem,2.5vw,2rem)', fontWeight: 800, color: D.white, lineHeight: 1, letterSpacing: '-0.02em' }}>{v}</div>
              <div style={{ fontSize: '0.62rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: D.dim2, marginTop: 5 }}>{l}</div>
            </div>
          ))}
        </motion.div>
      </motion.div>

      {/* Scroll hint */}
      <motion.div animate={{ y: [0, 9, 0] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        style={{ position: 'absolute', bottom: 28, right: 'clamp(32px,5vw,88px)', zIndex: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
        <div style={{ width: 1, height: 44, background: `linear-gradient(to bottom, transparent, ${D.dim3})` }} />
        <div style={{ width: 4, height: 4, borderRadius: '50%', background: D.dim2 }} />
      </motion.div>
    </section>
  )
}

// ─── 02 · MY BIKE — Dark, wide, editorial ────────────────────────────────────
function BikeSection() {
  const imgRef = useRef(null)
  const { scrollYProgress } = useScroll({ target: imgRef, offset: ['start end', 'end start'] })
  const imgScale = useTransform(scrollYProgress, [0, 0.5, 1], [1.06, 1.0, 1.06])

  return (
    <section id="v6-bike" style={{ background: D.bg1 }}>
      {/* Full-bleed image with subtle zoom */}
      <div ref={imgRef} style={{ position: 'relative', height: '75vh', minHeight: 480, overflow: 'hidden' }}>
        <motion.img src={P.bike1} alt={bike.name}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', scale: imgScale }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 35%, rgba(13,12,21,1) 100%)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(13,12,21,0.7) 0%, transparent 60%)' }} />
      </div>

      {/* Content — overlaps the image bottom */}
      <div style={{ padding: '0 clamp(32px,5vw,88px) clamp(64px,8vw,96px)', marginTop: -180, position: 'relative', zIndex: 2 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 64, alignItems: 'end' }} className="bike-v6-grid">
          <motion.div {...up()}>
            <Eyebrow n="002" label="My Machine" />
            <Title size="4rem">{bike.name}</Title>
            <p style={{ fontSize: '0.95rem', color: D.dim1, lineHeight: 1.85, margin: '24px 0 0', maxWidth: 420, fontWeight: 300 }}>{bike.story}</p>
          </motion.div>

          <motion.div {...up(0.15)}>
            {/* Key data — clean rows */}
            <div style={{ borderTop: `1px solid ${D.border}` }}>
              {[
                ['Color', bike.color],
                ['Purchased', bike.purchaseDate],
                ['Location', bike.location],
                ['Ownership', bike.ownership],
                ['Total Investment', bike.totalInvestment],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: `1px solid ${D.border}` }}>
                  <span style={{ fontSize: '0.7rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: D.dim2 }}>{k}</span>
                  <span style={{ fontSize: '0.9rem', fontWeight: 600, color: D.offW }}>{v}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Specs — 4 big numbers */}
        <motion.div {...up(0.2)} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 1, background: D.border, marginTop: 52, borderRadius: 4, overflow: 'hidden' }}>
          {bike.specs.overview.slice(0, 8).map((s, i) => (
            <div key={i} style={{ padding: '24px 20px', background: D.bg2, transition: 'background 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.background = D.bg3}
              onMouseLeave={e => e.currentTarget.style.background = D.bg2}>
              <div style={{ fontSize: '0.6rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: D.dim2, marginBottom: 8 }}>{s.label}</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 700, color: D.offW, lineHeight: 1 }}>{s.value}</div>
              {s.unit && <div style={{ fontSize: '0.7rem', color: D.dim2, marginTop: 4 }}>{s.unit}</div>}
            </div>
          ))}
        </motion.div>
      </div>
      <style>{`@media(max-width:768px){.bike-v6-grid{grid-template-columns:1fr!important;gap:32px!important}}`}</style>
    </section>
  )
}

// ─── 03 · SETUP — Dark list, rich detail panel ───────────────────────────────
function SetupSection() {
  const [active, setActive] = useState(0)
  const acc = accessories[active]
  const catColors = { Navigation: D.accent, Camera: '#ec4899', Safety: '#22c55e', Protection: '#f59e0b', Touring: '#3b82f6', Communication: '#a855f7' }

  return (
    <section id="v6-setup" style={{ background: D.bg, padding: 'clamp(64px,8vw,96px) 0' }}>
      <div style={{ padding: '0 clamp(32px,5vw,88px)', marginBottom: 48 }}>
        <motion.div {...up()}>
          <Eyebrow n="003" label="What's on my bike" />
          <Title>The Setup</Title>
        </motion.div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.1fr', minHeight: 560 }} className="setup-v6-grid">
        {/* Left — accessory list */}
        <div style={{ borderRight: `1px solid ${D.border}` }}>
          {accessories.map((a, i) => {
            const c = catColors[a.category] || D.accent
            const isActive = active === i
            return (
              <motion.div key={a.id}
                initial={{ opacity: 0, x: -24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.05 }}
                onClick={() => setActive(i)}
                style={{
                  display: 'grid', gridTemplateColumns: '4px 1fr auto',
                  cursor: 'pointer', transition: 'background 0.2s',
                  background: isActive ? D.bg2 : 'transparent',
                  borderBottom: `1px solid ${D.border}`,
                }}>
                {/* Accent left bar */}
                <div style={{ background: isActive ? c : 'transparent', transition: 'background 0.25s' }} />
                <div style={{ padding: '20px 24px' }}>
                  <div style={{ fontSize: '0.6rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: isActive ? c : D.dim2, marginBottom: 4, fontWeight: 600, transition: 'color 0.25s' }}>{a.category}</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: isActive ? D.white : D.dim1, transition: 'color 0.25s' }}>{a.name}</div>
                </div>
                <div style={{ padding: '20px 24px', textAlign: 'right', alignSelf: 'center' }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: isActive ? D.offW : D.dim2, transition: 'color 0.25s' }}>₹{a.price.toLocaleString('en-IN')}</div>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Right — detail */}
        <AnimatePresence mode="wait">
          <motion.div key={acc.id}
            initial={{ opacity: 0, x: 32 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            style={{ padding: 'clamp(32px,4vw,56px)', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 24 }}>

            {/* Image */}
            <div style={{ aspectRatio: '16/9', overflow: 'hidden', background: D.bg2, borderRadius: 6, position: 'relative' }}>
              <img src={[P.g1,P.g2,P.g3,P.g4,P.g5,P.g6,P.g7,P.g8][active % 8]} alt={acc.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.75 }} />
              <div style={{ position: 'absolute', top: 16, left: 16 }}>
                <span style={{ fontSize: '0.6rem', letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700, padding: '4px 12px', background: catColors[acc.category] || D.accent, color: '#fff' }}>
                  {acc.category}
                </span>
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: D.dim2, marginBottom: 8 }}>Installed {acc.purchaseDate}</div>
              <h3 style={{ fontSize: 'clamp(1.3rem,2.5vw,2rem)', fontFamily: "'Playfair Display',serif", color: D.offW, margin: '0 0 12px', lineHeight: 1.2 }}>{acc.name}</h3>
              <p style={{ fontSize: '0.88rem', color: D.dim1, lineHeight: 1.8, margin: '0 0 20px' }}>{acc.reason}</p>
              <blockquote style={{ margin: 0, borderLeft: `2px solid ${D.accent}`, paddingLeft: 16 }}>
                <p style={{ fontSize: '0.82rem', color: D.dim2, fontStyle: 'italic', lineHeight: 1.7, margin: 0 }}>"{acc.review}"</p>
              </blockquote>
            </div>

            <div style={{ display: 'flex', gap: 24, paddingTop: 16, borderTop: `1px solid ${D.border}` }}>
              {[['Rating', `${acc.rating}/5`], ['Coupon', acc.coupon], ['Price', `₹${acc.price.toLocaleString('en-IN')}`]].map(([k, v]) => (
                <div key={k}>
                  <div style={{ fontSize: '0.58rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: D.dim2, marginBottom: 4 }}>{k}</div>
                  <div style={{ fontWeight: 700, color: D.offW, fontSize: '0.9rem' }}>{v}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
      <style>{`@media(max-width:768px){.setup-v6-grid{grid-template-columns:1fr!important}}`}</style>
    </section>
  )
}

// ─── 04 · RECOMMENDED — Clean product grid ────────────────────────────────────
function RecommendedSection() {
  const [cat, setCat] = useState('favorites')
  const items = recommendedAccessories.filter(a => a.section === cat)

  return (
    <section id="v6-recommended" style={{ background: D.bg1, padding: 'clamp(64px,8vw,96px) clamp(32px,5vw,88px)' }}>
      <motion.div {...up()} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 24, marginBottom: 52 }}>
        <div>
          <Eyebrow n="004" label="Gear I Trust" />
          <Title>Recommended<br /><em style={{ color: D.accent, fontStyle: 'italic' }}>Accessories</em></Title>
        </div>
        <div style={{ display: 'flex', gap: 2 }}>
          {[['favorites', 'My Picks'], ['budget', 'Budget'], ['premium', 'Premium']].map(([id, label]) => (
            <button key={id} onClick={() => setCat(id)}
              style={{ padding: '9px 20px', background: cat === id ? D.white : 'transparent', color: cat === id ? D.bg : D.dim2, border: `1px solid ${cat === id ? D.white : D.border}`, fontFamily: 'var(--sans)', fontWeight: 600, fontSize: '0.72rem', letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.2s' }}>
              {label}
            </button>
          ))}
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        <motion.div key={cat} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px,1fr))', gap: 1, background: D.border, borderRadius: 6, overflow: 'hidden' }}>
            {items.map((item, i) => (
              <motion.div key={item.id}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.07 }}
                style={{ background: D.bg2, display: 'flex', flexDirection: 'column', transition: 'background 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.background = D.bg3}
                onMouseLeave={e => e.currentTarget.style.background = D.bg2}>
                {/* Image */}
                <div style={{ aspectRatio: '16/9', overflow: 'hidden', background: D.bg, position: 'relative' }}>
                  <img src={[P.g1,P.g2,P.g3,P.g4,P.g5,P.g6,P.g7,P.g8][i % 8]} alt={item.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s', opacity: 0.75 }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                  />
                  {item.badge && <div style={{ position: 'absolute', top: 12, left: 12, background: D.accent, color: '#fff', fontSize: '0.6rem', fontWeight: 800, padding: '3px 10px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{item.badge}</div>}
                </div>

                <div style={{ padding: '22px 22px 26px', flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div>
                    <div style={{ fontSize: '0.6rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: D.accent, marginBottom: 5, fontWeight: 600 }}>{item.subtitle}</div>
                    <h4 style={{ margin: 0, fontSize: '1.05rem', fontFamily: "'Playfair Display',serif", color: D.offW, fontWeight: 700 }}>{item.name}</h4>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: D.dim2, lineHeight: 1.7, flex: 1 }}>{item.description}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTop: `1px solid ${D.border}` }}>
                    <div>
                      <span style={{ fontWeight: 800, color: D.offW, fontSize: '1rem' }}>₹{item.price.toLocaleString('en-IN')}</span>
                      <span style={{ marginLeft: 6, fontSize: '0.72rem', color: D.dim2, textDecoration: 'line-through' }}>₹{item.originalPrice.toLocaleString('en-IN')}</span>
                    </div>
                    <span style={{ fontSize: '0.62rem', fontWeight: 700, padding: '3px 10px', border: `1px solid rgba(232,99,10,0.4)`, color: D.accent, letterSpacing: '0.1em' }}>{item.coupon}</span>
                  </div>
                  <a href={item.buyUrl}
                    style={{ display: 'block', padding: '11px', textAlign: 'center', background: D.accent, color: '#fff', fontFamily: 'var(--sans)', fontWeight: 700, fontSize: '0.72rem', letterSpacing: '0.14em', textTransform: 'uppercase', textDecoration: 'none', transition: 'opacity 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                    Buy Now
                  </a>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    </section>
  )
}

// ─── 05 · FULL BLEED BREAK — Road photo + quote ───────────────────────────────
function BreakSection({ img, quote, author }) {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [1.08, 1.0, 1.08])

  return (
    <section ref={ref} style={{ position: 'relative', height: '65vh', minHeight: 420, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <motion.img src={img} alt="" style={{ position: 'absolute', inset: '-10%', width: '120%', height: '120%', objectFit: 'cover', scale }} />
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(8,7,14,0.68)' }} />
      <motion.div {...up()} style={{ position: 'relative', zIndex: 2, textAlign: 'center', padding: '0 clamp(24px,8vw,120px)', maxWidth: 760, margin: '0 auto' }}>
        <div style={{ width: 32, height: 1, background: D.accent, margin: '0 auto 28px' }} />
        <p style={{ fontSize: 'clamp(1.4rem,3.5vw,2.8rem)', fontFamily: "'Playfair Display',serif", fontStyle: 'italic', color: D.offW, lineHeight: 1.3, margin: '0 0 20px', fontWeight: 500 }}>
          "{quote}"
        </p>
        <div style={{ fontSize: '0.62rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: D.dim2 }}>{author}</div>
      </motion.div>
    </section>
  )
}

// ─── 06 · VLOGS ───────────────────────────────────────────────────────────────
function VlogsSection() {
  const [playing, setPlaying] = useState(null)
  const [cat, setCat] = useState('Latest')
  const cats = ['Latest', 'Popular', 'Shorts', 'Ride Stories', 'Setup']
  const filtered = vlogs.filter(v => v.category === cat)

  return (
    <section id="v6-vlogs" style={{ background: D.bg1, padding: 'clamp(64px,8vw,96px) clamp(32px,5vw,88px)' }}>
      <motion.div {...up()} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 20, marginBottom: 44 }}>
        <div>
          <Eyebrow n="005" label="On the Road · Documented" />
          <Title>Vlogs &<br /><em style={{ color: D.accent, fontStyle: 'italic' }}>Ride Videos</em></Title>
        </div>
        <a href={cfg.social?.youtube?.href || '#'} target="_blank" rel="noopener noreferrer"
          style={{ fontSize: '0.7rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: D.dim2, textDecoration: 'none', borderBottom: `1px solid ${D.border}`, paddingBottom: 2, transition: 'color 0.2s, border-color 0.2s' }}
          onMouseEnter={e => { e.currentTarget.style.color = D.offW; e.currentTarget.style.borderColor = D.dim2 }}
          onMouseLeave={e => { e.currentTarget.style.color = D.dim2; e.currentTarget.style.borderColor = D.border }}>
          Subscribe ↗
        </a>
      </motion.div>

      {/* Category tabs */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 32, overflowX: 'auto' }}>
        {cats.map(c => (
          <button key={c} onClick={() => setCat(c)}
            style={{ padding: '8px 20px', background: cat === c ? D.white : 'transparent', color: cat === c ? D.bg : D.dim2, border: `1px solid ${cat === c ? D.white : D.border}`, fontFamily: 'var(--sans)', fontWeight: 600, fontSize: '0.72rem', letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap' }}>
            {c}
          </button>
        ))}
      </div>

      {/* Hero + grid layout */}
      <AnimatePresence mode="wait">
        <motion.div key={cat} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
          {filtered.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: filtered.length > 1 ? '1.6fr 1fr' : '1fr', gap: 2 }} className="vlogs-v6-hero">
              {/* Featured */}
              <motion.div onClick={() => setPlaying(filtered[0])} style={{ position: 'relative', cursor: 'pointer', overflow: 'hidden', background: D.bg, gridRow: filtered.length > 2 ? 'span 2' : 'span 1' }}>
                <img src={`https://img.youtube.com/vi/${filtered[0].id}/maxresdefault.jpg`} alt={filtered[0].title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', minHeight: 260, transition: 'transform 0.5s' }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.03)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                  onError={e => { e.target.src = P.road }}
                />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(8,7,14,0.9) 0%, transparent 55%)' }} />
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'rgba(232,99,10,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff"><path d="M8 5v14l11-7z"/></svg>
                  </div>
                </div>
                <div style={{ position: 'absolute', bottom: 20, left: 20, right: 20 }}>
                  <span style={{ fontSize: '0.6rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: D.accent, fontWeight: 700 }}>{filtered[0].category} · {filtered[0].date}</span>
                  <h3 style={{ margin: '6px 0 0', fontSize: 'clamp(1rem,2vw,1.5rem)', fontFamily: "'Playfair Display',serif", color: D.white, lineHeight: 1.25 }}>{filtered[0].title}</h3>
                </div>
                <span style={{ position: 'absolute', top: 14, right: 14, background: 'rgba(8,7,14,0.85)', color: D.dim1, fontSize: '0.7rem', padding: '3px 8px' }}>{filtered[0].duration}</span>
              </motion.div>

              {/* Side stack */}
              {filtered.slice(1, 3).map((v, i) => (
                <motion.div key={i} onClick={() => setPlaying(v)} style={{ position: 'relative', cursor: 'pointer', overflow: 'hidden', background: D.bg, minHeight: 160 }}>
                  <img src={`https://img.youtube.com/vi/${v.id}/mqdefault.jpg`} alt={v.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s', minHeight: 160 }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                    onError={e => { e.target.src = i === 0 ? P.sunset : P.night }}
                  />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(8,7,14,0.85) 0%, transparent 55%)' }} />
                  <div style={{ position: 'absolute', bottom: 12, left: 14, right: 14 }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: D.offW, lineHeight: 1.3 }}>{v.title}</div>
                    <div style={{ fontSize: '0.62rem', color: D.accent, marginTop: 3 }}>{v.duration} · {(v.views / 1000).toFixed(1)}K</div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Remaining videos */}
          {filtered.length > 3 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 2, marginTop: 2, background: D.border, borderRadius: 4, overflow: 'hidden' }}>
              {filtered.slice(3).map((v, i) => (
                <motion.div key={i} onClick={() => setPlaying(v)} style={{ background: D.bg2, cursor: 'pointer', transition: 'background 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.background = D.bg3}
                  onMouseLeave={e => e.currentTarget.style.background = D.bg2}>
                  <div style={{ aspectRatio: '16/9', overflow: 'hidden', position: 'relative' }}>
                    <img src={`https://img.youtube.com/vi/${v.id}/mqdefault.jpg`} alt={v.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={e => { e.target.src = P.coast }}
                    />
                    <span style={{ position: 'absolute', bottom: 6, right: 6, background: 'rgba(8,7,14,0.85)', color: D.dim1, fontSize: '0.62rem', padding: '2px 6px' }}>{v.duration}</span>
                  </div>
                  <div style={{ padding: '12px 14px' }}>
                    <div style={{ fontSize: '0.82rem', color: D.dim1, lineHeight: 1.35, fontWeight: 500 }}>{v.title}</div>
                    <div style={{ fontSize: '0.62rem', color: D.dim2, marginTop: 4 }}>{(v.views/1000).toFixed(1)}K · {v.date}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Modal */}
      <AnimatePresence>
        {playing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setPlaying(null)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <motion.div initial={{ scale: 0.94, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.94 }}
              onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 960, background: '#000', position: 'relative' }}>
              <button onClick={() => setPlaying(null)}
                style={{ position: 'absolute', top: -40, right: 0, background: 'none', border: `1px solid ${D.border}`, color: D.dim1, padding: '6px 16px', cursor: 'pointer', fontFamily: 'var(--sans)', fontSize: '0.68rem', letterSpacing: '0.1em' }}>
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
      <style>{`@media(max-width:768px){.vlogs-v6-hero{grid-template-columns:1fr!important}}`}</style>
    </section>
  )
}

// ─── 07 · RIDE MAP — Full layout matching reference screenshot ────────────────
// India map with react-simple-maps, colored route lines, left sidebar,
// right stats panel, featured journey cards below

// Route data enriched with colors per mode
const routeColors = { completed: '#a78bfa', planned: '#f59e0b', dream: '#e8630a' }

// Sidebar nav sections (mirrors the screenshot left panel)
const sidebarSections = [
  { id: 'v6-bike',        label: 'My Bike',               icon: '🏍️' },
  { id: 'v6-setup',       label: 'Specifications',         icon: '⚙️' },
  { id: 'v6-setup',       label: 'My Setup',               icon: '🔧' },
  { id: 'v6-recommended', label: 'Recommended Accessories', icon: '🛒' },
  { id: 'v6-vlogs',       label: 'Vlogs & Videos',         icon: '🎬' },
  { id: 'v6-rides',       label: 'Ride Map & Journeys',    icon: '📍', active: true },
  { id: 'v6-dream',       label: 'Dream Garage',           icon: '✨' },
  { id: 'v6-dream',       label: 'Wishlist',               icon: '📋' },
  { id: 'v6-stats',       label: 'Ride Stats',             icon: '📊' },
  { id: 'v6-cost',        label: 'Cost Tracker',           icon: '💰' },
]

const rideHighlights = [
  { label: 'Longest Ride',    value: 'Chennai to Rameswaram', sub: '620 KM',    icon: '🛣️' },
  { label: 'Highest Altitude', value: 'Yelagiri Hills',       sub: '1,410 m',   icon: '⛰️' },
  { label: 'Best Sunset',     value: 'East Coast Road (ECR)', sub: 'Chennai',   icon: '🌅' },
  { label: 'Most Challenging', value: 'Coimbatore Ghat Roads', sub: 'Curvy & Thrilling', icon: '🏔️' },
]

// ── SVG map cities — pixel positions on a 700×520 canvas ─────────────────────
// Coordinates are manually mapped so South India fills the frame nicely
// matching the reference screenshot layout
const MAP_CITIES = [
  { key: 'chennai',    label: 'Chennai',    x: 530, y: 195, home: true },
  { key: 'yelagiri',   label: 'Yelagiri',   x: 430, y: 108 },
  { key: 'pondy',      label: 'Pondicherry', x: 558, y: 300 },
  { key: 'coimbatore', label: 'Coimbatore', x: 265, y: 300 },
  { key: 'kodai',      label: 'Kodaikanal', x: 320, y: 380 },
  { key: 'rameswaram', label: 'Rameswaram', x: 500, y: 480 },
]

// Routes — from/to using city keys, with color
const MAP_ROUTES_DATA = [
  { id: 'r1', from: 'chennai', to: 'yelagiri',   color: '#a78bfa', mode: 'completed', label: 'Yelagiri Ride',       dist: '320 KM', date: 'May 2024', rating: 4.8 },
  { id: 'r2', from: 'chennai', to: 'pondy',       color: '#22c55e', mode: 'completed', label: 'Chennai → Pondy',    dist: '210 KM', date: 'Apr 2024', rating: 4.6 },
  { id: 'r3', from: 'coimbatore', to: 'chennai',  color: '#f59e0b', mode: 'completed', label: 'Coimbatore → Chennai', dist: '500 KM', date: 'Mar 2024', rating: 4.5 },
  { id: 'r4', from: 'chennai', to: 'rameswaram',  color: '#ec4899', mode: 'completed', label: 'Chennai → Rameswaram', dist: '570 KM', date: 'Mar 2024', rating: 4.9 },
  { id: 'r5', from: 'coimbatore', to: 'kodai',    color: '#38bdf8', mode: 'completed', label: 'Kodaikanal Ride',    dist: '100 KM', date: 'Feb 2024', rating: 4.7 },
]

// Get city pixel position by key
function getCityPos(key) { return MAP_CITIES.find(c => c.key === key) || { x: 0, y: 0 } }

// Curved path between two points — adds a midpoint offset for a natural arc
function curvePath(x1, y1, x2, y2) {
  const mx = (x1 + x2) / 2
  const my = (y1 + y2) / 2
  // Perpendicular offset for curve
  const dx = x2 - x1, dy = y2 - y1
  const len = Math.sqrt(dx * dx + dy * dy)
  const nx = -dy / len, ny = dx / len
  const curve = len * 0.18
  const cx = mx + nx * curve
  const cy = my + ny * curve
  return `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`
}

// Leaflet map loaded via CDN — injected once, reused
function loadLeaflet() {
  return new Promise(resolve => {
    if (window.L) { resolve(window.L); return }
    // CSS
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link')
      link.id = 'leaflet-css'
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(link)
    }
    // JS
    const script = document.createElement('script')
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
    script.onload = () => resolve(window.L)
    document.head.appendChild(script)
  })
}

// Geo coordinates for each city [lat, lng]
const CITY_COORDS = {
  chennai:    [13.0827, 80.2707],
  yelagiri:   [12.5793, 78.6393],
  pondy:      [11.9416, 79.8083],
  coimbatore: [11.0168, 76.9558],
  kodai:      [10.2381, 77.4892],
  rameswaram: [9.2876,  79.3129],
}

function RideMapSVG({ visibleRoutes, hoveredRoute, setHoveredRoute }) {
  const mapRef = useRef(null)
  const leafletMap = useRef(null)
  const routeLayers = useRef([])
  const markerLayers = useRef([])
  const [activeTooltip, setActiveTooltip] = useState(null)

  useEffect(() => {
    let mounted = true
    loadLeaflet().then(L => {
      if (!mounted || !mapRef.current || leafletMap.current) return

      // Init map centered on Tamil Nadu
      const map = L.map(mapRef.current, {
        center: [11.5, 78.5],
        zoom: 7,
        zoomControl: false,
        attributionControl: false,
        scrollWheelZoom: false,
      })
      leafletMap.current = map

      // CartoDB Dark Matter tiles — exact dark map style from the screenshot
      L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        { subdomains: 'abcd', maxZoom: 19 }
      ).addTo(map)

      // Draw routes using OSRM real road routing API
      const routeData = [
        { from: 'chennai',    to: 'yelagiri',   color: '#a78bfa', label: 'Yelagiri Hill Ride',          dist: '320 KM', date: 'May 2024', rating: 4.8 },
        { from: 'chennai',    to: 'pondy',       color: '#f97316', label: 'Coastal Ride to Pondicherry',  dist: '210 KM', date: 'Apr 2024', rating: 4.6 },
        { from: 'chennai',    to: 'rameswaram',  color: '#facc15', label: 'Chennai → Rameswaram',         dist: '570 KM', date: 'Mar 2024', rating: 4.9 },
        { from: 'coimbatore', to: 'chennai',     color: '#22c55e', label: 'Coimbatore → Chennai',         dist: '500 KM', date: 'Mar 2024', rating: 4.5 },
        { from: 'coimbatore', to: 'kodai',       color: '#38bdf8', label: 'Kodaikanal Ride',              dist: '100 KM', date: 'Feb 2024', rating: 4.7 },
      ]

      // Fetch real road route from OSRM public API and draw on map
      const drawRoute = async (r, delayMs) => {
        const from = CITY_COORDS[r.from]  // [lat, lng]
        const to   = CITY_COORDS[r.to]
        if (!from || !to || !mounted) return

        try {
          // OSRM expects lng,lat order in URL
          const url = `https://router.project-osrm.org/route/v1/driving/${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&geometries=geojson`
          const res  = await fetch(url)
          const data = await res.json()
          if (!mounted || !data.routes?.[0]) return

          // Decode GeoJSON coordinates [lng, lat] → Leaflet [lat, lng]
          const coords = data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng])

          // Glow polyline behind
          const glowLine = L.polyline(coords, {
            color: r.color, weight: 10, opacity: 0.18, smoothFactor: 1, interactive: false,
          }).addTo(map)

          // Main route polyline — drawn fully at once, animated via GPU CSS dash
          const polyline = L.polyline(coords, {
            color: r.color, weight: 3.5, opacity: 0.95,
            smoothFactor: 1, lineJoin: 'round', lineCap: 'round',
          }).addTo(map)

          const el = polyline.getElement()
          if (el && el.getTotalLength) {
            const len = el.getTotalLength()
            el.style.strokeDasharray = len
            el.style.strokeDashoffset = len
            el.style.transition = `stroke-dashoffset 1.2s ${delayMs}ms ease-out`
            requestAnimationFrame(() => { el.style.strokeDashoffset = '0' })
          }

          polyline.on('mouseover', () => setActiveTooltip(r))
          polyline.on('mouseout',  () => setActiveTooltip(null))
          routeLayers.current.push(polyline, glowLine)
        } catch (e) {
          // Fallback: straight line if OSRM fails
          if (!mounted) return
          const from = CITY_COORDS[r.from]
          const to   = CITY_COORDS[r.to]
          const fallback = L.polyline([from, to], { color: r.color, weight: 3, opacity: 0.85 }).addTo(map)
          fallback.on('mouseover', () => setActiveTooltip(r))
          fallback.on('mouseout',  () => setActiveTooltip(null))
          routeLayers.current.push(fallback)
        }
      }

      // Fire all route requests — staggered by 400ms each
      routeData.forEach((r, i) => drawRoute(r, i * 400))

      // City markers
      Object.entries(CITY_COORDS).forEach(([key, coords]) => {
        const isHome = key === 'chennai'
        const color  = isHome ? '#a78bfa' : '#c4b5fd'
        const labels = { chennai: 'Chennai', yelagiri: 'Yelagiri', pondy: 'Pondicherry', coimbatore: 'Coimbatore', kodai: 'Kodaikanal', rameswaram: 'Rameswaram' }

        // Custom HTML marker — pulsing circle with label
        const icon = L.divIcon({
          className: '',
          html: `
            <div style="position:relative;display:flex;align-items:center;justify-content:center">
              <div style="
                width:${isHome ? 18 : 14}px;height:${isHome ? 18 : 14}px;
                border-radius:50%;
                background:${color};
                border:2.5px solid rgba(255,255,255,0.9);
                box-shadow:0 0 12px ${color}80;
                position:relative;z-index:2;
              "></div>
              <div style="
                position:absolute;
                width:${isHome ? 32 : 26}px;height:${isHome ? 32 : 26}px;
                border-radius:50%;
                background:${color}30;
                animation:pulse-ring 2s ease-out infinite;
                z-index:1;
              "></div>
            </div>
          `,
          iconSize: [isHome ? 32 : 26, isHome ? 32 : 26],
          iconAnchor: [isHome ? 16 : 13, isHome ? 16 : 13],
        })

        const marker = L.marker(coords, { icon, zIndexOffset: isHome ? 100 : 0 }).addTo(map)

        // Label tooltip — always visible
        marker.bindTooltip(
          `<div style="
            background:rgba(13,12,26,0.92);
            border:1px solid rgba(167,139,250,0.3);
            color:#f0eee8;
            font-family:system-ui,sans-serif;
            font-size:12px;
            font-weight:700;
            padding:4px 10px;
            border-radius:4px;
            white-space:nowrap;
            letter-spacing:0.03em;
            pointer-events:none;
          ">${isHome ? '🏍️ ' : ''}${labels[key]}</div>`,
          {
            permanent: true,
            direction: ['chennai','pondy','rameswaram'].includes(key) ? 'right' : 'left',
            offset: [isHome ? 14 : 12, 0],
            className: 'leaflet-garage-tooltip',
          }
        )
        markerLayers.current.push(marker)
      })

      // Inject CSS for pulse animation + hide default tooltip bg
      if (!document.getElementById('garage-map-style')) {
        const style = document.createElement('style')
        style.id = 'garage-map-style'
        style.textContent = `
          @keyframes pulse-ring {
            0%   { transform: scale(1);   opacity: 0.7; }
            100% { transform: scale(2.2); opacity: 0; }
          }
          .leaflet-garage-tooltip {
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
          }
          .leaflet-garage-tooltip::before { display: none !important; }
          .leaflet-container { background: #080814 !important; }
        `
        document.head.appendChild(style)
      }
    })

    return () => {
      mounted = false
      if (leafletMap.current) {
        leafletMap.current.remove()
        leafletMap.current = null
      }
    }
  }, [])

  const zoomIn  = () => leafletMap.current?.zoomIn()
  const zoomOut = () => leafletMap.current?.zoomOut()

  return (
    <div style={{ flex: 1, position: 'relative', minHeight: 420 }}>
      {/* Leaflet map container */}
      <div ref={mapRef} style={{ position: 'absolute', inset: 0, zIndex: 1 }} />

      {/* Zoom controls matching screenshot */}
      <div style={{ position: 'absolute', left: 16, bottom: 80, display: 'flex', flexDirection: 'column', gap: 2, zIndex: 20 }}>
        {[{ sym: '+', fn: zoomIn }, { sym: '−', fn: zoomOut }, { sym: '⊕', fn: () => leafletMap.current?.setView([11.5,78.5], 7) }].map(({ sym, fn }, i) => (
          <button key={i} onClick={fn}
            style={{ width: 32, height: 32, background: 'rgba(13,12,26,0.92)', border: `1px solid ${D.border}`, color: D.dim1, fontSize: i === 2 ? '0.75rem' : '1.1rem', cursor: 'pointer', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4, transition: 'border-color 0.2s, color 0.2s', fontFamily: 'var(--sans)' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(167,139,250,0.5)'; e.currentTarget.style.color = D.offW }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = D.border; e.currentTarget.style.color = D.dim1 }}>
            {sym}
          </button>
        ))}
      </div>

      {/* Route hover tooltip */}
      <AnimatePresence>
        {activeTooltip && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', background: 'rgba(13,12,26,0.96)', border: `1px solid ${activeTooltip.color}50`, borderRadius: 8, padding: '10px 18px', backdropFilter: 'blur(16px)', zIndex: 20, whiteSpace: 'nowrap', pointerEvents: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.82rem' }}>
              <div style={{ width: 12, height: 3, background: activeTooltip.color, borderRadius: 999 }} />
              <span style={{ fontWeight: 700, color: D.offW }}>{activeTooltip.label}</span>
              <span style={{ color: D.dim2 }}>{activeTooltip.dist}</span>
              <span style={{ color: D.dim2 }}>·</span>
              <span style={{ color: D.dim2 }}>{activeTooltip.date}</span>
              {activeTooltip.rating && <span style={{ color: '#f59e0b' }}>★ {activeTooltip.rating}</span>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* View Full Screen */}
      <button style={{ position: 'absolute', bottom: 16, right: 16, padding: '6px 14px', background: 'rgba(13,12,26,0.92)', border: `1px solid ${D.border}`, color: D.dim1, fontSize: '0.72rem', fontFamily: 'var(--sans)', cursor: 'pointer', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', gap: 6, borderRadius: 4, zIndex: 20, transition: 'border-color 0.2s' }}
        onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(167,139,250,0.4)'}
        onMouseLeave={e => e.currentTarget.style.borderColor = D.border}>
        ⛶ View Full Screen +
      </button>
    </div>
  )
}

function RidesSection() {
  const [activeMode, setActiveMode] = useState('All')
  const [hoveredRoute, setHoveredRoute] = useState(null)
  const [tooltip, setTooltip] = useState(null)

  const modes = ['All Rides', 'Completed', 'Planned']
  const modeKey = { 'All Rides': null, 'Completed': 'completed', 'Planned': 'planned' }

  const visibleRoutes = routes.filter(r =>
    activeMode === 'All Rides' ? (r.mode === 'completed' || r.mode === 'planned') : r.mode === modeKey[activeMode]
  )

  const featuredJourneys = routes.slice(0, 6)

  return (
    <section id="v6-rides" style={{ background: '#0d0c1a' }}>

      {/* ── Breadcrumb ── */}
      <div style={{ padding: '16px 24px', borderBottom: `1px solid ${D.border}`, display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.75rem', color: D.dim2 }}>
        <span style={{ cursor: 'pointer', transition: 'color 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.color = D.offW}
          onMouseLeave={e => e.currentTarget.style.color = D.dim2}
          onClick={() => document.getElementById('v6-bike')?.scrollIntoView({ behavior: 'smooth' })}>
          Bike
        </span>
        <span style={{ opacity: 0.4 }}>›</span>
        <span style={{ color: D.accent, fontWeight: 600 }}>Ride Map &amp; Journeys</span>
      </div>

      {/* ── 3-column layout: Sidebar | Map | Right Stats ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr 300px', minHeight: 600 }} className="ridemap-layout">

        {/* ── LEFT SIDEBAR ── */}
        <div style={{ borderRight: `1px solid ${D.border}`, padding: '24px 0', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div style={{ padding: '0 16px 12px', fontSize: '0.58rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: D.dim2, fontWeight: 700 }}>
            BIKE SECTIONS
          </div>
          {sidebarSections.map((s, i) => (
            <button key={i} onClick={() => document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth' })}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 16px', background: s.active ? 'rgba(167,139,250,0.12)' : 'transparent',
                border: 'none', borderLeft: `3px solid ${s.active ? 'var(--accent)' : 'transparent'}`,
                cursor: 'pointer', textAlign: 'left', width: '100%',
                color: s.active ? 'var(--accent)' : D.dim1,
                fontSize: '0.82rem', fontFamily: 'var(--sans)', fontWeight: s.active ? 600 : 400,
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { if (!s.active) { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = D.offW } }}
              onMouseLeave={e => { if (!s.active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = D.dim1 } }}
            >
              <span style={{ fontSize: '0.9rem', flexShrink: 0 }}>{s.icon}</span>
              {s.label}
            </button>
          ))}

          {/* Next big trip card */}
          <div style={{ margin: '20px 12px 0', background: D.bg2, border: `1px solid ${D.border}`, borderRadius: 10, padding: 14 }}>
            <div style={{ fontSize: '0.58rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: D.dim2, marginBottom: 10, fontWeight: 700 }}>NEXT BIG TRIP</div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 10 }}>
              <div style={{ width: 44, height: 34, borderRadius: 6, overflow: 'hidden', flexShrink: 0, background: D.bg3 }}>
                <img src={P.mtn} alt="Ladakh" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }} />
              </div>
              <div>
                <div style={{ fontWeight: 700, color: D.offW, fontSize: '0.82rem', marginBottom: 2 }}>Ladakh 2025</div>
                <div style={{ fontSize: '0.68rem', color: D.dim2 }}>Chennai → Ladakh</div>
                <div style={{ fontSize: '0.68rem', color: D.dim2 }}>4200+ KM (One Way)</div>
                <span style={{ fontSize: '0.58rem', fontWeight: 700, padding: '2px 8px', background: 'rgba(248,196,0,0.15)', color: '#f8c400', borderRadius: 4, letterSpacing: '0.08em' }}>PLANNING</span>
              </div>
            </div>
            {/* Progress bar */}
            <div style={{ height: 4, background: D.bg3, borderRadius: 999, marginBottom: 4 }}>
              <motion.div initial={{ width: 0 }} whileInView={{ width: '60%' }} viewport={{ once: true }} transition={{ duration: 1 }}
                style={{ height: '100%', background: 'linear-gradient(to right, var(--accent), #e8630a)', borderRadius: 999 }} />
            </div>
            <div style={{ fontSize: '0.62rem', color: D.dim2 }}>60% Planned</div>
          </div>

          {/* Quote */}
          <div style={{ margin: '16px 12px 0', padding: '14px', borderLeft: `2px solid var(--accent)` }}>
            <div style={{ fontSize: '1.2rem', color: 'var(--accent)', marginBottom: 6, lineHeight: 1 }}>"</div>
            <p style={{ fontSize: '0.78rem', color: D.dim1, fontStyle: 'italic', lineHeight: 1.6, margin: '0 0 8px' }}>
              Sometimes the best therapy is a long ride and good roads.
            </p>
            <div style={{ fontSize: '0.7rem', color: D.dim2, fontFamily: "'Kaushan Script', cursive" }}>— Siva</div>
          </div>
        </div>

        {/* ── CENTER MAP ── */}
        <div style={{ position: 'relative', background: '#0d0c1a', display: 'flex', flexDirection: 'column' }}>
          {/* Map header */}
          <div style={{ padding: '24px 28px 16px', borderBottom: `1px solid ${D.border}` }}>
            <h2 style={{ margin: '0 0 6px', fontSize: '1.6rem', fontWeight: 800, color: D.white, letterSpacing: '-0.02em' }}>RIDE MAP &amp; JOURNEYS</h2>
            <p style={{ margin: '0 0 16px', fontSize: '0.82rem', color: D.dim2 }}>Every road has a story. Here are the places I've explored and the memories I've collected.</p>
            {/* Mode filter pills */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {modes.map(m => {
                const isActive = activeMode === m
                return (
                  <button key={m} onClick={() => setActiveMode(m)}
                    style={{
                      padding: '5px 14px', borderRadius: 999, cursor: 'pointer',
                      background: isActive ? (m === 'All Rides' ? 'var(--accent)' : m === 'Completed' ? 'rgba(34,197,94,0.15)' : 'rgba(245,158,11,0.15)') : 'transparent',
                      color: isActive ? (m === 'All Rides' ? '#fff' : m === 'Completed' ? '#22c55e' : '#f59e0b') : D.dim2,
                      border: `1px solid ${isActive ? (m === 'Completed' ? '#22c55e' : m === 'Planned' ? '#f59e0b' : 'var(--accent)') : D.border}`,
                      fontFamily: 'var(--sans)', fontWeight: 600, fontSize: '0.75rem',
                      display: 'flex', alignItems: 'center', gap: 5,
                      transition: 'all 0.2s',
                    }}>
                    {m === 'Completed' && <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />}
                    {m === 'Planned' && <span style={{ fontSize: '0.7rem' }}>⚑</span>}
                    {m}
                  </button>
                )
              })}
            </div>
          </div>

          {/* SVG Custom Map */}
          <RideMapSVG visibleRoutes={visibleRoutes} hoveredRoute={hoveredRoute} setHoveredRoute={setHoveredRoute} />

          {/* Featured Journeys below map */}
          <div style={{ padding: '20px 28px 28px', borderTop: `1px solid ${D.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: D.offW, letterSpacing: '0.06em' }}>FEATURED JOURNEYS</span>
              <button style={{ fontSize: '0.72rem', color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--sans)', fontWeight: 600 }}>
                View All Journeys →
              </button>
            </div>
            <div style={{ display: 'flex', gap: 10, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 4 }}>
              {featuredJourneys.map((r, i) => {
                const c = routeColors[r.mode]
                const modeLabel = { completed: 'COMPLETED', planned: 'PLANNED', dream: 'DREAM' }[r.mode]
                const thumbImgs = [P.g1, P.g2, P.g3, P.g4, P.road, P.sunset]
                return (
                  <motion.div key={r.id}
                    whileHover={{ y: -3 }}
                    style={{ minWidth: 160, flexShrink: 0, background: D.bg2, border: `1px solid ${D.border}`, borderRadius: 10, overflow: 'hidden', cursor: 'pointer' }}>
                    <div style={{ position: 'relative', height: 80, overflow: 'hidden', background: D.bg3 }}>
                      <img src={thumbImgs[i % thumbImgs.length]} alt={r.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.65 }} />
                      <div style={{ position: 'absolute', top: 6, left: 6 }}>
                        <span style={{ fontSize: '0.55rem', fontWeight: 800, padding: '2px 7px', background: c, color: '#fff', letterSpacing: '0.1em', borderRadius: 3 }}>{modeLabel}</span>
                      </div>
                      <div style={{ position: 'absolute', top: 6, right: 6 }}>
                        <span style={{ fontSize: '0.6rem', fontWeight: 700, color: D.offW, background: 'rgba(0,0,0,0.65)', padding: '2px 6px', borderRadius: 3 }}>{r.distance}</span>
                      </div>
                    </div>
                    <div style={{ padding: '10px 10px 12px' }}>
                      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: D.offW, lineHeight: 1.3, marginBottom: 4 }}>{r.name.toUpperCase()}</div>
                      <div style={{ fontSize: '0.62rem', color: D.dim2, marginBottom: 6, lineHeight: 1.4 }}>{r.description.slice(0, 40)}…</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6rem', color: D.dim2 }}>
                        <span>📅 {r.date}</span>
                        <span>⏱ {r.time}</span>
                        {r.rating && <span style={{ color: '#f59e0b' }}>★ {r.rating}</span>}
                        {!r.rating && <span style={{ color: 'var(--accent)' }}>♡</span>}
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </div>

        {/* ── RIGHT STATS PANEL ── */}
        <div style={{ borderLeft: `1px solid ${D.border}`, padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 24, overflowY: 'auto' }}>

          {/* Ride Statistics */}
          <div>
            <div style={{ fontSize: '0.62rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--accent)', fontWeight: 700, marginBottom: 16 }}>RIDE STATISTICS</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { icon: '🛣️', value: '12,547+', label: 'Total KM Ridden' },
                { icon: '🏁', value: '24',      label: 'Trips Completed' },
                { icon: '⏱️', value: '542',     label: 'Total Riding Hours' },
                { icon: '📍', value: '6',        label: 'States Explored' },
              ].map((s, i) => (
                <div key={i} style={{ background: D.bg2, border: `1px solid ${D.border}`, borderRadius: 10, padding: '12px 14px' }}>
                  <div style={{ fontSize: '1rem', marginBottom: 4 }}>{s.icon}</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: D.white, lineHeight: 1, marginBottom: 3 }}>{s.value}</div>
                  <div style={{ fontSize: '0.62rem', color: D.dim2, lineHeight: 1.3 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Countries explored */}
          <div>
            <div style={{ fontSize: '0.62rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--accent)', fontWeight: 700, marginBottom: 12 }}>COUNTRIES EXPLORED</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: D.bg2, border: `1px solid ${D.border}`, borderRadius: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: '1.1rem' }}>🇮🇳</span>
                <span style={{ fontSize: '0.85rem', color: D.offW, fontWeight: 500 }}>India</span>
              </div>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: D.dim1 }}>1</span>
            </div>
          </div>

          {/* Ride Highlights */}
          <div>
            <div style={{ fontSize: '0.62rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--accent)', fontWeight: 700, marginBottom: 12 }}>RIDE HIGHLIGHTS</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {rideHighlights.map((h, i) => (
                <motion.div key={i}
                  initial={{ opacity: 0, x: 16 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                  style={{ display: 'flex', gap: 10, padding: '10px 12px', background: D.bg2, border: `1px solid ${D.border}`, borderRadius: 8, alignItems: 'flex-start', cursor: 'default', transition: 'border-color 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(167,139,250,0.3)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = D.border}
                >
                  <span style={{ fontSize: '1rem', flexShrink: 0 }}>{h.icon}</span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '0.6rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: D.dim2, marginBottom: 2 }}>{h.label}</div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: D.offW, marginBottom: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.value}</div>
                    <div style={{ fontSize: '0.68rem', color: D.dim2 }}>{h.sub}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Add New Ride button */}
          <button style={{ width: '100%', padding: '11px', background: 'transparent', border: `1px solid ${D.border}`, color: D.dim1, fontFamily: 'var(--sans)', fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer', borderRadius: 8, transition: 'all 0.2s', letterSpacing: '0.04em' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = D.border; e.currentTarget.style.color = D.dim1 }}>
            + Add New Ride
          </button>
        </div>
      </div>

      <style>{`
        @media (max-width: 1100px) { .ridemap-layout { grid-template-columns: 200px 1fr !important; } .ridemap-layout > *:last-child { display: none; } }
        @media (max-width: 768px)  { .ridemap-layout { grid-template-columns: 1fr !important; } .ridemap-layout > *:first-child { display: none; } }
      `}</style>
    </section>
  )
}

// ─── 08 · STATS ───────────────────────────────────────────────────────────────
function StatsSection() {
  const chartRef = useRef(null)
  const inView = useInView(chartRef, { once: true })
  const max = Math.max(...rideStats.monthlyData.map(d => d.km))

  return (
    <section id="v6-stats" style={{ background: D.bg1, padding: 'clamp(64px,8vw,96px) clamp(32px,5vw,88px)' }}>
      <motion.div {...up()} style={{ marginBottom: 52 }}>
        <Eyebrow n="007" label="Analytics" />
        <Title>Ride Statistics</Title>
      </motion.div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'start' }} className="stats-v6-grid">
        {/* Summary grid */}
        <motion.div {...up()}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: D.border, borderRadius: 4, overflow: 'hidden', marginBottom: 32 }}>
            {[
              ['Total Rides', rideStats.summary.totalRides, ''],
              ['Distance', rideStats.summary.totalDistance, ' km'],
              ['Riding Hours', rideStats.summary.rideHours, 'h'],
              ['Top Speed', rideStats.summary.topSpeed, ' km/h'],
              ['Avg Mileage', rideStats.summary.avgMileage, ' km/l', 1],
              ['Avg Speed', rideStats.summary.avgSpeed, ' km/h'],
            ].map(([label, end, sfx, dec]) => (
              <div key={label} style={{ padding: '20px', background: D.bg2, transition: 'background 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.background = D.bg3}
                onMouseLeave={e => e.currentTarget.style.background = D.bg2}>
                <div style={{ fontSize: '0.58rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: D.dim2, marginBottom: 6 }}>{label}</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: D.white, lineHeight: 1 }}>
                  <CountUp end={end} suffix={sfx} decimals={dec || 0} />
                </div>
              </div>
            ))}
          </div>

          {/* Ride types */}
          <div>
            <div style={{ fontSize: '0.6rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: D.dim2, marginBottom: 16 }}>Ride Breakdown</div>
            {rideStats.rideTypes.map((rt, i) => (
              <div key={i} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.82rem' }}>
                  <span style={{ color: D.dim1 }}>{rt.type}</span>
                  <span style={{ fontWeight: 700, color: D.offW }}>{rt.percent}%</span>
                </div>
                <div style={{ height: 3, background: D.bg3, borderRadius: 999 }}>
                  <motion.div initial={{ width: 0 }} whileInView={{ width: `${rt.percent}%` }} viewport={{ once: true }}
                    transition={{ duration: 0.9, delay: i * 0.12 }}
                    style={{ height: '100%', background: rt.color, borderRadius: 999 }} />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Bar chart + recent rides */}
        <div>
          <motion.div {...up(0.1)}>
            <div ref={chartRef} style={{ marginBottom: 40 }}>
              <div style={{ fontSize: '0.6rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: D.dim2, marginBottom: 16 }}>Monthly KM</div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, height: 140 }}>
                {rideStats.monthlyData.map((d, i) => {
                  const h = Math.round((d.km / max) * 120)
                  return (
                    <div key={i} title={`${d.month}: ${d.km}`} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                      <motion.div
                        initial={{ height: 0 }} animate={inView ? { height: h } : { height: 0 }}
                        transition={{ duration: 0.6, delay: i * 0.05, ease: 'easeOut' }}
                        style={{ width: '100%', background: i === rideStats.monthlyData.length - 1 ? D.accent : D.border, borderRadius: '2px 2px 0 0', minHeight: 2 }} />
                      <span style={{ fontSize: '0.5rem', color: D.dim2 }}>{d.month}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Recent rides — clean rows */}
            <div style={{ fontSize: '0.6rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: D.dim2, marginBottom: 12 }}>Recent Rides</div>
            <div>
              {rideStats.recentRides.map((r, i) => (
                <motion.div key={i}
                  initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: `1px solid ${D.border}`, gap: 12 }}>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: D.offW }}>{r.route}</div>
                    <div style={{ fontSize: '0.62rem', color: D.dim2, marginTop: 2 }}>{r.date}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 16, flexShrink: 0 }}>
                    <span style={{ fontSize: '0.75rem', color: D.dim1 }}>{r.km} km</span>
                    <span style={{ fontSize: '0.7rem', padding: '2px 8px', border: `1px solid ${D.border}`, color: D.dim2, letterSpacing: '0.08em' }}>{r.type}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
      <style>{`@media(max-width:860px){.stats-v6-grid{grid-template-columns:1fr!important}}`}</style>
    </section>
  )
}

// ─── 09 · DREAM + WISHLIST ────────────────────────────────────────────────────
function DreamSection() {
  const statusC = { completed: '#22c55e', active: D.accent, planned: '#f59e0b', future: D.dim2 }

  return (
    <section id="v6-dream" style={{ background: D.bg2, padding: 'clamp(64px,8vw,96px) clamp(32px,5vw,88px)' }}>
      <motion.div {...up()} style={{ marginBottom: 52 }}>
        <Eyebrow n="008" label="The Vision Ahead" />
        <Title>Dream Garage</Title>
      </motion.div>

      {/* Phases — horizontal bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 1, background: D.border, marginBottom: 64, borderRadius: 4, overflow: 'hidden' }} className="phases-v6">
        {dreamGarage.phases.map((p, i) => {
          const c = statusC[p.status]
          return (
            <motion.div key={p.id}
              initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              style={{ padding: '28px 22px', background: D.bg2, borderTop: `3px solid ${c}` }}>
              <div style={{ fontSize: '0.58rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: c, fontWeight: 700, marginBottom: 5 }}>{p.status}</div>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.05rem', color: D.offW, marginBottom: 18, fontWeight: 700 }}>{p.title}</div>
              {p.items.map((item, j) => (
                <div key={j} style={{ display: 'flex', gap: 8, marginBottom: 7, fontSize: '0.75rem', color: D.dim1 }}>
                  <span style={{ color: c, flexShrink: 0 }}>{p.status === 'completed' ? '✓' : '—'}</span>{item}
                </div>
              ))}
            </motion.div>
          )
        })}
      </div>

      {/* Wishlist — clean list */}
      <motion.div {...up(0.1)}>
        <div style={{ fontSize: '0.6rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: D.dim2, marginBottom: 20 }}>Wishlist</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 1, background: D.border, borderRadius: 4, overflow: 'hidden' }}>
          {wishlist.filter(w => w.status !== 'dreaming').map((w, i) => {
            const pc = { high: D.accent, medium: '#f59e0b', low: '#22c55e' }[w.priority]
            return (
              <motion.div key={w.id}
                initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.04 }}
                style={{ padding: '20px', background: D.bg2, borderLeft: `3px solid ${pc}`, transition: 'background 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.background = D.bg3}
                onMouseLeave={e => e.currentTarget.style.background = D.bg2}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginBottom: 6 }}>
                  <div style={{ fontWeight: 700, color: D.offW, fontSize: '0.9rem' }}>{w.name}</div>
                  <div style={{ fontWeight: 800, color: D.offW, fontSize: '0.9rem', flexShrink: 0 }}>
                    {w.price >= 100000 ? `₹${(w.price/100000).toFixed(1)}L` : `₹${w.price.toLocaleString('en-IN')}`}
                  </div>
                </div>
                <p style={{ margin: '0 0 10px', fontSize: '0.75rem', color: D.dim2, lineHeight: 1.5 }}>{w.reason}</p>
                <div style={{ display: 'flex', gap: 10, fontSize: '0.62rem' }}>
                  <span style={{ color: pc, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{w.priority}</span>
                  <span style={{ color: D.dim2 }}>·</span>
                  <span style={{ color: D.dim2 }}>{w.targetMonth}</span>
                </div>
              </motion.div>
            )
          })}
        </div>
      </motion.div>
      <style>{`@media(max-width:860px){.phases-v6{grid-template-columns:1fr 1fr!important}} @media(max-width:520px){.phases-v6{grid-template-columns:1fr!important}}`}</style>
    </section>
  )
}

// ─── 10 · COST + MAINTENANCE ─────────────────────────────────────────────────
function CostSection() {
  const total = costTracker.categories.reduce((s, c) => s + c.amount, 0)
  const pColor = { high: D.accent, medium: '#f59e0b', low: '#22c55e' }

  return (
    <section id="v6-cost" style={{ background: D.bg, padding: 'clamp(64px,8vw,96px) clamp(32px,5vw,88px)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 72 }} className="cost-v6-grid">

        {/* Cost */}
        <div>
          <motion.div {...up()}>
            <Eyebrow n="009" label="Investment" />
            <Title size="2.8rem">Cost Tracker</Title>
          </motion.div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 1, background: D.border, borderRadius: 4, overflow: 'hidden', margin: '32px 0' }}>
            {[['₹3.1L','Total'],['₹8.2K','Monthly'],['₹24.9','/ KM']].map(([v,l]) => (
              <div key={l} style={{ padding: '18px 14px', background: D.bg1, textAlign: 'center' }}>
                <div style={{ fontWeight: 800, fontSize: '1.2rem', color: D.white, lineHeight: 1 }}>{v}</div>
                <div style={{ fontSize: '0.6rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: D.dim2, marginTop: 4 }}>{l}</div>
              </div>
            ))}
          </div>
          {costTracker.categories.map((c, i) => {
            const pct = (c.amount / total) * 100
            return (
              <motion.div key={i} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07 }} style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.82rem' }}>
                  <span style={{ color: D.dim1 }}>{c.icon} {c.name}</span>
                  <span style={{ fontWeight: 700, color: D.offW }}>₹{c.amount.toLocaleString('en-IN')}</span>
                </div>
                <div style={{ height: 3, background: D.bg2, borderRadius: 999 }}>
                  <motion.div initial={{ width: 0 }} whileInView={{ width: `${pct}%` }} viewport={{ once: true }} transition={{ duration: 0.8, delay: i * 0.1 }}
                    style={{ height: '100%', background: c.color, borderRadius: 999 }} />
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Maintenance */}
        <div>
          <motion.div {...up(0.1)}>
            <Eyebrow n="010" label="Keep It Running" />
            <Title size="2.8rem">Maintenance</Title>
          </motion.div>
          <div style={{ marginTop: 32 }}>
            {maintenance.upcoming.map((item, i) => {
              const pc = pColor[item.priority]
              const pct = item.dueKm ? Math.min((item.currentKm / item.dueKm) * 100, 100) : null
              return (
                <motion.div key={i} initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07 }}
                  style={{ padding: '16px', background: D.bg1, borderBottom: `1px solid ${D.border}`, borderLeft: `3px solid ${pc}`, marginBottom: 2, transition: 'background 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.background = D.bg2}
                  onMouseLeave={e => e.currentTarget.style.background = D.bg1}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: pct !== null ? 8 : 0 }}>
                    <span style={{ fontSize: '0.88rem', fontWeight: 600, color: D.offW }}>{item.icon} {item.type}</span>
                    <span style={{ fontSize: '0.6rem', fontWeight: 700, color: pc, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{item.priority}</span>
                  </div>
                  {pct !== null && (
                    <>
                      <div style={{ height: 2, background: D.bg3, borderRadius: 999 }}>
                        <motion.div initial={{ width: 0 }} whileInView={{ width: `${pct}%` }} viewport={{ once: true }} transition={{ duration: 0.8, delay: i * 0.1 }}
                          style={{ height: '100%', background: pct > 85 ? '#ef4444' : pc, borderRadius: 999 }} />
                      </div>
                      <div style={{ fontSize: '0.62rem', color: D.dim2, marginTop: 4 }}>{(item.dueKm - item.currentKm).toLocaleString('en-IN')} KM remaining</div>
                    </>
                  )}
                  {item.dueDate && <div style={{ fontSize: '0.68rem', color: D.dim2 }}>Due: {item.dueDate}</div>}
                </motion.div>
              )
            })}
            <div style={{ marginTop: 24 }}>
              <div style={{ fontSize: '0.6rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: D.dim2, marginBottom: 12 }}>Service History</div>
              {maintenance.history.slice(0, 4).map((h, i) => (
                <motion.div key={i} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.07 }}
                  style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '10px 0', borderBottom: `1px solid ${D.border}` }}>
                  <div>
                    <div style={{ fontSize: '0.82rem', color: D.offW, fontWeight: 500 }}>{h.work}</div>
                    <div style={{ fontSize: '0.62rem', color: D.dim2, marginTop: 2 }}>{h.date} · {h.km.toLocaleString('en-IN')} KM</div>
                  </div>
                  <div style={{ fontWeight: 700, color: h.cost === 0 ? '#22c55e' : D.accent, fontSize: '0.85rem', flexShrink: 0 }}>{h.cost === 0 ? 'Free' : `₹${h.cost.toLocaleString('en-IN')}`}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <style>{`@media(max-width:860px){.cost-v6-grid{grid-template-columns:1fr!important}}`}</style>
    </section>
  )
}

// ─── 11 · GALLERY ─────────────────────────────────────────────────────────────
const GALL = [
  { src: P.g1, loc: 'Yelagiri Hills', date: 'May 2024', col: 'span 2', row: 'span 2' },
  { src: P.g2, loc: 'East Coast Road', date: 'Apr 2024' },
  { src: P.g3, loc: 'Chennai', date: 'May 2024' },
  { src: P.g4, loc: 'Highway', date: 'Mar 2024', col: 'span 2' },
  { src: P.g5, loc: 'Mountain Pass', date: 'Apr 2024' },
  { src: P.g6, loc: 'Coastal Route', date: 'Apr 2024' },
  { src: P.g7, loc: 'Engine Bay', date: 'Aug 2024' },
  { src: P.g8, loc: 'Night Ride', date: 'Feb 2024' },
]

function GallerySection() {
  const [lbOpen, setLbOpen] = useState(false)
  const [lbIdx, setLbIdx] = useState(0)

  return (
    <section id="v6-gallery" style={{ background: D.bg1, padding: 'clamp(64px,8vw,96px) clamp(32px,5vw,88px)' }}>
      <motion.div {...up()} style={{ marginBottom: 44 }}>
        <Eyebrow n="011" label="Captured Moments" />
        <Title>Gallery</Title>
      </motion.div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gridAutoRows: '200px', gap: 3 }} className="gallery-v6">
        {GALL.map((g, i) => (
          <motion.div key={i}
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.6, delay: i * 0.07 }}
            onClick={() => { setLbIdx(i); setLbOpen(true) }}
            style={{ gridColumn: g.col, gridRow: g.row, position: 'relative', overflow: 'hidden', cursor: 'pointer', background: D.bg }}>
            <motion.img src={g.src} alt={g.loc}
              style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.6s ease' }}
              whileHover={{ scale: 1.06 }} transition={{ duration: 0.6 }}
            />
            <motion.div initial={{ opacity: 0 }} whileHover={{ opacity: 1 }} transition={{ duration: 0.25 }}
              style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(8,7,14,0.75) 0%, transparent 55%)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '14px 14px' }}>
              <div style={{ fontWeight: 700, color: D.white, fontSize: '0.85rem' }}>{g.loc}</div>
              <div style={{ fontSize: '0.62rem', color: D.dim2, marginTop: 2 }}>{g.date}</div>
            </motion.div>
          </motion.div>
        ))}
      </div>

      <Lightbox open={lbOpen} close={() => setLbOpen(false)} slides={GALL.map(g => ({ src: g.src }))} index={lbIdx} />
      <style>{`
        @media(max-width:768px){.gallery-v6{grid-template-columns:repeat(2,1fr)!important;grid-auto-rows:160px!important}}
        @media(max-width:480px){.gallery-v6{grid-template-columns:1fr!important}}
      `}</style>
    </section>
  )
}

// ─── 12 · CONNECT ─────────────────────────────────────────────────────────────
function ConnectSection() {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const bgY = useTransform(scrollYProgress, [0, 1], ['0%', '18%'])

  return (
    <section ref={ref} id="v6-connect" style={{ position: 'relative', minHeight: '70vh', overflow: 'hidden', display: 'flex', alignItems: 'center' }}>
      <motion.img src={P.night} alt="" style={{ position: 'absolute', inset: '-10%', width: '120%', height: '120%', objectFit: 'cover', y: bgY }} />
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(8,7,14,0.85)' }} />

      <div style={{ position: 'relative', zIndex: 2, width: '100%', padding: 'clamp(64px,8vw,96px) clamp(32px,5vw,88px)' }}>
        <motion.div {...up()} style={{ maxWidth: 680 }}>
          <Eyebrow n="012" label="Let's Connect" />
          <h2 style={{ fontSize: 'clamp(2.5rem,6vw,5.5rem)', fontFamily: "'Playfair Display',serif", fontWeight: 700, color: D.white, margin: '0 0 24px', lineHeight: 0.95, letterSpacing: '-0.03em' }}>
            Follow the<br /><span style={{ color: D.accent }}>Journey.</span>
          </h2>
          <p style={{ fontSize: '1rem', color: D.dim1, lineHeight: 1.8, margin: '0 0 48px', fontWeight: 300, maxWidth: 420 }}>
            Every ride documented. Every story shared. Join the community.
          </p>
        </motion.div>

        <motion.div {...up(0.15)} style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          {[
            { label: 'Instagram', handle: cfg.social?.instagram?.handle || '@sivashanmugavadivelv', href: cfg.social?.instagram?.href || '#' },
            { label: 'YouTube', handle: 'SIVA · Vlogs & Rides', href: cfg.social?.youtube?.href || '#' },
            { label: 'Blog', handle: 'Read Stories', href: '/blog' },
            { label: 'Email', handle: 'Get in Touch', href: '/contact' },
          ].map((s, i) => (
            <motion.a key={i} href={s.href}
              target={s.href.startsWith('http') ? '_blank' : undefined}
              rel="noopener noreferrer"
              whileHover={{ y: -3, borderColor: D.accent }}
              style={{ display: 'flex', flexDirection: 'column', padding: '20px 28px', background: 'rgba(13,12,21,0.7)', border: `1px solid ${D.border}`, backdropFilter: 'blur(16px)', textDecoration: 'none', minWidth: 160, transition: 'border-color 0.25s' }}>
              <span style={{ fontSize: '0.58rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: D.dim2, marginBottom: 6 }}>{s.label}</span>
              <span style={{ fontSize: '0.88rem', fontWeight: 600, color: D.offW }}>{s.handle}</span>
            </motion.a>
          ))}
        </motion.div>

        <motion.div {...up(0.25)} style={{ marginTop: 72, paddingTop: 40, borderTop: `1px solid ${D.border}` }}>
          <p style={{ fontFamily: "'Playfair Display',serif", fontStyle: 'italic', fontSize: 'clamp(1.1rem,2vw,1.6rem)', color: D.dim1, margin: '0 0 8px' }}>
            "Thanks for visiting my garage."
          </p>
          <p style={{ fontSize: '0.72rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: D.accent, margin: 0, fontWeight: 600 }}>
            See you on the next ride. 🏍️
          </p>
        </motion.div>
      </div>
    </section>
  )
}

// ─── Dot nav ──────────────────────────────────────────────────────────────────
const NAV6 = [['v6-hero','Hero'],['v6-bike','Bike'],['v6-setup','Setup'],['v6-recommended','Gear'],['v6-vlogs','Vlogs'],['v6-rides','Rides'],['v6-stats','Stats'],['v6-dream','Dream'],['v6-cost','Cost'],['v6-gallery','Gallery'],['v6-connect','Connect']]

function DotNav6() {
  const [active, setActive] = useState('v6-hero')
  useEffect(() => {
    const obs = new IntersectionObserver(e => e.forEach(en => { if (en.isIntersecting) setActive(en.target.id) }), { rootMargin: '-45% 0px -45% 0px' })
    NAV6.forEach(([id]) => { const el = document.getElementById(id); if (el) obs.observe(el) })
    return () => obs.disconnect()
  }, [])
  return (
    <div style={{ position: 'fixed', right: 20, top: '50%', transform: 'translateY(-50%)', zIndex: 50, display: 'flex', flexDirection: 'column', gap: 10 }} className="dn6">
      {NAV6.map(([id, label]) => (
        <button key={id} onClick={() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })} title={label}
          style={{ width: active === id ? 8 : 4, height: active === id ? 8 : 4, borderRadius: '50%', background: active === id ? D.accent : 'rgba(255,255,255,0.2)', border: 'none', cursor: 'pointer', padding: 0, transition: 'all 0.3s', alignSelf: 'center' }} />
      ))}
      <style>{`@media(max-width:768px){.dn6{display:none!important}}`}</style>
    </div>
  )
}

// ─── View switcher ────────────────────────────────────────────────────────────
function Switcher6() {
  return (
    <div style={{ position: 'fixed', top: 72, left: '50%', transform: 'translateX(-50%)', zIndex: 60, display: 'flex', background: 'rgba(8,7,14,0.85)', backdropFilter: 'blur(20px)', border: `1px solid ${D.border}`, overflow: 'hidden' }} className="sw6">
      {[{l:'Std',to:'/garage'},{l:'V2',to:'/garage/premium'},{l:'V3',to:'/garage/v3'},{l:'V4',to:'/garage/v4'},{l:'V5',to:'/garage/v5'},{l:'V6 ✦',to:null}].map(({l,to}) => (
        to ? <Link key={l} to={to} style={{ padding:'8px 12px', fontSize:'0.6rem', letterSpacing:'0.1em', textTransform:'uppercase', fontWeight:600, fontFamily:'var(--sans)', color:'rgba(240,238,232,0.4)', textDecoration:'none', whiteSpace:'nowrap' }}>{l}</Link>
           : <div key={l} style={{ padding:'8px 12px', fontSize:'0.6rem', letterSpacing:'0.1em', textTransform:'uppercase', fontWeight:700, fontFamily:'var(--sans)', background:D.accent, color:'#fff', whiteSpace:'nowrap' }}>{l}</div>
      ))}
      <style>{`@media(max-width:560px){.sw6{display:none!important}}`}</style>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function GarageV6() {
  return (
    <div style={{ background: D.bg, overflowX: 'hidden', color: D.dim1 }}>
      <Switcher6 />
      <DotNav6 />
      <Hero />
      <BikeSection />
      <SetupSection />
      <BreakSection img={P.road} quote="Not all those who wander are lost — some of them just found a better road." author="Siva · Rider · Explorer" />
      <RecommendedSection />
      <VlogsSection />
      <RidesSection />
      <BreakSection img={P.sunset} quote="Every sunrise is an invitation to ride." author="Shotgun 650 · 12,547 KM" />
      <StatsSection />
      <DreamSection />
      <CostSection />
      <GallerySection />
      <ConnectSection />
    </div>
  )
}
