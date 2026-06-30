import { useState, useRef, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform, useInView, AnimatePresence, useMotionValue, useSpring } from 'framer-motion'
import Lightbox from 'yet-another-react-lightbox'
import 'yet-another-react-lightbox/styles.css'
import Button from '../components/ui/Button'
import {
  bike, accessories, recommendedAccessories, vlogs, routes,
  dreamGarage, wishlist, rideStats, costTracker, maintenance,
  garageGallery,
} from '../data/garage'
import cfg from '../data/config.json'

// ─── Image URLs ──────────────────────────────────────────────────────────────
// Using Unsplash for high-quality motorcycle photography
const IMAGES = {
  heroBg: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=1920&q=80',
  bikeFull: 'https://images.unsplash.com/photo-1609630875171-b1321377ee65?w=1200&q=85',
  bikeDetail: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=900&q=85',
  bikeEngine: 'https://images.unsplash.com/photo-1449426468159-d96dbf08f19f?w=800&q=80',
  rideSunset: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=1200&q=85',
  rideHighway: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=85',
  rideMountain: 'https://images.unsplash.com/photo-1547549082-6bc09f2049ae?w=1200&q=85',
  rideCoastal: 'https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=1200&q=85',
  gear1: 'https://images.unsplash.com/photo-1547234935-80c7145ec969?w=600&q=80',
  gear2: 'https://images.unsplash.com/photo-1593352216840-4aa2f4e4b671?w=600&q=80',
  gear3: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=600&q=80',
  gallery1: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800&q=80',
  gallery2: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=800&q=80',
  gallery3: 'https://images.unsplash.com/photo-1609630875171-b1321377ee65?w=800&q=80',
  gallery4: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
  gallery5: 'https://images.unsplash.com/photo-1547549082-6bc09f2049ae?w=800&q=80',
  gallery6: 'https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=800&q=80',
  gallery7: 'https://images.unsplash.com/photo-1449426468159-d96dbf08f19f?w=800&q=80',
  gallery8: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800&q=80',
  map: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=1200&q=80',
}

// ─── Shared primitives ───────────────────────────────────────────────────────
const GOLD = '#c9a84c'
const GOLD_LIGHT = '#e8c97e'
const GOLD_DIM = 'rgba(201,168,76,0.15)'
const DARK = '#08070d'
const DARK2 = '#0f0e16'
const DARK3 = '#15131f'

const fadeUp = { initial: { opacity: 0, y: 40 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: '-60px' }, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
const fadeIn = { initial: { opacity: 0 }, whileInView: { opacity: 1 }, viewport: { once: true }, transition: { duration: 1, ease: 'easeOut' } }

function GoldDivider({ width = 60, centered }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24, justifyContent: centered ? 'center' : 'flex-start' }}>
      <div style={{ width, height: 1, background: `linear-gradient(to right, ${GOLD}, transparent)` }} />
      <div style={{ width: 4, height: 4, borderRadius: '50%', background: GOLD, flexShrink: 0 }} />
    </div>
  )
}

function Label({ children, centered }) {
  return (
    <div style={{ fontSize: '0.68rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: GOLD, fontWeight: 600, marginBottom: 12, fontFamily: 'var(--sans)', textAlign: centered ? 'center' : 'left' }}>
      {children}
    </div>
  )
}

function Heading({ children, size = '3rem', centered, light = true }) {
  return (
    <h2 style={{
      fontSize: `clamp(1.8rem, 4vw, ${size})`,
      fontFamily: 'var(--heading)',
      fontWeight: 700,
      color: light ? '#f5f0e8' : 'var(--text-h)',
      margin: 0,
      lineHeight: 1.1,
      letterSpacing: '-0.02em',
      textAlign: centered ? 'center' : 'left',
    }}>
      {children}
    </h2>
  )
}

function StatPill({ value, label }) {
  return (
    <div style={{ textAlign: 'center', padding: '20px 28px', borderLeft: `1px solid rgba(201,168,76,0.2)` }}>
      <div style={{ fontSize: 'clamp(1.6rem, 3vw, 2.4rem)', fontWeight: 800, color: '#f5f0e8', letterSpacing: '-0.03em', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: '0.68rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(245,240,232,0.45)', marginTop: 6 }}>{label}</div>
    </div>
  )
}

function AnimCounter({ end, suffix = '', prefix = '' }) {
  const [val, setVal] = useState(0)
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })
  const started = useRef(false)
  useEffect(() => {
    if (!inView || started.current) return
    started.current = true
    const steps = 80
    const inc = end / steps
    let cur = 0
    const t = setInterval(() => {
      cur += inc
      if (cur >= end) { setVal(end); clearInterval(t) } else { setVal(Math.floor(cur)) }
    }, 1800 / steps)
    return () => clearInterval(t)
  }, [inView, end])
  return <span ref={ref}>{prefix}{val.toLocaleString('en-IN')}{suffix}</span>
}

