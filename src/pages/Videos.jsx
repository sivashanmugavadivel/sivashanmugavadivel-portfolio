import { useState } from 'react'
import { motion } from 'framer-motion'
import cfg from '../data/config.json'

/* ── No-op wrapper — PageWrapper handles page entry animation ── */
function Reveal({ children, style }) {
  return <div style={style}>{children}</div>
}

/* ── Extract YouTube video ID from a full URL or a bare ID ── */
function youtubeId(input) {
  if (!input) return ''
  // Already a bare ID (11 chars, no slash or dot)
  if (/^[a-zA-Z0-9_-]{11}$/.test(input)) return input
  try {
    const url = new URL(input)
    // youtu.be/ID
    if (url.hostname === 'youtu.be') return url.pathname.slice(1)
    // youtube.com/watch?v=ID or /shorts/ID or /embed/ID
    return url.searchParams.get('v') || url.pathname.split('/').pop() || input
  } catch {
    return input
  }
}

/* ── Video card — thumbnail that swaps to iframe on click ── */
function VideoCardFull({ video, featured = false }) {
  const [playing, setPlaying] = useState(false)
  const id = youtubeId(video.id)
  const thumb = `https://img.youtube.com/vi/${id}/hqdefault.jpg`

  return (
    <motion.div
      whileHover={!playing ? { y: -4, boxShadow: 'var(--shadow-hover)' } : {}}
      transition={{ duration: 0.25 }}
      style={{
        background: 'var(--card-bg)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow)',
      }}
    >
      {/* Embed area */}
      <div style={{
        position: 'relative',
        aspectRatio: '16/9',
        background: '#000',
        cursor: playing ? 'default' : 'pointer',
      }}>
        {playing ? (
          <iframe
            src={`https://www.youtube.com/embed/${id}?autoplay=1&rel=0`}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
          />
        ) : (
          <>
            <img
              src={thumb}
              alt={video.title}
              loading="lazy"
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
            {/* Dark overlay */}
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.5))',
            }} />
            {/* Play button */}
            <motion.button
              onClick={() => setPlaying(true)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              aria-label={`Play ${video.title}`}
              style={{
                position: 'absolute',
                top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                width: featured ? 72 : 56,
                height: featured ? 72 : 56,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.95)',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
              }}
            >
              <svg
                width={featured ? 28 : 22}
                height={featured ? 28 : 22}
                viewBox="0 0 24 24"
                fill="var(--accent)"
                style={{ marginLeft: 3 }}
              >
                <polygon points="5,3 19,12 5,21"/>
              </svg>
            </motion.button>
          </>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: featured ? '20px 24px' : '14px 18px' }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
          {video.tags.map(tag => (
            <span
              key={tag}
              style={{
                padding: '2px 10px',
                borderRadius: 999,
                fontSize: '0.7rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                background: 'var(--accent-bg)',
                color: 'var(--accent)',
                border: '1px solid var(--accent-border)',
              }}
            >
              {tag}
            </span>
          ))}
        </div>
        <h3 style={{
          fontSize: featured ? '1.2rem' : '0.95rem',
          margin: '0 0 6px',
          color: 'var(--text-h)',
        }}>
          {video.title}
        </h3>
        <p style={{ fontSize: '0.83rem', color: 'var(--text)', margin: 0, lineHeight: 1.5 }}>
          {video.description}
        </p>
        <p style={{ fontSize: '0.72rem', color: 'var(--text)', marginTop: 8, opacity: 0.7 }}>
          {new Date(video.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>
    </motion.div>
  )
}

