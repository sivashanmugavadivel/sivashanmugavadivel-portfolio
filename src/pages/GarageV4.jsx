/**
 * The Garage — V4 "Definitive" Design
 *
 * Uses EXACT techniques from existing portfolio pages:
 * - 3-layer parallax hero (from Home.jsx)
 * - 3D carousel with drag (from Gallery.jsx)
 * - Letter-drop heading animation (from Videos.jsx)
 * - Expandable accordion cards (from About.jsx)
 * - Rotating blob rings + mouse tilt (from About.jsx)
 * - Staggered spring badges (from About.jsx)
 * - Vertical timeline with line reveal (from Home.jsx)
 * - Infinite ticker rows (from Home.jsx)
 * - useScroll parallax (from Home.jsx)
 * - mesh-drift animated gradient backgrounds
 * - All CSS vars honoured — works in light AND dark mode
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  motion, AnimatePresence, useScroll, useTransform,
  useInView, useAnimation, useMotionValue, useSpring,
} from 'framer-motion'
import Lightbox from 'yet-another-react-lightbox'
import 'yet-another-react-lightbox/styles.css'
import {
  bike, accessories, recommendedAccessories, vlogs,
  routes, dreamGarage, wishlist,
  rideStats, costTracker, maintenance,
} from '../data/garage'
import cfg from '../data/config.json'

// ─── Scroll-reveal wrapper (exact copy from Home.jsx) ───────────────────────
function Reveal({ children, delay = 0, y = 40, x = 0, style }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: false, margin: '-80px' })
  const controls = useAnimation()
  useEffect(() => {
    controls.start(isInView
      ? { opacity: 1, y: 0, x: 0, transition: { duration: 0.65, ease: [0.25, 0.1, 0.25, 1], delay } }
      : { opacity: 0, y, x, transition: { duration: 0.45, ease: [0.25, 0.1, 0.25, 1] } })
  }, [isInView, controls, delay, y, x])
  return <motion.div ref={ref} initial={{ opacity: 0, y, x }} animate={controls} style={style}>{children}</motion.div>
}

// ─── Section label + animated underline heading (from Home.jsx) ─────────────
function SectionLabel({ children }) {
  return (
    <p style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--accent)', margin: '0 0 12px' }}>
      {children}
    </p>
  )
}

function UnderlineHeading({ children, size = '2.2rem' }) {
  return (
    <h2 style={{ position: 'relative', display: 'inline-block', fontSize: `clamp(1.6rem,3vw,${size})`, fontFamily: 'var(--heading)', fontWeight: 700, color: 'var(--text-h)', margin: '0 0 32px', lineHeight: 1.15 }}>
      {children}
      <motion.span
        initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }}
        viewport={{ once: false }} transition={{ duration: 0.5, delay: 0.35, ease: 'easeOut' }}
        style={{ position: 'absolute', bottom: -5, left: 0, right: 0, height: 3, background: 'var(--accent)', borderRadius: 2, transformOrigin: 'left' }}
      />
    </h2>
  )
}

// ─── Animated counter (from About dev dashboard pattern) ────────────────────
function AnimCounter({ end, suffix = '', prefix = '', decimals = 0 }) {
  const [val, setVal] = useState(0)
  const ref = useRef(null)
  const seen = useRef(false)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  useEffect(() => {
    if (!inView || seen.current) return
    seen.current = true
    const steps = 70, duration = 1800
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

// ─── 01 HERO — 3-layer parallax + letter drop (Home + Videos pattern) ────────
const HERO_PHOTO = 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=1920&q=90'
const HERO_CUTOUT = 'https://images.unsplash.com/photo-1609630875171-b1321377ee65?auto=format&fit=crop&w=900&q=85'
const TITLE_CHARS = ['T','h','e',' ','G','a','r','a','g','e']

function Hero() {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const bgY   = useTransform(scrollYProgress, [0,1], ['0%','28%'])
  const cutY  = useTransform(scrollYProgress, [0,1], ['0%','8%'])
  const textO = useTransform(scrollYProgress, [0,0.35,0.5],[1,0,0])
  const textY = useTransform(scrollYProgress, [0,0.5],['0%','25%'])

  return (
    <section ref={ref} id="v4-hero" style={{ position:'relative', height:'100svh', minHeight:680, overflow:'hidden', display:'flex', alignItems:'center' }}>
      {/* Layer 1 — parallax photo */}
      <motion.div style={{ position:'absolute', inset:'-20%', y:bgY, zIndex:1 }}>
        <img src={HERO_PHOTO} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
      </motion.div>

      {/* Layer 1b — gradient overlay */}
      <div style={{ position:'absolute', inset:0, zIndex:2,
        background:'linear-gradient(to right, rgba(10,10,15,0.95) 0%, rgba(10,10,15,0.7) 55%, rgba(10,10,15,0.15) 100%)' }} />
      <div style={{ position:'absolute', inset:0, zIndex:2,
        background:'linear-gradient(to top, var(--bg) 0%, transparent 45%)' }} />

      {/* Mesh gradient animation (from index.css hero-bg-mesh) */}
      <div className="hero-bg-mesh" style={{ position:'absolute', inset:0, zIndex:2, opacity:0.6 }} />

      {/* Layer 2 — letter-drop heading (from Videos.jsx) */}
      <motion.div style={{ position:'absolute', inset:0, zIndex:3, display:'flex', alignItems:'center', justifyContent:'center', y:textY, opacity:textO, pointerEvents:'none' }}>
        <h1 aria-label="The Garage" style={{ margin:0, lineHeight:1, userSelect:'none', display:'flex', flexWrap:'wrap', justifyContent:'center', gap:'0 0.06em' }}>
          {TITLE_CHARS.map((ch, i) => (
            <motion.span key={i}
              initial={{ opacity:0, y:-80, rotateX:-90 }}
              animate={{ opacity:1, y:0, rotateX:0 }}
              transition={{ duration:0.7, delay:0.1 + i*0.07, ease:[0.16,1,0.3,1] }}
              style={{
                display:'inline-block',
                fontSize:'clamp(3.5rem,10vw,9rem)',
                fontFamily:"'Lilita One', cursive",
                color:'#fff',
                textShadow:'0 0 60px rgba(124,58,237,0.5)',
                opacity: ch === ' ' ? 0 : 1,
                minWidth: ch === ' ' ? '0.3em' : undefined,
              }}
            >{ch}</motion.span>
          ))}
        </h1>
      </motion.div>

      {/* Layer 3 — bike cutout with slower parallax */}
      <motion.div style={{ position:'absolute', right:0, bottom:0, width:'55%', height:'90%', zIndex:3, y:cutY, pointerEvents:'none' }}>
        <img src={HERO_CUTOUT} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', objectPosition:'center bottom', maskImage:'linear-gradient(to left, rgba(0,0,0,0.7) 0%, transparent 100%)', WebkitMaskImage:'linear-gradient(to left, rgba(0,0,0,0.7) 0%, transparent 100%)' }} />
      </motion.div>

      {/* Corner brackets (from Home.jsx) */}
      {[{top:24,left:24},{top:24,right:24},{bottom:24,left:24},{bottom:24,right:24}].map((pos,i) => (
        <motion.div key={i}
          initial={{ opacity:0, scale:0.5 }} animate={{ opacity:1, scale:1 }}
          transition={{ duration:0.4, delay:0.8 + i*0.05, type:'spring', stiffness:400 }}
          style={{ position:'absolute', ...pos, zIndex:5, width:24, height:24,
            borderTop: (pos.top !== undefined) ? '2px solid rgba(255,255,255,0.35)' : undefined,
            borderBottom: (pos.bottom !== undefined) ? '2px solid rgba(255,255,255,0.35)' : undefined,
            borderLeft: (pos.left !== undefined) ? '2px solid rgba(255,255,255,0.35)' : undefined,
            borderRight: (pos.right !== undefined) ? '2px solid rgba(255,255,255,0.35)' : undefined,
          }}
        />
      ))}

      {/* Content overlay — left side */}
      <motion.div style={{ position:'relative', zIndex:4, y:textY, opacity:textO, padding:'clamp(24px,5vw,96px)', maxWidth:600 }}>
        <Reveal delay={0.9}>
          <SectionLabel>Royal Enfield Shotgun 650 · Since May 2024</SectionLabel>
          <p style={{ fontSize:'clamp(0.95rem,1.5vw,1.15rem)', color:'rgba(255,255,255,0.55)', maxWidth:420, lineHeight:1.8, margin:'16px 0 36px', fontWeight:300 }}>
            Where machines become stories and every ride becomes a memory.
          </p>
          <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
            <motion.button whileHover={{ scale:1.04, boxShadow:'var(--glow)' }} whileTap={{ scale:0.97 }}
              onClick={() => document.getElementById('v4-bike')?.scrollIntoView({ behavior:'smooth' })}
              style={{ padding:'12px 28px', background:'var(--accent)', color:'#fff', border:'none', borderRadius:999, fontFamily:'var(--sans)', fontWeight:700, fontSize:'0.85rem', cursor:'pointer', letterSpacing:'0.04em' }}>
              Explore the Machine
            </motion.button>
            <motion.button whileHover={{ scale:1.04 }} whileTap={{ scale:0.97 }}
              onClick={() => document.getElementById('v4-vlogs')?.scrollIntoView({ behavior:'smooth' })}
              style={{ padding:'12px 28px', background:'rgba(255,255,255,0.08)', color:'#fff', border:'1.5px solid rgba(255,255,255,0.25)', borderRadius:999, fontFamily:'var(--sans)', fontWeight:500, fontSize:'0.85rem', cursor:'pointer', backdropFilter:'blur(12px)' }}>
              Watch Rides ▶
            </motion.button>
          </div>
        </Reveal>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div animate={{ y:[0,8,0] }} transition={{ duration:1.5, repeat:Infinity }}
        style={{ position:'absolute', bottom:32, left:'50%', transform:'translateX(-50%)', zIndex:5,
          display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
        <div style={{ width:1, height:40, background:'linear-gradient(to bottom, transparent, rgba(255,255,255,0.4))' }} />
        <div style={{ width:5, height:5, borderRadius:'50%', background:'rgba(255,255,255,0.4)' }} />
      </motion.div>
    </section>
  )
}