// ─── Section 01: Cinematic Hero ──────────────────────────────────────────────
function PremiumHero() {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const bgY = useTransform(scrollYProgress, [0, 1], ['0%', '30%'])
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0])

  return (
    <section ref={ref} style={{ position: 'relative', height: '100vh', minHeight: 700, overflow: 'hidden', display: 'flex', alignItems: 'flex-end' }}>
      {/* Parallax BG */}
      <motion.div style={{ position: 'absolute', inset: '-20%', y: bgY }}>
        <img src={IMAGES.heroBg} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </motion.div>

      {/* Gradient overlays */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(8,7,13,0.96) 0%, rgba(8,7,13,0.7) 50%, rgba(8,7,13,0.2) 100%)' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(8,7,13,1) 0%, transparent 50%)' }} />

      {/* Animated grain overlay */}
      <div style={{ position: 'absolute', inset: 0, opacity: 0.03, backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")' }} />

      <motion.div style={{ position: 'relative', zIndex: 2, width: '100%', padding: 'clamp(32px, 5vw, 80px)', paddingBottom: 'clamp(48px, 7vw, 100px)', opacity }}>
        <motion.div {...fadeUp} transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}>
          <Label>Royal Enfield · Shotgun 650 · Graphite Black</Label>
          <GoldDivider width={80} />
          <h1 style={{
            fontSize: 'clamp(3.5rem, 9vw, 8rem)',
            fontFamily: 'var(--heading)',
            fontWeight: 700,
            color: '#f5f0e8',
            lineHeight: 0.95,
            letterSpacing: '-0.03em',
            margin: '0 0 32px',
          }}>
            The<br />
            <span style={{ color: GOLD }}>Garage.</span>
          </h1>
          <p style={{ fontSize: 'clamp(0.95rem, 1.5vw, 1.2rem)', color: 'rgba(245,240,232,0.55)', maxWidth: 500, lineHeight: 1.8, marginBottom: 44, fontWeight: 300, letterSpacing: '0.02em' }}>
            Where machines become stories,<br />and every ride becomes a memory.
          </p>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            <motion.button
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={() => document.getElementById('pm-bike')?.scrollIntoView({ behavior: 'smooth' })}
              style={{ padding: '14px 36px', background: GOLD, color: DARK, border: 'none', borderRadius: 2, fontFamily: 'var(--sans)', fontWeight: 700, fontSize: '0.82rem', letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer' }}
            >
              Explore the Machine
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={() => document.getElementById('pm-vlogs')?.scrollIntoView({ behavior: 'smooth' })}
              style={{ padding: '14px 36px', background: 'transparent', color: '#f5f0e8', border: '1px solid rgba(245,240,232,0.3)', borderRadius: 2, fontFamily: 'var(--sans)', fontWeight: 500, fontSize: '0.82rem', letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer', backdropFilter: 'blur(8px)' }}
            >
              Watch Vlogs
            </motion.button>
          </div>
        </motion.div>

        {/* Stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.4, duration: 0.8 }}
          style={{ display: 'flex', flexWrap: 'wrap', marginTop: 64, borderTop: `1px solid rgba(201,168,76,0.2)`, paddingTop: 32, gap: 0 }}
        >
          {[['12,547', 'KM Ridden'], ['47', 'Rides Completed'], ['15', 'Accessories'], ['50+', 'Videos Created'], ['1 Year', 'Ownership']].map(([v, l]) => (
            <StatPill key={l} value={v} label={l} />
          ))}
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        animate={{ y: [0, 10, 0] }} transition={{ duration: 2, repeat: Infinity }}
        style={{ position: 'absolute', bottom: 32, right: 'clamp(32px, 5vw, 80px)', zIndex: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}
      >
        <div style={{ width: 1, height: 48, background: `linear-gradient(to bottom, transparent, ${GOLD})` }} />
        <div style={{ fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: GOLD, writingMode: 'vertical-rl' }}>Scroll</div>
      </motion.div>
    </section>
  )
}

// ─── Section 02: My Bike — Full cinematic reveal ─────────────────────────────
function PremiumBike() {
  const [activeTab, setActiveTab] = useState('Story')
  const tabs = ['Story', 'Specs', 'Performance', 'Dimensions']

  const specMap = {
    Story: null,
    Specs: bike.specs.overview,
    Performance: bike.specs.performance,
    Dimensions: bike.specs.dimensions,
  }

  return (
    <section id="pm-bike" style={{ background: DARK, overflow: 'hidden' }}>
      {/* Big bike reveal */}
      <div style={{ position: 'relative', minHeight: '90vh', display: 'flex', alignItems: 'center' }}>
        <motion.div {...fadeIn} style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '60%' }}>
          <img src={IMAGES.bikeFull} alt={bike.name} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(8,7,13,1) 0%, rgba(8,7,13,0.4) 40%, transparent 100%)' }} />
        </motion.div>

        <div style={{ position: 'relative', zIndex: 2, padding: 'clamp(60px, 8vw, 120px) clamp(32px, 5vw, 80px)', maxWidth: 620 }}>
          <motion.div {...fadeUp}>
            <Label>My Machine · Since May 2024</Label>
            <GoldDivider width={60} />
            <Heading size="4.5rem">
              Royal Enfield<br />
              <span style={{ color: GOLD }}>Shotgun 650</span>
            </Heading>
            <p style={{ fontSize: '1rem', color: 'rgba(245,240,232,0.5)', lineHeight: 1.9, marginTop: 20, marginBottom: 36, fontWeight: 300 }}>
              {bike.story}
            </p>

            {/* Key details */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px', background: 'rgba(201,168,76,0.15)', border: `1px solid rgba(201,168,76,0.15)`, marginBottom: 40 }}>
              {[
                ['Color', bike.color],
                ['Purchased', bike.purchaseDate],
                ['Location', bike.location],
                ['Odometer', bike.odometer.toLocaleString('en-IN') + ' KM'],
                ['Ownership', bike.ownership],
                ['Investment', bike.totalInvestment],
              ].map(([k, v]) => (
                <div key={k} style={{ padding: '16px 20px', background: DARK }}>
                  <div style={{ fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: GOLD, marginBottom: 4 }}>{k}</div>
                  <div style={{ fontSize: '0.9rem', color: '#f5f0e8', fontWeight: 500 }}>{v}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Tabs + specs */}
      <div style={{ padding: 'clamp(40px, 6vw, 80px) clamp(32px, 5vw, 80px)', borderTop: `1px solid rgba(201,168,76,0.12)` }}>
        <div style={{ display: 'flex', gap: 0, borderBottom: `1px solid rgba(201,168,76,0.15)`, marginBottom: 40, overflowX: 'auto' }}>
          {tabs.map(t => (
            <button key={t} onClick={() => setActiveTab(t)} style={{
              padding: '14px 28px', background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: 'var(--sans)', fontSize: '0.8rem', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600,
              color: activeTab === t ? GOLD : 'rgba(245,240,232,0.35)',
              borderBottom: `2px solid ${activeTab === t ? GOLD : 'transparent'}`,
              transition: 'all 0.25s', whiteSpace: 'nowrap',
            }}>{t}</button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
            {activeTab === 'Story' ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
                {bike.quickMetrics.map((m, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                    style={{ padding: '28px 24px', border: `1px solid rgba(201,168,76,0.18)`, position: 'relative', overflow: 'hidden' }}>
                    <div style={{ fontSize: '2rem', marginBottom: 12 }}>{m.icon}</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f5f0e8', marginBottom: 4 }}>{m.value}</div>
                    <div style={{ fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: GOLD }}>{m.label}</div>
                    <div style={{ position: 'absolute', bottom: 0, left: 0, width: '40%', height: 1, background: `linear-gradient(to right, ${GOLD}, transparent)` }} />
                  </motion.div>
                ))}
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1px', background: 'rgba(201,168,76,0.1)' }}>
                {(specMap[activeTab] || []).map((s, i) => (
                  <div key={i} style={{ padding: '20px 24px', background: DARK2, display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '1.4rem', flexShrink: 0, opacity: 0.8 }}>{s.icon}</span>
                    <div>
                      <div style={{ fontSize: '0.65rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(245,240,232,0.35)', marginBottom: 6 }}>{s.label}</div>
                      <div style={{ fontSize: '1rem', fontWeight: 700, color: '#f5f0e8' }}>{s.value} <span style={{ fontSize: '0.78rem', fontWeight: 400, color: GOLD }}>{s.unit}</span></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  )
}

// ─── Section 03: Full-bleed Ride Story ──────────────────────────────────────
function PremiumRideStory() {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [1.1, 1.0, 1.1])

  return (
    <section ref={ref} style={{ position: 'relative', height: '70vh', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <motion.div style={{ position: 'absolute', inset: '-10%', scale }}>
        <img src={IMAGES.rideSunset} alt="Ride" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </motion.div>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(8,7,13,0.65)' }} />
      <motion.div {...fadeUp} style={{ position: 'relative', zIndex: 2, textAlign: 'center', padding: '0 clamp(24px, 5vw, 80px)' }}>
        <Label centered>The Journey So Far</Label>
        <blockquote style={{ fontSize: 'clamp(1.6rem, 4vw, 3rem)', fontFamily: 'var(--heading)', fontStyle: 'italic', color: '#f5f0e8', margin: 0, lineHeight: 1.3, fontWeight: 500 }}>
          "Every road has a story.<br />Every mile, a memory."
        </blockquote>
        <div style={{ marginTop: 24, fontSize: '0.75rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: GOLD }}>— Siva · Rider · Explorer</div>
      </motion.div>
    </section>
  )
}

// ─── Section 04: Setup / Accessories ────────────────────────────────────────
function PremiumSetup() {
  const [selected, setSelected] = useState(accessories[0])

  return (
    <section id="pm-setup" style={{ background: DARK2, padding: 'clamp(60px, 8vw, 120px) clamp(32px, 5vw, 80px)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'start' }} className="setup-grid">
        {/* Left — list */}
        <div>
          <motion.div {...fadeUp}>
            <Label>The Setup</Label>
            <GoldDivider width={60} />
            <Heading size="3.5rem">What's On<br /><span style={{ color: GOLD }}>My Bike</span></Heading>
            <p style={{ color: 'rgba(245,240,232,0.45)', lineHeight: 1.8, marginTop: 16, marginBottom: 40, fontWeight: 300 }}>
              Every piece handpicked. Every accessory tested on real roads.
            </p>
          </motion.div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {accessories.map((acc, i) => (
              <motion.button
                key={acc.id}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                onClick={() => setSelected(acc)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 20,
                  padding: '18px 20px',
                  background: selected.id === acc.id ? GOLD_DIM : 'transparent',
                  border: 'none',
                  borderLeft: `2px solid ${selected.id === acc.id ? GOLD : 'transparent'}`,
                  cursor: 'pointer', textAlign: 'left',
                  transition: 'all 0.25s',
                }}
              >
                <span style={{ fontSize: '1.4rem', flexShrink: 0 }}>
                  {acc.category === 'Navigation' ? '🗺️' : acc.category === 'Camera' ? '📷' : acc.category === 'Safety' ? '🛡️' : acc.category === 'Protection' ? '🦺' : acc.category === 'Touring' ? '🧳' : '🎧'}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: selected.id === acc.id ? '#f5f0e8' : 'rgba(245,240,232,0.6)', letterSpacing: '0.02em' }}>{acc.name}</div>
                  <div style={{ fontSize: '0.72rem', color: GOLD, marginTop: 2, letterSpacing: '0.08em', opacity: selected.id === acc.id ? 1 : 0.5 }}>{acc.category}</div>
                </div>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: selected.id === acc.id ? GOLD : 'rgba(245,240,232,0.25)', flexShrink: 0 }}>
                  ₹{acc.price.toLocaleString('en-IN')}
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Right — detail */}
        <AnimatePresence mode="wait">
          <motion.div key={selected.id}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            style={{ position: 'sticky', top: 100 }}
          >
            <div style={{ aspectRatio: '4/3', background: DARK3, border: `1px solid rgba(201,168,76,0.15)`, borderRadius: 4, overflow: 'hidden', marginBottom: 32 }}>
              <img src={IMAGES.gear1} alt={selected.name} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85 }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(8,7,13,0.5) 0%, transparent 60%)' }} />
            </div>

            <div style={{ padding: '0 4px' }}>
              <div style={{ fontSize: '0.65rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: GOLD, marginBottom: 6 }}>{selected.category}</div>
              <h3 style={{ fontSize: '1.8rem', fontFamily: 'var(--heading)', color: '#f5f0e8', margin: '0 0 4px' }}>{selected.name}</h3>
              <p style={{ fontSize: '0.82rem', color: 'rgba(245,240,232,0.45)', marginBottom: 24, lineHeight: 1.7 }}>{selected.reason}</p>

              <div style={{ padding: '20px 0', borderTop: `1px solid rgba(201,168,76,0.12)`, borderBottom: `1px solid rgba(201,168,76,0.12)`, display: 'flex', gap: 40, marginBottom: 24 }}>
                <div>
                  <div style={{ fontSize: '0.62rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(245,240,232,0.3)', marginBottom: 4 }}>Installed</div>
                  <div style={{ fontSize: '0.9rem', color: '#f5f0e8', fontWeight: 600 }}>{selected.purchaseDate}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.62rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(245,240,232,0.3)', marginBottom: 4 }}>Price Paid</div>
                  <div style={{ fontSize: '0.9rem', color: GOLD, fontWeight: 700 }}>₹{selected.price.toLocaleString('en-IN')}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.62rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(245,240,232,0.3)', marginBottom: 4 }}>Rating</div>
                  <div style={{ fontSize: '0.9rem', color: '#f5f0e8', fontWeight: 600 }}>{'★'.repeat(Math.round(selected.rating))} {selected.rating}</div>
                </div>
              </div>

              <p style={{ fontSize: '0.85rem', color: 'rgba(245,240,232,0.5)', lineHeight: 1.8, fontStyle: 'italic' }}>"{selected.review}"</p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <style>{`@media (max-width: 900px) { .setup-grid { grid-template-columns: 1fr !important; gap: 40px !important; } }`}</style>
    </section>
  )
}

// ─── Section 05: Recommended — Horizontal magazine carousel ─────────────────
function PremiumRecommended() {
  const scrollRef = useRef(null)
  const [activeSection, setActiveSection] = useState('favorites')

  const filtered = recommendedAccessories.filter(a => a.section === activeSection)

  return (
    <section id="pm-recommended" style={{ background: DARK, padding: 'clamp(60px, 8vw, 120px) 0', overflow: 'hidden' }}>
      <div style={{ padding: '0 clamp(32px, 5vw, 80px)', marginBottom: 48 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 24 }}>
          <motion.div {...fadeUp}>
            <Label>Gear I Trust</Label>
            <GoldDivider width={60} />
            <Heading size="3rem">Recommended<br /><span style={{ color: GOLD }}>Accessories</span></Heading>
          </motion.div>
          <div style={{ display: 'flex', gap: 8 }}>
            {[['favorites', 'My Picks'], ['budget', 'Budget'], ['premium', 'Premium']].map(([id, label]) => (
              <button key={id} onClick={() => setActiveSection(id)} style={{
                padding: '8px 20px', border: `1px solid ${activeSection === id ? GOLD : 'rgba(201,168,76,0.2)'}`,
                background: activeSection === id ? GOLD_DIM : 'transparent',
                color: activeSection === id ? GOLD : 'rgba(245,240,232,0.4)',
                fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase',
                fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--sans)', transition: 'all 0.2s',
              }}>{label}</button>
            ))}
          </div>
        </div>
      </div>

      <div ref={scrollRef} style={{ display: 'flex', gap: 2, overflowX: 'auto', paddingLeft: 'clamp(32px, 5vw, 80px)', paddingBottom: 8, scrollbarWidth: 'none', cursor: 'grab' }}>
        {filtered.map((acc, i) => (
          <motion.div
            key={acc.id}
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
            whileHover={{ y: -6 }}
            style={{ minWidth: 300, background: DARK2, border: `1px solid rgba(201,168,76,0.12)`, flexShrink: 0, display: 'flex', flexDirection: 'column' }}
          >
            <div style={{ aspectRatio: '4/3', background: DARK3, overflow: 'hidden', position: 'relative' }}>
              <img src={i % 3 === 0 ? IMAGES.gear1 : i % 3 === 1 ? IMAGES.gear2 : IMAGES.gear3} alt={acc.name} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s' }} />
              {acc.badge && <div style={{ position: 'absolute', top: 16, left: 16, background: GOLD, color: DARK, fontSize: '0.65rem', fontWeight: 800, padding: '4px 10px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{acc.badge}</div>}
            </div>

            <div style={{ padding: '24px 24px 28px', flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: '0.62rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: GOLD, marginBottom: 8 }}>{acc.subtitle}</div>
              <h4 style={{ margin: '0 0 10px', fontSize: '1.1rem', fontFamily: 'var(--heading)', color: '#f5f0e8', fontWeight: 700 }}>{acc.name}</h4>
              <p style={{ fontSize: '0.8rem', color: 'rgba(245,240,232,0.4)', lineHeight: 1.7, flex: 1, marginBottom: 20 }}>{acc.description}</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 20 }}>
                {acc.features.map(f => (
                  <div key={f} style={{ fontSize: '0.75rem', color: 'rgba(245,240,232,0.5)', display: 'flex', gap: 8 }}>
                    <span style={{ color: GOLD }}>—</span>{f}
                  </div>
                ))}
              </div>

              <div style={{ padding: '14px 0', borderTop: `1px solid rgba(201,168,76,0.12)`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f5f0e8' }}>₹{acc.price.toLocaleString('en-IN')}</span>
                  <span style={{ marginLeft: 8, fontSize: '0.78rem', color: 'rgba(245,240,232,0.3)', textDecoration: 'line-through' }}>₹{acc.originalPrice.toLocaleString('en-IN')}</span>
                </div>
                <div style={{ fontSize: '0.68rem', letterSpacing: '0.1em', background: GOLD_DIM, color: GOLD, padding: '4px 10px', fontWeight: 700, border: `1px solid rgba(201,168,76,0.3)` }}>{acc.coupon}</div>
              </div>

              <a href={acc.buyUrl} style={{
                display: 'block', padding: '12px', textAlign: 'center',
                background: GOLD, color: DARK, fontFamily: 'var(--sans)',
                fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.15em', textTransform: 'uppercase',
                textDecoration: 'none', transition: 'opacity 0.2s',
              }}
                onMouseEnter={e => e.currentTarget.style.opacity = 0.85}
                onMouseLeave={e => e.currentTarget.style.opacity = 1}
              >
                Buy Now
              </a>
            </div>
          </motion.div>
        ))}
        <div style={{ minWidth: 'clamp(32px, 5vw, 80px)', flexShrink: 0 }} />
      </div>
    </section>
  )
}

// ─── Section 06: Vlogs — Magazine grid ───────────────────────────────────────
function PremiumVlogs() {
  const [playing, setPlaying] = useState(null)
  const latest = vlogs.filter(v => v.category === 'Latest').slice(0, 4)
  const popular = vlogs.filter(v => v.category === 'Popular').slice(0, 5)

  return (
    <section id="pm-vlogs" style={{ background: DARK2, padding: 'clamp(60px, 8vw, 120px) clamp(32px, 5vw, 80px)' }}>
      <motion.div {...fadeUp} style={{ marginBottom: 56 }}>
        <Label>On the Road · Documented</Label>
        <GoldDivider width={60} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 24, flexWrap: 'wrap' }}>
          <Heading size="3.5rem">Vlogs &<br /><span style={{ color: GOLD }}>Ride Videos</span></Heading>
          <a href={cfg.social?.youtube?.href || '#'} target="_blank" rel="noopener noreferrer"
            style={{ fontSize: '0.75rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: GOLD, textDecoration: 'none', borderBottom: `1px solid ${GOLD}`, paddingBottom: 2 }}>
            Subscribe on YouTube →
          </a>
        </div>
      </motion.div>

      {/* Hero + grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 2, marginBottom: 2 }} className="vlogs-hero-grid">
        {/* Hero video */}
        {latest[0] && (
          <motion.div {...fadeIn} onClick={() => setPlaying(latest[0])}
            style={{ position: 'relative', aspectRatio: '16/9', cursor: 'pointer', overflow: 'hidden', background: DARK3 }}
          >
            <img src={`https://img.youtube.com/vi/${latest[0].id}/maxresdefault.jpg`} alt={latest[0].title} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.03)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              onError={e => { e.target.src = IMAGES.rideHighway }}
            />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(8,7,13,0.9) 0%, rgba(8,7,13,0.2) 60%, transparent 100%)' }} />
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(8,7,13,0.7)', border: `1px solid rgba(201,168,76,0.5)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '1.4rem', marginLeft: 4 }}>▶</span>
              </div>
            </div>
            <div style={{ position: 'absolute', bottom: 24, left: 24, right: 24 }}>
              <div style={{ fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: GOLD, marginBottom: 6 }}>Latest · {latest[0].date}</div>
              <h3 style={{ margin: 0, fontSize: 'clamp(1rem, 2vw, 1.5rem)', fontFamily: 'var(--heading)', color: '#f5f0e8' }}>{latest[0].title}</h3>
              <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: '0.75rem', color: 'rgba(245,240,232,0.5)' }}>
                {latest[0].distance && <span>📍 {latest[0].distance}</span>}
                <span>⏱ {latest[0].duration}</span>
                <span>👁 {(latest[0].views / 1000).toFixed(1)}K</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Side videos */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {latest.slice(1, 4).map((v, i) => (
            <motion.div key={i} {...fadeIn} transition={{ delay: i * 0.1 }}
              onClick={() => setPlaying(v)}
              style={{ flex: 1, position: 'relative', cursor: 'pointer', overflow: 'hidden', background: DARK3, minHeight: 0 }}
            >
              <img src={`https://img.youtube.com/vi/${v.id}/mqdefault.jpg`} alt={v.title} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s' }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.04)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                onError={e => { e.target.src = IMAGES.rideMountain }}
              />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(8,7,13,0.85) 0%, transparent 60%)' }} />
              <div style={{ position: 'absolute', bottom: 12, left: 14, right: 14 }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f5f0e8', lineHeight: 1.3 }}>{v.title}</div>
                <div style={{ fontSize: '0.65rem', color: GOLD, marginTop: 4 }}>{v.duration} · {(v.views / 1000).toFixed(1)}K views</div>
              </div>
              <div style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(8,7,13,0.75)', padding: '2px 8px', fontSize: '0.7rem', color: '#f5f0e8' }}>{v.duration}</div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Popular strip */}
      <div style={{ marginTop: 40 }}>
        <div style={{ fontSize: '0.68rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: GOLD, marginBottom: 20 }}>Most Watched</div>
        <div style={{ display: 'flex', gap: 16, overflowX: 'auto', scrollbarWidth: 'none' }}>
          {popular.map((v, i) => (
            <motion.div key={i} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
              onClick={() => setPlaying(v)} style={{ minWidth: 200, cursor: 'pointer', flexShrink: 0 }}>
              <div style={{ position: 'relative', aspectRatio: '16/9', overflow: 'hidden', marginBottom: 10 }}>
                <img src={`https://img.youtube.com/vi/${v.id}/mqdefault.jpg`} alt={v.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.src = IMAGES.rideCoastal }} />
                <span style={{ position: 'absolute', bottom: 6, right: 6, background: 'rgba(8,7,13,0.8)', fontSize: '0.68rem', color: '#f5f0e8', padding: '2px 6px' }}>{v.duration}</span>
                <div style={{ position: 'absolute', top: 8, left: 8, width: 22, height: 22, borderRadius: '50%', background: GOLD, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 800, color: DARK }}>#{i + 1}</div>
              </div>
              <div style={{ fontSize: '0.82rem', color: 'rgba(245,240,232,0.7)', lineHeight: 1.4, marginBottom: 4 }}>{v.title}</div>
              <div style={{ fontSize: '0.68rem', color: 'rgba(201,168,76,0.6)' }}>{(v.views / 1000).toFixed(1)}K views · {v.date}</div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Video modal */}
      <AnimatePresence>
        {playing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setPlaying(null)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          >
            <motion.div initial={{ scale: 0.92 }} animate={{ scale: 1 }} exit={{ scale: 0.92 }}
              onClick={e => e.stopPropagation()}
              style={{ width: '100%', maxWidth: 960, background: '#000', position: 'relative' }}
            >
              <button onClick={() => setPlaying(null)} style={{ position: 'absolute', top: -40, right: 0, background: 'none', border: 'none', color: GOLD, fontSize: '1rem', cursor: 'pointer', letterSpacing: '0.1em', fontFamily: 'var(--sans)' }}>CLOSE ✕</button>
              <div style={{ aspectRatio: '16/9' }}>
                <iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${playing.id}?autoplay=1`} title={playing.title} frameBorder="0" allow="autoplay; fullscreen" allowFullScreen style={{ display: 'block' }} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`@media (max-width: 768px) { .vlogs-hero-grid { grid-template-columns: 1fr !important; } }`}</style>
    </section>
  )
}

// ─── Section 07: Ride Map ─────────────────────────────────────────────────────
function PremiumRideMap() {
  const [mode, setMode] = useState('completed')
  const modeColors = { completed: '#22c55e', planned: GOLD, dream: '#a78bfa' }
  const filtered = routes.filter(r => r.mode === mode)

  return (
    <section id="pm-map" style={{ background: DARK, overflow: 'hidden' }}>
      {/* Full bleed map image */}
      <div style={{ position: 'relative', height: '75vh', minHeight: 500 }}>
        <img src={IMAGES.map} alt="Map" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.4 }} />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, rgba(8,7,13,0.3) 0%, rgba(8,7,13,0.85) 100%)' }} />

        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 'clamp(32px, 5vw, 80px)' }}>
          <motion.div {...fadeUp}>
            <Label>Rides & Routes</Label>
            <GoldDivider width={60} />
            <Heading size="3.5rem">Journey<br /><span style={{ color: GOLD }}>Visualised</span></Heading>
            <p style={{ color: 'rgba(245,240,232,0.45)', lineHeight: 1.8, marginTop: 16, maxWidth: 420, fontWeight: 300 }}>
              Every route ridden, planned, and dreamed. The roads I've taken and the ones I'm chasing.
            </p>
          </motion.div>

          {/* Mode toggle */}
          <div style={{ display: 'flex', gap: 2, marginTop: 36 }}>
            {[['completed', '✅ Completed'], ['planned', '📋 Planned'], ['dream', '💜 Dream']].map(([id, label]) => (
              <button key={id} onClick={() => setMode(id)} style={{
                padding: '10px 22px', border: `1px solid ${mode === id ? modeColors[id] : 'rgba(255,255,255,0.15)'}`,
                background: mode === id ? `${modeColors[id]}20` : 'rgba(8,7,13,0.6)',
                color: mode === id ? modeColors[id] : 'rgba(255,255,255,0.4)',
                fontSize: '0.75rem', letterSpacing: '0.1em', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--sans)', backdropFilter: 'blur(8px)', transition: 'all 0.2s',
              }}>{label}</button>
            ))}
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', gap: 40, marginTop: 36, flexWrap: 'wrap' }}>
            {[['12,547+ KM', 'Total Distance'], ['24 Trips', 'Completed'], ['6 States', 'Explored'], ['342h', 'On the Road']].map(([v, l]) => (
              <div key={l}>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f5f0e8' }}>{v}</div>
                <div style={{ fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(245,240,232,0.35)', marginTop: 4 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Route cards */}
      <div style={{ padding: 'clamp(40px, 5vw, 60px) clamp(32px, 5vw, 80px)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 2 }}>
          {filtered.map((r, i) => (
            <motion.div key={r.id}
              initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
              style={{ padding: '24px', background: DARK2, borderTop: `2px solid ${modeColors[r.mode]}`, position: 'relative', overflow: 'hidden' }}
            >
              <div style={{ position: 'absolute', top: 0, right: 0, width: '40%', height: '100%', background: `radial-gradient(ellipse at right, ${modeColors[r.mode]}08 0%, transparent 70%)` }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <h4 style={{ margin: 0, fontSize: '1rem', fontFamily: 'var(--heading)', color: '#f5f0e8', fontWeight: 700, lineHeight: 1.3 }}>{r.name}</h4>
                {r.rating && <span style={{ fontSize: '0.78rem', color: GOLD, fontWeight: 700 }}>★ {r.rating}</span>}
              </div>
              <p style={{ margin: '0 0 16px', fontSize: '0.8rem', color: 'rgba(245,240,232,0.4)', lineHeight: 1.6 }}>{r.description}</p>
              <div style={{ display: 'flex', gap: 20, fontSize: '0.75rem', color: 'rgba(245,240,232,0.5)' }}>
                <span>📍 {r.distance}</span>
                <span>⏱ {r.time}</span>
                <span>📅 {r.date}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Section 08: Ride Stats — Data art ───────────────────────────────────────
function PremiumStats() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })
  const max = Math.max(...rideStats.monthlyData.map(d => d.km))

  return (
    <section id="pm-stats" style={{ background: DARK2, padding: 'clamp(60px, 8vw, 120px) clamp(32px, 5vw, 80px)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'start' }} className="stats-main-grid">
        <motion.div {...fadeUp}>
          <Label>By the Numbers</Label>
          <GoldDivider width={60} />
          <Heading size="3.5rem">Ride<br /><span style={{ color: GOLD }}>Statistics</span></Heading>
          <p style={{ color: 'rgba(245,240,232,0.4)', lineHeight: 1.9, marginTop: 20, fontWeight: 300 }}>
            Every kilometre logged. Every ride measured. The data behind the journey.
          </p>

          {/* Big stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px', background: 'rgba(201,168,76,0.12)', marginTop: 40 }}>
            {[
              { label: 'Total Rides', value: rideStats.summary.totalRides },
              { label: 'KM Ridden', value: rideStats.summary.totalDistance.toLocaleString('en-IN') },
              { label: 'Riding Hours', value: rideStats.summary.rideHours + 'h' },
              { label: 'Top Speed', value: rideStats.summary.topSpeed + ' km/h' },
              { label: 'Avg Mileage', value: rideStats.summary.avgMileage + ' km/l' },
              { label: 'Avg Speed', value: rideStats.summary.avgSpeed + ' km/h' },
            ].map((s, i) => (
              <div key={i} style={{ padding: '20px 22px', background: DARK2 }}>
                <div style={{ fontSize: '0.6rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(245,240,232,0.3)', marginBottom: 6 }}>{s.label}</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f5f0e8', lineHeight: 1 }}>{s.value}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Bar chart */}
        <div ref={ref}>
          <div style={{ fontSize: '0.65rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: GOLD, marginBottom: 24 }}>Monthly Distance (KM)</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 200 }}>
            {rideStats.monthlyData.map((d, i) => {
              const h = Math.round((d.km / max) * 180)
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, position: 'relative' }}
                  title={`${d.month}: ${d.km} km`}>
                  <motion.div
                    initial={{ height: 0 }}
                    animate={inView ? { height: h } : { height: 0 }}
                    transition={{ duration: 0.7, delay: i * 0.05, ease: 'easeOut' }}
                    style={{ width: '100%', background: `linear-gradient(to top, ${GOLD}, ${GOLD_LIGHT})`, minHeight: 2 }}
                  />
                  <span style={{ fontSize: '0.58rem', color: 'rgba(245,240,232,0.3)', textAlign: 'center' }}>{d.month}</span>
                </div>
              )
            })}
          </div>

          {/* Ride types donut */}
          <div style={{ marginTop: 48 }}>
            <div style={{ fontSize: '0.65rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: GOLD, marginBottom: 24 }}>Ride Type Breakdown</div>
            <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
              <svg width={100} height={100} viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
                {(() => {
                  let offset = 0
                  const circ = 2 * Math.PI * 38
                  return rideStats.rideTypes.map((rt, i) => {
                    const dash = (rt.percent / 100) * circ
                    const el = <circle key={i} cx={50} cy={50} r={38} fill="none" stroke={rt.color} strokeWidth={14} strokeDasharray={`${dash} ${circ}`} strokeDashoffset={-offset} />
                    offset += dash
                    return el
                  })
                })()}
              </svg>
              <div style={{ flex: 1 }}>
                {rideStats.rideTypes.map((rt, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: rt.color, flexShrink: 0 }} />
                      <span style={{ fontSize: '0.78rem', color: 'rgba(245,240,232,0.6)' }}>{rt.type}</span>
                    </div>
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#f5f0e8' }}>{rt.percent}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent rides */}
      <div style={{ marginTop: 80 }}>
        <div style={{ fontSize: '0.65rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: GOLD, marginBottom: 24 }}>Recent Rides</div>
        <div style={{ borderTop: `1px solid rgba(201,168,76,0.12)` }}>
          {rideStats.recentRides.map((ride, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
              style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1fr auto', gap: 16, padding: '18px 0', borderBottom: `1px solid rgba(201,168,76,0.08)`, alignItems: 'center' }}
              className="ride-row"
            >
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#f5f0e8' }}>{ride.route}</div>
                <div style={{ fontSize: '0.72rem', color: 'rgba(245,240,232,0.35)', marginTop: 3 }}>{ride.date}</div>
              </div>
              <div style={{ fontSize: '0.85rem', color: 'rgba(245,240,232,0.6)' }}>{ride.km} km</div>
              <div style={{ fontSize: '0.85rem', color: 'rgba(245,240,232,0.6)' }}>{ride.time}</div>
              <div style={{ fontSize: '0.85rem', color: 'rgba(245,240,232,0.6)' }}>{ride.avgSpeed}</div>
              <div style={{ fontSize: '0.85rem', color: 'rgba(245,240,232,0.6)' }}>{ride.mileage}</div>
              <span style={{ fontSize: '0.68rem', padding: '4px 10px', border: `1px solid rgba(201,168,76,0.25)`, color: GOLD, fontWeight: 600, letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>{ride.type}</span>
            </motion.div>
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) { .stats-main-grid { grid-template-columns: 1fr !important; } }
        @media (max-width: 640px) { .ride-row { grid-template-columns: 1fr auto !important; } .ride-row > *:not(:first-child):not(:last-child) { display: none; } }
      `}</style>
    </section>
  )
}

// ─── Section 09: Dream Garage ────────────────────────────────────────────────
function PremiumDream() {
  const statusMap = { completed: { label: 'Complete', color: '#22c55e' }, active: { label: 'In Progress', color: GOLD }, planned: { label: 'Planned', color: '#60a5fa' }, future: { label: 'Future', color: 'rgba(245,240,232,0.3)' } }

  return (
    <section id="pm-dream" style={{ background: DARK, padding: 'clamp(60px, 8vw, 120px) clamp(32px, 5vw, 80px)' }}>
      <motion.div {...fadeUp} style={{ marginBottom: 60 }}>
        <Label>The Vision</Label>
        <GoldDivider width={60} />
        <Heading size="3.5rem">Dream<br /><span style={{ color: GOLD }}>Garage</span></Heading>
      </motion.div>

      {/* Phase timeline */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2, marginBottom: 80 }} className="phase-grid">
        {dreamGarage.phases.map((phase, i) => {
          const s = statusMap[phase.status]
          return (
            <motion.div key={phase.id}
              initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.12 }}
              style={{ padding: '32px 28px', background: phase.status === 'active' ? `linear-gradient(135deg, ${DARK3}, rgba(201,168,76,0.06))` : DARK2, borderTop: `2px solid ${s.color}`, position: 'relative', overflow: 'hidden' }}
            >
              {phase.status === 'active' && (
                <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at top left, rgba(201,168,76,0.08) 0%, transparent 60%)` }} />
              )}
              <div style={{ fontSize: '0.62rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: s.color, marginBottom: 8 }}>{s.label}</div>
              <div style={{ fontSize: '0.72rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(245,240,232,0.3)', marginBottom: 4 }}>{phase.label}</div>
              <h3 style={{ margin: '0 0 24px', fontSize: '1.2rem', fontFamily: 'var(--heading)', color: '#f5f0e8' }}>{phase.title}</h3>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {phase.items.map((item, j) => (
                  <li key={j} style={{ fontSize: '0.78rem', color: 'rgba(245,240,232,0.5)', display: 'flex', gap: 10 }}>
                    <span style={{ color: s.color, flexShrink: 0, marginTop: 1 }}>{phase.status === 'completed' ? '✓' : '—'}</span>
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          )
        })}
      </div>

      {/* Dream bikes */}
      <div>
        <div style={{ fontSize: '0.65rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: GOLD, marginBottom: 32 }}>Machines I Dream to Own</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 2 }}>
          {dreamGarage.dreamBikes.map((b, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              style={{ position: 'relative', overflow: 'hidden' }}
            >
              <div style={{ aspectRatio: '16/9', background: DARK3 }}>
                <img src={[IMAGES.bikeFull, IMAGES.bikeDetail, IMAGES.rideMountain, IMAGES.rideCoastal][i % 4]} alt={b.name} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.6 }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(8,7,13,1) 0%, rgba(8,7,13,0.3) 60%, transparent 100%)' }} />
              </div>
              <div style={{ padding: '20px 20px 24px', background: DARK2 }}>
                <h4 style={{ margin: '0 0 4px', fontSize: '0.95rem', fontFamily: 'var(--heading)', color: '#f5f0e8' }}>{b.name}</h4>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: GOLD, marginBottom: 10 }}>{b.price}</div>
                <p style={{ margin: 0, fontSize: '0.78rem', color: 'rgba(245,240,232,0.4)', lineHeight: 1.6 }}>{b.reason}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) { .phase-grid { grid-template-columns: 1fr 1fr !important; } }
        @media (max-width: 580px) { .phase-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </section>
  )
}

// ─── Section 10: Cost + Maintenance ─────────────────────────────────────────
function PremiumCostMaintenance() {
  const total = costTracker.categories.reduce((s, c) => s + c.amount, 0)

  return (
    <section id="pm-cost" style={{ background: DARK2, padding: 'clamp(60px, 8vw, 120px) clamp(32px, 5vw, 80px)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80 }} className="cost-grid">

        {/* Cost tracker */}
        <div>
          <motion.div {...fadeUp}>
            <Label>Total Investment</Label>
            <GoldDivider width={60} />
            <Heading size="2.8rem">Cost<br /><span style={{ color: GOLD }}>Tracker</span></Heading>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px', background: 'rgba(201,168,76,0.1)', margin: '36px 0' }}>
            {[
              { label: 'Total', value: `₹${(costTracker.summary.totalCost / 100000).toFixed(1)}L` },
              { label: 'Monthly', value: `₹${(costTracker.summary.monthlyCost / 1000).toFixed(1)}K` },
              { label: 'Per KM', value: `₹${costTracker.summary.costPerKm}` },
            ].map(s => (
              <div key={s.label} style={{ padding: '20px 16px', background: DARK2, textAlign: 'center' }}>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f5f0e8' }}>{s.value}</div>
                <div style={{ fontSize: '0.62rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(245,240,232,0.3)', marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {costTracker.categories.map((c, i) => {
              const pct = (c.amount / total) * 100
              return (
                <motion.div key={i} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '0.82rem' }}>
                    <span style={{ color: 'rgba(245,240,232,0.65)' }}>{c.icon} {c.name}</span>
                    <span style={{ color: GOLD, fontWeight: 700 }}>₹{c.amount.toLocaleString('en-IN')}</span>
                  </div>
                  <div style={{ height: 2, background: 'rgba(255,255,255,0.06)' }}>
                    <motion.div
                      initial={{ width: 0 }} whileInView={{ width: `${pct}%` }} viewport={{ once: true }}
                      transition={{ duration: 0.8, delay: i * 0.1, ease: 'easeOut' }}
                      style={{ height: '100%', background: `linear-gradient(to right, ${GOLD}, ${GOLD_LIGHT})` }}
                    />
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* Maintenance */}
        <div>
          <motion.div {...fadeUp} transition={{ delay: 0.2 }}>
            <Label>Keep It Running</Label>
            <GoldDivider width={60} />
            <Heading size="2.8rem">Maintenance<br /><span style={{ color: GOLD }}>Log</span></Heading>
          </motion.div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 36 }}>
            <div style={{ fontSize: '0.62rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: GOLD, marginBottom: 12 }}>Upcoming</div>
            {maintenance.upcoming.map((item, i) => {
              const pct = item.dueKm ? Math.min((item.currentKm / item.dueKm) * 100, 100) : null
              const priorityColor = item.priority === 'high' ? '#ef4444' : item.priority === 'medium' ? GOLD : '#22c55e'
              return (
                <div key={i} style={{ padding: '16px 18px', background: DARK, borderLeft: `2px solid ${priorityColor}`, marginBottom: 2 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: '0.88rem', color: '#f5f0e8', fontWeight: 600 }}>{item.icon} {item.type}</span>
                    <span style={{ fontSize: '0.62rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: priorityColor, fontWeight: 700 }}>{item.priority}</span>
                  </div>
                  {pct !== null && (
                    <div>
                      <div style={{ height: 2, background: 'rgba(255,255,255,0.06)', marginBottom: 4 }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: pct > 85 ? '#ef4444' : GOLD, transition: 'width 0.6s' }} />
                      </div>
                      <div style={{ fontSize: '0.68rem', color: 'rgba(245,240,232,0.35)' }}>{(item.dueKm - item.currentKm).toLocaleString('en-IN')} KM remaining</div>
                    </div>
                  )}
                  {item.dueDate && (
                    <div style={{ fontSize: '0.75rem', color: 'rgba(245,240,232,0.4)' }}>Due: {item.dueDate}</div>
                  )}
                </div>
              )
            })}

            <div style={{ fontSize: '0.62rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: GOLD, margin: '24px 0 12px' }}>Service History</div>
            {maintenance.history.slice(0, 4).map((h, i) => (
              <div key={i} style={{ padding: '14px 0', borderBottom: `1px solid rgba(201,168,76,0.08)`, display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.82rem', color: '#f5f0e8', fontWeight: 500 }}>{h.work}</div>
                  <div style={{ fontSize: '0.7rem', color: 'rgba(245,240,232,0.35)', marginTop: 3 }}>{h.date} · {h.km.toLocaleString('en-IN')} KM</div>
                </div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: GOLD, flexShrink: 0 }}>{h.cost === 0 ? 'Free' : `₹${h.cost.toLocaleString('en-IN')}`}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`@media (max-width: 900px) { .cost-grid { grid-template-columns: 1fr !important; } }`}</style>
    </section>
  )
}

// ─── Section 11: Wishlist ──────────────────────────────────────────────────
function PremiumWishlist() {
  const priorityColors = { high: '#ef4444', medium: GOLD, low: '#22c55e' }

  return (
    <section id="pm-wishlist" style={{ background: DARK, padding: 'clamp(60px, 8vw, 120px) clamp(32px, 5vw, 80px)' }}>
      <motion.div {...fadeUp} style={{ marginBottom: 56, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 24 }}>
        <div>
          <Label>What's Next</Label>
          <GoldDivider width={60} />
          <Heading size="3rem">Wishlist &<br /><span style={{ color: GOLD }}>Future Plans</span></Heading>
        </div>
        <div style={{ fontSize: '2.5rem', fontWeight: 800, color: GOLD }}>
          65% <span style={{ fontSize: '0.85rem', fontWeight: 400, color: 'rgba(245,240,232,0.35)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Build Progress</span>
        </div>
      </motion.div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 2 }}>
        {wishlist.filter(w => w.status !== 'dreaming').map((w, i) => (
          <motion.div key={w.id}
            initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}
            style={{ padding: '24px', background: DARK2, borderTop: `2px solid ${priorityColors[w.priority]}40`, position: 'relative' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div style={{ flex: 1, paddingRight: 12 }}>
                <div style={{ fontSize: '0.62rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(245,240,232,0.3)', marginBottom: 4 }}>{w.category}</div>
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontFamily: 'var(--heading)', color: '#f5f0e8', fontWeight: 700 }}>{w.name}</h4>
              </div>
              <span style={{ fontSize: '0.62rem', fontWeight: 700, padding: '4px 10px', color: priorityColors[w.priority], border: `1px solid ${priorityColors[w.priority]}40`, letterSpacing: '0.1em', textTransform: 'uppercase', flexShrink: 0 }}>
                {w.priority}
              </span>
            </div>
            <p style={{ margin: '0 0 16px', fontSize: '0.78rem', color: 'rgba(245,240,232,0.4)', lineHeight: 1.6 }}>{w.reason}</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.72rem', color: 'rgba(245,240,232,0.3)', letterSpacing: '0.08em' }}>🗓 {w.targetMonth}</span>
              <span style={{ fontSize: '1rem', fontWeight: 800, color: GOLD }}>
                {w.price >= 100000 ? `₹${(w.price / 100000).toFixed(1)}L` : `₹${w.price.toLocaleString('en-IN')}`}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  )
}

// ─── Section 12: Gallery ──────────────────────────────────────────────────────
function PremiumGallery() {
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)

  const galleryImages = [
    { src: IMAGES.gallery1, location: 'Yelagiri Hills', date: 'May 2024', story: 'First sunrise ride up the ghat road' },
    { src: IMAGES.gallery2, location: 'East Coast Road', date: 'Apr 2024', story: 'Golden hour along the coastline' },
    { src: IMAGES.gallery3, location: 'Chennai', date: 'May 2024', story: 'Bike in its element' },
    { src: IMAGES.gallery4, location: 'Highway', date: 'Mar 2024', story: 'Open road, open mind' },
    { src: IMAGES.gallery5, location: 'Mountain Pass', date: 'Apr 2024', story: 'Mid-ride at the viewpoint' },
    { src: IMAGES.gallery6, location: 'Coastal Route', date: 'Apr 2024', story: 'Blue horizon ride' },
    { src: IMAGES.gallery7, location: 'Workshop', date: 'Aug 2024', story: 'Engine close-up' },
    { src: IMAGES.gallery8, location: 'Night Ride', date: 'Feb 2024', story: 'City lights, full tank' },
  ]

  const slides = galleryImages.map(g => ({ src: g.src }))

  return (
    <section id="pm-gallery" style={{ background: DARK2, padding: 'clamp(60px, 8vw, 100px) clamp(32px, 5vw, 80px)' }}>
      <motion.div {...fadeUp} style={{ marginBottom: 48 }}>
        <Label>Captured Moments</Label>
        <GoldDivider width={60} />
        <Heading size="3rem">The<br /><span style={{ color: GOLD }}>Gallery</span></Heading>
      </motion.div>

      {/* Masonry-style grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gridTemplateRows: 'auto', gap: 3 }} className="gallery-premium-grid">
        {galleryImages.map((g, i) => (
          <motion.div
            key={i}
            {...fadeIn}
            transition={{ delay: i * 0.06 }}
            onClick={() => { setLightboxIndex(i); setLightboxOpen(true) }}
            style={{
              position: 'relative',
              aspectRatio: i === 0 || i === 4 ? '1/1.5' : '1/1',
              gridRow: i === 0 || i === 4 ? 'span 2' : 'span 1',
              overflow: 'hidden',
              cursor: 'pointer',
              background: DARK3,
            }}
          >
            <img src={g.src} alt={g.location}
              style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.06)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            />
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(to top, rgba(8,7,13,0.85) 0%, transparent 55%)',
              opacity: 0, transition: 'opacity 0.3s',
              display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '16px 14px',
            }}
              onMouseEnter={e => e.currentTarget.style.opacity = 1}
              onMouseLeave={e => e.currentTarget.style.opacity = 0}
            >
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f5f0e8' }}>{g.location}</div>
              <div style={{ fontSize: '0.68rem', color: GOLD, marginTop: 2 }}>{g.date}</div>
              <div style={{ fontSize: '0.72rem', color: 'rgba(245,240,232,0.6)', marginTop: 2 }}>{g.story}</div>
            </div>
          </motion.div>
        ))}
      </div>

      <Lightbox open={lightboxOpen} close={() => setLightboxOpen(false)} slides={slides} index={lightboxIndex} />

      <style>{`
        @media (max-width: 768px) { .gallery-premium-grid { grid-template-columns: repeat(2, 1fr) !important; } }
        @media (max-width: 480px) { .gallery-premium-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </section>
  )
}

// ─── Section 13: Connect ──────────────────────────────────────────────────────
function PremiumConnect() {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const bgY = useTransform(scrollYProgress, [0, 1], ['0%', '20%'])

  return (
    <section ref={ref} id="pm-connect" style={{ position: 'relative', minHeight: '60vh', overflow: 'hidden', display: 'flex', alignItems: 'center' }}>
      <motion.div style={{ position: 'absolute', inset: '-10%', y: bgY }}>
        <img src={IMAGES.rideHighway} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </motion.div>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(8,7,13,0.88)' }} />
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at center, rgba(201,168,76,0.05) 0%, transparent 70%)` }} />

      <div style={{ position: 'relative', zIndex: 2, width: '100%', padding: 'clamp(60px, 8vw, 120px) clamp(32px, 5vw, 80px)' }}>
        <motion.div {...fadeUp} style={{ textAlign: 'center', marginBottom: 64 }}>
          <Label centered>Ride Together</Label>
          <GoldDivider width={80} centered />
          <Heading size="3.5rem" centered>Let's<br /><span style={{ color: GOLD }}>Connect</span></Heading>
          <p style={{ color: 'rgba(245,240,232,0.45)', lineHeight: 1.9, marginTop: 20, maxWidth: 500, margin: '20px auto 0', fontWeight: 300 }}>
            Follow the journey. Join the community. Let's ride together.
          </p>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 2, maxWidth: 900, margin: '0 auto 64px' }}>
          {[
            { icon: '📸', label: 'Instagram', handle: cfg.social?.instagram?.handle || '@sivashanmugavadivelv', href: cfg.social?.instagram?.href || '#', color: '#e1306c' },
            { icon: '▶', label: 'YouTube', handle: 'SIVA · Vlogs & Rides', href: cfg.social?.youtube?.href || '#', color: '#ff0000' },
            { icon: '✍️', label: 'Blog', handle: 'Read Ride Stories', href: '/blog', color: GOLD },
            { icon: '✉️', label: 'Email', handle: 'Get in Touch', href: '/contact', color: '#22c55e' },
          ].map((s, i) => (
            <motion.a key={i} href={s.href}
              target={s.href.startsWith('http') ? '_blank' : undefined}
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              whileHover={{ y: -4 }}
              style={{ padding: '32px 28px', background: 'rgba(15,14,22,0.8)', backdropFilter: 'blur(12px)', border: `1px solid rgba(201,168,76,0.12)`, textDecoration: 'none', display: 'flex', flexDirection: 'column', gap: 10, transition: 'border-color 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = s.color + '60'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(201,168,76,0.12)'}
            >
              <span style={{ fontSize: '1.8rem' }}>{s.icon}</span>
              <div>
                <div style={{ fontSize: '0.62rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(245,240,232,0.3)', marginBottom: 4 }}>{s.label}</div>
                <div style={{ fontSize: '0.9rem', color: s.color, fontWeight: 600 }}>{s.handle}</div>
              </div>
            </motion.a>
          ))}
        </div>

        {/* Closing */}
        <motion.div {...fadeUp} style={{ textAlign: 'center' }}>
          <div style={{ width: 1, height: 48, background: `linear-gradient(to bottom, transparent, ${GOLD})`, margin: '0 auto 24px' }} />
          <p style={{ fontFamily: 'var(--heading)', fontStyle: 'italic', fontSize: 'clamp(1.2rem, 2.5vw, 1.8rem)', color: 'rgba(245,240,232,0.6)', margin: '0 0 8px' }}>
            "Thanks for visiting my garage."
          </p>
          <p style={{ fontSize: '0.85rem', color: GOLD, letterSpacing: '0.12em', margin: 0 }}>See you on the next ride. 🏍️</p>
        </motion.div>
      </div>
    </section>
  )
}

// ─── Nav dots ─────────────────────────────────────────────────────────────────
const NAV_SECTIONS = [
  { id: 'pm-hero', label: 'Home' },
  { id: 'pm-bike', label: 'My Bike' },
  { id: 'pm-setup', label: 'Setup' },
  { id: 'pm-recommended', label: 'Gear' },
  { id: 'pm-vlogs', label: 'Vlogs' },
  { id: 'pm-map', label: 'Routes' },
  { id: 'pm-stats', label: 'Stats' },
  { id: 'pm-dream', label: 'Dream' },
  { id: 'pm-cost', label: 'Cost' },
  { id: 'pm-wishlist', label: 'Wishlist' },
  { id: 'pm-gallery', label: 'Gallery' },
  { id: 'pm-connect', label: 'Connect' },
]

function NavDots() {
  const [active, setActive] = useState('pm-hero')

  useEffect(() => {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) setActive(e.target.id) })
    }, { rootMargin: '-40% 0px -50% 0px' })
    NAV_SECTIONS.forEach(({ id }) => { const el = document.getElementById(id); if (el) obs.observe(el) })
    return () => obs.disconnect()
  }, [])

  return (
    <div style={{ position: 'fixed', right: 24, top: '50%', transform: 'translateY(-50%)', zIndex: 50, display: 'flex', flexDirection: 'column', gap: 10 }} className="nav-dots">
      {NAV_SECTIONS.map(({ id, label }) => (
        <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end' }}>
          <motion.span
            initial={{ opacity: 0, x: 10 }}
            style={{ fontSize: '0.6rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: GOLD, display: active === id ? 'block' : 'none' }}
          >{label}</motion.span>
          <button
            onClick={() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })}
            title={label}
            style={{
              width: active === id ? 10 : 4,
              height: active === id ? 10 : 4,
              borderRadius: '50%',
              background: active === id ? GOLD : 'rgba(201,168,76,0.3)',
              border: `1px solid ${active === id ? GOLD : 'rgba(201,168,76,0.2)'}`,
              cursor: 'pointer',
              padding: 0,
              transition: 'all 0.3s',
              flexShrink: 0,
            }}
          />
        </div>
      ))}
      <style>{`@media (max-width: 768px) { .nav-dots { display: none !important; } }`}</style>
    </div>
  )
}

// ─── Page toggle strip ────────────────────────────────────────────────────────
function PageToggle() {
  return (
    <div style={{ position: 'fixed', top: 72, left: '50%', transform: 'translateX(-50%)', zIndex: 60, display: 'flex', gap: 2, background: 'rgba(8,7,13,0.85)', backdropFilter: 'blur(16px)', border: `1px solid rgba(201,168,76,0.2)`, padding: '6px', borderRadius: 2 }} className="page-toggle">
      <Link to="/garage" style={{ padding: '7px 18px', fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600, fontFamily: 'var(--sans)', color: 'rgba(201,168,76,0.5)', textDecoration: 'none', whiteSpace: 'nowrap' }}>
        Standard
      </Link>
      <div style={{ padding: '7px 18px', fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700, fontFamily: 'var(--sans)', background: GOLD, color: DARK, whiteSpace: 'nowrap' }}>
        Premium ✦
      </div>
      <Link to="/garage/v3" style={{ padding: '7px 18px', fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600, fontFamily: 'var(--sans)', color: 'rgba(201,168,76,0.5)', textDecoration: 'none', whiteSpace: 'nowrap' }}>
        V3 ✦
      </Link>
      <style>{`@media (max-width: 480px) { .page-toggle { display: none !important; } }`}</style>
    </div>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function GaragePremium() {
  return (
    <div style={{ background: DARK, minHeight: '100vh', color: '#f5f0e8' }}>
      <PageToggle />
      <NavDots />

      <div id="pm-hero"><PremiumHero /></div>
      <PremiumBike />
      <PremiumRideStory />
      <PremiumSetup />
      <PremiumRecommended />
      <PremiumVlogs />
      <PremiumRideMap />
      <PremiumStats />
      <PremiumDream />
      <PremiumCostMaintenance />
      <PremiumWishlist />
      <PremiumGallery />
      <PremiumConnect />
    </div>
  )
}