/* ── Shorts section with category filter ── */
function ShortsSection({ shorts }) {
  const categories = ['all', ...Array.from(new Set(shorts.map(s => s.category).filter(Boolean))).sort()]
  const [activeCategory, setActiveCategory] = useState('all')

  const filtered = activeCategory === 'all' ? shorts : shorts.filter(s => s.category === activeCategory)

  return (
    <section className="section" style={{ background: 'var(--bg)' }}>
      <div className="page-container">
        <div style={{ marginBottom: 32, textAlign: 'center' }}>
          <span className="section-label" style={{ display: 'block', marginBottom: 4 }}>Short Form</span>
          <h2>YouTube Shorts</h2>
        </div>

        {/* Category pills — same style as Gallery */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}
        >
          {categories.map((cat, i) => (
            <motion.button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 + i * 0.04 }}
              style={{
                padding: '8px 20px', borderRadius: 999,
                fontFamily: 'var(--sans)', fontSize: '0.85rem', fontWeight: 500,
                cursor: 'pointer',
                border: activeCategory === cat ? '1.5px solid var(--text-h)' : '1.5px solid var(--border)',
                background: activeCategory === cat ? 'var(--text-h)' : 'transparent',
                color: activeCategory === cat ? 'var(--bg)' : 'var(--text-h)',
                transition: 'all 0.2s',
              }}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </motion.button>
          ))}
        </motion.div>

        {/* Count */}
        <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text)', opacity: 0.6, marginBottom: 32 }}>
          {filtered.length} {filtered.length === 1 ? 'short' : 'shorts'}
          {activeCategory !== 'all' && ` in ${activeCategory}`}
        </p>

        <ShortsCarousel shorts={filtered} />
      </div>
    </section>
  )
}

