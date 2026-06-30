/**
 * My Garage — New (Premium Cinematic Edition)  ·  /garage/new
 *
 * A single long-scroll, premium landing page. Each section card clicks through
 * to its existing detail page (ride detail → /garage/v7/rides/:id,
 * accessory detail → /garage/accessories/:id).
 *
 * Animation language:
 *  - Parallax hero with scroll-linked layers + animated counters
 *  - Sticky "scene" sections that pin while the inner content transitions
 *  - Staggered viewport reveals (fadeUp) on every block
 *  - Scroll-progress driven roadmap spine
 *  - Hover micro-interactions, animated gauges, charts and progress bars
 *
 * Reuses real data from ../data/garage and AnimatedCounter from components.
 */

import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  motion, useScroll, useTransform, useSpring, useInView, AnimatePresence,
} from 'framer-motion'
import {
  bike, accessories, recommendedAccessories, routes, rideStats,
  vlogs, dreamGarage, wishlist,
} from '../data/garage'
import AnimatedCounter from '../components/garage/AnimatedCounter'
import cfg from '../data/config.json'

// ─── Design tokens ────────────────────────────────────────────────────────────
const BG   = '#0a0810'
const BG2  = '#110e1a'
const BG3  = '#171320'
const CARD = '#14111d'
const BD   = 'rgba(255,255,255,0.07)'
const BD2  = 'rgba(255,255,255,0.14)'
const W    = '#ffffff'
const OFF  = '#f1efe9'
const D1   = 'rgba(241,239,233,0.72)'
const D2   = 'rgba(241,239,233,0.45)'
const D3   = 'rgba(241,239,233,0.22)'
const ACC  = '#a78bfa'
const ACC2 = '#7c3aed'
const EASE = [0.22, 1, 0.36, 1]

// Hero image (Royal Enfield-ish; matches the other garage versions)
const HERO_IMG = 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=1400&q=85'
const BIKE_IMG = 'https://images.unsplash.com/photo-1609630875171-b1321377ee65?w=900&q=85'

// ─── Reusable reveal helper ─────────────────────────────────────────────────
const fadeUp = (delay = 0, y = 28) => ({
  initial: { opacity: 0, y },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.7, delay, ease: EASE },
})

// ─── Category accent map ─────────────────────────────────────────────────────
const CAT_COLOR = {
  Navigation: '#a78bfa', Camera: '#ec4899', Safety: '#22c55e',
  Protection: '#f59e0b', Touring: '#3b82f6', Communication: '#06b6d4',
}

// ─── Section eyebrow + heading ───────────────────────────────────────────────
function SectionHead({ index, label, title, sub, action, to }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16, marginBottom: 32 }}>
      <div>
        <motion.div {...fadeUp(0)} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          {index && (
            <span style={{ fontFamily: 'var(--mono)', fontSize: '0.7rem', color: ACC, opacity: 0.7, fontWeight: 600 }}>
              {index}
            </span>
          )}
          <span style={{ width: 28, height: 1, background: ACC, opacity: 0.6 }} />
          <span style={{ fontSize: '0.66rem', letterSpacing: '0.28em', textTransform: 'uppercase', color: ACC, fontWeight: 700 }}>{label}</span>
        </motion.div>
        <motion.h2 {...fadeUp(0.05)} style={{ margin: 0, fontSize: 'clamp(1.8rem,4vw,2.8rem)', fontFamily: 'var(--heading)', fontWeight: 700, color: W, letterSpacing: '-0.025em', lineHeight: 1.05 }}>
          {title}
        </motion.h2>
        {sub && <motion.p {...fadeUp(0.1)} style={{ margin: '12px 0 0', color: D2, fontSize: '0.95rem', maxWidth: 540, lineHeight: 1.7, fontWeight: 300 }}>{sub}</motion.p>}
      </div>
      {action && to && (
        <motion.div {...fadeUp(0.1)}>
          <Link to={to} className="gn-pill" style={{ fontSize: '0.74rem', color: D1, textDecoration: 'none', border: `1px solid ${BD2}`, padding: '9px 18px', borderRadius: 999, whiteSpace: 'nowrap', display: 'inline-block', transition: 'all 0.25s', fontWeight: 500 }}>
            {action}
          </Link>
        </motion.div>
      )}
    </div>
  )
}

// ─── Glass card ──────────────────────────────────────────────────────────────
function Glass({ children, style: sx, hover = false, onClick, className = '' }) {
  return (
    <motion.div
      onClick={onClick}
      className={className}
      whileHover={hover ? { y: -6 } : undefined}
      transition={{ duration: 0.3, ease: EASE }}
      style={{
        background: `linear-gradient(160deg, ${CARD} 0%, ${BG2} 100%)`,
        border: `1px solid ${BD}`,
        borderRadius: 18,
        overflow: 'hidden',
        cursor: onClick ? 'pointer' : 'default',
        ...sx,
      }}
    >
      {children}
    </motion.div>
  )
}

