import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Lightbox from 'yet-another-react-lightbox'
import 'yet-another-react-lightbox/styles.css'
import galleryData from '../data/gallery.json'
import cfg from '../data/config.json'

const BASE = import.meta.env.BASE_URL

/* ── Polaroid intro — images from config.gallery.introImages ── */
const SLIDESHOW_IMAGES = (cfg.gallery?.introImages ?? []).map(p =>
  p.startsWith('http') ? p : `${BASE}${p}`
)

const isMobileGallery = window.innerWidth <= 768

const CARD_CONFIGS = isMobileGallery ? [
  { x: '-90px', y: '-120px', rotate: -12 },
  { x:  '90px', y: '-120px', rotate:  10 },
  { x: '-90px', y:  '120px', rotate:   8 },
  { x:  '90px', y:  '120px', rotate:  -9 },
] : [
  { x: '-260px', y: '-110px', rotate: -12 },
  { x:  '200px', y: '-130px', rotate:  10 },
  { x: '-200px', y:  '100px', rotate:   8 },
  { x:  '240px', y:   '85px', rotate:  -9 },
]

const ORIGINS = [
  { x: '-60vw', y: '-40vh', rotate: -20 },
  { x:  '60vw', y: '-40vh', rotate:  20 },
  { x: '-60vw', y:  '40vh', rotate: -15 },
  { x:  '60vw', y:  '40vh', rotate:  15 },
]

function PolaroidIntro({ onDone }) {
  const [phase, setPhase] = useState('loading')
  const [loaded, setLoaded] = useState(0)

  useEffect(() => {
    let count = 0
    SLIDESHOW_IMAGES.forEach(src => {
      const img = new Image()
      img.onload = img.onerror = () => { count++; setLoaded(count) }
      img.src = src
    })
  }, [])

  useEffect(() => {
    if (loaded < SLIDESHOW_IMAGES.length) return
    setPhase('fly-in')
    const hold = setTimeout(() => setPhase('fly-out'), 2800)
    const done = setTimeout(() => onDone(), 3800)
    return () => { clearTimeout(hold); clearTimeout(done) }
  }, [loaded, onDone])

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: phase === 'fly-out' ? 0 : 1 }}
      transition={{ duration: 0.8, delay: phase === 'fly-out' ? 0.3 : 0 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'var(--bg)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        pointerEvents: phase === 'fly-out' ? 'none' : 'all',
      }}
    >
      {phase !== 'loading' && SLIDESHOW_IMAGES.map((src, i) => {
        const origin = ORIGINS[i]
        const land = CARD_CONFIGS[i]
        return (
          <motion.div
            key={src}
            initial={{ x: origin.x, y: origin.y, rotate: origin.rotate, opacity: 0 }}
            animate={phase === 'fly-out'
              ? { x: ORIGINS[(i + 2) % 4].x, y: ORIGINS[(i + 2) % 4].y, rotate: origin.rotate * -1.2, opacity: 0 }
              : { x: land.x, y: land.y, rotate: land.rotate, opacity: 1 }
            }
            transition={phase === 'fly-out'
              ? { duration: 0.7, delay: i * 0.05, ease: [0.4, 0, 0.6, 1] }
              : { duration: 1.0, delay: i * 0.15, ease: [0.16, 1, 0.3, 1] }
            }
            style={{
              position: 'absolute',
              width: isMobileGallery ? 'clamp(100px, 36vw, 150px)' : 'clamp(180px, 22vw, 280px)',
              background: '#fff',
              borderRadius: 4,
              boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
              padding: '10px 10px 32px',
            }}
          >
            <img src={src} alt="" style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover', display: 'block', borderRadius: 2 }} />
          </motion.div>
        )
      })}
    </motion.div>
  )
}