/* ── Shorts carousel ── */
function ShortsCarousel({ shorts }) {
  const [active, setActive] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [hovered, setHovered] = useState(false)
  const prev = () => { setPlaying(false); setActive(i => (i - 1 + shorts.length) % shorts.length) }
  const next = () => { setPlaying(false); setActive(i => (i + 1) % shorts.length) }

  const getPos = (i) => {
    const diff = i - active
    const wrapped = ((diff + shorts.length) % shorts.length)
    if (wrapped === 0) return 'center'
    if (wrapped === 1 || wrapped === -(shorts.length - 1)) return 'right'
    if (wrapped === shorts.length - 1 || wrapped === -1) return 'left'
    return 'hidden'
  }

  const posStyles = {
    center: { x: '0%',    scale: 1,    opacity: 1,   zIndex: 3, rotateY:   0 },
    left:   { x: '-62%',  scale: 0.78, opacity: 0.6, zIndex: 2, rotateY:  18 },
    right:  { x:  '62%',  scale: 0.78, opacity: 0.6, zIndex: 2, rotateY: -18 },
    hidden: { x:   '0%',  scale: 0.5,  opacity: 0,   zIndex: 1, rotateY:   0 },
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 32 }}>

      {/* Carousel stage */}
      <div style={{ width: '100%', overflow: 'hidden' }}>
      <div style={{
        position: 'relative',
        width: '100%',
        height: 'clamp(340px, 55vw, 520px)',
        perspective: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {shorts.map((v, i) => {
          const pos = getPos(i)
          const isCenter = pos === 'center'
          const vid = youtubeId(v.id)
          const vthumb = `https://img.youtube.com/vi/${vid}/hqdefault.jpg`

          return (
            <motion.div
              key={v.id}
              animate={posStyles[pos]}
              transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
              drag={isCenter ? 'x' : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragEnd={(_, info) => {
                if (info.offset.x < -60) next()
                else if (info.offset.x > 60) prev()
              }}
              onClick={() => { if (!isCenter) { setPlaying(false); setActive(i) } }}
              onHoverStart={() => isCenter && setHovered(true)}
              onHoverEnd={() => setHovered(false)}
              style={{
                position: 'absolute',
                width: 'clamp(160px, 22vw, 240px)',
                aspectRatio: '9/16',
                borderRadius: 20,
                overflow: 'hidden',
                cursor: isCenter ? 'grab' : 'pointer',
                transformStyle: 'preserve-3d',
                boxShadow: isCenter && hovered
                  ? '0 0 40px var(--accent), 0 0 80px var(--accent), 0 24px 60px rgba(0,0,0,0.45)'
                  : isCenter
                  ? '0 24px 60px rgba(0,0,0,0.45)'
                  : '0 8px 24px rgba(0,0,0,0.2)',
                transition: 'box-shadow 0.3s ease',
              }}
            >
              {/* Thumbnail */}
              <img
                src={vthumb}
                alt={v.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />

              {/* Overlay */}
              <div style={{
                position: 'absolute', inset: 0,
                background: isCenter ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.45)',
                transition: 'background 0.3s',
              }} />

              {/* SHORT badge */}
              <div style={{
                position: 'absolute', top: 10, left: 10,
                padding: '3px 10px', borderRadius: 999,
                background: '#ff0000', color: '#fff',
                fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.08em',
              }}>
                SHORT
              </div>

              {/* Play button — always visible on center card */}
              {isCenter && !playing && (
                <motion.button
                  animate={{ scale: hovered ? 1.1 : 1 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  onClick={(e) => { e.stopPropagation(); setPlaying(true) }}
                  whileTap={{ scale: 0.92 }}
                  style={{
                    position: 'absolute', top: '50%', left: '50%',
                    marginTop: -28, marginLeft: -28,
                    width: 56, height: 56, borderRadius: '50%',
                    background: 'var(--accent)',
                    border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 0 28px var(--accent), 0 0 60px var(--accent)',
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff" style={{ marginLeft: 3 }}>
                    <polygon points="5,3 19,12 5,21"/>
                  </svg>
                </motion.button>
              )}

              {/* Iframe when playing */}
              {isCenter && playing && (
                <iframe
                  src={`https://www.youtube.com/embed/${vid}?autoplay=1&rel=0`}
                  title={v.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
                />
              )}

              {/* Title on center card */}
              {isCenter && !playing && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0,
                    padding: '32px 14px 14px',
                    background: 'linear-gradient(to top, rgba(0,0,0,0.85), transparent)',
                  }}
                >
                  <p style={{
                    color: '#fff', fontSize: '0.78rem', fontWeight: 600,
                    margin: 0, lineHeight: 1.4,
                    display: '-webkit-box', WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical', overflow: 'hidden',
                  }}>
                    {v.title}
                  </p>
                </motion.div>
              )}
            </motion.div>
          )
        })}
      </div>
      </div>

      {/* Nav controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <motion.button
          onClick={prev} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.92 }}
          style={{
            width: 40, height: 40, borderRadius: '50%', border: '1.5px solid var(--accent)',
            background: 'transparent', color: 'var(--accent)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15,18 9,12 15,6"/></svg>
        </motion.button>

        {/* Dots — windowed to 5 around active to prevent overflow */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {shorts.length <= 7
            ? shorts.map((_, i) => (
                <motion.button
                  key={i}
                  onClick={() => { setPlaying(false); setActive(i) }}
                  animate={{ width: i === active ? 20 : 7, background: i === active ? 'var(--accent)' : 'var(--border)' }}
                  transition={{ duration: 0.3 }}
                  style={{ height: 7, borderRadius: 999, border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0 }}
                />
              ))
            : (() => {
                const total = shorts.length
                const half = 2
                let start = Math.max(0, active - half)
                let end = Math.min(total - 1, active + half)
                if (active - half < 0) end = Math.min(total - 1, 4)
                if (active + half > total - 1) start = Math.max(0, total - 5)
                const visible = []
                for (let i = start; i <= end; i++) visible.push(i)
                return visible.map(i => (
                  <motion.button
                    key={i}
                    onClick={() => { setPlaying(false); setActive(i) }}
                    animate={{ width: i === active ? 20 : 7, background: i === active ? 'var(--accent)' : 'var(--border)' }}
                    transition={{ duration: 0.3 }}
                    style={{ height: 7, borderRadius: 999, border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0 }}
                  />
                ))
              })()
          }
        </div>

        <motion.button
          onClick={next} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.92 }}
          style={{
            width: 40, height: 40, borderRadius: '50%', border: '1.5px solid var(--accent)',
            background: 'transparent', color: 'var(--accent)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9,18 15,12 9,6"/></svg>
        </motion.button>
      </div>

      {/* Counter */}
      <p style={{ color: 'var(--text)', fontSize: '0.8rem', margin: 0 }}>
        {active + 1} / {shorts.length}
      </p>
    </div>
  )
}

/* ── Header Design 1 — Cinematic Letter Drop ── */
const TITLE = 'VIDEOS'
function VideosHeader1() {
  return (
    <section style={{
      paddingTop: 'clamp(100px, 14vw, 160px)',
      paddingBottom: 'clamp(40px, 5vw, 64px)',
      background: 'var(--bg)',
      textAlign: 'center',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(124,58,237,0.15), transparent)', pointerEvents: 'none' }} />
      <div className="page-container" style={{ position: 'relative', zIndex: 1 }}>
        <motion.span
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 20 }}
        >
          Watch
        </motion.span>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 'clamp(2px, 1vw, 12px)', marginBottom: 24 }}>
          {TITLE.split('').map((char, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, y: -80, rotateX: -90 }}
              animate={{ opacity: 1, y: 0, rotateX: 0 }}
              transition={{ duration: 0.6, delay: 0.2 + i * 0.07, ease: [0.16, 1, 0.3, 1] }}
              style={{
                display: 'inline-block',
                fontSize: 'clamp(3rem, 9vw, 8rem)',
                fontFamily: "'Lilita One', cursive",
                fontWeight: 400,
                color: 'var(--text-h)',
                lineHeight: 1,
                textShadow: '0 0 40px rgba(124,58,237,0.4)',
              }}
            >
              {char}
            </motion.span>
          ))}
        </div>
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.8, delay: 0.8, ease: [0.16, 1, 0.3, 1] }}
          style={{ height: 2, background: 'linear-gradient(to right, transparent, var(--accent), transparent)', transformOrigin: 'center', marginBottom: 24 }}
        />
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.0 }}
          style={{ color: 'var(--text)', maxWidth: 440, margin: '0 auto', lineHeight: 1.7 }}
        >
          YouTube videos, tutorials, vlogs, and short-form content.
        </motion.p>
      </div>
    </section>
  )
}