/* ════════════════════════════════════════════════════════════════════════════
   01 · HERO — parallax, scroll-linked layers
   ════════════════════════════════════════════════════════════════════════════ */
function Hero() {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const yBg    = useTransform(scrollYProgress, [0, 1], ['0%', '28%'])
  const yText  = useTransform(scrollYProgress, [0, 1], ['0%', '120%'])
  const scale  = useTransform(scrollYProgress, [0, 1], [1, 1.18])
  const opacity = useTransform(scrollYProgress, [0, 0.7], [1, 0])
  const ghostX = useTransform(scrollYProgress, [0, 1], ['0%', '-12%'])

  return (
    <section ref={ref} style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden', display: 'flex', alignItems: 'center' }}>
      {/* Parallax background image */}
      <motion.div style={{ position: 'absolute', inset: 0, y: yBg, scale }}>
        <img src={HERO_IMG} alt="" style={{ width: '100%', height: '120%', objectFit: 'cover', opacity: 0.55 }} />
        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(105deg, ${BG} 18%, rgba(10,8,16,0.7) 50%, rgba(10,8,16,0.35) 100%)` }} />
        <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse 70% 90% at 75% 50%, rgba(124,58,237,0.22) 0%, transparent 65%)` }} />
      </motion.div>

      {/* Giant ghost wordmark */}
      <motion.div style={{ position: 'absolute', right: '-4%', top: '50%', y: '-50%', x: ghostX, fontSize: 'clamp(8rem,22vw,20rem)', fontFamily: 'var(--heading)', fontWeight: 700, color: W, opacity: 0.035, letterSpacing: '-0.04em', whiteSpace: 'nowrap', userSelect: 'none', pointerEvents: 'none' }}>
        SHOTGUN
      </motion.div>

      {/* Foreground content */}
      <motion.div style={{ position: 'relative', zIndex: 3, y: yText, opacity, width: '100%' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 clamp(24px,5vw,64px)' }}>
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: EASE }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '7px 16px', borderRadius: 999, background: 'rgba(167,139,250,0.1)', border: `1px solid ${ACC}44`, marginBottom: 28 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: ACC, boxShadow: `0 0 10px ${ACC}` }} />
              <span style={{ fontSize: '0.68rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: ACC, fontWeight: 600 }}>Software Developer · Rider · Explorer</span>
            </div>
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.1, ease: EASE }}
            style={{ margin: 0, fontSize: 'clamp(2.8rem,8vw,6rem)', fontFamily: 'var(--heading)', fontWeight: 700, color: W, lineHeight: 0.98, letterSpacing: '-0.035em' }}>
            Ride More.<br /><span style={{ color: ACC }}>Code Better.</span>
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.3, ease: EASE }}
            style={{ margin: '28px 0 0', color: D1, fontSize: 'clamp(1rem,1.6vw,1.2rem)', maxWidth: 520, lineHeight: 1.7, fontWeight: 300 }}>
            Documenting my {bike.name} — every ride, every upgrade, and the stories that make the journey unforgettable.
          </motion.p>

          {/* CTAs */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.45, ease: EASE }}
            style={{ display: 'flex', gap: 14, marginTop: 38, flexWrap: 'wrap' }}>
            <a href="#dashboard" className="gn-cta-primary" style={{ padding: '14px 28px', borderRadius: 999, background: ACC2, color: '#fff', fontWeight: 600, fontSize: '0.9rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8, boxShadow: `0 8px 30px ${ACC2}55`, transition: 'all 0.25s' }}>
              Explore the Garage <span>↓</span>
            </a>
            <a href={cfg.social?.youtube?.href || '#'} target="_blank" rel="noopener noreferrer" className="gn-cta-ghost" style={{ padding: '14px 28px', borderRadius: 999, background: 'rgba(255,255,255,0.06)', color: OFF, fontWeight: 600, fontSize: '0.9rem', textDecoration: 'none', border: `1px solid ${BD2}`, display: 'inline-flex', alignItems: 'center', gap: 8, transition: 'all 0.25s' }}>
              ▶ Watch Vlogs
            </a>
          </motion.div>
        </div>
      </motion.div>

      {/* Scroll hint */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}
        style={{ position: 'absolute', bottom: 28, left: '50%', transform: 'translateX(-50%)', zIndex: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: '0.6rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: D2 }}>Scroll</span>
        <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
          style={{ width: 22, height: 36, borderRadius: 999, border: `1.5px solid ${D2}`, display: 'flex', justifyContent: 'center', paddingTop: 6 }}>
          <span style={{ width: 3, height: 7, borderRadius: 999, background: ACC }} />
        </motion.div>
      </motion.div>
    </section>
  )
}

/* ════════════════════════════════════════════════════════════════════════════
   02 · DASHBOARD — animated counters + bike snapshot
   ════════════════════════════════════════════════════════════════════════════ */
function Dashboard() {
  const stats = [
    { value: bike.odometer, suffix: '+', label: 'KM Ridden', icon: '🛣️' },
    { value: 15, suffix: '', label: 'Accessories', icon: '🔧' },
    { value: rideStats.summary.totalRides, suffix: '', label: 'Rides Done', icon: '🏍️' },
    { value: 50, suffix: '+', label: 'Hours of Content', icon: '🎬' },
  ]
  return (
    <section id="dashboard" style={{ position: 'relative', padding: 'clamp(70px,9vw,120px) 0' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 clamp(24px,5vw,64px)' }}>
        <SectionHead index="02" label="Dashboard" title="The Numbers Behind the Ride" sub="A snapshot of the bike and the journey so far — counted live as you scroll." />

        <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 1fr', gap: 24 }} className="gn-dash-grid">
          {/* LEFT — bike snapshot */}
          <Glass style={{ position: 'relative', minHeight: 320 }}>
            <img src={BIKE_IMG} alt={bike.name} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.32 }} />
            <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(180deg, transparent 30%, ${BG2} 95%)` }} />
            <div style={{ position: 'relative', zIndex: 2, padding: 'clamp(24px,3vw,36px)', display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'flex-end', minHeight: 320 }}>
              <span style={{ fontSize: '0.66rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: ACC, fontWeight: 700 }}>My Machine</span>
              <h3 style={{ margin: '10px 0 6px', fontFamily: 'var(--heading)', fontSize: 'clamp(1.6rem,3vw,2.2rem)', color: W, fontWeight: 700, letterSpacing: '-0.02em' }}>{bike.name}</h3>
              <p style={{ margin: 0, color: D1, fontSize: '0.9rem', fontStyle: 'italic' }}>“{bike.tagline}”</p>
              <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', marginTop: 18 }}>
                {[['Color', bike.color], ['Since', bike.purchaseDate], ['Base', bike.location]].map(([k, v]) => (
                  <div key={k}>
                    <div style={{ fontSize: '0.58rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: D3 }}>{k}</div>
                    <div style={{ fontSize: '0.84rem', color: OFF, fontWeight: 600, marginTop: 2 }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          </Glass>

          {/* RIGHT — counter grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            {stats.map((s, i) => (
              <motion.div key={s.label} {...fadeUp(i * 0.08)}>
                <Glass hover style={{ padding: '26px 24px', height: '100%' }}>
                  <div style={{ fontSize: '1.6rem', marginBottom: 12 }}>{s.icon}</div>
                  <div style={{ fontSize: 'clamp(1.8rem,3.5vw,2.6rem)', fontWeight: 800, color: W, letterSpacing: '-0.03em', lineHeight: 1 }}>
                    <AnimatedCounter value={s.value} suffix={s.suffix} />
                  </div>
                  <div style={{ fontSize: '0.66rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: D2, marginTop: 8, fontWeight: 600 }}>{s.label}</div>
                </Glass>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
      <style>{`@media(max-width:820px){.gn-dash-grid{grid-template-columns:1fr!important}}`}</style>
    </section>
  )
}

/* ════════════════════════════════════════════════════════════════════════════
   03 · WHAT'S ON MY BIKE — sticky interactive accessory showcase
   ════════════════════════════════════════════════════════════════════════════ */
function WhatsOnBike({ navigate }) {
  const [active, setActive] = useState(0)
  const installed = accessories.filter(a => a.installed)
  const a = installed[active]
  const c = CAT_COLOR[a.category] || ACC

  return (
    <section style={{ position: 'relative', padding: 'clamp(70px,9vw,120px) 0', background: `linear-gradient(180deg, ${BG} 0%, ${BG2} 50%, ${BG} 100%)` }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 clamp(24px,5vw,64px)' }}>
        <SectionHead index="03" label="The Setup" title="What's On My Bike" sub="Every accessory I run, hand-picked and tested on real rides. Tap any item to see the full breakdown." action="All 15 →" to="/garage/accessories/chigee-aio6" />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.1fr', gap: 28 }} className="gn-setup-grid">
          {/* LEFT — sticky live preview */}
          <div className="gn-sticky">
            <AnimatePresence mode="wait">
              <motion.div key={a.id}
                initial={{ opacity: 0, scale: 0.96, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: -16 }}
                transition={{ duration: 0.4, ease: EASE }}>
                <Glass style={{ padding: 0 }}>
                  <div style={{ position: 'relative', aspectRatio: '4/3', background: BG3, borderBottom: `1px solid ${BD}` }}>
                    <img src={`${import.meta.env.BASE_URL}${a.image}`} alt={a.name}
                      onError={e => { e.target.src = 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=600&q=80' }}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(180deg, transparent 50%, ${CARD} 100%)` }} />
                    <span style={{ position: 'absolute', top: 16, left: 16, padding: '5px 12px', borderRadius: 999, background: `${c}22`, border: `1px solid ${c}55`, color: c, fontSize: '0.6rem', letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700 }}>{a.category}</span>
                  </div>
                  <div style={{ padding: '24px 26px' }}>
                    <h3 style={{ margin: 0, fontFamily: 'var(--heading)', fontSize: '1.5rem', color: W, fontWeight: 700 }}>{a.name}</h3>
                    <div style={{ fontSize: '0.78rem', color: D2, marginTop: 4 }}>{a.subtitle}</div>
                    <p style={{ margin: '16px 0 0', color: D1, fontSize: '0.88rem', lineHeight: 1.7, fontWeight: 300 }}>{a.reason}</p>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 20, paddingTop: 18, borderTop: `1px solid ${BD}` }}>
                      <div>
                        <span style={{ fontSize: '1.25rem', fontWeight: 800, color: W }}>₹{a.price.toLocaleString('en-IN')}</span>
                        <span style={{ fontSize: '0.72rem', color: '#f59e0b', marginLeft: 10 }}>★ {a.rating}</span>
                      </div>
                      <button onClick={() => navigate(`/garage/accessories/${a.id}`)} className="gn-pill"
                        style={{ padding: '9px 18px', borderRadius: 999, background: ACC2, color: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'var(--sans)', fontWeight: 600, fontSize: '0.78rem', transition: 'all 0.2s' }}>
                        View Details →
                      </button>
                    </div>
                  </div>
                </Glass>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* RIGHT — selectable list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {installed.map((item, i) => {
              const ic = CAT_COLOR[item.category] || ACC
              const on = i === active
              return (
                <motion.button key={item.id} {...fadeUp(i * 0.05)}
                  onClick={() => setActive(i)}
                  style={{
                    textAlign: 'left', cursor: 'pointer', width: '100%',
                    background: on ? `linear-gradient(100deg, ${ic}18, transparent)` : 'transparent',
                    border: `1px solid ${on ? ic + '55' : BD}`,
                    borderRadius: 14, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16,
                    transition: 'all 0.25s', fontFamily: 'var(--sans)',
                  }}
                  onMouseEnter={e => { if (!on) e.currentTarget.style.borderColor = BD2 }}
                  onMouseLeave={e => { if (!on) e.currentTarget.style.borderColor = BD }}>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: '0.72rem', color: on ? ic : D3, fontWeight: 700, flexShrink: 0 }}>{String(i + 1).padStart(2, '0')}</span>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: ic, flexShrink: 0, opacity: on ? 1 : 0.4, boxShadow: on ? `0 0 8px ${ic}` : 'none', transition: 'all 0.25s' }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.92rem', fontWeight: 600, color: on ? W : OFF, transition: 'color 0.25s' }}>{item.name}</div>
                    <div style={{ fontSize: '0.7rem', color: D2 }}>{item.subtitle}</div>
                  </div>
                  <span style={{ fontSize: '0.6rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: ic, opacity: on ? 1 : 0, transition: 'opacity 0.25s', flexShrink: 0 }}>{item.category}</span>
                </motion.button>
              )
            })}
          </div>
        </div>
      </div>
      <style>{`
        .gn-sticky{position:sticky;top:96px;align-self:start;height:fit-content}
        @media(max-width:860px){.gn-setup-grid{grid-template-columns:1fr!important}.gn-sticky{position:relative!important;top:0!important}}
      `}</style>
    </section>
  )
}