/* ── 3D Carousel ── */
function GalleryCarousel({ items, onOpen }) {
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)

  const prev = () => setActive(i => (i - 1 + items.length) % items.length)
  const next = () => setActive(i => (i + 1) % items.length)

  // Auto-scroll every 3s, pauses on hover
  useEffect(() => {
    if (paused || items.length <= 1) return
    const id = setInterval(() => setActive(i => (i + 1) % items.length), 3000)
    return () => clearInterval(id)
  }, [paused, items.length])

  const getPos = (i) => {
    const diff = ((i - active) + items.length) % items.length
    if (diff === 0) return 'center'
    if (diff === 1) return 'right1'
    if (diff === items.length - 1) return 'left1'
    if (diff === 2) return 'right2'
    if (diff === items.length - 2) return 'left2'
    return 'hidden'
  }

  const posStyles = {
    center: { x: '0%',    scale: 1,     opacity: 1,   zIndex: 5, rotateY:   0 },
    left1:  { x: '-52%',  scale: 0.82,  opacity: 0.85, zIndex: 4, rotateY:  12 },
    right1: { x:  '52%',  scale: 0.82,  opacity: 0.85, zIndex: 4, rotateY: -12 },
    left2:  { x: '-90%',  scale: 0.65,  opacity: 0.5,  zIndex: 3, rotateY:  18 },
    right2: { x:  '90%',  scale: 0.65,  opacity: 0.5,  zIndex: 3, rotateY: -18 },
    hidden: { x:   '0%',  scale: 0.4,   opacity: 0,    zIndex: 1, rotateY:   0 },
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 40 }}>

      {/* Stage */}
      <div style={{
        position: 'relative',
        width: '100%',
        height: 'clamp(300px, 50vw, 500px)',
        perspective: 1200,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
      }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}>
        {items.map((item, i) => {
          const pos = getPos(i)
          // Only render the 5 visible cards — skip hidden ones entirely
          // This avoids mounting 50+ motion.divs and eliminates the lag
          if (pos === 'hidden') return null
          const isCenter = pos === 'center'
          const src = `${BASE}gallery/${item.category}/${item.filename}`

          return (
            <motion.div
              key={`${item.category}/${item.filename}`}
              animate={posStyles[pos]}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              drag={isCenter ? 'x' : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.15}
              onDragEnd={(_, info) => {
                if (info.offset.x < -60) next()
                else if (info.offset.x > 60) prev()
              }}
              onClick={() => { if (!isCenter) setActive(i); else onOpen(i) }}
              style={{
                position: 'absolute',
                width: 'clamp(200px, 32vw, 380px)',
                aspectRatio: '4/5',
                borderRadius: 20,
                overflow: 'hidden',
                cursor: isCenter ? 'pointer' : 'pointer',
                transformStyle: 'preserve-3d',
                boxShadow: isCenter
                  ? '0 24px 60px rgba(0,0,0,0.25)'
                  : '0 8px 24px rgba(0,0,0,0.12)',
              }}
            >
              <img
                src={src}
                alt={item.caption}
                loading="lazy"
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />

              {/* Center card overlay with play/expand icon */}
              {isCenter && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 60%)',
                    display: 'flex', alignItems: 'flex-end',
                    padding: '16px',
                  }}
                >
                  <div style={{ flex: 1 }} />
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: 'rgba(255,255,255,0.9)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/>
                      <line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>
                    </svg>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )
        })}
      </div>

      {/* Nav arrows */}
      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
        <motion.button
          onClick={prev}
          whileHover={{ scale: 1.1, borderColor: 'var(--text-h)' }}
          whileTap={{ scale: 0.92 }}
          style={{
            width: 44, height: 44, borderRadius: '50%',
            border: '1.5px solid var(--border)',
            background: 'transparent', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--text-h)', transition: 'border-color 0.2s',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15,18 9,12 15,6"/></svg>
        </motion.button>

        <span style={{ fontSize: '0.8rem', color: 'var(--text)', minWidth: 48, textAlign: 'center' }}>
          {active + 1} / {items.length}
        </span>

        <motion.button
          onClick={next}
          whileHover={{ scale: 1.1, borderColor: 'var(--text-h)' }}
          whileTap={{ scale: 0.92 }}
          style={{
            width: 44, height: 44, borderRadius: '50%',
            border: '1.5px solid var(--border)',
            background: 'transparent', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--text-h)', transition: 'border-color 0.2s',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="9,18 15,12 9,6"/></svg>
        </motion.button>
      </div>
    </div>
  )
}

/* ── Main Gallery page ── */
export default function Gallery() {
  const [showIntro, setShowIntro] = useState(true)
  const categories = ['all', ...Array.from(new Set(galleryData.map(p => p.category))).sort()]
  const [activeCategory, setActiveCategory] = useState('all')
  const [lightboxIndex, setLightboxIndex] = useState(-1)

  const filtered = activeCategory === 'all'
    ? galleryData
    : galleryData.filter(p => p.category === activeCategory)

  const slides = filtered.map(item => ({
    src: `${BASE}gallery/${item.category}/${item.filename}`,
    alt: item.caption,
  }))

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <AnimatePresence>
        {showIntro && <PolaroidIntro onDone={() => setShowIntro(false)} />}
      </AnimatePresence>

      {/* ── Header ── */}
      <section style={{
        paddingTop: 'clamp(100px, 14vw, 160px)',
        paddingBottom: 'clamp(32px, 4vw, 48px)',
        textAlign: 'center',
      }}>
        <div className="page-container">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="section-label">Gallery</span>
            <h1 style={{ fontSize: 'clamp(2.2rem, 6vw, 4rem)', marginTop: 8, marginBottom: 12 }}>
              My Visual Diary
            </h1>
            <p style={{ color: 'var(--text)', maxWidth: 420, margin: '0 auto', lineHeight: 1.7 }}>
              See the world through my lens:<br />adventures in photos that capture moments and memories
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── Category pills ── */}
      <section style={{ paddingBottom: 'clamp(32px, 4vw, 48px)' }}>
        <div className="page-container">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            style={{
              display: 'flex', gap: 8, flexWrap: 'wrap',
              alignItems: 'center', justifyContent: 'center',
            }}
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

          {/* Photo count */}
          <motion.p
            key={activeCategory}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ textAlign: 'center', color: 'var(--text)', fontSize: '0.78rem', marginTop: 12, marginBottom: 0 }}
          >
            {filtered.length} {filtered.length === 1 ? 'photo' : 'photos'}
            {activeCategory !== 'all' && ` in ${activeCategory}`}
          </motion.p>
        </div>
      </section>

      {/* ── 3D Carousel ── */}
      <section style={{ paddingBottom: 'clamp(64px, 8vw, 96px)' }}>
        <div className="page-container">
          <AnimatePresence mode="wait">
            {filtered.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{ textAlign: 'center', padding: '64px 0', color: 'var(--text)' }}
              >
                <p>No photos in this category yet.</p>
              </motion.div>
            ) : (
              <motion.div
                key={activeCategory}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <GalleryCarousel
                  key={activeCategory}
                  items={filtered}
                  onOpen={(i) => setLightboxIndex(i)}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* Lightbox */}
      <Lightbox
        open={lightboxIndex >= 0}
        close={() => setLightboxIndex(-1)}
        index={lightboxIndex}
        slides={slides}
        styles={{ container: { backgroundColor: 'rgba(0,0,0,0.92)' } }}
      />
    </div>
  )
}