/* ── YouTube SVG icon ── */
const YTIcon = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
    <path d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.56 3.5 12 3.5 12 3.5s-7.56 0-9.38.55A3.02 3.02 0 0 0 .5 6.19C0 8.01 0 12 0 12s0 3.99.5 5.81a3.02 3.02 0 0 0 2.12 2.14C4.44 20.5 12 20.5 12 20.5s7.56 0 9.38-.55a3.02 3.02 0 0 0 2.12-2.14C24 15.99 24 12 24 12s0-3.99-.5-5.81zM9.75 15.52V8.48L15.5 12l-5.75 3.52z"/>
  </svg>
)

/* ──────────────────────────────────────────────
   Design G — "Underwater World"
   Fish swimming, bubbles rising, ocean wave
   ────────────────────────────────────────────── */
function DesignG({ href }) {
  const fish = [
    { emoji:'🐠', delay:0,   dur:6,  y:'30%', dir:-1 },
    { emoji:'🐟', delay:1.2, dur:8,  y:'55%', dir:-1 },
    { emoji:'🐡', delay:2.5, dur:7,  y:'72%', dir:-1 },
    { emoji:'🦈', delay:0.8, dur:10, y:'20%', dir:-1 },
    { emoji:'🐙', delay:3,   dur:5,  y:'65%', dir:-1 },
  ]
  const bubbles = Array.from({length:14}, (_,i) => ({
    left: `${(i*7+5)%95}%`, delay: i*0.35, dur: 2.5+i*0.3, size: 6+i%4*4,
  }))
  return (
    <section style={{ padding:'clamp(56px,7vw,100px) 0', position:'relative', overflow:'hidden',
      background:'linear-gradient(180deg,#001220 0%,#003554 40%,#006494 100%)' }}>
      {/* Bubbles */}
      {bubbles.map((b,i) => (
        <motion.div key={i} animate={{ y:['0%','-110%'], opacity:[0,0.7,0], scale:[0.6,1.2,0.8] }}
          transition={{ duration:b.dur, repeat:Infinity, delay:b.delay, ease:'easeInOut' }}
          style={{ position:'absolute', bottom:0, left:b.left, width:b.size, height:b.size,
            borderRadius:'50%', border:'1.5px solid rgba(255,255,255,0.4)',
            background:'rgba(255,255,255,0.05)', pointerEvents:'none' }} />
      ))}
      {/* Swimming fish — all move right → left */}
      {fish.map((f,i) => (
        <motion.div key={i}
          initial={{ x: '105vw' }}
          animate={{ x: '-120px' }}
          transition={{ duration:f.dur, repeat:Infinity, ease:'linear', delay:f.delay, repeatDelay: 0 }}
          style={{ position:'absolute', top:f.y, left:0, fontSize:'clamp(24px,3.5vw,36px)',
            transform:'scaleX(-1)',
            pointerEvents:'none', filter:'drop-shadow(0 2px 8px rgba(0,180,255,0.6))' }}>
          <motion.span
            animate={{ y:[0,-10,0] }}
            transition={{ duration:1.5, repeat:Infinity, ease:'easeInOut', delay:f.delay }}
            style={{ display:'inline-block' }}>
            {f.emoji}
          </motion.span>
        </motion.div>
      ))}
      {/* Seaweed */}
      {[8,25,72,88].map((left,i) => (
        <motion.div key={i} animate={{ rotate:[-6,6,-6] }}
          transition={{ duration:2.5+i*0.4, repeat:Infinity, ease:'easeInOut', delay:i*0.3 }}
          style={{ position:'absolute', bottom:0, left:`${left}%`, fontSize:'clamp(24px,4vw,40px)',
            transformOrigin:'bottom center', pointerEvents:'none', opacity:0.7 }}>
          🌿
        </motion.div>
      ))}
      <div className="page-container" style={{ textAlign:'center', position:'relative', zIndex:2 }}>
        <motion.div animate={{ y:[0,-8,0], rotate:[-2,2,-2] }}
          transition={{ duration:3, repeat:Infinity, ease:'easeInOut' }}
          style={{ fontSize:'clamp(52px,8vw,80px)', marginBottom:16, display:'inline-block',
            filter:'drop-shadow(0 0 20px rgba(0,200,255,0.6))' }}>
          🐬
        </motion.div>
        <motion.h2 animate={{ opacity:[0.8,1,0.8] }} transition={{ duration:2.5, repeat:Infinity }}
          style={{ color:'#7dd3fc', fontSize:'clamp(1.4rem,4vw,2.4rem)',
            fontFamily:'var(--display)', marginBottom:8,
            textShadow:'0 0 24px rgba(125,211,252,0.6)' }}>
          🌊 Dive Into More Content
        </motion.h2>
        <p style={{ color:'rgba(186,230,253,0.6)', marginBottom:36, fontFamily:'var(--sans)', fontSize:'0.9rem' }}>
          Subscribe and explore a whole ocean of videos
        </p>
        <motion.a href={href} target="_blank" rel="noopener noreferrer"
          whileHover={{ scale:1.07, boxShadow:'0 8px 32px rgba(0,200,255,0.5)' }} whileTap={{ scale:0.94 }}
          style={{ display:'inline-flex', alignItems:'center', gap:10, padding:'14px 32px',
            borderRadius:999, background:'linear-gradient(135deg,#0284c7,#0ea5e9)',
            color:'#fff', fontWeight:800, fontSize:'1.05rem', textDecoration:'none',
            fontFamily:'var(--sans)', boxShadow:'0 6px 24px rgba(2,132,199,0.5)' }}>
          <YTIcon /> Subscribe — Dive In!
        </motion.a>
      </div>
    </section>
  )
}