// ─── 02 STATS — Animated counters ticker style ───────────────────────────────
function StatsStrip() {
  const stats = [
    { icon:'🛣️', end:12547, suffix:'', label:'KM Ridden' },
    { icon:'🏁', end:47, suffix:'', label:'Rides' },
    { icon:'🔧', end:15, suffix:'', label:'Accessories' },
    { icon:'🎬', end:50, suffix:'+', label:'Videos' },
    { icon:'⚡', end:28.4, suffix:' km/l', label:'Avg Mileage', decimals:1 },
    { icon:'🚀', end:142, suffix:' km/h', label:'Top Speed' },
  ]
  return (
    <section style={{ background:'var(--bg-secondary)', borderTop:'1px solid var(--border)', borderBottom:'1px solid var(--border)' }}>
      <div style={{ display:'flex', flexWrap:'wrap', overflow:'hidden' }}>
        {stats.map((s,i) => (
          <Reveal key={i} delay={i*0.07} y={20} style={{ flex:'1 1 150px', padding:'28px 20px', textAlign:'center', borderRight:'1px solid var(--border)', position:'relative' }}>
            <div style={{ fontSize:'1.6rem', marginBottom:8 }}>{s.icon}</div>
            <div style={{ fontSize:'clamp(1.5rem,3vw,2.2rem)', fontWeight:800, color:'var(--text-h)', lineHeight:1, letterSpacing:'-0.03em' }}>
              <AnimCounter end={s.end} suffix={s.suffix} decimals={s.decimals||0} />
            </div>
            <div style={{ fontSize:'0.7rem', letterSpacing:'0.16em', textTransform:'uppercase', color:'var(--text)', opacity:0.6, marginTop:6 }}>{s.label}</div>
            {/* Accent underline dot */}
            {i === 0 && <motion.div initial={{ scaleX:0 }} whileInView={{ scaleX:1 }} viewport={{ once:true }}
              style={{ position:'absolute', bottom:0, left:'20%', right:'20%', height:2, background:'var(--accent)', transformOrigin:'left', borderRadius:1 }} />}
          </Reveal>
        ))}
      </div>
    </section>
  )
}

// ─── 03 MY BIKE — 3D tilt + rotating rings (from About.jsx) ─────────────────
const BIKE_IMG = 'https://images.unsplash.com/photo-1609630875171-b1321377ee65?auto=format&fit=crop&w=900&q=90'