/* ════════════════════════════════════════════════════════════════════════════
   04 · RECOMMENDED ACCESSORIES — premium product cards
   ════════════════════════════════════════════════════════════════════════════ */
function Recommended({ navigate }) {
  const items = recommendedAccessories.slice(0, 4)
  return (
    <section style={{ position: 'relative', padding: 'clamp(70px,9vw,120px) 0' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 clamp(24px,5vw,64px)' }}>
        <SectionHead index="04" label="Gear I Trust" title="Recommended Accessories" sub="The gear I personally use and recommend — with exclusive coupon codes for the best deals." action="View all →" to="/garage/accessories/chigee-aio6" />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 22 }} className="gn-rec-grid">
          {items.map((p, i) => (
            <motion.div key={p.id} {...fadeUp(i * 0.08)} style={{ height: '100%' }}>
              <Glass hover onClick={() => p.accessoryId && navigate(`/garage/accessories/${p.accessoryId}`)} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <div style={{ position: 'relative', aspectRatio: '4/3', background: BG3 }}>
                  <img src={`${import.meta.env.BASE_URL}${p.image}`} alt={p.name}
                    onError={e => { e.target.src = 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=500&q=80' }}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  {p.badge && <span style={{ position: 'absolute', top: 14, left: 14, padding: '5px 12px', borderRadius: 999, background: ACC2, color: '#fff', fontSize: '0.56rem', letterSpacing: '0.14em', fontWeight: 700 }}>{p.badge}</span>}
                </div>
                <div style={{ padding: '20px 20px 22px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', color: W, fontWeight: 700, letterSpacing: '-0.01em' }}>{p.name}</h3>
                  <div style={{ fontSize: '0.72rem', color: D2, marginTop: 3 }}>{p.subtitle}</div>
                  <div style={{ fontSize: '0.72rem', color: '#f59e0b', marginTop: 8 }}>★ {p.rating} <span style={{ color: D3 }}>({p.reviews})</span></div>
                  <ul style={{ listStyle: 'none', padding: 0, margin: '14px 0 0', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {p.features.slice(0, 3).map(f => (
                      <li key={f} style={{ fontSize: '0.74rem', color: D1, display: 'flex', gap: 7, alignItems: 'center' }}>
                        <span style={{ color: ACC, fontSize: '0.7rem' }}>✓</span> {f}
                      </li>
                    ))}
                  </ul>
                  <div style={{ marginTop: 'auto', paddingTop: 18 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: 8, border: `1px dashed ${ACC}55`, background: 'rgba(167,139,250,0.06)', marginBottom: 14 }}>
                      <span style={{ fontSize: '0.7rem', color: D1 }}>Code <b style={{ color: ACC }}>{p.coupon}</b></span>
                      <span style={{ fontSize: '0.6rem', fontWeight: 700, color: '#fff', background: ACC2, padding: '2px 8px', borderRadius: 6 }}>{p.discount}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                      <span style={{ fontSize: '1.15rem', fontWeight: 800, color: W }}>₹{p.price.toLocaleString('en-IN')}</span>
                      <span style={{ fontSize: '0.78rem', color: D3, textDecoration: 'line-through' }}>₹{p.originalPrice.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>
              </Glass>
            </motion.div>
          ))}
        </div>
      </div>
      <style>{`
        @media(max-width:1024px){.gn-rec-grid{grid-template-columns:repeat(2,1fr)!important}}
        @media(max-width:520px){.gn-rec-grid{grid-template-columns:1fr!important}}
      `}</style>
    </section>
  )
}

/* ════════════════════════════════════════════════════════════════════════════
   05 · VLOGS — featured + scroller
   ════════════════════════════════════════════════════════════════════════════ */
function VlogsSection() {
  const [playing, setPlaying] = useState(null)
  const featured = vlogs.filter(v => v.category === 'Latest').slice(0, 4)
  return (
    <section style={{ position: 'relative', padding: 'clamp(70px,9vw,120px) 0', background: `linear-gradient(180deg, ${BG} 0%, ${BG2} 100%)` }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 clamp(24px,5vw,64px)' }}>
        <SectionHead index="05" label="On the Road" title="Latest Vlogs" sub="Stories from the saddle — raw moments, long rides and epic memories." action="YouTube →" to="/videos" />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 20 }} className="gn-vlog-grid">
          {featured.map((v, i) => (
            <motion.div key={i} {...fadeUp(i * 0.07)}>
              <Glass hover onClick={() => setPlaying(v)} style={{ height: '100%' }}>
                <div style={{ position: 'relative', aspectRatio: '16/9' }}>
                  <img src={`https://img.youtube.com/vi/${v.id}/mqdefault.jpg`} alt={v.title}
                    onError={e => { e.target.src = 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=400&q=70' }}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <motion.div whileHover={{ scale: 1.15 }} style={{ width: 46, height: 46, borderRadius: '50%', background: 'rgba(124,58,237,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 6px 20px ${ACC2}88` }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="#fff"><path d="M8 5v14l11-7z" /></svg>
                    </motion.div>
                  </div>
                  <span style={{ position: 'absolute', bottom: 8, right: 8, background: 'rgba(0,0,0,0.8)', color: '#fff', fontSize: '0.62rem', padding: '2px 7px', borderRadius: 4 }}>{v.duration}</span>
                </div>
                <div style={{ padding: '14px 16px 16px' }}>
                  <div style={{ fontSize: '0.86rem', fontWeight: 600, color: OFF, lineHeight: 1.35 }}>{v.title}</div>
                  <div style={{ fontSize: '0.7rem', color: D2, marginTop: 6 }}>{v.distance ? `${v.distance} · ` : ''}{(v.views / 1000).toFixed(1)}K views · {v.date}</div>
                </div>
              </Glass>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Lightbox player */}
      <AnimatePresence>
        {playing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setPlaying(null)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <motion.div initial={{ scale: 0.92 }} animate={{ scale: 1 }} exit={{ scale: 0.92 }} onClick={e => e.stopPropagation()}
              style={{ width: '100%', maxWidth: 920, position: 'relative' }}>
              <button onClick={() => setPlaying(null)} style={{ position: 'absolute', top: -38, right: 0, background: 'none', border: `1px solid ${BD2}`, color: '#fff', padding: '5px 14px', cursor: 'pointer', fontFamily: 'var(--sans)', fontSize: '0.7rem', borderRadius: 6 }}>CLOSE ✕</button>
              <div style={{ aspectRatio: '16/9', borderRadius: 12, overflow: 'hidden', background: '#000' }}>
                <iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${playing.id}?autoplay=1`} title={playing.title} frameBorder="0" allow="autoplay; fullscreen" allowFullScreen style={{ display: 'block' }} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @media(max-width:1024px){.gn-vlog-grid{grid-template-columns:repeat(2,1fr)!important}}
        @media(max-width:520px){.gn-vlog-grid{grid-template-columns:1fr!important}}
      `}</style>
    </section>
  )
}

/* ════════════════════════════════════════════════════════════════════════════
   06 · RIDE MAP — stats + clickable ride list (links to detail)
   ════════════════════════════════════════════════════════════════════════════ */
function RideMapSection({ navigate }) {
  const completed = routes.filter(r => r.mode === 'completed')
  const monthly = rideStats.monthlyData
  const max = Math.max(...monthly.map(d => d.km))
  const chartRef = useRef(null)
  const inView = useInView(chartRef, { once: true, margin: '-40px' })

  return (
    <section style={{ position: 'relative', padding: 'clamp(70px,9vw,120px) 0' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 clamp(24px,5vw,64px)' }}>
        <SectionHead index="06" label="Ride Map & Journeys" title="Every Road Has a Story" sub="The places I've explored and the memories collected along the way." action="View all rides →" to="/garage/v7/rides" />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 24 }} className="gn-map-grid">
          {/* LEFT — stats + chart */}
          <Glass style={{ padding: 'clamp(24px,3vw,32px)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 24 }}>
              {[['12,547+', 'Total KM'], ['24', 'Trips Done'], ['570 km', 'Longest Ride'], ['2', 'States']].map(([v, l]) => (
                <div key={l}>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: W, letterSpacing: '-0.02em' }}>{v}</div>
                  <div style={{ fontSize: '0.62rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: D2, marginTop: 3 }}>{l}</div>
                </div>
              ))}
            </div>
            <div ref={chartRef}>
              <div style={{ fontSize: '0.62rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: D3, marginBottom: 12 }}>Distance over time</div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 90 }}>
                {monthly.map((d, i) => {
                  const h = Math.round((d.km / max) * 82)
                  const last = i === monthly.length - 1
                  return (
                    <div key={i} title={`${d.month}: ${d.km} km`} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                      <motion.div initial={{ height: 0 }} animate={inView ? { height: h } : {}} transition={{ duration: 0.6, delay: i * 0.04, ease: EASE }}
                        style={{ width: '100%', background: last ? `linear-gradient(180deg, ${ACC}, ${ACC2})` : BD2, borderRadius: '3px 3px 0 0', minHeight: 3, boxShadow: last ? `0 0 12px ${ACC}66` : 'none' }} />
                      <span style={{ fontSize: '0.48rem', color: D3 }}>{d.month.slice(0, 1)}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </Glass>

          {/* RIGHT — ride list */}
          <Glass style={{ padding: 0 }}>
            <div style={{ padding: '18px 24px', borderBottom: `1px solid ${BD}`, fontSize: '0.62rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: D2, fontWeight: 700 }}>
              Featured Journeys · click to explore
            </div>
            {completed.map((r, i) => (
              <motion.div key={r.id} {...fadeUp(i * 0.05)}
                onClick={() => navigate(`/garage/v7/rides/${r.id}`)}
                style={{ padding: '18px 24px', borderBottom: i < completed.length - 1 ? `1px solid ${BD}` : 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 16, transition: 'background 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.background = BG3}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: r.color, flexShrink: 0, boxShadow: `0 0 10px ${r.color}` }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.95rem', fontWeight: 600, color: OFF }}>{r.name}</div>
                  <div style={{ fontSize: '0.72rem', color: D2, marginTop: 3 }}>{r.distance} · {r.time} · {r.date}</div>
                </div>
                {r.rating && <span style={{ fontSize: '0.74rem', color: '#f59e0b', flexShrink: 0 }}>★ {r.rating}</span>}
                <span style={{ color: D3, flexShrink: 0, fontSize: '1.1rem' }}>›</span>
              </motion.div>
            ))}
          </Glass>
        </div>
      </div>
      <style>{`@media(max-width:860px){.gn-map-grid{grid-template-columns:1fr!important}}`}</style>
    </section>
  )
}

/* ════════════════════════════════════════════════════════════════════════════
   07 · DREAM BUILD ROADMAP — scroll-progress spine
   ════════════════════════════════════════════════════════════════════════════ */
function Roadmap() {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 70%', 'end 60%'] })
  const lineScale = useSpring(scrollYProgress, { stiffness: 80, damping: 24 })
  const phases = dreamGarage.phases
  const statusMeta = {
    completed: { c: '#22c55e', label: 'Completed' },
    active:    { c: ACC,       label: 'In Progress' },
    planned:   { c: '#3b82f6', label: 'Planned' },
    future:    { c: '#f59e0b', label: 'Dream' },
  }

  return (
    <section style={{ position: 'relative', padding: 'clamp(70px,9vw,120px) 0', background: `linear-gradient(180deg, ${BG} 0%, ${BG2} 50%, ${BG} 100%)` }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 clamp(24px,5vw,64px)' }}>
        <SectionHead index="07" label="The Vision" title="Dream Build Roadmap" sub="My build plan in phases — from essentials to the ultimate touring machine." />

        <div ref={ref} style={{ position: 'relative', paddingLeft: 40 }} className="gn-road">
          {/* Spine */}
          <div style={{ position: 'absolute', left: 13, top: 8, bottom: 8, width: 2, background: BD }} />
          <motion.div style={{ position: 'absolute', left: 13, top: 8, bottom: 8, width: 2, background: `linear-gradient(180deg, ${ACC}, ${ACC2})`, transformOrigin: 'top', scaleY: lineScale, boxShadow: `0 0 12px ${ACC}88` }} />

          {phases.map((ph, i) => {
            const m = statusMeta[ph.status] || statusMeta.planned
            return (
              <motion.div key={ph.id} {...fadeUp(i * 0.06)} style={{ position: 'relative', paddingBottom: i < phases.length - 1 ? 40 : 0 }}>
                {/* Node */}
                <div style={{ position: 'absolute', left: -34, top: 4, width: 16, height: 16, borderRadius: '50%', background: BG, border: `3px solid ${m.c}`, boxShadow: `0 0 12px ${m.c}88`, zIndex: 2 }} />
                <Glass hover style={{ padding: '22px 26px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: '0.72rem', color: m.c, fontWeight: 700 }}>{ph.label}</span>
                      <h3 style={{ margin: 0, fontSize: '1.2rem', color: W, fontWeight: 700, fontFamily: 'var(--heading)' }}>{ph.title}</h3>
                    </div>
                    <span style={{ fontSize: '0.58rem', letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700, color: m.c, background: `${m.c}1a`, border: `1px solid ${m.c}44`, padding: '4px 12px', borderRadius: 999 }}>{m.label}</span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 16 }}>
                    {ph.items.map(it => (
                      <span key={it} style={{ fontSize: '0.74rem', color: D1, background: BG3, border: `1px solid ${BD}`, padding: '6px 12px', borderRadius: 8 }}>{it}</span>
                    ))}
                  </div>
                </Glass>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

/* ════════════════════════════════════════════════════════════════════════════
   08 · WISHLIST — progress ring + cards
   ════════════════════════════════════════════════════════════════════════════ */
function WishlistSection() {
  const ringRef = useRef(null)
  const inView = useInView(ringRef, { once: true, margin: '-60px' })
  const pct = 65
  const R = 52, C = 2 * Math.PI * R
  const top = wishlist.slice(0, 4)

  return (
    <section style={{ position: 'relative', padding: 'clamp(70px,9vw,120px) 0' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 clamp(24px,5vw,64px)' }}>
        <SectionHead index="08" label="Future Upgrades" title="The Wishlist" sub="Things on my dream garage list — keep riding, keep dreaming." />

        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 28 }} className="gn-wish-grid">
          {/* Progress ring */}
          <Glass style={{ padding: '32px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div ref={ringRef} style={{ position: 'relative', width: 140, height: 140 }}>
              <svg width="140" height="140" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="70" cy="70" r={R} fill="none" stroke={BD} strokeWidth="10" />
                <motion.circle cx="70" cy="70" r={R} fill="none" stroke="url(#gn-grad)" strokeWidth="10" strokeLinecap="round"
                  strokeDasharray={C} initial={{ strokeDashoffset: C }}
                  animate={inView ? { strokeDashoffset: C - (C * pct) / 100 } : {}}
                  transition={{ duration: 1.4, ease: EASE }} />
                <defs>
                  <linearGradient id="gn-grad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor={ACC} />
                    <stop offset="100%" stopColor={ACC2} />
                  </linearGradient>
                </defs>
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '1.9rem', fontWeight: 800, color: W }}>
                  <AnimatedCounter value={pct} suffix="%" duration={1400} />
                </span>
                <span style={{ fontSize: '0.56rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: D2, marginTop: 2 }}>Dream Garage</span>
              </div>
            </div>
            <p style={{ margin: '22px 0 0', fontSize: '0.82rem', color: D1, textAlign: 'center', fontStyle: 'italic', lineHeight: 1.6 }}>
              “Keep riding.<br />Keep dreaming.”
            </p>
          </Glass>

          {/* Wishlist cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 16 }} className="gn-wish-cards">
            {top.map((w, i) => {
              const pc = { high: '#ef4444', medium: '#f59e0b', low: '#22c55e' }[w.priority]
              return (
                <motion.div key={w.id} {...fadeUp(i * 0.07)}>
                  <Glass hover style={{ padding: '20px 22px', height: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                      <span style={{ fontSize: '0.58rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: ACC, fontWeight: 700 }}>{w.category}</span>
                      <span style={{ fontSize: '0.54rem', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700, color: pc, background: `${pc}1a`, padding: '3px 9px', borderRadius: 999 }}>{w.priority}</span>
                    </div>
                    <h3 style={{ margin: '12px 0 0', fontSize: '1rem', color: W, fontWeight: 700, lineHeight: 1.3 }}>{w.name}</h3>
                    <p style={{ margin: '8px 0 0', fontSize: '0.78rem', color: D2, lineHeight: 1.6, fontWeight: 300 }}>{w.reason}</p>
                    <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${BD}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '1.05rem', fontWeight: 800, color: W }}>₹{w.price.toLocaleString('en-IN')}</span>
                      <span style={{ fontSize: '0.66rem', color: D2 }}>Target {w.targetMonth}</span>
                    </div>
                  </Glass>
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>
      <style>{`
        @media(max-width:760px){.gn-wish-grid{grid-template-columns:1fr!important}}
        @media(max-width:480px){.gn-wish-cards{grid-template-columns:1fr!important}}
      `}</style>
    </section>
  )
}

/* ════════════════════════════════════════════════════════════════════════════
   CLOSING CTA
   ════════════════════════════════════════════════════════════════════════════ */
function ClosingCTA() {
  return (
    <section style={{ position: 'relative', padding: 'clamp(80px,10vw,140px) 0', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse 60% 80% at 50% 50%, rgba(124,58,237,0.16) 0%, transparent 70%)` }} />
      <div style={{ position: 'relative', maxWidth: 720, margin: '0 auto', padding: '0 24px', textAlign: 'center' }}>
        <motion.h2 {...fadeUp(0)} style={{ margin: 0, fontFamily: 'var(--heading)', fontSize: 'clamp(2rem,5vw,3.4rem)', color: W, fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.05 }}>
          Sometimes the best therapy<br />is a long ride and good roads.
        </motion.h2>
        <motion.p {...fadeUp(0.1)} style={{ margin: '20px 0 0', color: D1, fontSize: '1rem', fontWeight: 300 }}>— Siva Shanmugavadivel</motion.p>
        <motion.div {...fadeUp(0.2)} style={{ display: 'flex', gap: 14, justifyContent: 'center', marginTop: 36, flexWrap: 'wrap' }}>
          <Link to="/garage/v7/rides" className="gn-cta-primary" style={{ padding: '14px 28px', borderRadius: 999, background: ACC2, color: '#fff', fontWeight: 600, fontSize: '0.9rem', textDecoration: 'none', boxShadow: `0 8px 30px ${ACC2}55`, transition: 'all 0.25s' }}>
            Explore All Rides →
          </Link>
          <Link to="/contact" className="gn-cta-ghost" style={{ padding: '14px 28px', borderRadius: 999, background: 'rgba(255,255,255,0.06)', color: OFF, fontWeight: 600, fontSize: '0.9rem', textDecoration: 'none', border: `1px solid ${BD2}`, transition: 'all 0.25s' }}>
            Get in Touch
          </Link>
        </motion.div>
      </div>
    </section>
  )
}

/* ════════════════════════════════════════════════════════════════════════════
   PAGE
   ════════════════════════════════════════════════════════════════════════════ */
export default function GarageNew() {
  const navigate = useNavigate()

  return (
    <div style={{ background: BG, color: OFF, minHeight: '100vh' }}>
      {/* Version switcher (consistent with other garage versions) */}
      <div className="gn-switch" style={{ position: 'fixed', top: 76, left: '50%', transform: 'translateX(-50%)', zIndex: 60, display: 'flex', background: 'rgba(10,8,16,0.88)', backdropFilter: 'blur(20px)', border: `1px solid ${BD}`, overflow: 'hidden', borderRadius: 999 }}>
        {[['Std', '/garage'], ['V7', '/garage/v7'], ['New ✦', null]].map(([l, to]) => (
          to
            ? <Link key={l} to={to} style={{ padding: '7px 16px', fontSize: '0.62rem', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600, fontFamily: 'var(--sans)', color: D2, textDecoration: 'none', whiteSpace: 'nowrap' }}>{l}</Link>
            : <div key={l} style={{ padding: '7px 16px', fontSize: '0.62rem', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700, fontFamily: 'var(--sans)', background: ACC2, color: '#fff', whiteSpace: 'nowrap' }}>{l}</div>
        ))}
      </div>

      <Hero />
      <Dashboard />
      <WhatsOnBike navigate={navigate} />
      <Recommended navigate={navigate} />
      <VlogsSection />
      <RideMapSection navigate={navigate} />
      <Roadmap />
      <WishlistSection />
      <ClosingCTA />

      {/* Page-scoped hover styles */}
      <style>{`
        .gn-pill:hover { border-color: ${ACC} !important; color: ${W} !important; }
        .gn-cta-primary:hover { filter: brightness(1.12); transform: translateY(-2px); }
        .gn-cta-ghost:hover { background: rgba(255,255,255,0.12) !important; border-color: ${BD2} !important; }
        @media (max-width:480px){ .gn-switch{ display:none !important; } }
        @media (prefers-reduced-motion: reduce){ * { scroll-behavior: auto !important; } }
      `}</style>
    </div>
  )
}