function SubscribeDesignPicker() {
  const href = cfg.social.youtube.href
  return <DesignG href={href} />
}

/* ── Main Videos page ── */
export default function Videos() {
  const regularVideos = (cfg.videos || []).filter(v => v.type === 'video')
  const shorts = (cfg.videos || []).filter(v => v.type === 'short')
  return (
    <div>
      <VideosHeader1 />

      {/* ── Videos ── */}
      {regularVideos.length > 0 && (
        <section className="section" style={{ paddingTop: 'clamp(48px, 6vw, 80px)', background: 'var(--bg)', overflow: 'hidden' }}>
          <div className="page-container">
            <Reveal delay={0}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
                <h2 style={{ margin: 0 }}>Videos</h2>
                <span style={{ fontSize: '0.8rem', color: 'var(--accent)' }}>← drag →</span>
              </div>
            </Reveal>
            <div style={{ overflowX: 'auto', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
              <div style={{ display: 'flex', gap: 16, paddingBottom: 16, scrollSnapType: 'x mandatory', width: 'max-content' }}>
                {regularVideos.map((video) => (
                  <div
                    key={video.id}
                    style={{ width: 'clamp(260px, 75vw, 440px)', scrollSnapAlign: 'start', flexShrink: 0 }}
                  >
                    <VideoCardFull video={video} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}


      {/* Shorts */}
      {shorts.length > 0 && (
        <ShortsSection shorts={shorts} />
      )}

      {/* CTA — Subscribe Button Design Picker */}
      <SubscribeDesignPicker />
    </div>
  )
}
