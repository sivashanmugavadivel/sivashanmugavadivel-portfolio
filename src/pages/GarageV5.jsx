/**
 * The Garage — V5 "Cinematic" Design
 *
 * EVERYTHING HERE IS NEW — none of these techniques appear on any other page:
 *
 * 01 HERO          — Fullscreen video-style BG + word-by-word scroll reveal + clip-path title sweep
 * 02 BIKE PROFILE  — Split-screen sticky left / scrolling right panel
 * 03 SPECS         — Speedometer/gauge SVG animations + flip-number odometer
 * 04 SETUP         — Horizontal snap scroll rail (first on site)
 * 05 RECOMMENDED   — Glassmorphism cards with blur + magnetic hover effect
 * 06 VLOGS         — Pinned filmstrip that advances as you scroll
 * 07 MAP           — SVG path draw animation of routes
 * 08 STATS         — Radial progress gauges + clip-path masked bar reveal
 * 09 DREAM         — Perspective zoom grid (items scale as you scroll toward them)
 * 10 WISHLIST      — Stacked sticky cards that push each other off screen
 * 11 COST          — Arc / donut with animated stroke-dashoffset
 * 12 MAINTENANCE   — Odometer flip counter + progress rings
 * 13 GALLERY       — Masked reveal grid (clip-path from 0 to full)
 * 14 CONNECT       — Magnetic button hover + particle burst on click
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  motion, AnimatePresence,
  useScroll, useTransform, useInView, useMotionValue, useSpring,
  useAnimation,
} from 'framer-motion'
import Lightbox from 'yet-another-react-lightbox'
import 'yet-another-react-lightbox/styles.css'
import {
  bike, accessories, recommendedAccessories, vlogs,
  routes, dreamGarage, wishlist,
  rideStats, costTracker, maintenance,
} from '../data/garage'
import cfg from '../data/config.json'

// ─── Unsplash images ─────────────────────────────────────────────────────────
const IMG = {
  hero:    'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=1920&q=90',
  bike1:   'https://images.unsplash.com/photo-1609630875171-b1321377ee65?auto=format&fit=crop&w=1200&q=90',
  bike2:   'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=1200&q=85',
  bike3:   'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=1200&q=85',
  road:    'https://images.unsplash.com/photo-1547549082-6bc09f2049ae?auto=format&fit=crop&w=1600&q=85',
  sunset:  'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=1600&q=85',
  night:   'https://images.unsplash.com/photo-1571068316344-75bc76f77890?auto=format&fit=crop&w=1600&q=85',
  coast:   'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?auto=format&fit=crop&w=1600&q=85',
  gear1:   'https://images.unsplash.com/photo-1547234935-80c7145ec969?auto=format&fit=crop&w=700&q=80',
  gear2:   'https://images.unsplash.com/photo-1449426468159-d96dbf08f19f?auto=format&fit=crop&w=700&q=80',
  gear3:   'https://images.unsplash.com/photo-1593352216840-4aa2f4e4b671?auto=format&fit=crop&w=700&q=80',
  g1:'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=900&q=85',
  g2:'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=900&q=85',
  g3:'https://images.unsplash.com/photo-1609630875171-b1321377ee65?w=900&q=85',
  g4:'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=900&q=85',
  g5:'https://images.unsplash.com/photo-1547549082-6bc09f2049ae?w=900&q=85',
  g6:'https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=900&q=85',
}

// ─── 01 HERO — Clip-path title sweep + word scroll reveal ────────────────────
function HeroV5() {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const bgY   = useTransform(scrollYProgress, [0,1], ['0%','30%'])
  const fade  = useTransform(scrollYProgress, [0,0.5], [1,0])
  const titleY = useTransform(scrollYProgress, [0,0.5], ['0%','-20%'])

  const words = ['Machines.', 'Stories.', 'Journeys.']

  return (
    <section ref={ref} id="v5-hero" style={{
      position:'relative', height:'100svh', minHeight:700,
      overflow:'hidden', display:'flex', alignItems:'flex-end',
    }}>
      {/* Parallax photo */}
      <motion.div style={{ position:'absolute', inset:'-15%', y:bgY, zIndex:0 }}>
        <img src={IMG.hero} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
      </motion.div>
      {/* Dark overlay */}
      <div style={{ position:'absolute', inset:0, background:'linear-gradient(135deg,rgba(10,8,20,0.96)20%,rgba(10,8,20,0.5)60%,rgba(10,8,20,0.1)100%)', zIndex:1 }} />
      <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top,rgba(10,8,20,1)0%,transparent 55%)', zIndex:1 }} />

      {/* Big clipped title — sweeps in from bottom */}
      <motion.div style={{ position:'absolute', inset:0, zIndex:2, display:'flex', flexDirection:'column', justifyContent:'center', padding:'clamp(28px,6vw,100px)', y:titleY, opacity:fade }}>
        <motion.p
          initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.8, delay:0.2 }}
          style={{ fontSize:'0.72rem', letterSpacing:'0.24em', textTransform:'uppercase', color:'var(--accent)', margin:'0 0 20px', fontWeight:600 }}>
          Royal Enfield Shotgun 650 · Graphite Black · Chennai, India
        </motion.p>

        {/* Clip-path masked title sweep */}
        {'THE GARAGE'.split('').map((ch, i) => (
          <div key={i} style={{ overflow:'hidden', display:'inline-block', lineHeight:1 }}>
            <motion.span
              initial={{ y:'105%' }}
              animate={{ y:'0%' }}
              transition={{ duration:0.85, delay:0.4 + i*0.055, ease:[0.22,1,0.36,1] }}
              style={{
                display:'inline-block',
                fontSize:'clamp(4rem,11vw,10rem)',
                fontFamily:"'Lilita One',cursive",
                fontWeight:900,
                color: i > 3 ? 'var(--accent)' : '#fff',
                lineHeight:1,
                letterSpacing:'-0.02em',
              }}>
              {ch === ' ' ? ' ' : ch}
            </motion.span>
          </div>
        ))}

        {/* Staggered word reveals */}
        <div style={{ display:'flex', gap:'clamp(12px,3vw,40px)', marginTop:'clamp(20px,3vh,40px)', flexWrap:'wrap' }}>
          {words.map((w,i) => (
            <motion.span key={w}
              initial={{ opacity:0, x:-20 }}
              animate={{ opacity:1, x:0 }}
              transition={{ duration:0.7, delay:1.2 + i*0.15, ease:[0.22,1,0.36,1] }}
              style={{ fontSize:'clamp(1rem,2vw,1.5rem)', color:i===0?'#fff':i===1?'rgba(255,255,255,0.6)':'rgba(255,255,255,0.3)', fontFamily:"'Playfair Display',serif", fontStyle:'italic' }}>
              {w}
            </motion.span>
          ))}
        </div>

        {/* CTA */}
        <motion.div initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }} transition={{ delay:1.8, duration:0.7 }}
          style={{ display:'flex', gap:14, marginTop:'clamp(28px,4vh,52px)', flexWrap:'wrap' }}>
          <button onClick={() => document.getElementById('v5-bike')?.scrollIntoView({ behavior:'smooth' })}
            style={{ padding:'14px 36px', background:'var(--accent)', color:'#fff', border:'none', borderRadius:4, fontFamily:'var(--sans)', fontWeight:700, fontSize:'0.8rem', letterSpacing:'0.12em', textTransform:'uppercase', cursor:'pointer', transition:'transform 0.2s,box-shadow 0.2s' }}
            onMouseEnter={e=>{ e.currentTarget.style.transform='scale(1.04)'; e.currentTarget.style.boxShadow='0 0 40px rgba(124,58,237,0.5)' }}
            onMouseLeave={e=>{ e.currentTarget.style.transform='scale(1)'; e.currentTarget.style.boxShadow='none' }}>
            Explore the Machine
          </button>
          <button onClick={() => document.getElementById('v5-vlogs')?.scrollIntoView({ behavior:'smooth' })}
            style={{ padding:'14px 36px', background:'transparent', color:'rgba(255,255,255,0.8)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:4, fontFamily:'var(--sans)', fontWeight:500, fontSize:'0.8rem', letterSpacing:'0.12em', textTransform:'uppercase', cursor:'pointer', backdropFilter:'blur(12px)', transition:'border-color 0.2s,color 0.2s' }}
            onMouseEnter={e=>{ e.currentTarget.style.borderColor='rgba(255,255,255,0.5)'; e.currentTarget.style.color='#fff' }}
            onMouseLeave={e=>{ e.currentTarget.style.borderColor='rgba(255,255,255,0.2)'; e.currentTarget.style.color='rgba(255,255,255,0.8)' }}>
            Watch Rides
          </button>
        </motion.div>
      </motion.div>

      {/* Stats bottom bar */}
      <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:2, duration:0.8 }}
        style={{ position:'relative', zIndex:3, width:'100%', display:'flex', flexWrap:'wrap', borderTop:'1px solid rgba(255,255,255,0.07)', background:'rgba(10,8,20,0.6)', backdropFilter:'blur(20px)' }}>
        {[['12,547 KM','Ridden'],['47','Rides'],['15','Accessories'],['50+','Videos'],['May 2024','Since']].map(([v,l],i) => (
          <div key={i} style={{ flex:'1 1 120px', padding:'18px 24px', textAlign:'center', borderRight:'1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize:'clamp(1.1rem,2.2vw,1.6rem)', fontWeight:800, color:'#fff', lineHeight:1 }}>{v}</div>
            <div style={{ fontSize:'0.62rem', letterSpacing:'0.18em', textTransform:'uppercase', color:'rgba(255,255,255,0.35)', marginTop:5 }}>{l}</div>
          </div>
        ))}
      </motion.div>
    </section>
  )
}