function BikeSection() {
  const [hovered, setHovered] = useState(false)
  const [tab, setTab] = useState('Overview')
  const tabs = ['Overview','Performance','Dimensions','Technology']
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const rotX = useSpring(useTransform(mouseY,[-0.5,0.5],[8,-8]),{ stiffness:120, damping:20 })
  const rotY = useSpring(useTransform(mouseX,[-0.5,0.5],[-8,8]),{ stiffness:120, damping:20 })

  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect()
    mouseX.set((e.clientX - r.left) / r.width - 0.5)
    mouseY.set((e.clientY - r.top) / r.height - 0.5)
  }
  const onLeave = () => { mouseX.set(0); mouseY.set(0) }

  return (
    <section id="v4-bike" style={{ padding:'96px clamp(20px,5vw,80px)', background:'var(--bg)' }}>
      <div style={{ maxWidth:1200, margin:'0 auto' }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:64, alignItems:'center' }} className="bike-v4-grid">

          {/* Image with rotating rings + 3D tilt */}
          <Reveal>
            <div style={{ position:'relative', display:'flex', alignItems:'center', justifyContent:'center' }}>
              {/* Outer blob ring — rotates */}
              <motion.div animate={{ rotate:360 }} transition={{ duration:14, repeat:Infinity, ease:'linear' }}
                style={{ position:'absolute', width:'100%', aspectRatio:'1/1',
                  borderRadius:'62% 38% 46% 54% / 60% 44% 56% 40%',
                  border:'2px solid var(--accent)', opacity:0.35 }} />
              {/* Inner dashed counter-rotate */}
              <motion.div animate={{ rotate:-360 }} transition={{ duration:20, repeat:Infinity, ease:'linear' }}
                style={{ position:'absolute', width:'82%', aspectRatio:'1/1',
                  borderRadius:'46% 54% 62% 38% / 44% 56% 44% 56%',
                  border:'1.5px dashed var(--accent)', opacity:0.2 }} />

              {/* 3D tilt image */}
              <motion.div
                onMouseMove={onMove} onMouseLeave={onLeave}
                onHoverStart={() => setHovered(true)} onHoverEnd={() => setHovered(false)}
                style={{ rotateX:rotX, rotateY:rotY, transformStyle:'preserve-3d', width:'78%', aspectRatio:'1/1', borderRadius:'50%', overflow:'hidden', position:'relative', zIndex:2 }}
              >
                <motion.div
                  animate={{ borderRadius: hovered
                    ? ['58% 42% 50% 50% / 48% 48% 52% 52%','48% 52% 42% 58% / 52% 40% 60% 48%']
                    : '58% 42% 50% 50% / 48% 48% 52% 52%' }}
                  transition={{ duration:3, repeat: hovered ? Infinity : 0, repeatType:'mirror' }}
                  style={{ width:'100%', height:'100%', overflow:'hidden', background:'var(--bg-secondary)' }}
                >
                  <img src={BIKE_IMG} alt={bike.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                </motion.div>
              </motion.div>

              {/* Floating badge */}
              <motion.div animate={{ y:[-6,6,-6] }} transition={{ duration:3, repeat:Infinity, ease:'easeInOut' }}
                style={{ position:'absolute', bottom:'8%', right:'4%', zIndex:3, background:'var(--card-bg)', border:'1px solid var(--border)', borderRadius:12, padding:'10px 16px', boxShadow:'var(--shadow)' }}>
                <div style={{ fontSize:'0.65rem', textTransform:'uppercase', letterSpacing:'0.12em', color:'var(--accent)', marginBottom:2 }}>Odometer</div>
                <div style={{ fontWeight:800, fontSize:'1.1rem', color:'var(--text-h)' }}>
                  <AnimCounter end={bike.odometer} suffix=" KM" />
                </div>
              </motion.div>
            </div>
          </Reveal>

          {/* Details */}
          <div>
            <Reveal>
              <SectionLabel>My Machine</SectionLabel>
              <UnderlineHeading size="3rem">{bike.name}</UnderlineHeading>
              <p style={{ fontSize:'0.95rem', color:'var(--text)', lineHeight:1.8, marginBottom:28 }}>{bike.story}</p>
            </Reveal>

            {/* Key info grid */}
            <Reveal delay={0.1}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:1, background:'var(--border)', marginBottom:28, borderRadius:12, overflow:'hidden' }}>
                {[['Color',bike.color],['Purchased',bike.purchaseDate],['Location',bike.location],['Investment',bike.totalInvestment]].map(([k,v]) => (
                  <div key={k} style={{ padding:'14px 18px', background:'var(--card-bg)' }}>
                    <div style={{ fontSize:'0.65rem', letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--text)', opacity:0.5, marginBottom:4 }}>{k}</div>
                    <div style={{ fontWeight:600, color:'var(--text-h)', fontSize:'0.92rem' }}>{v}</div>
                  </div>
                ))}
              </div>
            </Reveal>

            {/* Quick metric pills */}
            <Reveal delay={0.15}>
              <motion.div variants={{ hidden:{}, show:{ transition:{ staggerChildren:0.08 } } }} initial="hidden" whileInView="show" viewport={{ once:true }}>
                <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                  {bike.quickMetrics.map((m,i) => {
                    const colors = ['var(--accent)','#22c55e','#f59e0b','#ec4899']
                    const c = colors[i % colors.length]
                    return (
                      <motion.div key={i}
                        variants={{ hidden:{ opacity:0, scale:0.75 }, show:{ opacity:1, scale:1, transition:{ type:'spring', stiffness:300 } } }}
                        whileHover={{ scale:1.08, background:c, color:'#fff', boxShadow:`0 0 20px ${c}66` }}
                        style={{ padding:'8px 16px', borderRadius:999, border:`1.5px solid ${c}`, color:c, fontSize:'0.82rem', fontWeight:600, cursor:'default', transition:'all 0.2s', display:'flex', gap:6, alignItems:'center', background:'transparent' }}>
                        <span>{m.icon}</span>{m.value} <span style={{ fontWeight:400, fontSize:'0.72rem', opacity:0.7 }}>{m.label}</span>
                      </motion.div>
                    )
                  })}
                </div>
              </motion.div>
            </Reveal>
          </div>
        </div>

        {/* Specs tabs */}
        <div style={{ marginTop:64 }}>
          <Reveal>
            <div style={{ display:'flex', gap:0, borderBottom:'1px solid var(--border)', marginBottom:32, overflowX:'auto' }}>
              {tabs.map(t => (
                <button key={t} onClick={() => setTab(t)} style={{
                  padding:'10px 24px', background:'none', border:'none', cursor:'pointer',
                  fontFamily:'var(--sans)', fontWeight: tab===t ? 700 : 400,
                  fontSize:'0.85rem', color: tab===t ? 'var(--accent)' : 'var(--text)',
                  borderBottom:`2px solid ${tab===t ? 'var(--accent)' : 'transparent'}`,
                  transition:'all 0.25s', whiteSpace:'nowrap', marginBottom:-1,
                }}>{t}</button>
              ))}
            </div>
            <AnimatePresence mode="wait">
              <motion.div key={tab} initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }} transition={{ duration:0.25 }}>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:1, background:'var(--border)', borderRadius:12, overflow:'hidden' }}>
                  {(bike.specs[tab.toLowerCase()] || bike.specs.overview).map((s,i) => (
                    <motion.div key={i} whileHover={{ background:'var(--accent-bg)' }}
                      style={{ padding:'18px 20px', background:'var(--card-bg)', transition:'background 0.2s', display:'flex', gap:12 }}>
                      <span style={{ fontSize:'1.3rem', flexShrink:0 }}>{s.icon}</span>
                      <div>
                        <div style={{ fontSize:'0.65rem', letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--text)', opacity:0.5, marginBottom:4 }}>{s.label}</div>
                        <div style={{ fontWeight:700, color:'var(--text-h)' }}>{s.value} <span style={{ fontSize:'0.75rem', fontWeight:400, color:'var(--text)' }}>{s.unit}</span></div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          </Reveal>
        </div>
      </div>
      <style>{`@media (max-width: 860px) { .bike-v4-grid { grid-template-columns: 1fr !important; } }`}</style>
    </section>
  )
}

// ─── 04 SETUP — Expandable accordion cards (from About.jsx timeline) ─────────
function SetupSection() {
  const [expanded, setExpanded] = useState(null)
  const catColors = { Navigation:'var(--accent)', Camera:'#ec4899', Safety:'#22c55e', Protection:'#f59e0b', Touring:'#3b82f6', Communication:'#a855f7' }

  return (
    <section id="v4-setup" style={{ padding:'96px clamp(20px,5vw,80px)', background:'var(--bg-secondary)' }}>
      <div style={{ maxWidth:900, margin:'0 auto' }}>
        <Reveal>
          <SectionLabel>Section 04</SectionLabel>
          <UnderlineHeading>What's On My Bike</UnderlineHeading>
          <p style={{ color:'var(--text)', lineHeight:1.8, maxWidth:560, marginBottom:48 }}>Every piece handpicked. Every accessory tested on real roads.</p>
        </Reveal>

        <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
          {accessories.map((acc, i) => {
            const isOpen = expanded === i
            const color = catColors[acc.category] || 'var(--accent)'
            return (
              <Reveal key={acc.id} delay={i * 0.04}>
                <motion.div
                  onClick={() => setExpanded(isOpen ? null : i)}
                  animate={{ borderColor: isOpen ? 'var(--accent-border)' : 'var(--border)' }}
                  whileHover={!isOpen ? { y:-2, boxShadow:'var(--shadow-hover)' } : {}}
                  style={{
                    border:'1px solid var(--border)', borderRadius:'var(--radius)', overflow:'hidden',
                    background:'var(--card-bg)', cursor:'pointer', position:'relative',
                    boxShadow:'var(--shadow)',
                  }}
                >
                  {/* Accent top bar */}
                  <motion.div animate={{ scaleX: isOpen ? 1 : 0 }} transition={{ duration:0.3 }}
                    style={{ position:'absolute', top:0, left:0, right:0, height:3, background:color, transformOrigin:'left' }} />

                  {/* Header row */}
                  <div style={{ display:'grid', gridTemplateColumns:'auto 1fr auto auto', gap:16, padding:'18px 22px', alignItems:'center' }}>
                    <div style={{ width:40, height:40, borderRadius:10, background:`${color}18`, border:`1.5px solid ${color}40`,
                      display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.3rem', flexShrink:0 }}>
                      {acc.category==='Navigation'?'🗺️':acc.category==='Camera'?'📷':acc.category==='Safety'?'🛡️':acc.category==='Protection'?'🦺':acc.category==='Touring'?'🧳':'🎧'}
                    </div>
                    <div>
                      <div style={{ fontWeight:700, color:'var(--text-h)', fontSize:'0.95rem' }}>{acc.name}</div>
                      <div style={{ fontSize:'0.72rem', color, marginTop:2, fontWeight:600 }}>{acc.category} · {acc.purchaseDate}</div>
                    </div>
                    <div style={{ textAlign:'right' }}>
                      <div style={{ fontWeight:800, color:'var(--text-h)', fontSize:'0.95rem' }}>₹{acc.price.toLocaleString('en-IN')}</div>
                      <div style={{ fontSize:'0.65rem', color:'var(--text)', opacity:0.5, marginTop:2 }}>
                        {'★'.repeat(Math.round(acc.rating))} {acc.rating}
                      </div>
                    </div>
                    <motion.span animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration:0.25 }}
                      style={{ color:'var(--accent)', fontSize:'1.2rem', flexShrink:0 }}>▾</motion.span>
                  </div>

                  {/* Expanded detail */}
                  <motion.div initial={false}
                    animate={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }}
                    transition={{ duration:0.35, ease:[0.25,0.1,0.25,1] }}
                    style={{ overflow:'hidden' }}>
                    <div style={{ padding:'0 22px 22px', paddingLeft:78, display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }} className="acc-detail-grid">
                      <div>
                        <p style={{ fontSize:'0.88rem', color:'var(--text)', lineHeight:1.8, marginBottom:12 }}>{acc.reason}</p>
                        <blockquote style={{ borderLeft:`3px solid ${color}`, paddingLeft:12, margin:0 }}>
                          <p style={{ fontSize:'0.82rem', color:'var(--text)', fontStyle:'italic', lineHeight:1.7, margin:0 }}>"{acc.review}"</p>
                        </blockquote>
                      </div>
                      <div style={{ display:'flex', flexDirection:'column', gap:10, alignItems:'flex-start' }}>
                        {[['Installed', acc.purchaseDate],['Rating', `${acc.rating}/5`],['Coupon', acc.coupon]].map(([k,v]) => (
                          <div key={k} style={{ display:'flex', gap:8, alignItems:'center' }}>
                            <span style={{ fontSize:'0.65rem', textTransform:'uppercase', letterSpacing:'0.12em', color:'var(--text)', opacity:0.5, minWidth:52 }}>{k}</span>
                            <span style={{ fontWeight:600, color:'var(--text-h)', fontSize:'0.85rem', background:'var(--accent-bg)', padding:'3px 10px', borderRadius:999, border:'1px solid var(--accent-border)' }}>{v}</span>
                          </div>
                        ))}
                        <Link to={`/garage/accessories/${acc.id}`}
                          style={{ marginTop:4, fontSize:'0.78rem', color:'var(--accent)', textDecoration:'none', display:'flex', alignItems:'center', gap:4, fontWeight:600 }}>
                          Full Review →
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              </Reveal>
            )
          })}
        </div>

        {/* Summary */}
        <Reveal delay={0.1}>
          <div style={{ marginTop:32, display:'flex', flexWrap:'wrap', gap:24, padding:'24px', background:'var(--card-bg)', border:'1px solid var(--border)', borderRadius:'var(--radius)', borderTop:'3px solid var(--accent)' }}>
            {[['Total Accessories',`${accessories.length}`],['Setup Cost',`₹${accessories.reduce((s,a)=>s+a.price,0).toLocaleString('en-IN')}`],['Top Pick','Chigee AIO-6'],['Category','Navigation']].map(([k,v]) => (
              <div key={k}>
                <div style={{ fontSize:'0.65rem', letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--text)', opacity:0.5, marginBottom:4 }}>{k}</div>
                <div style={{ fontWeight:700, color:'var(--text-h)', fontSize:'1.05rem' }}>{v}</div>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
      <style>{`@media (max-width: 640px) { .acc-detail-grid { grid-template-columns: 1fr !important; } }`}</style>
    </section>
  )
}

// ─── 05 RECOMMENDED — 3D Carousel (exact from Gallery.jsx) ───────────────────
const posStyles = {
  center: { x:'0%',   scale:1,    opacity:1,    zIndex:5, rotateY:0   },
  left1:  { x:'-52%', scale:0.82, opacity:0.85, zIndex:4, rotateY:12  },
  right1: { x:'52%',  scale:0.82, opacity:0.85, zIndex:4, rotateY:-12 },
  left2:  { x:'-90%', scale:0.65, opacity:0.5,  zIndex:3, rotateY:18  },
  right2: { x:'90%',  scale:0.65, opacity:0.5,  zIndex:3, rotateY:-18 },
  hidden: { x:'0%',   scale:0.4,  opacity:0,    zIndex:1, rotateY:0   },
}
const ITEM_IMAGES = [
  'https://images.unsplash.com/photo-1547234935-80c7145ec969?w=600&q=80',
  'https://images.unsplash.com/photo-1593352216840-4aa2f4e4b671?w=600&q=80',
  'https://images.unsplash.com/photo-1449426468159-d96dbf08f19f?w=600&q=80',
  'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=600&q=80',
  'https://images.unsplash.com/photo-1609630875171-b1321377ee65?w=600&q=80',
  'https://images.unsplash.com/photo-1547549082-6bc09f2049ae?w=600&q=80',
  'https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=600&q=80',
  'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=600&q=80',
]

function getPos(idx, active, total) {
  const diff = ((idx - active) % total + total) % total
  const rdiff = diff > total/2 ? diff - total : diff
  if (rdiff === 0) return 'center'
  if (rdiff === -1) return 'left1'
  if (rdiff ===  1) return 'right1'
  if (rdiff === -2) return 'left2'
  if (rdiff ===  2) return 'right2'
  return 'hidden'
}

function RecommendedSection() {
  const [active, setActive] = useState(0)
  const [cat, setCat] = useState('favorites')
  const items = recommendedAccessories.filter(a => a.section === cat)
  const n = items.length

  const prev = () => setActive(a => (a - 1 + n) % n)
  const next = () => setActive(a => (a + 1) % n)

  useEffect(() => { setActive(0) }, [cat])

  const cardW = 'clamp(260px, 30vw, 340px)'

  return (
    <section id="v4-recommended" style={{ padding:'96px 0', background:'var(--bg)', overflow:'hidden' }}>
      <div style={{ padding:'0 clamp(20px,5vw,80px)', marginBottom:48 }}>
        <Reveal>
          <SectionLabel>Gear I Trust</SectionLabel>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', flexWrap:'wrap', gap:16 }}>
            <UnderlineHeading>Recommended Accessories</UnderlineHeading>
            <div style={{ display:'flex', gap:6 }}>
              {[['favorites','My Picks'],['budget','Budget'],['premium','Premium']].map(([id,label]) => (
                <motion.button key={id} onClick={() => setCat(id)} whileHover={{ scale:1.04 }} whileTap={{ scale:0.97 }}
                  style={{ padding:'7px 18px', borderRadius:999, border:'1.5px solid', cursor:'pointer', fontFamily:'var(--sans)', fontWeight:600, fontSize:'0.78rem', transition:'all 0.2s',
                    borderColor: cat===id ? 'var(--text-h)' : 'var(--border)',
                    background: cat===id ? 'var(--text-h)' : 'transparent',
                    color: cat===id ? 'var(--bg)' : 'var(--text-h)',
                  }}>{label}</motion.button>
              ))}
            </div>
          </div>
        </Reveal>
      </div>

      {/* 3D carousel (from Gallery.jsx) */}
      <div style={{ position:'relative', height:'clamp(360px,50vw,480px)', perspective:1200 }}>
        {items.map((item, i) => {
          const pos = getPos(i, active, n)
          const ps = posStyles[pos]
          const isCenter = pos === 'center'
          return (
            <motion.div key={item.id}
              animate={ps}
              transition={{ type:'spring', stiffness:200, damping:28 }}
              drag={isCenter ? 'x' : false}
              dragConstraints={{ left:0, right:0 }}
              dragElastic={0.15}
              onDragEnd={(_, info) => { if (info.offset.x < -50) next(); else if (info.offset.x > 50) prev() }}
              onClick={() => { if (!isCenter) { if (pos.includes('left')) prev(); else next() } }}
              style={{
                position:'absolute', top:'50%', left:'50%',
                width:cardW, translateX:'-50%', translateY:'-50%',
                transformStyle:'preserve-3d',
                boxShadow: isCenter ? '0 24px 60px rgba(0,0,0,0.22), var(--glow)' : '0 8px 24px rgba(0,0,0,0.10)',
                cursor: isCenter ? 'grab' : 'pointer',
                userSelect:'none', borderRadius:'var(--radius-lg)', overflow:'hidden',
                background:'var(--card-bg)', border:'1px solid var(--border)',
              }}
            >
              {/* Image */}
              <div style={{ position:'relative', aspectRatio:'4/3', overflow:'hidden', background:'var(--bg-secondary)' }}>
                <img src={ITEM_IMAGES[i % ITEM_IMAGES.length]} alt={item.name}
                  style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                {item.badge && <div style={{ position:'absolute', top:12, left:12, background:'var(--accent)', color:'#fff', fontSize:'0.65rem', fontWeight:800, padding:'4px 10px', borderRadius:999, letterSpacing:'0.08em' }}>{item.badge}</div>}
              </div>
              <div style={{ padding:20 }}>
                <div style={{ fontSize:'0.65rem', letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--accent)', marginBottom:4 }}>{item.subtitle}</div>
                <h4 style={{ margin:'0 0 8px', fontFamily:'var(--heading)', fontSize:'1.1rem', color:'var(--text-h)', fontWeight:700 }}>{item.name}</h4>
                <p style={{ fontSize:'0.78rem', color:'var(--text)', lineHeight:1.6, marginBottom:14 }}>{item.description}</p>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
                  <div>
                    <span style={{ fontWeight:800, color:'var(--text-h)', fontSize:'1.1rem' }}>₹{item.price.toLocaleString('en-IN')}</span>
                    <span style={{ marginLeft:6, fontSize:'0.75rem', color:'var(--text)', opacity:0.45, textDecoration:'line-through' }}>₹{item.originalPrice.toLocaleString('en-IN')}</span>
                  </div>
                  <span style={{ fontSize:'0.7rem', fontWeight:700, padding:'3px 10px', borderRadius:999, border:'1px solid var(--accent-border)', color:'var(--accent)', background:'var(--accent-bg)' }}>{item.coupon}</span>
                </div>
                {isCenter && (
                  <motion.a href={item.buyUrl} whileHover={{ scale:1.03, boxShadow:'var(--glow)' }} whileTap={{ scale:0.97 }}
                    style={{ display:'block', padding:'10px', textAlign:'center', background:'var(--accent)', color:'#fff', borderRadius:999, fontFamily:'var(--sans)', fontWeight:700, fontSize:'0.8rem', textDecoration:'none', letterSpacing:'0.06em' }}>
                    Buy Now ↗
                  </motion.a>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Nav */}
      <div style={{ display:'flex', justifyContent:'center', alignItems:'center', gap:20, marginTop:24, padding:'0 clamp(20px,5vw,80px)' }}>
        <motion.button whileHover={{ scale:1.1 }} whileTap={{ scale:0.9 }} onClick={prev}
          style={{ width:44, height:44, borderRadius:'50%', border:'1.5px solid var(--border)', background:'var(--card-bg)', cursor:'pointer', fontSize:'1.1rem', color:'var(--text-h)', display:'flex', alignItems:'center', justifyContent:'center' }}>‹</motion.button>
        <span style={{ fontSize:'0.82rem', color:'var(--text)' }}>{active+1} / {n}</span>
        <motion.button whileHover={{ scale:1.1 }} whileTap={{ scale:0.9 }} onClick={next}
          style={{ width:44, height:44, borderRadius:'50%', border:'1.5px solid var(--border)', background:'var(--card-bg)', cursor:'pointer', fontSize:'1.1rem', color:'var(--text-h)', display:'flex', alignItems:'center', justifyContent:'center' }}>›</motion.button>
      </div>
    </section>
  )
}

// ─── 06 VLOGS — letter drop + video grid (from Videos.jsx) ───────────────────
function VlogsSection() {
  const [playing, setPlaying] = useState(null)
  const [cat, setCat] = useState('Latest')
  const categories = ['Latest','Popular','Shorts','Ride Stories','Setup']
  const filtered = vlogs.filter(v => v.category === cat)

  return (
    <section id="v4-vlogs" style={{ padding:'96px clamp(20px,5vw,80px)', background:'var(--bg-secondary)' }}>
      {/* Letter-drop title (from Videos.jsx) */}
      <Reveal style={{ marginBottom:48 }}>
        <SectionLabel>On the Road · Documented</SectionLabel>
        <h2 aria-label="Vlogs & Rides" style={{ margin:'0 0 24px', lineHeight:1, display:'flex', flexWrap:'wrap', gap:'0 0.05em' }}>
          {'Vlogs & Rides'.split('').map((ch, i) => (
            <motion.span key={i}
              initial={{ opacity:0, y:-60, rotateX:-90 }}
              whileInView={{ opacity:1, y:0, rotateX:0 }}
              viewport={{ once:true }}
              transition={{ duration:0.6, delay:0.05 + i*0.06, ease:[0.16,1,0.3,1] }}
              style={{ display:'inline-block', fontSize:'clamp(2.4rem,6vw,5rem)', fontFamily:"'Lilita One', cursive", color:'var(--text-h)', minWidth: ch===' ' ? '0.3em' : undefined }}>
              {ch === ' ' ? ' ' : ch}
            </motion.span>
          ))}
        </h2>

        <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:32 }}>
          {categories.map(c => (
            <motion.button key={c} onClick={() => setCat(c)} whileHover={{ scale:1.04 }} whileTap={{ scale:0.97 }}
              style={{ padding:'7px 18px', borderRadius:999, border:'1.5px solid', cursor:'pointer', fontFamily:'var(--sans)', fontWeight:600, fontSize:'0.78rem', transition:'all 0.2s',
                borderColor: cat===c ? 'var(--text-h)' : 'var(--border)',
                background: cat===c ? 'var(--text-h)' : 'transparent',
                color: cat===c ? 'var(--bg)' : 'var(--text-h)',
              }}>{c}</motion.button>
          ))}
        </div>
      </Reveal>

      {/* Video grid — featured + 3-col */}
      <AnimatePresence mode="wait">
        <motion.div key={cat} initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} transition={{ duration:0.25 }}>
          {cat === 'Shorts' ? (
            // Shorts — vertical cards row
            <div style={{ display:'flex', gap:12, overflowX:'auto', scrollbarWidth:'none', paddingBottom:8 }}>
              {filtered.map((v, i) => (
                <motion.div key={i} whileHover={{ y:-4, boxShadow:'var(--shadow-hover)' }} onClick={() => setPlaying(v)}
                  style={{ minWidth:140, flexShrink:0, borderRadius:'var(--radius)', overflow:'hidden', background:'var(--card-bg)', border:'1px solid var(--border)', cursor:'pointer', boxShadow:'var(--shadow)' }}>
                  <div style={{ position:'relative', aspectRatio:'9/16' }}>
                    <img src={`https://img.youtube.com/vi/${v.id}/mqdefault.jpg`} alt={v.title}
                      style={{ width:'100%', height:'100%', objectFit:'cover' }}
                      onError={e => { e.target.src='https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=300&q=70' }} />
                    <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 50%)' }} />
                    <div style={{ position:'absolute', bottom:8, left:8, right:8, fontSize:'0.72rem', fontWeight:600, color:'#fff', lineHeight:1.3 }}>{v.title}</div>
                    <div style={{ position:'absolute', top:8, right:8, background:'rgba(0,0,0,0.7)', color:'#fff', fontSize:'0.62rem', padding:'2px 6px', borderRadius:4 }}>{v.duration}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:20 }}>
              {filtered.map((v, i) => (
                <Reveal key={i} delay={i*0.05}>
                  <motion.div whileHover={{ y:-4, boxShadow:'var(--shadow-hover)' }} onClick={() => setPlaying(v)}
                    style={{ borderRadius:'var(--radius)', overflow:'hidden', background:'var(--card-bg)', border:'1px solid var(--border)', cursor:'pointer', boxShadow:'var(--shadow)' }}>
                    <div style={{ position:'relative', aspectRatio:'16/9', background:'var(--bg-secondary)', overflow:'hidden' }}>
                      <img src={`https://img.youtube.com/vi/${v.id}/mqdefault.jpg`} alt={v.title}
                        style={{ width:'100%', height:'100%', objectFit:'cover', transition:'transform 0.4s' }}
                        onMouseEnter={e => e.currentTarget.style.transform='scale(1.04)'}
                        onMouseLeave={e => e.currentTarget.style.transform='scale(1)'}
                        onError={e => { e.target.src='https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=600&q=70' }} />
                      {/* Play button (from Videos.jsx) */}
                      <motion.div whileHover={{ scale:1.1 }} whileTap={{ scale:0.95 }}
                        style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:52, height:52, borderRadius:'50%', background:'rgba(255,255,255,0.95)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 24px rgba(0,0,0,0.3)' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="var(--accent)"><path d="M8 5v14l11-7z"/></svg>
                      </motion.div>
                      <span style={{ position:'absolute', bottom:8, right:8, background:'rgba(0,0,0,0.8)', color:'#fff', fontSize:'0.7rem', padding:'2px 8px', borderRadius:4 }}>{v.duration}</span>
                    </div>
                    <div style={{ padding:'14px 16px' }}>
                      <h4 style={{ margin:'0 0 4px', fontSize:'0.92rem', fontWeight:700, color:'var(--text-h)', lineHeight:1.3 }}>{v.title}</h4>
                      {v.subtitle && <p style={{ margin:'0 0 10px', fontSize:'0.75rem', color:'var(--text)', opacity:0.6 }}>{v.subtitle}</p>}
                      <div style={{ display:'flex', gap:12, fontSize:'0.72rem', color:'var(--text)', opacity:0.65, flexWrap:'wrap' }}>
                        {v.distance && <span>📍 {v.distance}</span>}
                        <span>👁 {(v.views/1000).toFixed(1)}K</span>
                        <span>📅 {v.date}</span>
                      </div>
                    </div>
                  </motion.div>
                </Reveal>
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Modal */}
      <AnimatePresence>
        {playing && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            onClick={() => setPlaying(null)}
            style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.92)', zIndex:400, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
            <motion.div initial={{ scale:0.9, y:20 }} animate={{ scale:1, y:0 }} exit={{ scale:0.9 }}
              onClick={e => e.stopPropagation()}
              style={{ width:'100%', maxWidth:960, background:'#000', borderRadius:12, overflow:'hidden', position:'relative' }}>
              <button onClick={() => setPlaying(null)}
                style={{ position:'absolute', top:-40, right:0, background:'none', border:'1px solid rgba(255,255,255,0.2)', color:'#fff', padding:'6px 16px', cursor:'pointer', fontFamily:'var(--sans)', fontSize:'0.72rem', letterSpacing:'0.1em', borderRadius:4 }}>
                CLOSE ✕
              </button>
              <div style={{ aspectRatio:'16/9' }}>
                <iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${playing.id}?autoplay=1`}
                  title={playing.title} frameBorder="0" allow="autoplay; fullscreen" allowFullScreen style={{ display:'block' }} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}

// ─── 07 RIDE MAP — Full-bleed with floating route cards ──────────────────────
const MAP_BG = 'https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=1600&q=85'

function MapSection() {
  const [mode, setMode] = useState('completed')
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target:ref, offset:['start end','end start'] })
  const bgScale = useTransform(scrollYProgress,[0,0.5,1],[1.08,1.0,1.08])
  const modeColor = { completed:'#22c55e', planned:'#f59e0b', dream:'var(--accent)' }
  const filtered = routes.filter(r => r.mode === mode)

  return (
    <section id="v4-map" ref={ref} style={{ position:'relative', overflow:'hidden', background:'var(--bg)' }}>
      {/* Hero image with parallax zoom */}
      <div style={{ position:'relative', height:'72vh', minHeight:460, overflow:'hidden' }}>
        <motion.div style={{ position:'absolute', inset:'-10%', scale:bgScale }}>
          <img src={MAP_BG} alt="Map" style={{ width:'100%', height:'100%', objectFit:'cover', opacity:0.35 }} />
        </motion.div>
        <div style={{ position:'absolute', inset:0, background:'var(--bg)', opacity:0.5 }} />

        {/* Content */}
        <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', justifyContent:'center', padding:'clamp(20px,5vw,80px)' }}>
          <Reveal>
            <SectionLabel>Every Road Has a Story</SectionLabel>
            <UnderlineHeading size="3.5rem">Ride Map &<br />Journeys</UnderlineHeading>
            <p style={{ color:'var(--text)', lineHeight:1.8, maxWidth:440, marginBottom:32 }}>
              From Chennai to the hills, the coast, and beyond. Every route ridden, planned, and dreamed.
            </p>
          </Reveal>

          {/* Mode toggle */}
          <Reveal delay={0.1}>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:32 }}>
              {[['completed','✓ Completed'],['planned','↗ Planned'],['dream','♡ Dream']].map(([id,label]) => (
                <motion.button key={id} onClick={() => setMode(id)} whileHover={{ scale:1.04 }} whileTap={{ scale:0.97 }}
                  style={{ padding:'8px 20px', borderRadius:999, cursor:'pointer', fontFamily:'var(--sans)', fontWeight:600, fontSize:'0.78rem', transition:'all 0.2s',
                    border:`1.5px solid ${mode===id ? modeColor[id] : 'var(--border)'}`,
                    background: mode===id ? `${modeColor[id]}18` : 'var(--card-bg)',
                    color: mode===id ? modeColor[id] : 'var(--text)',
                  }}>{label}</motion.button>
              ))}
            </div>
          </Reveal>

          {/* Stats row */}
          <Reveal delay={0.15}>
            <div style={{ display:'flex', gap:32, flexWrap:'wrap' }}>
              {[['12,547+','KM Ridden'],['24','Trips Done'],['3','States'],['342h','On Road']].map(([v,l]) => (
                <div key={l}>
                  <div style={{ fontSize:'clamp(1.3rem,2.5vw,2rem)', fontWeight:800, color:'var(--text-h)', lineHeight:1 }}>{v}</div>
                  <div style={{ fontSize:'0.65rem', letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--text)', opacity:0.5, marginTop:4 }}>{l}</div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </div>

      {/* Route cards */}
      <div style={{ padding:'48px clamp(20px,5vw,80px) 80px' }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:16 }}>
          {filtered.map((r, i) => (
            <Reveal key={r.id} delay={i*0.07}>
              <motion.div whileHover={{ y:-4, boxShadow:'var(--shadow-hover)' }}
                style={{ background:'var(--card-bg)', border:'1px solid var(--border)', borderTop:`3px solid ${modeColor[r.mode]}`, borderRadius:'var(--radius)', padding:20, boxShadow:'var(--shadow)' }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10 }}>
                  <h4 style={{ margin:0, fontFamily:'var(--heading)', fontSize:'1rem', color:'var(--text-h)', fontWeight:700, lineHeight:1.3 }}>{r.name}</h4>
                  {r.rating && <span style={{ fontSize:'0.75rem', color:'#f59e0b', fontWeight:700, flexShrink:0, marginLeft:8 }}>★ {r.rating}</span>}
                </div>
                <p style={{ margin:'0 0 12px', fontSize:'0.8rem', color:'var(--text)', lineHeight:1.6 }}>{r.description}</p>
                <div style={{ display:'flex', gap:14, fontSize:'0.72rem', color:'var(--text)', opacity:0.65, flexWrap:'wrap' }}>
                  <span>📍 {r.distance}</span><span>⏱ {r.time}</span><span>📅 {r.date}</span>
                </div>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── 08 STATS — Animated bars + vertical timeline (Home.jsx pattern) ─────────
function StatsSection() {
  const lineRef = useRef(null)
  const lineInView = useInView(lineRef, { once:true })
  const chartRef = useRef(null)
  const chartInView = useInView(chartRef, { once:true })
  const max = Math.max(...rideStats.monthlyData.map(d => d.km))

  return (
    <section id="v4-stats" style={{ padding:'96px clamp(20px,5vw,80px)', background:'var(--bg-secondary)' }}>
      <Reveal>
        <SectionLabel>Measured in Kilometres</SectionLabel>
        <UnderlineHeading size="3rem">Ride Statistics</UnderlineHeading>
      </Reveal>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:64, marginTop:48, alignItems:'start' }} className="stats-v4-grid">
        {/* Left — big summary + bar chart */}
        <div>
          <Reveal>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:1, background:'var(--border)', borderRadius:'var(--radius)', overflow:'hidden', marginBottom:36 }}>
              {[
                { label:'Total Rides', end:rideStats.summary.totalRides },
                { label:'KM Ridden', end:rideStats.summary.totalDistance },
                { label:'Riding Hours', end:rideStats.summary.rideHours, suffix:'h' },
                { label:'Top Speed', end:rideStats.summary.topSpeed, suffix:' km/h' },
                { label:'Avg Mileage', end:rideStats.summary.avgMileage, suffix:' km/l', decimals:1 },
                { label:'Avg Speed', end:rideStats.summary.avgSpeed, suffix:' km/h' },
              ].map((s,i) => (
                <motion.div key={i} whileHover={{ background:'var(--accent-bg)' }}
                  style={{ padding:'18px 20px', background:'var(--card-bg)', transition:'background 0.2s' }}>
                  <div style={{ fontSize:'0.65rem', letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--text)', opacity:0.5, marginBottom:4 }}>{s.label}</div>
                  <div style={{ fontWeight:800, fontSize:'1.3rem', color:'var(--text-h)', lineHeight:1 }}>
                    <AnimCounter end={s.end} suffix={s.suffix||''} decimals={s.decimals||0} />
                  </div>
                </motion.div>
              ))}
            </div>
          </Reveal>

          {/* Bar chart */}
          <Reveal delay={0.1}>
            <div ref={chartRef}>
              <div style={{ fontSize:'0.72rem', letterSpacing:'0.16em', textTransform:'uppercase', color:'var(--text)', opacity:0.6, marginBottom:16 }}>Monthly Distance (KM)</div>
              <div style={{ display:'flex', alignItems:'flex-end', gap:5, height:160 }}>
                {rideStats.monthlyData.map((d, i) => {
                  const h = Math.round((d.km / max) * 140)
                  return (
                    <div key={i} title={`${d.month}: ${d.km} km`}
                      style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                      <motion.div
                        initial={{ height:0 }} animate={chartInView ? { height:h } : { height:0 }}
                        transition={{ duration:0.6, delay:i*0.05, ease:'easeOut' }}
                        style={{ width:'100%', background: i===rideStats.monthlyData.length-1 ? 'var(--accent)' : 'var(--accent-border)', borderRadius:'3px 3px 0 0', minHeight:2 }}
                      />
                      <span style={{ fontSize:'0.52rem', color:'var(--text)', opacity:0.5, textAlign:'center' }}>{d.month}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </Reveal>
        </div>

        {/* Right — vertical ride timeline (Home.jsx timeline pattern) */}
        <div>
          <Reveal>
            <div style={{ fontSize:'0.72rem', letterSpacing:'0.16em', textTransform:'uppercase', color:'var(--text)', opacity:0.6, marginBottom:24 }}>Recent Rides</div>
          </Reveal>
          <div ref={lineRef} style={{ position:'relative', paddingLeft:28 }}>
            {/* Animated vertical line */}
            <motion.div initial={{ scaleY:0 }} animate={lineInView ? { scaleY:1 } : { scaleY:0 }}
              transition={{ duration:1.2, ease:'easeInOut' }}
              style={{ position:'absolute', left:10, top:4, bottom:4, width:1, background:'var(--border)', transformOrigin:'top' }} />

            {rideStats.recentRides.map((ride, i) => (
              <Reveal key={i} delay={i*0.08} x={-20}>
                <div style={{ position:'relative', marginBottom:24 }}>
                  {/* Dot */}
                  <div style={{ position:'absolute', left:-22, top:5, width:10, height:10, borderRadius:'50%', background:'var(--accent)', border:'2px solid var(--bg)', zIndex:1 }} />
                  <motion.div whileHover={{ y:-2, boxShadow:'var(--shadow-hover)' }}
                    style={{ background:'var(--card-bg)', border:'1px solid var(--border)', borderLeft:'3px solid var(--accent)', borderRadius:8, padding:'14px 16px', boxShadow:'var(--shadow)' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:6 }}>
                      <div style={{ fontWeight:700, color:'var(--text-h)', fontSize:'0.9rem' }}>{ride.route}</div>
                      <span style={{ fontSize:'0.68rem', padding:'2px 8px', borderRadius:999, background:'var(--accent-bg)', color:'var(--accent)', fontWeight:600, flexShrink:0, marginLeft:8 }}>{ride.type}</span>
                    </div>
                    <div style={{ display:'flex', gap:12, fontSize:'0.72rem', color:'var(--text)', flexWrap:'wrap' }}>
                      <span>📅 {ride.date}</span>
                      <span>📍 {ride.km} km</span>
                      <span>⏱ {ride.time}</span>
                      <span>⚡ {ride.avgSpeed}</span>
                      <span>⛽ {ride.mileage}</span>
                    </div>
                  </motion.div>
                </div>
              </Reveal>
            ))}
          </div>

          {/* Ride type breakdown */}
          <Reveal delay={0.2}>
            <div style={{ marginTop:8 }}>
              <div style={{ fontSize:'0.72rem', letterSpacing:'0.16em', textTransform:'uppercase', color:'var(--text)', opacity:0.6, marginBottom:16 }}>Ride Breakdown</div>
              {rideStats.rideTypes.map((rt,i) => (
                <div key={i} style={{ marginBottom:12 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4, fontSize:'0.82rem' }}>
                    <span style={{ color:'var(--text)' }}>{rt.type}</span>
                    <span style={{ fontWeight:700, color:'var(--text-h)' }}>{rt.percent}%</span>
                  </div>
                  <div style={{ height:4, background:'var(--bg)', borderRadius:999, overflow:'hidden' }}>
                    <motion.div initial={{ width:0 }} whileInView={{ width:`${rt.percent}%` }} viewport={{ once:true }}
                      transition={{ duration:0.8, delay:i*0.1, ease:'easeOut' }}
                      style={{ height:'100%', background:rt.color, borderRadius:999 }} />
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
      <style>{`@media (max-width: 860px) { .stats-v4-grid { grid-template-columns: 1fr !important; } }`}</style>
    </section>
  )
}

// ─── 09 DREAM GARAGE — Phase cards + spring badges (About.jsx pattern) ────────
function DreamSection() {
  const [expanded, setExpanded] = useState(1)
  const statusColors = { completed:'#22c55e', active:'var(--accent)', planned:'#f59e0b', future:'var(--text)' }

  return (
    <section id="v4-dream" style={{ padding:'96px clamp(20px,5vw,80px)', background:'var(--bg)' }}>
      <div style={{ maxWidth:1100, margin:'0 auto' }}>
        <Reveal>
          <SectionLabel>The Vision</SectionLabel>
          <UnderlineHeading size="3rem">Dream Garage & Build Plan</UnderlineHeading>
          <p style={{ color:'var(--text)', lineHeight:1.8, maxWidth:520, marginBottom:48 }}>From essential add-ons to a fully loaded touring beast — here's the roadmap.</p>
        </Reveal>

        {/* Phase accordion cards */}
        <div style={{ display:'flex', flexDirection:'column', gap:12, marginBottom:64 }}>
          {dreamGarage.phases.map((phase, i) => {
            const isOpen = expanded === i
            const color = statusColors[phase.status]
            return (
              <Reveal key={phase.id} delay={i*0.08}>
                <motion.div onClick={() => setExpanded(isOpen ? null : i)}
                  animate={{ borderColor: isOpen ? 'var(--accent-border)' : 'var(--border)' }}
                  whileHover={!isOpen ? { y:-2, boxShadow:'var(--shadow-hover)' } : {}}
                  style={{ border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', overflow:'hidden', background:'var(--card-bg)', cursor:'pointer', boxShadow:'var(--shadow)' }}>
                  {/* Top bar */}
                  <motion.div animate={{ scaleX: isOpen ? 1 : 0 }} transition={{ duration:0.3 }}
                    style={{ height:3, background:color, transformOrigin:'left' }} />
                  <div style={{ display:'grid', gridTemplateColumns:'auto 1fr auto auto', gap:16, padding:'20px 24px', alignItems:'center' }}>
                    <div style={{ width:44, height:44, borderRadius:12, background:`${color}18`, border:`2px solid ${color}40`,
                      display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--mono)', fontWeight:800, fontSize:'0.88rem', color, flexShrink:0 }}>
                      {String(i+1).padStart(2,'0')}
                    </div>
                    <div>
                      <div style={{ fontSize:'0.65rem', letterSpacing:'0.14em', textTransform:'uppercase', color, fontWeight:600, marginBottom:2 }}>{phase.status}</div>
                      <div style={{ fontWeight:700, color:'var(--text-h)', fontSize:'1.05rem' }}>{phase.label} — {phase.title}</div>
                    </div>
                    <div style={{ display:'flex', gap:6, flexWrap:'wrap', justifyContent:'flex-end' }}>
                      {phase.items.slice(0,3).map((item,j) => (
                        <span key={j} style={{ fontSize:'0.65rem', padding:'3px 10px', borderRadius:999, background:'var(--bg-secondary)', color:'var(--text)', border:'1px solid var(--border)' }}>{item}</span>
                      ))}
                    </div>
                    <motion.span animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration:0.25 }}
                      style={{ color:'var(--accent)', fontSize:'1.2rem', flexShrink:0 }}>▾</motion.span>
                  </div>
                  <motion.div initial={false} animate={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }}
                    transition={{ duration:0.35, ease:[0.25,0.1,0.25,1] }} style={{ overflow:'hidden' }}>
                    <div style={{ padding:'0 24px 24px', paddingLeft:84 }}>
                      <motion.div variants={{ hidden:{}, show:{ transition:{ staggerChildren:0.07 } } }} initial="hidden" animate={isOpen ? "show" : "hidden"}>
                        <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                          {phase.items.map((item,j) => {
                            return (
                              <motion.span key={j}
                                variants={{ hidden:{ opacity:0, scale:0.75 }, show:{ opacity:1, scale:1, transition:{ type:'spring', stiffness:300 } } }}
                                style={{ padding:'6px 14px', borderRadius:999, fontSize:'0.8rem', fontWeight:500, background:'var(--accent-bg)', color:'var(--accent)', border:'1px solid var(--accent-border)' }}>
                                {phase.status === 'completed' ? '✓ ' : '○ '}{item}
                              </motion.span>
                            )
                          })}
                        </div>
                      </motion.div>
                    </div>
                  </motion.div>
                </motion.div>
              </Reveal>
            )
          })}
        </div>

        {/* Dream bikes */}
        <Reveal>
          <div style={{ fontSize:'0.72rem', letterSpacing:'0.16em', textTransform:'uppercase', color:'var(--text)', opacity:0.6, marginBottom:24 }}>Machines I Dream to Own</div>
        </Reveal>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))', gap:16 }}>
          {dreamGarage.dreamBikes.map((b, i) => (
            <Reveal key={i} delay={i*0.08}>
              <motion.div whileHover={{ y:-6, boxShadow:'var(--shadow-hover)' }}
                style={{ background:'var(--card-bg)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', overflow:'hidden', boxShadow:'var(--shadow)' }}>
                <div style={{ height:140, background:'var(--bg-secondary)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'3.5rem', borderBottom:'1px solid var(--border)' }}>🏍️</div>
                <div style={{ padding:18 }}>
                  <h4 style={{ margin:'0 0 4px', fontSize:'0.95rem', fontFamily:'var(--heading)', color:'var(--text-h)', fontWeight:700 }}>{b.name}</h4>
                  <div style={{ fontSize:'0.9rem', fontWeight:700, color:'var(--accent)', marginBottom:8 }}>{b.price}</div>
                  <p style={{ margin:0, fontSize:'0.78rem', color:'var(--text)', lineHeight:1.6 }}>{b.reason}</p>
                </div>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── 10 WISHLIST + COST ───────────────────────────────────────────────────────
function WishlistCostSection() {
  const total = costTracker.categories.reduce((s, c) => s + c.amount, 0)
  const priorityColor = { high:'#ef4444', medium:'#f59e0b', low:'#22c55e' }

  return (
    <section id="v4-cost" style={{ padding:'96px clamp(20px,5vw,80px)', background:'var(--bg-secondary)' }}>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:64 }} className="cost-wish-grid">

        {/* Wishlist */}
        <div>
          <Reveal>
            <SectionLabel>What's Next</SectionLabel>
            <UnderlineHeading>Wishlist</UnderlineHeading>
          </Reveal>
          <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:32 }}>
            {wishlist.filter(w => w.status !== 'dreaming').slice(0, 6).map((w, i) => {
              const pc = priorityColor[w.priority]
              return (
                <Reveal key={w.id} delay={i*0.06} x={-20}>
                  <motion.div whileHover={{ x:4 }}
                    style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:12, padding:'14px 18px', background:'var(--card-bg)', border:'1px solid var(--border)', borderLeft:`4px solid ${pc}`, borderRadius:'0 var(--radius) var(--radius) 0', boxShadow:'var(--shadow)' }}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontWeight:600, color:'var(--text-h)', fontSize:'0.88rem', marginBottom:2 }}>{w.name}</div>
                      <div style={{ fontSize:'0.68rem', color:'var(--text)', opacity:0.55 }}>{w.category} · {w.targetMonth}</div>
                    </div>
                    <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:4 }}>
                      <span style={{ fontWeight:800, color:'var(--text-h)', fontSize:'0.9rem' }}>
                        {w.price >= 100000 ? `₹${(w.price/100000).toFixed(1)}L` : `₹${w.price.toLocaleString('en-IN')}`}
                      </span>
                      <span style={{ fontSize:'0.62rem', fontWeight:700, padding:'2px 8px', borderRadius:999, background:`${pc}18`, color:pc, border:`1px solid ${pc}40` }}>{w.priority}</span>
                    </div>
                  </motion.div>
                </Reveal>
              )
            })}
          </div>
        </div>

        {/* Cost tracker */}
        <div>
          <Reveal delay={0.1}>
            <SectionLabel>Investment Breakdown</SectionLabel>
            <UnderlineHeading>Cost Tracker</UnderlineHeading>
          </Reveal>
          <Reveal delay={0.15}>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:1, background:'var(--border)', borderRadius:'var(--radius)', overflow:'hidden', marginBottom:32 }}>
              {[['₹3.1L','Total'],['₹8.2K','Monthly'],['₹24.9','Per KM']].map(([v,l]) => (
                <div key={l} style={{ padding:'16px', textAlign:'center', background:'var(--card-bg)' }}>
                  <div style={{ fontWeight:800, fontSize:'1.2rem', color:'var(--text-h)', lineHeight:1 }}>{v}</div>
                  <div style={{ fontSize:'0.62rem', letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--text)', opacity:0.5, marginTop:4 }}>{l}</div>
                </div>
              ))}
            </div>
          </Reveal>
          <div>
            {costTracker.categories.map((c, i) => {
              const pct = (c.amount/total)*100
              return (
                <Reveal key={i} delay={i*0.07}>
                  <div style={{ marginBottom:16 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6, fontSize:'0.85rem' }}>
                      <span style={{ color:'var(--text)' }}>{c.icon} {c.name}</span>
                      <span style={{ fontWeight:700, color:'var(--text-h)' }}>₹{c.amount.toLocaleString('en-IN')}</span>
                    </div>
                    <div style={{ height:5, background:'var(--bg)', borderRadius:999, overflow:'hidden' }}>
                      <motion.div initial={{ width:0 }} whileInView={{ width:`${pct}%` }} viewport={{ once:true }}
                        transition={{ duration:0.8, delay:i*0.1, ease:'easeOut' }}
                        style={{ height:'100%', background:c.color, borderRadius:999 }} />
                    </div>
                  </div>
                </Reveal>
              )
            })}
          </div>

          {/* Recent expenses */}
          <Reveal delay={0.2}>
            <div style={{ marginTop:24 }}>
              <div style={{ fontSize:'0.65rem', letterSpacing:'0.16em', textTransform:'uppercase', color:'var(--text)', opacity:0.55, marginBottom:12 }}>Recent Expenses</div>
              {costTracker.recentExpenses.slice(0,5).map((e,i) => (
                <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid var(--border)', fontSize:'0.82rem' }}>
                  <span style={{ color:'var(--text)' }}>{e.item}</span>
                  <span style={{ fontWeight:700, color:'var(--accent)' }}>₹{e.amount.toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
      <style>{`@media (max-width: 860px) { .cost-wish-grid { grid-template-columns: 1fr !important; } }`}</style>
    </section>
  )
}

// ─── 11 MAINTENANCE — Numbered cards (About principles pattern) ───────────────
function MaintenanceSection() {
  const priorityColor = { high:'#ef4444', medium:'#f59e0b', low:'#22c55e' }

  return (
    <section id="v4-maintenance" style={{ padding:'96px clamp(20px,5vw,80px)', background:'var(--bg)' }}>
      <div style={{ maxWidth:1000, margin:'0 auto' }}>
        <Reveal>
          <SectionLabel>Keep It Running</SectionLabel>
          <UnderlineHeading>Maintenance</UnderlineHeading>
        </Reveal>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:32, marginTop:40 }} className="maint-grid">
          {/* Upcoming — numbered cards (About principles pattern) */}
          <div>
            <div style={{ fontSize:'0.72rem', letterSpacing:'0.16em', textTransform:'uppercase', color:'var(--text)', opacity:0.6, marginBottom:20 }}>Upcoming</div>
            {maintenance.upcoming.map((item, i) => {
              const pc = priorityColor[item.priority]
              const pct = item.dueKm ? Math.min((item.currentKm/item.dueKm)*100, 100) : null
              return (
                <Reveal key={i} delay={i*0.07}>
                  <motion.div whileHover={{ y:-2, boxShadow:'var(--shadow-hover)' }}
                    style={{ display:'flex', gap:14, padding:'16px 18px', background:'var(--card-bg)', border:'1px solid var(--border)', borderRadius:'var(--radius)', marginBottom:10, boxShadow:'var(--shadow)' }}>
                    {/* Numbered circle (from About principles) */}
                    <div style={{ width:38, height:38, borderRadius:'50%', flexShrink:0, background:`${pc}18`, border:`2px solid ${pc}`, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:'0.85rem', color:pc }}>
                      {String(i+1).padStart(2,'0')}
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                        <span style={{ fontWeight:600, color:'var(--text-h)', fontSize:'0.9rem' }}>{item.icon} {item.type}</span>
                        <span style={{ fontSize:'0.62rem', fontWeight:700, padding:'2px 8px', borderRadius:999, background:`${pc}18`, color:pc, border:`1px solid ${pc}40` }}>{item.priority}</span>
                      </div>
                      {pct !== null && (
                        <>
                          <div style={{ height:4, background:'var(--bg-secondary)', borderRadius:999, overflow:'hidden', marginBottom:4 }}>
                            <div style={{ height:'100%', width:`${pct}%`, background: pct>85?'#ef4444':'var(--accent)', borderRadius:999, transition:'width 0.6s' }} />
                          </div>
                          <div style={{ fontSize:'0.68rem', color:'var(--text)', opacity:0.55 }}>{(item.dueKm-item.currentKm).toLocaleString('en-IN')} KM remaining</div>
                        </>
                      )}
                      {item.dueDate && <div style={{ fontSize:'0.72rem', color:'var(--text)', opacity:0.6 }}>Due: {item.dueDate}</div>}
                    </div>
                  </motion.div>
                </Reveal>
              )
            })}
          </div>

          {/* History */}
          <div>
            <div style={{ fontSize:'0.72rem', letterSpacing:'0.16em', textTransform:'uppercase', color:'var(--text)', opacity:0.6, marginBottom:20 }}>Service History</div>
            <div style={{ position:'relative', paddingLeft:24 }}>
              <motion.div initial={{ scaleY:0 }} whileInView={{ scaleY:1 }} viewport={{ once:true }}
                transition={{ duration:1, ease:'easeInOut' }}
                style={{ position:'absolute', left:8, top:4, bottom:4, width:1, background:'var(--border)', transformOrigin:'top' }} />
              {maintenance.history.map((h, i) => (
                <Reveal key={i} delay={i*0.08} x={-20}>
                  <div style={{ position:'relative', marginBottom:20 }}>
                    <div style={{ position:'absolute', left:-20, top:5, width:10, height:10, borderRadius:'50%', background:i===0?'var(--accent)':'var(--border)', border:'2px solid var(--bg)', zIndex:1 }} />
                    <motion.div whileHover={{ x:4, borderColor:'var(--accent-border)' }}
                      style={{ background:'var(--card-bg)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:'14px 16px', boxShadow:'var(--shadow)', transition:'border-color 0.2s' }}>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                        <div style={{ fontWeight:600, color:'var(--text-h)', fontSize:'0.88rem' }}>{h.work}</div>
                        <span style={{ fontWeight:700, color:h.cost===0?'#22c55e':'var(--accent)', fontSize:'0.88rem', flexShrink:0, marginLeft:8 }}>{h.cost===0?'Free':`₹${h.cost.toLocaleString('en-IN')}`}</span>
                      </div>
                      <div style={{ fontSize:'0.7rem', color:'var(--text)', opacity:0.55 }}>{h.date} · {h.km.toLocaleString('en-IN')} KM · {h.shop}</div>
                    </motion.div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </div>
      <style>{`@media (max-width: 760px) { .maint-grid { grid-template-columns: 1fr !important; } }`}</style>
    </section>
  )
}

// ─── 12 GALLERY — 3D polaroid intro + lightbox (Gallery.jsx pattern) ──────────
const GALLERY_IMGS = [
  { src:'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800&q=85', loc:'Yelagiri Hills', date:'May 2024' },
  { src:'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=800&q=85', loc:'East Coast Road', date:'Apr 2024' },
  { src:'https://images.unsplash.com/photo-1609630875171-b1321377ee65?w=800&q=85', loc:'Chennai', date:'May 2024' },
  { src:'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=85', loc:'Highway', date:'Mar 2024' },
  { src:'https://images.unsplash.com/photo-1547549082-6bc09f2049ae?w=800&q=85', loc:'Mountain Pass', date:'Apr 2024' },
  { src:'https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=800&q=85', loc:'Coastal', date:'Apr 2024' },
  { src:'https://images.unsplash.com/photo-1449426468159-d96dbf08f19f?w=800&q=85', loc:'Engine Bay', date:'Aug 2024' },
  { src:'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800&q=85', loc:'Night Ride', date:'Feb 2024' },
]

function GallerySection() {
  const [lbOpen, setLbOpen] = useState(false)
  const [lbIdx, setLbIdx] = useState(0)
  const [activeFilter, setActiveFilter] = useState('All')
  const filters = ['All','Rides','Setup','Moments']

  const open = (i) => { setLbIdx(i); setLbOpen(true) }

  return (
    <section id="v4-gallery" style={{ padding:'96px clamp(20px,5vw,80px)', background:'var(--bg-secondary)' }}>
      <Reveal>
        <SectionLabel>Captured Moments</SectionLabel>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', flexWrap:'wrap', gap:16, marginBottom:36 }}>
          <UnderlineHeading>Gallery</UnderlineHeading>
          <div style={{ display:'flex', gap:8 }}>
            {filters.map(f => (
              <motion.button key={f} onClick={() => setActiveFilter(f)} whileHover={{ scale:1.04 }} whileTap={{ scale:0.97 }}
                style={{ padding:'7px 18px', borderRadius:999, border:'1.5px solid', cursor:'pointer', fontFamily:'var(--sans)', fontWeight:600, fontSize:'0.78rem', transition:'all 0.2s',
                  borderColor: activeFilter===f ? 'var(--text-h)' : 'var(--border)',
                  background: activeFilter===f ? 'var(--text-h)' : 'transparent',
                  color: activeFilter===f ? 'var(--bg)' : 'var(--text-h)',
                }}>{f}</motion.button>
            ))}
          </div>
        </div>
      </Reveal>

      {/* Mixed grid — different sized cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gridAutoRows:200, gap:12 }} className="gallery-v4-grid">
        {GALLERY_IMGS.map((g, i) => (
          <Reveal key={i} delay={i*0.05} style={{
            gridColumn: i===0 ? 'span 2' : i===3 ? 'span 2' : 'span 1',
            gridRow: i===0 || i===4 ? 'span 2' : 'span 1',
          }}>
            <motion.div
              whileHover={{ scale:1.02 }}
              onClick={() => open(i)}
              style={{ width:'100%', height:'100%', borderRadius:'var(--radius)', overflow:'hidden', cursor:'pointer', position:'relative', background:'var(--bg)', boxShadow:'var(--shadow)' }}
            >
              <img src={g.src} alt={g.loc} style={{ width:'100%', height:'100%', objectFit:'cover', transition:'transform 0.5s ease' }}
                onMouseEnter={e => e.currentTarget.style.transform='scale(1.06)'}
                onMouseLeave={e => e.currentTarget.style.transform='scale(1)'}
              />
              <motion.div initial={{ opacity:0 }} whileHover={{ opacity:1 }} transition={{ duration:0.25 }}
                style={{ position:'absolute', inset:0, background:'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 55%)',
                  display:'flex', flexDirection:'column', justifyContent:'flex-end', padding:14 }}>
                <div style={{ fontWeight:700, color:'#fff', fontSize:'0.85rem' }}>{g.loc}</div>
                <div style={{ fontSize:'0.68rem', color:'rgba(255,255,255,0.7)', marginTop:2 }}>{g.date}</div>
              </motion.div>
            </motion.div>
          </Reveal>
        ))}
      </div>

      <Lightbox open={lbOpen} close={() => setLbOpen(false)} slides={GALLERY_IMGS.map(g => ({ src:g.src }))} index={lbIdx} />

      <style>{`
        @media (max-width: 768px) { .gallery-v4-grid { grid-template-columns: repeat(2,1fr) !important; grid-auto-rows: 160px !important; } }
        @media (max-width: 480px) { .gallery-v4-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </section>
  )
}

// ─── 13 CONNECT — Infinite ticker rows (Home.jsx SocialSection) ───────────────
function ConnectSection() {
  const socials = [
    { label:'Instagram', handle:cfg.social?.instagram?.handle||'@sivashanmugavadivelv', href:cfg.social?.instagram?.href||'#', color:'#e1306c' },
    { label:'YouTube', handle:'SIVA SHANMUGA VADIVEL', href:cfg.social?.youtube?.href||'#', color:'#ff0000' },
    { label:'Blog', handle:'Read Ride Stories', href:'/blog', color:'var(--accent)' },
    { label:'Email', handle:'Get in Touch', href:'/contact', color:'#22c55e' },
  ]

  // Ticker items
  const tickerItems = [...socials, ...socials, ...socials]

  return (
    <section id="v4-connect" style={{ background:'var(--bg)', paddingTop:96, overflow:'hidden' }}>
      <div style={{ padding:'0 clamp(20px,5vw,80px)', marginBottom:64 }}>
        <Reveal>
          <SectionLabel>Ride Together</SectionLabel>
          <UnderlineHeading size="3rem">Connect</UnderlineHeading>
          <p style={{ color:'var(--text)', lineHeight:1.8, maxWidth:440, marginBottom:48 }}>Follow the journey. Join the community. Every ride is better with good people.</p>
        </Reveal>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:16, marginBottom:64 }}>
          {socials.map((s, i) => (
            <Reveal key={i} delay={i*0.08}>
              <motion.a href={s.href}
                target={s.href.startsWith('http') ? '_blank' : undefined}
                rel="noopener noreferrer"
                whileHover={{ y:-6, boxShadow:`0 12px 32px ${s.color}35`, borderColor:`${s.color}80` }}
                style={{ display:'flex', flexDirection:'column', gap:10, padding:'24px 20px', background:'var(--card-bg)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', textDecoration:'none', boxShadow:'var(--shadow)', transition:'border-color 0.2s' }}>
                <div style={{ fontSize:'0.65rem', letterSpacing:'0.18em', textTransform:'uppercase', color:'var(--text)', opacity:0.5 }}>{s.label}</div>
                <div style={{ fontWeight:700, color:s.color, fontSize:'0.95rem' }}>{s.handle}</div>
                <div style={{ marginTop:'auto', fontSize:'0.78rem', color:'var(--accent)', fontWeight:600 }}>Follow →</div>
              </motion.a>
            </Reveal>
          ))}
        </div>
      </div>

      {/* Infinite ticker (Home.jsx TickerRow pattern) */}
      {['left','right'].map(dir => (
        <div key={dir} style={{ position:'relative', overflow:'hidden', marginBottom:dir==='left' ? 2 : 0 }}>
          {/* Gradient fade edges */}
          <div style={{ position:'absolute', left:0, top:0, bottom:0, width:80, background:`linear-gradient(to right, var(--bg), transparent)`, zIndex:2, pointerEvents:'none' }} />
          <div style={{ position:'absolute', right:0, top:0, bottom:0, width:80, background:`linear-gradient(to left, var(--bg), transparent)`, zIndex:2, pointerEvents:'none' }} />
          <motion.div
            animate={{ x: dir==='left' ? ['0%','-50%'] : ['-50%','0%'] }}
            transition={{ duration:18, repeat:Infinity, ease:'linear' }}
            style={{ display:'flex', gap:8, paddingBottom:8, width:'fit-content', paddingTop:4 }}>
            {tickerItems.map((s, i) => (
              <motion.div key={i}
                whileHover={{ scale:1.07, boxShadow:`0 12px 32px ${s.color}35`, borderColor:`${s.color}80` }}
                style={{ flexShrink:0, padding:'10px 24px', background:'var(--card-bg)', border:'1px solid var(--border)', borderRadius:999, display:'flex', gap:10, alignItems:'center', cursor:'default', transition:'border-color 0.2s' }}>
                <span style={{ fontWeight:700, color:s.color, fontSize:'0.82rem' }}>{s.label}</span>
                <span style={{ fontSize:'0.78rem', color:'var(--text)', opacity:0.55 }}>·</span>
                <span style={{ fontSize:'0.78rem', color:'var(--text)' }}>{s.handle}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      ))}

      {/* Closing */}
      <div style={{ padding:'48px clamp(20px,5vw,80px) 80px', textAlign:'center' }}>
        <Reveal>
          <div style={{ fontFamily:'var(--heading)', fontStyle:'italic', fontSize:'clamp(1.3rem,2.5vw,2rem)', color:'var(--text-h)', marginBottom:8 }}>
            "Thanks for visiting my garage."
          </div>
          <div style={{ fontSize:'0.85rem', color:'var(--accent)', fontWeight:600, letterSpacing:'0.08em' }}>
            See you on the next ride. 🏍️
          </div>
          <div style={{ width:60, height:3, background:'var(--accent)', borderRadius:999, margin:'20px auto 0' }} />
        </Reveal>
      </div>
    </section>
  )
}

// ─── Fixed dot nav ────────────────────────────────────────────────────────────
const NAV = [
  ['v4-hero','Hero'],['v4-bike','Bike'],['v4-setup','Setup'],
  ['v4-recommended','Gear'],['v4-vlogs','Vlogs'],['v4-map','Map'],
  ['v4-stats','Stats'],['v4-dream','Dream'],['v4-cost','Wishlist'],
  ['v4-maintenance','Service'],['v4-gallery','Gallery'],['v4-connect','Connect'],
]
function DotNav() {
  const [active, setActive] = useState('v4-hero')
  useEffect(() => {
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) setActive(e.target.id) }),
      { rootMargin:'-45% 0px -45% 0px' }
    )
    NAV.forEach(([id]) => { const el = document.getElementById(id); if (el) obs.observe(el) })
    return () => obs.disconnect()
  }, [])
  return (
    <div style={{ position:'fixed', right:20, top:'50%', transform:'translateY(-50%)', zIndex:50, display:'flex', flexDirection:'column', gap:10 }} className="dot-nav-v4">
      {NAV.map(([id,label]) => (
        <button key={id} onClick={() => document.getElementById(id)?.scrollIntoView({ behavior:'smooth' })} title={label}
          style={{ width:active===id?8:4, height:active===id?8:4, borderRadius:'50%', background: active===id ? 'var(--accent)' : 'var(--accent-border)', border:'none', cursor:'pointer', padding:0, transition:'all 0.3s', alignSelf:'center' }} />
      ))}
      <style>{`@media (max-width: 768px) { .dot-nav-v4 { display: none !important; } }`}</style>
    </div>
  )
}

// ─── View switcher ────────────────────────────────────────────────────────────
function Switcher() {
  return (
    <div style={{ position:'fixed', top:72, left:'50%', transform:'translateX(-50%)', zIndex:60, display:'flex', background:'var(--card-bg)', backdropFilter:'blur(20px)', border:'1px solid var(--border)', overflow:'hidden', borderRadius:999 }} className="switcher-v4">
      {[{ label:'Standard', to:'/garage' },{ label:'Premium', to:'/garage/premium' },{ label:'V3', to:'/garage/v3' },{ label:'V4 ✦', to:null }].map(({ label, to }) => (
        to ? (
          <Link key={label} to={to} style={{ padding:'8px 16px', fontSize:'0.65rem', letterSpacing:'0.1em', textTransform:'uppercase', fontWeight:600, fontFamily:'var(--sans)', color:'var(--text)', textDecoration:'none', whiteSpace:'nowrap' }}>{label}</Link>
        ) : (
          <div key={label} style={{ padding:'8px 16px', fontSize:'0.65rem', letterSpacing:'0.1em', textTransform:'uppercase', fontWeight:700, fontFamily:'var(--sans)', background:'var(--accent)', color:'#fff', whiteSpace:'nowrap' }}>{label}</div>
        )
      ))}
      <style>{`@media (max-width: 480px) { .switcher-v4 { display: none !important; } }`}</style>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function GarageV4() {
  return (
    <div style={{ background:'var(--bg)', overflowX:'hidden' }}>
      <Switcher />
      <DotNav />
      <Hero />
      <StatsStrip />
      <BikeSection />
      <SetupSection />
      <RecommendedSection />
      <VlogsSection />
      <MapSection />
      <StatsSection />
      <DreamSection />
      <WishlistCostSection />
      <MaintenanceSection />
      <GallerySection />
      <ConnectSection />
    </div>
  )
}