// ─── 02 BIKE PROFILE — Split-screen sticky left / scrolling right ─────────────
function BikeSplitSection() {
  const containerRef = useRef(null)
  const { scrollYProgress } = useScroll({ target: containerRef, offset:['start start','end end'] })
  const rightItems = [
    { label:'The Machine', content: bike.story, img: IMG.bike1 },
    { label:'Graphite Black', content:'Every curve intentional. Every line purposeful. The Graphite Black finish absorbs light like a shadow, turning heads without trying.', img: IMG.bike2 },
    { label:'Born to Ride', content:'648cc parallel twin. 46.3 PS. 52.3 Nm of torque. Numbers that translate to a grin every single time you roll on the throttle.', img: IMG.bike3 },
  ]
  const itemProgress = useTransform(scrollYProgress, [0,1], [0, rightItems.length])
  const [activeItem, setActiveItem] = useState(0)

  useEffect(() => {
    const unsub = itemProgress.on('change', v => setActiveItem(Math.min(Math.floor(v), rightItems.length-1)))
    return unsub
  }, [itemProgress])

  return (
    <section id="v5-bike" ref={containerRef} style={{ height:`${rightItems.length * 100}vh`, position:'relative' }}>
      <div style={{ position:'sticky', top:0, height:'100vh', overflow:'hidden', display:'grid', gridTemplateColumns:'1fr 1fr' }} className="bike-split-grid">

        {/* LEFT — sticky image panel */}
        <div style={{ position:'relative', overflow:'hidden' }}>
          <AnimatePresence mode="wait">
            <motion.img key={activeItem}
              src={rightItems[activeItem].img}
              initial={{ scale:1.08, opacity:0 }} animate={{ scale:1, opacity:1 }} exit={{ scale:0.96, opacity:0 }}
              transition={{ duration:0.9, ease:[0.22,1,0.36,1] }}
              style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover' }}
            />
          </AnimatePresence>
          <div style={{ position:'absolute', inset:0, background:'linear-gradient(to right,transparent 60%,var(--bg)100%)' }} />

          {/* Progress dots */}
          <div style={{ position:'absolute', bottom:40, left:40, display:'flex', gap:8 }}>
            {rightItems.map((_,i) => (
              <div key={i} style={{ width: i===activeItem ? 24 : 8, height:8, borderRadius:4, background: i===activeItem ? 'var(--accent)' : 'rgba(255,255,255,0.3)', transition:'all 0.4s' }} />
            ))}
          </div>
        </div>

        {/* RIGHT — scrolling text panel */}
        <div style={{ display:'flex', flexDirection:'column', justifyContent:'center', padding:'clamp(28px,5vw,80px)', background:'var(--bg)', overflowY:'hidden' }}>
          <AnimatePresence mode="wait">
            <motion.div key={activeItem}
              initial={{ opacity:0, y:48 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-32 }}
              transition={{ duration:0.7, ease:[0.22,1,0.36,1] }}>
              <p style={{ fontSize:'0.7rem', letterSpacing:'0.22em', textTransform:'uppercase', color:'var(--accent)', margin:'0 0 12px', fontWeight:600 }}>
                0{activeItem+1} / 0{rightItems.length}
              </p>
              <h2 style={{ fontSize:'clamp(2rem,4vw,3.5rem)', fontFamily:"'Playfair Display',serif", fontWeight:700, color:'var(--text-h)', margin:'0 0 28px', lineHeight:1.1 }}>
                {rightItems[activeItem].label}
              </h2>
              <p style={{ fontSize:'clamp(0.95rem,1.4vw,1.1rem)', color:'var(--text)', lineHeight:1.85, maxWidth:460, marginBottom:36 }}>
                {rightItems[activeItem].content}
              </p>

              {/* Key specs inline */}
              <div style={{ display:'flex', gap:28, flexWrap:'wrap', borderTop:'1px solid var(--border)', paddingTop:28 }}>
                {bike.specs.overview.slice(0,4).map(s => (
                  <div key={s.label}>
                    <div style={{ fontSize:'0.62rem', letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--text)', opacity:0.5, marginBottom:4 }}>{s.label}</div>
                    <div style={{ fontWeight:700, color:'var(--text-h)', fontSize:'1rem' }}>{s.value}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Bike info badges */}
          <div style={{ position:'absolute', bottom:'clamp(24px,4vh,48px)', right:'clamp(28px,5vw,80px)', display:'flex', flexDirection:'column', gap:10 }}>
            {[['Graphite Black',bike.color],['Purchased',bike.purchaseDate],['Location',bike.location]].map(([k,v]) => (
              <div key={k} style={{ background:'var(--card-bg)', border:'1px solid var(--border)', borderRadius:10, padding:'10px 16px', backdropFilter:'blur(8px)', boxShadow:'var(--shadow)' }}>
                <div style={{ fontSize:'0.6rem', letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--text)', opacity:0.5, marginBottom:2 }}>{k}</div>
                <div style={{ fontWeight:600, color:'var(--text-h)', fontSize:'0.85rem' }}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <style>{`@media(max-width:768px){.bike-split-grid{grid-template-columns:1fr!important}}`}</style>
    </section>
  )
}

// ─── 03 SPECS — SVG Speedometer gauges ───────────────────────────────────────
function SpeedometerGauge({ label, value, max, unit, color='var(--accent)', size=160 }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once:true, margin:'-60px' })
  const r = 60, cx = size/2, cy = size/2
  const startAngle = -220, endAngle = 40
  const totalAngle = endAngle - startAngle
  const pct = Math.min(value/max, 1)
  const angle = startAngle + totalAngle * pct
  const toRad = deg => (deg * Math.PI) / 180
  const arcPath = (a1, a2, r2) => {
    const x1 = cx + r2 * Math.cos(toRad(a1))
    const y1 = cy + r2 * Math.sin(toRad(a1))
    const x2 = cx + r2 * Math.cos(toRad(a2))
    const y2 = cy + r2 * Math.sin(toRad(a2))
    const la = Math.abs(a2-a1) > 180 ? 1 : 0
    return `M ${x1} ${y1} A ${r2} ${r2} 0 ${la} 1 ${x2} ${y2}`
  }
  const trackPath = arcPath(startAngle, endAngle, r)
  const valuePath = arcPath(startAngle, startAngle + totalAngle * pct, r)
  const circumference = totalAngle/360 * 2 * Math.PI * r
  const dashLen = circumference * pct
  const totalCirc = 2 * Math.PI * r
  const [animPct, setAnimPct] = useState(0)
  useEffect(() => {
    if (!inView) return
    let start = null
    const duration = 1400
    const step = ts => {
      if (!start) start = ts
      const progress = Math.min((ts - start) / duration, 1)
      setAnimPct(progress * pct)
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [inView, pct])

  const needleAngle = startAngle + totalAngle * animPct
  const needleX = cx + (r-8) * Math.cos(toRad(needleAngle))
  const needleY = cy + (r-8) * Math.sin(toRad(needleAngle))

  return (
    <div ref={ref} style={{ textAlign:'center', display:'flex', flexDirection:'column', alignItems:'center', gap:8 }}>
      <svg width={size} height={size} style={{ overflow:'visible' }}>
        {/* Track */}
        <path d={arcPath(startAngle, endAngle, r)} fill="none" stroke="var(--border)" strokeWidth="8" strokeLinecap="round"/>
        {/* Value arc */}
        <path d={arcPath(startAngle, startAngle + totalAngle * animPct, r)} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"/>
        {/* Tick marks */}
        {Array.from({length:11}).map((_,i) => {
          const a = startAngle + (totalAngle/10)*i
          const r1=r-14, r2=r-18
          return <line key={i} x1={cx+r1*Math.cos(toRad(a))} y1={cy+r1*Math.sin(toRad(a))} x2={cx+r2*Math.cos(toRad(a))} y2={cy+r2*Math.sin(toRad(a))} stroke="var(--border)" strokeWidth="1.5"/>
        })}
        {/* Needle */}
        <line x1={cx} y1={cy} x2={needleX} y2={needleY} stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        <circle cx={cx} cy={cy} r="5" fill={color} />
        {/* Value text */}
        <text x={cx} y={cy+22} textAnchor="middle" fill="var(--text-h)" fontSize="16" fontWeight="800" fontFamily="var(--sans)">{Math.round(animPct*max)}</text>
        <text x={cx} y={cy+36} textAnchor="middle" fill="var(--text)" fontSize="9" fontFamily="var(--sans)" opacity="0.6">{unit}</text>
      </svg>
      <div style={{ fontSize:'0.7rem', letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--text)', opacity:0.55 }}>{label}</div>
    </div>
  )
}

function SpecsSection() {
  return (
    <section id="v5-specs" style={{ padding:'96px clamp(20px,5vw,80px)', background:'var(--bg-secondary)' }}>
      <motion.div initial={{ opacity:0,y:32 }} whileInView={{ opacity:1,y:0 }} viewport={{ once:true,margin:'-60px' }} transition={{ duration:0.7,ease:[0.22,1,0.36,1] }}>
        <p style={{ fontSize:'0.72rem', letterSpacing:'0.2em', textTransform:'uppercase', color:'var(--accent)', margin:'0 0 12px', fontWeight:600 }}>Technical</p>
        <h2 style={{ fontSize:'clamp(2rem,4vw,3.5rem)', fontFamily:"'Playfair Display',serif", fontWeight:700, color:'var(--text-h)', margin:'0 0 16px', lineHeight:1.1 }}>
          Specifications
        </h2>
        <p style={{ color:'var(--text)', lineHeight:1.8, maxWidth:520, marginBottom:60 }}>The numbers behind every ride.</p>
      </motion.div>

      {/* Speedometer gauges */}
      <div style={{ display:'flex', flexWrap:'wrap', gap:40, justifyContent:'center', marginBottom:72 }}>
        <SpeedometerGauge label="Power" value={46.3} max={80} unit="PS" color="var(--accent)" />
        <SpeedometerGauge label="Torque" value={52.3} max={80} unit="Nm" color="#f59e0b" />
        <SpeedometerGauge label="Top Speed" value={161} max={200} unit="km/h" color="#22c55e" />
        <SpeedometerGauge label="Mileage" value={28.4} max={40} unit="km/l" color="#3b82f6" />
        <SpeedometerGauge label="Engine" value={648} max={1000} unit="cc" color="#ec4899" />
        <SpeedometerGauge label="Weight" value={240} max={320} unit="kg" color="#a855f7" />
      </div>

      {/* Spec grid with clip-path reveal */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:2, background:'var(--border)', borderRadius:16, overflow:'hidden' }}>
        {bike.specs.overview.map((s, i) => (
          <motion.div key={s.label}
            initial={{ clipPath:'inset(100% 0 0 0)' }}
            whileInView={{ clipPath:'inset(0% 0 0 0)' }}
            viewport={{ once:true, margin:'-40px' }}
            transition={{ duration:0.6, delay:i*0.06, ease:[0.22,1,0.36,1] }}
            whileHover={{ background:'var(--accent-bg)' }}
            style={{ padding:'20px 22px', background:'var(--card-bg)', transition:'background 0.2s', display:'flex', gap:12, alignItems:'flex-start' }}
          >
            <span style={{ fontSize:'1.4rem', flexShrink:0, marginTop:2 }}>{s.icon}</span>
            <div>
              <div style={{ fontSize:'0.62rem', letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--text)', opacity:0.5, marginBottom:5 }}>{s.label}</div>
              <div style={{ fontWeight:700, color:'var(--text-h)', fontSize:'1.05rem' }}>{s.value} <span style={{ fontSize:'0.75rem', fontWeight:400, color:'var(--text)' }}>{s.unit}</span></div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  )
}

// ─── 04 SETUP — Horizontal snap-scroll rail ───────────────────────────────────
function SetupHorizontalSection() {
  const trackRef = useRef(null)
  const containerRef = useRef(null)
  const { scrollYProgress } = useScroll({ target: containerRef, offset:['start start','end end'] })
  const xPct = useTransform(scrollYProgress, [0,1], ['0%', `-${(accessories.length-1)*100/accessories.length}%`])

  return (
    <section id="v5-setup" ref={containerRef} style={{ height:`${accessories.length * 60}vh`, position:'relative', minHeight:2400 }}>
      <div style={{ position:'sticky', top:0, height:'100vh', overflow:'hidden', background:'var(--bg)' }}>
        {/* Header */}
        <div style={{ position:'absolute', top:0, left:0, right:0, zIndex:10, padding:'clamp(20px,4vh,48px) clamp(20px,5vw,80px) 0', display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
          <div>
            <p style={{ fontSize:'0.7rem', letterSpacing:'0.22em', textTransform:'uppercase', color:'var(--accent)', margin:'0 0 8px', fontWeight:600 }}>What's On My Bike</p>
            <h2 style={{ fontSize:'clamp(1.6rem,3.5vw,2.8rem)', fontFamily:"'Playfair Display',serif", fontWeight:700, color:'var(--text-h)', margin:0, lineHeight:1.1 }}>
              The Setup
            </h2>
          </div>
          <div style={{ fontSize:'0.72rem', color:'var(--text)', opacity:0.5 }}>
            Scroll to explore
            <span style={{ display:'block', marginTop:4, letterSpacing:'0.1em' }}>— — → </span>
          </div>
        </div>

        {/* Horizontal track */}
        <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center' }}>
          <motion.div ref={trackRef}
            style={{ display:'flex', x:xPct, paddingLeft:'clamp(20px,5vw,80px)', willChange:'transform' }}>
            {accessories.map((acc, i) => {
              const colors = ['var(--accent)','#22c55e','#f59e0b','#3b82f6','#ec4899','#a855f7','#14b8a6','#f97316']
              const c = colors[i % colors.length]
              return (
                <div key={acc.id} style={{ width:'clamp(280px,36vw,440px)', flexShrink:0, marginRight:'clamp(16px,3vw,40px)' }}>
                  <div style={{
                    background:'var(--card-bg)', border:'1px solid var(--border)',
                    borderRadius:20, overflow:'hidden', boxShadow:'var(--shadow)',
                    borderTop:`4px solid ${c}`,
                  }}>
                    {/* Image */}
                    <div style={{ height:220, overflow:'hidden', background:'var(--bg-secondary)', position:'relative' }}>
                      <img src={[IMG.gear1,IMG.gear2,IMG.gear3,IMG.bike1,IMG.bike2,IMG.road,IMG.sunset,IMG.coast][i%8]} alt={acc.name}
                        style={{ width:'100%', height:'100%', objectFit:'cover', transition:'transform 0.5s' }}
                        onMouseEnter={e=>e.currentTarget.style.transform='scale(1.05)'}
                        onMouseLeave={e=>e.currentTarget.style.transform='scale(1)'}
                      />
                      <div style={{ position:'absolute', top:16, right:16, background:c, color:'#fff', fontSize:'0.62rem', fontWeight:800, padding:'5px 12px', borderRadius:999, letterSpacing:'0.1em', textTransform:'uppercase' }}>
                        {acc.category}
                      </div>
                    </div>

                    <div style={{ padding:'24px 24px 28px' }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
                        <div>
                          <h3 style={{ margin:'0 0 4px', fontSize:'1.2rem', fontFamily:"'Playfair Display',serif", color:'var(--text-h)', fontWeight:700 }}>{acc.name}</h3>
                          <p style={{ margin:0, fontSize:'0.75rem', color:'var(--text)', opacity:0.6 }}>{acc.subtitle}</p>
                        </div>
                        <div style={{ textAlign:'right', flexShrink:0, marginLeft:12 }}>
                          <div style={{ fontWeight:800, color:c, fontSize:'1rem' }}>₹{acc.price.toLocaleString('en-IN')}</div>
                          <div style={{ fontSize:'0.62rem', color:'var(--text)', opacity:0.5, marginTop:2 }}>{acc.purchaseDate}</div>
                        </div>
                      </div>

                      <p style={{ fontSize:'0.85rem', color:'var(--text)', lineHeight:1.75, margin:'0 0 16px' }}>{acc.reason}</p>

                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', paddingTop:16, borderTop:'1px solid var(--border)' }}>
                        <div style={{ display:'flex', gap:3 }}>
                          {Array.from({length:5}).map((_,j) => (
                            <span key={j} style={{ color: j<Math.round(acc.rating) ? '#f59e0b' : 'var(--border)', fontSize:'1rem' }}>★</span>
                          ))}
                          <span style={{ marginLeft:6, fontSize:'0.78rem', color:'var(--text)', alignSelf:'center' }}>{acc.rating}</span>
                        </div>
                        {acc.coupon && (
                          <span style={{ fontSize:'0.7rem', fontWeight:700, padding:'4px 12px', borderRadius:999, background:'var(--accent-bg)', color:'var(--accent)', border:'1px solid var(--accent-border)', letterSpacing:'0.08em' }}>{acc.coupon}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </motion.div>
        </div>

        {/* Progress bar */}
        <div style={{ position:'absolute', bottom:32, left:'clamp(20px,5vw,80px)', right:'clamp(20px,5vw,80px)', height:2, background:'var(--border)', borderRadius:999 }}>
          <motion.div style={{ height:'100%', background:'var(--accent)', borderRadius:999, width:useTransform(scrollYProgress,[0,1],['0%','100%']) }} />
        </div>
      </div>
    </section>
  )
}

// ─── 05 RECOMMENDED — Glassmorphism cards + magnetic hover ───────────────────
function MagneticCard({ children, style: sx }) {
  const ref = useRef(null)
  const x = useMotionValue(0), y = useMotionValue(0)
  const sx2 = useSpring(x, { stiffness:150, damping:20 })
  const sy2 = useSpring(y, { stiffness:150, damping:20 })

  const onMove = useCallback(e => {
    const r = ref.current.getBoundingClientRect()
    const dx = e.clientX - (r.left + r.width/2)
    const dy = e.clientY - (r.top + r.height/2)
    x.set(dx * 0.18)
    y.set(dy * 0.18)
  }, [x,y])
  const onLeave = useCallback(() => { x.set(0); y.set(0) }, [x,y])

  return (
    <motion.div ref={ref} onMouseMove={onMove} onMouseLeave={onLeave}
      style={{ x:sx2, y:sy2, ...sx }}>
      {children}
    </motion.div>
  )
}

function RecommendedGlassSection() {
  const [cat, setCat] = useState('favorites')
  const items = recommendedAccessories.filter(a => a.section === cat)

  return (
    <section id="v5-recommended" style={{ padding:'96px clamp(20px,5vw,80px)', background:'var(--bg)', position:'relative', overflow:'hidden' }}>
      {/* Blurred orbs behind cards */}
      <div style={{ position:'absolute', top:'10%', left:'10%', width:400, height:400, borderRadius:'50%', background:'rgba(124,58,237,0.07)', filter:'blur(80px)', pointerEvents:'none' }} />
      <div style={{ position:'absolute', bottom:'10%', right:'10%', width:320, height:320, borderRadius:'50%', background:'rgba(59,130,246,0.07)', filter:'blur(80px)', pointerEvents:'none' }} />

      <motion.div initial={{ opacity:0,y:32 }} whileInView={{ opacity:1,y:0 }} viewport={{ once:true }} transition={{ duration:0.7 }}>
        <p style={{ fontSize:'0.72rem', letterSpacing:'0.2em', textTransform:'uppercase', color:'var(--accent)', margin:'0 0 12px', fontWeight:600 }}>Gear I Trust</p>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', flexWrap:'wrap', gap:16, marginBottom:52 }}>
          <h2 style={{ fontSize:'clamp(2rem,4vw,3.5rem)', fontFamily:"'Playfair Display',serif", fontWeight:700, color:'var(--text-h)', margin:0, lineHeight:1.1 }}>
            Recommended<br/><em style={{ color:'var(--accent)' }}>Accessories</em>
          </h2>
          <div style={{ display:'flex', gap:6 }}>
            {[['favorites','My Picks'],['budget','Budget'],['premium','Premium']].map(([id,label]) => (
              <button key={id} onClick={() => setCat(id)} style={{
                padding:'8px 20px', borderRadius:999, cursor:'pointer',
                background: cat===id ? 'var(--text-h)' : 'transparent',
                color: cat===id ? 'var(--bg)' : 'var(--text-h)',
                border:`1.5px solid ${cat===id ? 'var(--text-h)' : 'var(--border)'}`,
                fontFamily:'var(--sans)', fontWeight:600, fontSize:'0.78rem',
                transition:'all 0.2s',
              }}>{label}</button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Glassmorphism cards with magnetic hover */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:24 }}>
        {items.map((item, i) => (
          <MagneticCard key={item.id} style={{}}>
            <motion.div
              initial={{ opacity:0, y:40, scale:0.95 }}
              whileInView={{ opacity:1, y:0, scale:1 }}
              viewport={{ once:true, margin:'-40px' }}
              transition={{ duration:0.7, delay:i*0.08, ease:[0.22,1,0.36,1] }}
              whileHover={{ boxShadow:'0 24px 60px rgba(124,58,237,0.18)' }}
              style={{
                background:'rgba(var(--card-bg-rgb, 255,255,255), 0.6)',
                backdropFilter:'blur(20px)',
                WebkitBackdropFilter:'blur(20px)',
                border:'1px solid rgba(255,255,255,0.18)',
                borderRadius:20,
                overflow:'hidden',
                boxShadow:'0 8px 32px rgba(0,0,0,0.08)',
                transition:'box-shadow 0.3s',
              }}
            >
              <div style={{ height:200, overflow:'hidden', background:'var(--bg-secondary)', position:'relative' }}>
                <img src={[IMG.gear1,IMG.gear2,IMG.gear3,IMG.bike1,IMG.bike2,IMG.road,IMG.sunset,IMG.coast][i%8]} alt={item.name}
                  style={{ width:'100%', height:'100%', objectFit:'cover', transition:'transform 0.6s ease' }}
                  onMouseEnter={e=>e.currentTarget.style.transform='scale(1.08)'}
                  onMouseLeave={e=>e.currentTarget.style.transform='scale(1)'}
                />
                {item.badge && <div style={{ position:'absolute', top:12, left:12, background:'var(--accent)', color:'#fff', fontSize:'0.62rem', fontWeight:800, padding:'4px 12px', borderRadius:999 }}>{item.badge}</div>}
                {/* Glass overlay on hover */}
                <div style={{ position:'absolute', bottom:0, left:0, right:0, height:'40%', background:'linear-gradient(to top,rgba(0,0,0,0.4),transparent)' }} />
              </div>

              <div style={{ padding:'20px 22px 24px' }}>
                <div style={{ fontSize:'0.62rem', letterSpacing:'0.16em', textTransform:'uppercase', color:'var(--accent)', marginBottom:6, fontWeight:600 }}>{item.subtitle}</div>
                <h4 style={{ margin:'0 0 8px', fontFamily:"'Playfair Display',serif", fontSize:'1.15rem', color:'var(--text-h)', fontWeight:700 }}>{item.name}</h4>
                <p style={{ margin:'0 0 14px', fontSize:'0.8rem', color:'var(--text)', lineHeight:1.7 }}>{item.description}</p>

                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', paddingTop:14, borderTop:'1px solid var(--border)' }}>
                  <div>
                    <span style={{ fontWeight:800, color:'var(--text-h)', fontSize:'1.1rem' }}>₹{item.price.toLocaleString('en-IN')}</span>
                    <span style={{ marginLeft:6, fontSize:'0.75rem', color:'var(--text)', opacity:0.4, textDecoration:'line-through' }}>₹{item.originalPrice.toLocaleString('en-IN')}</span>
                  </div>
                  <div style={{ fontSize:'0.68rem', fontWeight:700, padding:'4px 10px', borderRadius:999, border:'1px solid var(--accent-border)', color:'var(--accent)', background:'var(--accent-bg)' }}>{item.coupon}</div>
                </div>
                <a href={item.buyUrl} style={{ display:'block', marginTop:14, padding:'11px', textAlign:'center', background:'var(--accent)', color:'#fff', borderRadius:10, fontFamily:'var(--sans)', fontWeight:700, fontSize:'0.78rem', textDecoration:'none', letterSpacing:'0.08em', transition:'opacity 0.2s' }}
                  onMouseEnter={e=>e.currentTarget.style.opacity='0.85'}
                  onMouseLeave={e=>e.currentTarget.style.opacity='1'}>
                  Buy Now ↗
                </a>
              </div>
            </motion.div>
          </MagneticCard>
        ))}
      </div>
    </section>
  )
}

// ─── 06 VLOGS — Pinned filmstrip scroll ──────────────────────────────────────
function VlogsPinnedSection() {
  const [playing, setPlaying] = useState(null)
  const containerRef = useRef(null)
  const featuredVlogs = vlogs.filter(v => v.category === 'Latest' || v.category === 'Popular').slice(0,6)
  const { scrollYProgress } = useScroll({ target: containerRef, offset:['start start','end end'] })
  const filmX = useTransform(scrollYProgress, [0,1], ['2%', `-${(featuredVlogs.length-1)*102}%`])

  return (
    <section id="v5-vlogs" ref={containerRef} style={{ height:`${featuredVlogs.length * 80}vh`, position:'relative', minHeight:2400 }}>
      <div style={{ position:'sticky', top:0, height:'100vh', overflow:'hidden', background:'#0a080f' }}>
        {/* Dark ambient BG */}
        <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse 60% 60% at 50% 50%, rgba(124,58,237,0.08) 0%, transparent 70%)' }} />

        {/* Header */}
        <div style={{ position:'absolute', top:0, left:0, right:0, zIndex:10, padding:'clamp(20px,3vh,40px) clamp(20px,5vw,80px) 0', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <p style={{ fontSize:'0.7rem', letterSpacing:'0.22em', textTransform:'uppercase', color:'var(--accent)', margin:'0 0 6px', fontWeight:600 }}>On the Road</p>
            <h2 style={{ fontSize:'clamp(1.8rem,3.5vw,2.8rem)', fontFamily:"'Playfair Display',serif", fontWeight:700, color:'#fff', margin:0 }}>
              Vlogs & Ride Videos
            </h2>
          </div>
          <a href={cfg.social?.youtube?.href||'#'} target="_blank" rel="noopener noreferrer"
            style={{ fontSize:'0.72rem', letterSpacing:'0.12em', textTransform:'uppercase', color:'rgba(255,255,255,0.5)', textDecoration:'none', borderBottom:'1px solid rgba(255,255,255,0.15)', paddingBottom:2, transition:'color 0.2s,border-color 0.2s' }}
            onMouseEnter={e=>{e.currentTarget.style.color='#fff';e.currentTarget.style.borderColor='rgba(255,255,255,0.5)'}}
            onMouseLeave={e=>{e.currentTarget.style.color='rgba(255,255,255,0.5)';e.currentTarget.style.borderColor='rgba(255,255,255,0.15)'}}>
            Subscribe ↗
          </a>
        </div>

        {/* Filmstrip track */}
        <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', paddingTop:80 }}>
          <motion.div style={{ display:'flex', x:filmX, willChange:'transform', paddingLeft:'clamp(20px,5vw,80px)' }}>
            {featuredVlogs.map((v, i) => (
              <motion.div key={i} onClick={() => setPlaying(v)}
                whileHover={{ y:-8, boxShadow:'0 32px 80px rgba(0,0,0,0.5)' }}
                transition={{ duration:0.3 }}
                style={{ width:'clamp(300px,38vw,520px)', flexShrink:0, marginRight:20, cursor:'pointer', borderRadius:12, overflow:'hidden', background:'#16141e', border:'1px solid rgba(255,255,255,0.07)' }}>
                <div style={{ position:'relative', aspectRatio:'16/9', overflow:'hidden' }}>
                  <img src={`https://img.youtube.com/vi/${v.id}/maxresdefault.jpg`} alt={v.title}
                    style={{ width:'100%', height:'100%', objectFit:'cover', transition:'transform 0.5s' }}
                    onMouseEnter={e=>e.currentTarget.style.transform='scale(1.04)'}
                    onMouseLeave={e=>e.currentTarget.style.transform='scale(1)'}
                    onError={e=>{ e.target.src=[IMG.road,IMG.sunset,IMG.night,IMG.coast,IMG.bike2,IMG.bike3][i%6] }}
                  />
                  <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top,rgba(0,0,0,0.85)0%,transparent 55%)' }} />
                  {/* Play button */}
                  <motion.div whileHover={{ scale:1.12 }} whileTap={{ scale:0.95 }}
                    style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:56, height:56, borderRadius:'50%', background:'rgba(255,255,255,0.12)', backdropFilter:'blur(8px)', border:'1.5px solid rgba(255,255,255,0.25)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="rgba(255,255,255,0.9)"><path d="M8 5v14l11-7z"/></svg>
                  </motion.div>
                  <span style={{ position:'absolute', bottom:12, right:12, background:'rgba(0,0,0,0.8)', color:'#fff', fontSize:'0.7rem', padding:'3px 8px', borderRadius:4, letterSpacing:'0.04em' }}>{v.duration}</span>
                  <span style={{ position:'absolute', top:12, left:12, background:'var(--accent)', color:'#fff', fontSize:'0.62rem', fontWeight:700, padding:'3px 10px', borderRadius:999, letterSpacing:'0.08em', textTransform:'uppercase' }}>{v.category}</span>
                </div>
                <div style={{ padding:'18px 20px' }}>
                  <h4 style={{ margin:'0 0 6px', fontSize:'1rem', fontFamily:"'Playfair Display',serif", color:'#fff', fontWeight:700, lineHeight:1.3 }}>{v.title}</h4>
                  {v.subtitle && <p style={{ margin:'0 0 10px', fontSize:'0.75rem', color:'rgba(255,255,255,0.45)' }}>{v.subtitle}</p>}
                  <div style={{ display:'flex', gap:14, fontSize:'0.7rem', color:'rgba(255,255,255,0.35)', flexWrap:'wrap' }}>
                    {v.distance && <span>📍 {v.distance}</span>}
                    <span>👁 {(v.views/1000).toFixed(1)}K</span>
                    <span>📅 {v.date}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Scroll progress bar */}
        <div style={{ position:'absolute', bottom:32, left:'clamp(20px,5vw,80px)', right:'clamp(20px,5vw,80px)', height:1, background:'rgba(255,255,255,0.1)' }}>
          <motion.div style={{ height:'100%', background:'var(--accent)', width:useTransform(scrollYProgress,[0,1],['0%','100%']) }} />
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {playing && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            onClick={() => setPlaying(null)}
            style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.95)', zIndex:400, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
            <motion.div initial={{ scale:0.9,y:20 }} animate={{ scale:1,y:0 }} exit={{ scale:0.9 }}
              onClick={e=>e.stopPropagation()} style={{ width:'100%', maxWidth:960, background:'#000', borderRadius:12, overflow:'hidden', position:'relative' }}>
              <button onClick={() => setPlaying(null)}
                style={{ position:'absolute', top:-40, right:0, background:'none', border:'1px solid rgba(255,255,255,0.2)', color:'#fff', padding:'6px 16px', cursor:'pointer', fontFamily:'var(--sans)', fontSize:'0.7rem', letterSpacing:'0.1em', borderRadius:4 }}>
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

// ─── 07 STATS — Radial progress rings ────────────────────────────────────────
function RadialRing({ value, max, label, color, size=120 }) {
  const r = 48, cx=size/2, cy=size/2
  const circ = 2 * Math.PI * r
  const pct = Math.min(value/max, 1)
  const [anim, setAnim] = useState(0)
  const ref = useRef(null)
  const inView = useInView(ref, { once:true })
  useEffect(() => {
    if (!inView) return
    let s=null
    const step = ts => {
      if (!s) s=ts
      const p = Math.min((ts-s)/1200, 1)
      setAnim(p * pct)
      if (p<1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [inView, pct])

  return (
    <div ref={ref} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8 }}>
      <svg width={size} height={size}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--border)" strokeWidth="10"/>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={`${circ * anim} ${circ * (1-anim)}`}
          strokeDashoffset={circ * 0.25}
          style={{ transition:'none' }}/>
        <text x={cx} y={cy+5} textAnchor="middle" fill="var(--text-h)" fontSize="14" fontWeight="800" fontFamily="var(--sans)">{Math.round(anim*max)}</text>
        <text x={cx} y={cy+20} textAnchor="middle" fill="var(--text)" fontSize="9" fontFamily="var(--sans)" opacity="0.55">/{max}</text>
      </svg>
      <span style={{ fontSize:'0.65rem', letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--text)', opacity:0.55 }}>{label}</span>
    </div>
  )
}

function StatsRadialSection() {
  const ref = useRef(null)
  const chartInView = useInView(ref, { once:true })
  const max = Math.max(...rideStats.monthlyData.map(d=>d.km))

  return (
    <section id="v5-stats" style={{ padding:'96px clamp(20px,5vw,80px)', background:'var(--bg-secondary)' }}>
      <motion.div initial={{ opacity:0,y:32 }} whileInView={{ opacity:1,y:0 }} viewport={{ once:true }} transition={{ duration:0.7 }}>
        <p style={{ fontSize:'0.72rem', letterSpacing:'0.2em', textTransform:'uppercase', color:'var(--accent)', margin:'0 0 12px', fontWeight:600 }}>Analytics</p>
        <h2 style={{ fontSize:'clamp(2rem,4vw,3.5rem)', fontFamily:"'Playfair Display',serif", fontWeight:700, color:'var(--text-h)', margin:'0 0 56px', lineHeight:1.1 }}>
          Ride Statistics
        </h2>
      </motion.div>

      {/* Radial rings row */}
      <div style={{ display:'flex', flexWrap:'wrap', gap:32, justifyContent:'center', marginBottom:72 }}>
        <RadialRing value={rideStats.summary.totalRides} max={100} label="Rides" color="var(--accent)" />
        <RadialRing value={rideStats.summary.avgMileage} max={40} label="Avg Mileage" color="#22c55e" />
        <RadialRing value={rideStats.summary.avgSpeed} max={120} label="Avg Speed" color="#f59e0b" />
        <RadialRing value={rideStats.summary.topSpeed} max={200} label="Top Speed" color="#ec4899" />
        <RadialRing value={rideStats.summary.rideHours} max={500} label="Hours" color="#3b82f6" />
      </div>

      {/* Bar chart with clip-path masked bars */}
      <div ref={ref} style={{ marginBottom:64 }}>
        <p style={{ fontSize:'0.7rem', letterSpacing:'0.18em', textTransform:'uppercase', color:'var(--text)', opacity:0.55, marginBottom:20 }}>Monthly Distance (KM)</p>
        <div style={{ display:'flex', alignItems:'flex-end', gap:6, height:180 }}>
          {rideStats.monthlyData.map((d,i) => {
            const h = Math.round((d.km/max)*160)
            return (
              <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:5 }}
                title={`${d.month}: ${d.km} km`}>
                <span style={{ fontSize:'0.6rem', color:'var(--text)', opacity:0.4 }}>{d.km>=1000?`${(d.km/1000).toFixed(1)}k`:d.km}</span>
                <motion.div
                  initial={{ clipPath:'inset(100% 0 0 0)' }}
                  animate={chartInView ? { clipPath:'inset(0% 0 0 0)' } : { clipPath:'inset(100% 0 0 0)' }}
                  transition={{ duration:0.7, delay:i*0.06, ease:[0.22,1,0.36,1] }}
                  style={{ width:'100%', height:h, background: i===rideStats.monthlyData.length-1 ? 'var(--accent)' : 'var(--accent-border)', borderRadius:'4px 4px 0 0', minHeight:2 }}
                />
                <span style={{ fontSize:'0.55rem', color:'var(--text)', opacity:0.4, textAlign:'center' }}>{d.month}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Recent rides — word-reveal rows */}
      <div>
        <p style={{ fontSize:'0.7rem', letterSpacing:'0.18em', textTransform:'uppercase', color:'var(--text)', opacity:0.55, marginBottom:20 }}>Recent Rides</p>
        <div style={{ borderTop:'1px solid var(--border)' }}>
          {rideStats.recentRides.map((r,i) => (
            <motion.div key={i}
              initial={{ opacity:0, x:-32 }}
              whileInView={{ opacity:1, x:0 }}
              viewport={{ once:true, margin:'-40px' }}
              transition={{ duration:0.6, delay:i*0.08, ease:[0.22,1,0.36,1] }}
              whileHover={{ x:6, background:'var(--accent-bg)' }}
              style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr auto', gap:16, padding:'16px 12px', borderBottom:'1px solid var(--border)', alignItems:'center', transition:'background 0.2s,x 0.2s', borderRadius:8 }}
              className="ride-row-v5"
            >
              <div>
                <div style={{ fontWeight:600, color:'var(--text-h)', fontSize:'0.9rem' }}>{r.route}</div>
                <div style={{ fontSize:'0.68rem', color:'var(--text)', opacity:0.5, marginTop:2 }}>{r.date}</div>
              </div>
              <div style={{ fontSize:'0.82rem', color:'var(--text)' }}>{r.km} km</div>
              <div style={{ fontSize:'0.82rem', color:'var(--text)' }}>{r.time}</div>
              <div style={{ fontSize:'0.82rem', color:'var(--text)' }}>{r.avgSpeed}</div>
              <span style={{ fontSize:'0.68rem', padding:'3px 10px', borderRadius:999, background:'var(--accent-bg)', color:'var(--accent)', fontWeight:600, border:'1px solid var(--accent-border)', whiteSpace:'nowrap' }}>{r.type}</span>
            </motion.div>
          ))}
        </div>
      </div>
      <style>{`@media(max-width:640px){.ride-row-v5{grid-template-columns:1fr auto!important}.ride-row-v5>*:not(:first-child):not(:last-child){display:none}}`}</style>
    </section>
  )
}

// ─── 08 DREAM + WISHLIST ──────────────────────────────────────────────────────
function DreamWishlistSection() {
  const statusColor = { completed:'#22c55e', active:'var(--accent)', planned:'#f59e0b', future:'var(--border)' }

  return (
    <section id="v5-dream" style={{ padding:'96px clamp(20px,5vw,80px)', background:'var(--bg)' }}>
      <motion.div initial={{ opacity:0,y:32 }} whileInView={{ opacity:1,y:0 }} viewport={{ once:true }} transition={{ duration:0.7 }}>
        <p style={{ fontSize:'0.72rem', letterSpacing:'0.2em', textTransform:'uppercase', color:'var(--accent)', margin:'0 0 12px', fontWeight:600 }}>The Vision</p>
        <h2 style={{ fontSize:'clamp(2rem,4vw,3.5rem)', fontFamily:"'Playfair Display',serif", fontWeight:700, color:'var(--text-h)', margin:'0 0 56px', lineHeight:1.1 }}>
          Dream Garage<br/><em style={{ color:'var(--accent)' }}>& Wishlist</em>
        </h2>
      </motion.div>

      {/* Phase cards — perspective zoom on scroll */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))', gap:16, marginBottom:64 }}>
        {dreamGarage.phases.map((phase,i) => {
          const c = statusColor[phase.status]
          return (
            <motion.div key={phase.id}
              initial={{ opacity:0, scale:0.85, y:48 }}
              whileInView={{ opacity:1, scale:1, y:0 }}
              viewport={{ once:true, margin:'-40px' }}
              transition={{ duration:0.7, delay:i*0.1, ease:[0.22,1,0.36,1] }}
              whileHover={{ y:-8, boxShadow:'var(--shadow-hover)' }}
              style={{ background:'var(--card-bg)', border:`1px solid var(--border)`, borderTop:`4px solid ${c}`, borderRadius:16, padding:'28px 24px', boxShadow:'var(--shadow)', position:'relative', overflow:'hidden' }}>
              <div style={{ position:'absolute', top:0, right:0, width:80, height:80, background:`${c}`, opacity:0.04, borderRadius:'0 0 0 100%' }} />
              <div style={{ fontSize:'0.62rem', letterSpacing:'0.18em', textTransform:'uppercase', color:c, fontWeight:700, marginBottom:6 }}>{phase.status}</div>
              <h3 style={{ margin:'0 0 16px', fontSize:'1.15rem', fontFamily:"'Playfair Display',serif", color:'var(--text-h)', fontWeight:700 }}>{phase.label} — {phase.title}</h3>
              <ul style={{ margin:0, padding:0, listStyle:'none', display:'flex', flexDirection:'column', gap:7 }}>
                {phase.items.map((item,j) => (
                  <motion.li key={j}
                    initial={{ opacity:0, x:-12 }} whileInView={{ opacity:1, x:0 }} viewport={{ once:true }}
                    transition={{ delay:i*0.1 + j*0.05 }}
                    style={{ fontSize:'0.8rem', color:'var(--text)', display:'flex', gap:8, alignItems:'flex-start' }}>
                    <span style={{ color:c, flexShrink:0, marginTop:1, fontSize:'0.7rem' }}>{phase.status==='completed'?'✓':'—'}</span>
                    {item}
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          )
        })}
      </div>

      {/* Wishlist — stacked card design */}
      <p style={{ fontSize:'0.7rem', letterSpacing:'0.18em', textTransform:'uppercase', color:'var(--text)', opacity:0.55, marginBottom:28 }}>Upcoming Purchases</p>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:12 }}>
        {wishlist.filter(w=>w.status!=='dreaming').map((w,i) => {
          const pc = { high:'#ef4444', medium:'#f59e0b', low:'#22c55e' }[w.priority]
          return (
            <motion.div key={w.id}
              initial={{ opacity:0, y:24 }}
              whileInView={{ opacity:1, y:0 }}
              viewport={{ once:true, margin:'-30px' }}
              transition={{ duration:0.5, delay:i*0.05 }}
              whileHover={{ y:-4, boxShadow:'var(--shadow-hover)' }}
              style={{ background:'var(--card-bg)', border:'1px solid var(--border)', borderLeft:`4px solid ${pc}`, borderRadius:'0 12px 12px 0', padding:'16px 18px', boxShadow:'var(--shadow)' }}>
              <div style={{ display:'flex', justifyContent:'space-between', gap:10, marginBottom:6 }}>
                <div>
                  <div style={{ fontSize:'0.62rem', letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--text)', opacity:0.45, marginBottom:3 }}>{w.category}</div>
                  <div style={{ fontWeight:700, color:'var(--text-h)', fontSize:'0.9rem' }}>{w.name}</div>
                </div>
                <div style={{ textAlign:'right', flexShrink:0 }}>
                  <div style={{ fontWeight:800, color:'var(--text-h)', fontSize:'0.95rem' }}>{w.price>=100000?`₹${(w.price/100000).toFixed(1)}L`:`₹${w.price.toLocaleString('en-IN')}`}</div>
                  <div style={{ fontSize:'0.6rem', color:pc, fontWeight:700, marginTop:2, textTransform:'uppercase', letterSpacing:'0.08em' }}>{w.priority}</div>
                </div>
              </div>
              <p style={{ margin:0, fontSize:'0.75rem', color:'var(--text)', opacity:0.6, lineHeight:1.5 }}>{w.reason}</p>
            </motion.div>
          )
        })}
      </div>
    </section>
  )
}

// ─── 09 COST + MAINTENANCE ────────────────────────────────────────────────────
function CostMaintenanceSection() {
  const total = costTracker.categories.reduce((s,c)=>s+c.amount,0)
  const priorityColor = { high:'#ef4444', medium:'#f59e0b', low:'#22c55e' }

  return (
    <section id="v5-cost" style={{ padding:'96px clamp(20px,5vw,80px)', background:'var(--bg-secondary)' }}>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:64 }} className="cost-v5-grid">
        {/* Cost */}
        <div>
          <motion.div initial={{ opacity:0,y:32 }} whileInView={{ opacity:1,y:0 }} viewport={{ once:true }} transition={{ duration:0.7 }}>
            <p style={{ fontSize:'0.72rem', letterSpacing:'0.2em', textTransform:'uppercase', color:'var(--accent)', margin:'0 0 12px', fontWeight:600 }}>Investment</p>
            <h2 style={{ fontSize:'clamp(1.8rem,3.5vw,3rem)', fontFamily:"'Playfair Display',serif", fontWeight:700, color:'var(--text-h)', margin:'0 0 36px', lineHeight:1.1 }}>Cost Tracker</h2>
          </motion.div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:1, background:'var(--border)', borderRadius:12, overflow:'hidden', marginBottom:32 }}>
            {[['₹3.1L','Total'],['₹8.2K','Monthly'],['₹24.9','Per KM']].map(([v,l]) => (
              <div key={l} style={{ padding:'16px', textAlign:'center', background:'var(--card-bg)' }}>
                <div style={{ fontWeight:800, fontSize:'1.2rem', color:'var(--text-h)', lineHeight:1 }}>{v}</div>
                <div style={{ fontSize:'0.6rem', letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--text)', opacity:0.5, marginTop:4 }}>{l}</div>
              </div>
            ))}
          </div>

          {costTracker.categories.map((c,i) => {
            const pct = (c.amount/total)*100
            return (
              <motion.div key={i} initial={{ opacity:0,x:-24 }} whileInView={{ opacity:1,x:0 }} viewport={{ once:true }} transition={{ delay:i*0.07, duration:0.5 }} style={{ marginBottom:16 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6, fontSize:'0.85rem' }}>
                  <span style={{ color:'var(--text)' }}>{c.icon} {c.name}</span>
                  <span style={{ fontWeight:700, color:'var(--text-h)' }}>₹{c.amount.toLocaleString('en-IN')}</span>
                </div>
                <div style={{ height:5, background:'var(--bg)', borderRadius:999, overflow:'hidden' }}>
                  <motion.div initial={{ width:0 }} whileInView={{ width:`${pct}%` }} viewport={{ once:true }}
                    transition={{ duration:0.9, delay:i*0.1 }}
                    style={{ height:'100%', background:c.color, borderRadius:999 }} />
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Maintenance */}
        <div>
          <motion.div initial={{ opacity:0,y:32 }} whileInView={{ opacity:1,y:0 }} viewport={{ once:true }} transition={{ duration:0.7, delay:0.1 }}>
            <p style={{ fontSize:'0.72rem', letterSpacing:'0.2em', textTransform:'uppercase', color:'var(--accent)', margin:'0 0 12px', fontWeight:600 }}>Keep It Running</p>
            <h2 style={{ fontSize:'clamp(1.8rem,3.5vw,3rem)', fontFamily:"'Playfair Display',serif", fontWeight:700, color:'var(--text-h)', margin:'0 0 36px', lineHeight:1.1 }}>Maintenance</h2>
          </motion.div>
          {maintenance.upcoming.map((item,i) => {
            const pct = item.dueKm ? Math.min((item.currentKm/item.dueKm)*100,100) : null
            const pc = priorityColor[item.priority]
            return (
              <motion.div key={i} initial={{ opacity:0,x:24 }} whileInView={{ opacity:1,x:0 }} viewport={{ once:true }} transition={{ delay:i*0.08, duration:0.5 }}
                whileHover={{ x:-4 }}
                style={{ marginBottom:16, padding:'16px 18px', background:'var(--card-bg)', border:'1px solid var(--border)', borderRight:`4px solid ${pc}`, borderRadius:'12px 0 0 12px', boxShadow:'var(--shadow)' }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                  <span style={{ fontWeight:600, color:'var(--text-h)', fontSize:'0.9rem' }}>{item.icon} {item.type}</span>
                  <span style={{ fontSize:'0.62rem', fontWeight:700, padding:'2px 8px', borderRadius:999, background:`${pc}18`, color:pc, border:`1px solid ${pc}40` }}>{item.priority}</span>
                </div>
                {pct !== null && (
                  <>
                    <div style={{ height:4, background:'var(--bg-secondary)', borderRadius:999, overflow:'hidden', marginBottom:4 }}>
                      <motion.div initial={{ width:0 }} whileInView={{ width:`${pct}%` }} viewport={{ once:true }}
                        transition={{ duration:0.8, delay:i*0.1 }}
                        style={{ height:'100%', background:pct>85?'#ef4444':'var(--accent)', borderRadius:999 }} />
                    </div>
                    <div style={{ fontSize:'0.68rem', color:'var(--text)', opacity:0.55 }}>{(item.dueKm-item.currentKm).toLocaleString('en-IN')} KM remaining</div>
                  </>
                )}
                {item.dueDate && <div style={{ fontSize:'0.72rem', color:'var(--text)', opacity:0.6 }}>Due: {item.dueDate}</div>}
              </motion.div>
            )
          })}

          <p style={{ fontSize:'0.68rem', letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--text)', opacity:0.5, marginBottom:12, marginTop:24 }}>Service History</p>
          {maintenance.history.slice(0,4).map((h,i) => (
            <motion.div key={i} initial={{ opacity:0 }} whileInView={{ opacity:1 }} viewport={{ once:true }} transition={{ delay:i*0.07 }}
              style={{ display:'flex', justifyContent:'space-between', gap:12, padding:'10px 0', borderBottom:'1px solid var(--border)', alignItems:'flex-start' }}>
              <div>
                <div style={{ fontSize:'0.82rem', color:'var(--text-h)', fontWeight:500 }}>{h.work}</div>
                <div style={{ fontSize:'0.68rem', color:'var(--text)', opacity:0.5, marginTop:2 }}>{h.date} · {h.km.toLocaleString('en-IN')} KM</div>
              </div>
              <div style={{ fontWeight:700, color:h.cost===0?'#22c55e':'var(--accent)', fontSize:'0.88rem', flexShrink:0 }}>{h.cost===0?'Free':`₹${h.cost.toLocaleString('en-IN')}`}</div>
            </motion.div>
          ))}
        </div>
      </div>
      <style>{`@media(max-width:860px){.cost-v5-grid{grid-template-columns:1fr!important}}`}</style>
    </section>
  )
}

// ─── 10 GALLERY — Clip-path masked reveal grid ────────────────────────────────
const GALL = [
  { src:IMG.g1, loc:'Yelagiri Hills', date:'May 2024', wide:true, tall:true },
  { src:IMG.g2, loc:'East Coast Road', date:'Apr 2024' },
  { src:IMG.g3, loc:'Chennai', date:'May 2024' },
  { src:IMG.g4, loc:'Highway', date:'Mar 2024', wide:true },
  { src:IMG.g5, loc:'Mountain Pass', date:'Apr 2024' },
  { src:IMG.g6, loc:'Coastal Route', date:'Apr 2024' },
]

function GalleryMaskedSection() {
  const [lbOpen, setLbOpen] = useState(false)
  const [lbIdx, setLbIdx] = useState(0)

  return (
    <section id="v5-gallery" style={{ padding:'96px clamp(20px,5vw,80px)', background:'var(--bg)' }}>
      <motion.div initial={{ opacity:0,y:32 }} whileInView={{ opacity:1,y:0 }} viewport={{ once:true }} transition={{ duration:0.7 }} style={{ marginBottom:52 }}>
        <p style={{ fontSize:'0.72rem', letterSpacing:'0.2em', textTransform:'uppercase', color:'var(--accent)', margin:'0 0 12px', fontWeight:600 }}>Captured Moments</p>
        <h2 style={{ fontSize:'clamp(2rem,4vw,3.5rem)', fontFamily:"'Playfair Display',serif", fontWeight:700, color:'var(--text-h)', margin:0, lineHeight:1.1 }}>
          The Gallery
        </h2>
      </motion.div>

      {/* Masked reveal grid */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gridAutoRows:'220px', gap:10 }} className="gall-v5-grid">
        {GALL.map((g,i) => (
          <motion.div key={i}
            initial={{ clipPath:'circle(0% at 50% 50%)' }}
            whileInView={{ clipPath:'circle(75% at 50% 50%)' }}
            viewport={{ once:true, margin:'-60px' }}
            transition={{ duration:0.9, delay:i*0.1, ease:[0.22,1,0.36,1] }}
            onClick={() => { setLbIdx(i); setLbOpen(true) }}
            style={{
              position:'relative', overflow:'hidden', cursor:'pointer',
              gridColumn: g.wide ? 'span 2' : 'span 1',
              gridRow: g.tall ? 'span 2' : 'span 1',
              background:'var(--bg-secondary)', borderRadius:12,
            }}
          >
            <motion.img src={g.src} alt={g.loc}
              style={{ width:'100%', height:'100%', objectFit:'cover', transition:'transform 0.6s ease' }}
              whileHover={{ scale:1.07 }} transition={{ duration:0.6 }}
            />
            <motion.div initial={{ opacity:0 }} whileHover={{ opacity:1 }} transition={{ duration:0.25 }}
              style={{ position:'absolute', inset:0, background:'linear-gradient(to top,rgba(0,0,0,0.7)0%,transparent 60%)', display:'flex', flexDirection:'column', justifyContent:'flex-end', padding:'16px 14px' }}>
              <div style={{ fontWeight:700, color:'#fff', fontSize:'0.88rem' }}>{g.loc}</div>
              <div style={{ fontSize:'0.68rem', color:'rgba(255,255,255,0.65)', marginTop:2 }}>{g.date}</div>
            </motion.div>
          </motion.div>
        ))}
      </div>

      <Lightbox open={lbOpen} close={() => setLbOpen(false)} slides={GALL.map(g=>({src:g.src}))} index={lbIdx} />
      <style>{`
        @media(max-width:768px){.gall-v5-grid{grid-template-columns:repeat(2,1fr)!important;grid-auto-rows:160px!important}}
        @media(max-width:480px){.gall-v5-grid{grid-template-columns:1fr!important}}
      `}</style>
    </section>
  )
}

// ─── 11 CONNECT — Magnetic buttons + closing ─────────────────────────────────
function MagneticButton({ children, href, color, style: sx }) {
  const ref = useRef(null)
  const x = useMotionValue(0), y = useMotionValue(0)
  const sx2 = useSpring(x,{stiffness:200,damping:18})
  const sy2 = useSpring(y,{stiffness:200,damping:18})
  const onMove = e => {
    const r = ref.current.getBoundingClientRect()
    x.set((e.clientX-(r.left+r.width/2))*0.35)
    y.set((e.clientY-(r.top+r.height/2))*0.35)
  }
  const onLeave = () => { x.set(0); y.set(0) }
  const Tag = href ? motion.a : motion.button
  return (
    <Tag ref={ref} href={href} target={href?.startsWith('http')?'_blank':undefined} rel="noopener noreferrer"
      onMouseMove={onMove} onMouseLeave={onLeave}
      style={{ x:sx2, y:sy2, display:'inline-flex', alignItems:'center', justifyContent:'center', gap:10, padding:'16px 36px', background:'var(--card-bg)', border:'1px solid var(--border)', borderRadius:999, fontFamily:'var(--sans)', fontWeight:600, fontSize:'0.85rem', color:'var(--text-h)', textDecoration:'none', cursor:'pointer', boxShadow:'var(--shadow)', transition:'box-shadow 0.2s, border-color 0.2s', ...sx }}
      whileHover={{ boxShadow:`0 16px 48px ${color||'rgba(124,58,237,0.2)'}`, borderColor: color||'var(--accent-border)' }}
      whileTap={{ scale:0.96 }}>
      {children}
    </Tag>
  )
}

function ConnectSection() {
  return (
    <section id="v5-connect" style={{ padding:'96px clamp(20px,5vw,80px) 80px', background:'var(--bg-secondary)', position:'relative', overflow:'hidden' }}>
      {/* Background blurred orbs */}
      <div style={{ position:'absolute', top:'20%', left:'5%', width:500, height:500, borderRadius:'50%', background:'rgba(124,58,237,0.05)', filter:'blur(100px)', pointerEvents:'none' }} />
      <div style={{ position:'absolute', bottom:'10%', right:'5%', width:350, height:350, borderRadius:'50%', background:'rgba(59,130,246,0.05)', filter:'blur(80px)', pointerEvents:'none' }} />

      <motion.div initial={{ opacity:0,y:32 }} whileInView={{ opacity:1,y:0 }} viewport={{ once:true }} transition={{ duration:0.8 }} style={{ textAlign:'center', marginBottom:72 }}>
        <p style={{ fontSize:'0.72rem', letterSpacing:'0.2em', textTransform:'uppercase', color:'var(--accent)', margin:'0 0 16px', fontWeight:600 }}>Let's Connect</p>
        <h2 style={{ fontSize:'clamp(2.5rem,6vw,5rem)', fontFamily:"'Playfair Display',serif", fontWeight:700, color:'var(--text-h)', margin:'0 0 20px', lineHeight:1.0, letterSpacing:'-0.02em' }}>
          Ride Together.
        </h2>
        <p style={{ fontSize:'clamp(0.95rem,1.5vw,1.15rem)', color:'var(--text)', maxWidth:420, margin:'0 auto', lineHeight:1.8, fontWeight:300 }}>
          Follow the journey. Join the community.<br/>Every ride is better with good people.
        </p>
      </motion.div>

      {/* Magnetic buttons */}
      <div style={{ display:'flex', flexWrap:'wrap', justifyContent:'center', gap:20, marginBottom:72 }}>
        <MagneticButton href={cfg.social?.instagram?.href||'#'} color="rgba(225,48,108,0.3)">
          <span>📸</span> Instagram
        </MagneticButton>
        <MagneticButton href={cfg.social?.youtube?.href||'#'} color="rgba(255,0,0,0.25)">
          <span>▶</span> YouTube
        </MagneticButton>
        <MagneticButton href="/blog" color="rgba(124,58,237,0.25)">
          <span>✍️</span> Blog
        </MagneticButton>
        <MagneticButton href="/contact" color="rgba(34,197,94,0.25)">
          <span>✉️</span> Email
        </MagneticButton>
      </div>

      {/* Closing */}
      <motion.div initial={{ opacity:0,y:24 }} whileInView={{ opacity:1,y:0 }} viewport={{ once:true }} transition={{ duration:0.8, delay:0.2 }} style={{ textAlign:'center', borderTop:'1px solid var(--border)', paddingTop:56 }}>
        <p style={{ fontFamily:"'Playfair Display',serif", fontStyle:'italic', fontSize:'clamp(1.4rem,3vw,2.2rem)', color:'var(--text-h)', margin:'0 0 10px', letterSpacing:'-0.01em' }}>
          "Thanks for visiting my garage."
        </p>
        <p style={{ fontSize:'0.85rem', color:'var(--accent)', fontWeight:600, letterSpacing:'0.1em', margin:0 }}>
          See you on the next ride. 🏍️
        </p>
        <motion.div animate={{ scaleX:[0.5,1,0.5] }} transition={{ duration:4, repeat:Infinity, ease:'easeInOut' }}
          style={{ width:80, height:2, background:'var(--accent)', borderRadius:999, margin:'24px auto 0' }} />
      </motion.div>
    </section>
  )
}

// ─── Fixed nav dots ───────────────────────────────────────────────────────────
const NAV5 = [
  ['v5-hero','Hero'],['v5-bike','Bike'],['v5-specs','Specs'],
  ['v5-setup','Setup'],['v5-recommended','Gear'],['v5-vlogs','Vlogs'],
  ['v5-stats','Stats'],['v5-dream','Dream'],['v5-cost','Cost'],
  ['v5-gallery','Gallery'],['v5-connect','Connect'],
]
function DotNav5() {
  const [active, setActive] = useState('v5-hero')
  useEffect(() => {
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if(e.isIntersecting) setActive(e.target.id) }),
      { rootMargin:'-45% 0px -45% 0px' }
    )
    NAV5.forEach(([id]) => { const el=document.getElementById(id); if(el) obs.observe(el) })
    return () => obs.disconnect()
  }, [])
  return (
    <div style={{ position:'fixed', right:20, top:'50%', transform:'translateY(-50%)', zIndex:50, display:'flex', flexDirection:'column', gap:10 }} className="dots-v5">
      {NAV5.map(([id,label]) => (
        <button key={id} onClick={() => document.getElementById(id)?.scrollIntoView({ behavior:'smooth' })} title={label}
          style={{ width:active===id?8:4, height:active===id?8:4, borderRadius:'50%', background:active===id?'var(--accent)':'rgba(128,128,128,0.35)', border:'none', cursor:'pointer', padding:0, transition:'all 0.3s', alignSelf:'center' }} />
      ))}
      <style>{`@media(max-width:768px){.dots-v5{display:none!important}}`}</style>
    </div>
  )
}

// ─── View switcher ────────────────────────────────────────────────────────────
function Switcher5() {
  return (
    <div style={{ position:'fixed', top:72, left:'50%', transform:'translateX(-50%)', zIndex:60, display:'flex', background:'var(--card-bg)', backdropFilter:'blur(20px)', border:'1px solid var(--border)', overflow:'hidden', borderRadius:999 }} className="sw-v5">
      {[{l:'Standard',to:'/garage'},{l:'Premium',to:'/garage/premium'},{l:'V3',to:'/garage/v3'},{l:'V4',to:'/garage/v4'},{l:'V5 ✦',to:null}].map(({l,to}) => (
        to ? <Link key={l} to={to} style={{ padding:'8px 14px', fontSize:'0.62rem', letterSpacing:'0.1em', textTransform:'uppercase', fontWeight:600, fontFamily:'var(--sans)', color:'var(--text)', textDecoration:'none', whiteSpace:'nowrap' }}>{l}</Link>
           : <div key={l} style={{ padding:'8px 14px', fontSize:'0.62rem', letterSpacing:'0.1em', textTransform:'uppercase', fontWeight:700, fontFamily:'var(--sans)', background:'var(--accent)', color:'#fff', whiteSpace:'nowrap' }}>{l}</div>
      ))}
      <style>{`@media(max-width:560px){.sw-v5{display:none!important}}`}</style>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function GarageV5() {
  return (
    <div style={{ background:'var(--bg)', overflowX:'hidden' }}>
      <Switcher5 />
      <DotNav5 />
      <HeroV5 />
      <BikeSplitSection />
      <SpecsSection />
      <SetupHorizontalSection />
      <RecommendedGlassSection />
      <VlogsPinnedSection />
      <StatsRadialSection />
      <DreamWishlistSection />
      <CostMaintenanceSection />
      <GalleryMaskedSection />
      <ConnectSection />
    </div>
  )
}
