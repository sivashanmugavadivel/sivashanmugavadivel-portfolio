import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Lightbox from 'yet-another-react-lightbox'
import 'yet-another-react-lightbox/styles.css'
import galleryData from '../data/gallery.json'

/* ── Polaroid card intro ── */
const SLIDESHOW_IMAGES = [
  '/slideshareImages/ss1.jpg',
  '/slideshareImages/ss2.jpg',
  '/slideshareImages/ss3.png',
  '/slideshareImages/ss4.jpg',
]

// Fixed scatter positions — spread within screen bounds
const CARD_CONFIGS = [
  { x: '-280px', y: '-120px', rotate: -14 },
  { x:  '220px', y: '-140px', rotate:  12 },
  { x: '-220px', y:  '110px', rotate:   9 },
  { x:  '260px', y:   '90px', rotate: -11 },
]

// Each card flies in from a different off-screen origin
const ORIGINS = [
  { x: '-120vw', y: '-60vh', rotate: -40 },
  { x:  '120vw', y: '-80vh', rotate:  40 },
  { x: '-100vw', y:  '80vh', rotate: -30 },
  { x:  '100vw', y:  '60vh', rotate:  30 },
]

function PolaroidIntro({ onDone }) {
  const [phase, setPhase] = useState('fly-in') // fly-in → hold → fly-out → done

  useEffect(() => {
    // After all cards land (~1.4s), hold briefly, then scatter out
    const hold    = setTimeout(() => setPhase('fly-out'), 2200)
    const done    = setTimeout(() => onDone(),            3200)
    return () => { clearTimeout(hold); clearTimeout(done) }
  }, [onDone])

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: phase === 'fly-out' ? 0 : 1 }}
      transition={{ duration: 0.6, delay: phase === 'fly-out' ? 0.4 : 0 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'var(--bg)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        pointerEvents: phase === 'fly-out' ? 'none' : 'all',
      }}
    >
      {SLIDESHOW_IMAGES.map((src, i) => {
        const origin = ORIGINS[i]
        const land   = CARD_CONFIGS[i]
        return (
          <motion.div
            key={src}
            initial={{ x: origin.x, y: origin.y, rotate: origin.rotate, opacity: 0 }}
            animate={phase === 'fly-out'
              ? { x: ORIGINS[(i + 2) % 4].x, y: ORIGINS[(i + 2) % 4].y, rotate: origin.rotate * -1.5, opacity: 0 }
              : { x: land.x, y: land.y, rotate: land.rotate, opacity: 1 }
            }
            transition={phase === 'fly-out'
              ? { duration: 0.55, delay: i * 0.06, ease: [0.4, 0, 1, 1] }
              : { duration: 0.65, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] }
            }
            style={{
              position: 'absolute',
              width: 'clamp(180px, 22vw, 280px)',
              background: '#fff',
              borderRadius: 4,
              boxShadow: '0 8px 32px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.1)',
              padding: '10px 10px 32px',
            }}
          >
            <img
              src={src}
              alt=""
              style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover', display: 'block', borderRadius: 2 }}
            />
          </motion.div>
        )
      })}
    </motion.div>
  )
}

/* ── Filter pill ── */
function FilterPill({ label, active, onClick }) {
  return (
    <motion.button
      onClick={onClick}
      layout
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.97 }}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '6px 18px',
        borderRadius: 999,
        fontFamily: 'var(--sans)',
        fontSize: '0.82rem',
        fontWeight: 500,
        cursor: 'pointer',
        border: active ? '1.5px solid var(--accent)' : '1.5px solid var(--border)',
        background: active ? 'var(--accent-bg)' : 'transparent',
        color: active ? 'var(--accent)' : 'var(--text)',
        transition: 'background 0.2s, border-color 0.2s, color 0.2s',
      }}
    >
      {label.charAt(0).toUpperCase() + label.slice(1)}
    </motion.button>
  )
}

/* ── Single gallery item ── */
function GalleryItem({ item, onClick }) {
  const [hovered, setHovered] = useState(false)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.92 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      onClick={onClick}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      style={{
        position: 'relative',
        borderRadius: 'var(--radius)',
        overflow: 'hidden',
        cursor: 'pointer',
        breakInside: 'avoid',
        marginBottom: 16,
        boxShadow: 'var(--shadow)',
      }}
    >
      <img
        src={`/gallery/${item.category}/${item.filename}`}
        alt={item.caption}
        loading="lazy"
        style={{
          display: 'block',
          width: '100%',
          height: 'auto',
          transition: 'transform 0.5s ease',
          transform: hovered ? 'scale(1.05)' : 'scale(1)',
        }}
      />

      {/* Caption overlay — slides up on hover */}
      <motion.div
        animate={{ y: hovered ? 0 : '100%' }}
        transition={{ duration: 0.28, ease: 'easeOut' }}
        style={{
          position: 'absolute',
          bottom: 0, left: 0, right: 0,
          padding: '32px 14px 14px',
          background: 'linear-gradient(to top, rgba(0,0,0,0.78), transparent)',
        }}
      >
        <p style={{ color: '#fff', fontWeight: 500, fontSize: '0.875rem', margin: '0 0 6px' }}>
          {item.caption}
        </p>
        <span style={{
          padding: '2px 10px',
          borderRadius: 999,
          fontSize: '0.68rem',
          fontWeight: 600,
          background: 'rgba(255,255,255,0.15)',
          color: 'rgba(255,255,255,0.85)',
          textTransform: 'capitalize',
        }}>
          {item.category}
        </span>
      </motion.div>

      {/* Expand icon */}
      <motion.div
        animate={{ opacity: hovered ? 1 : 0, scale: hovered ? 1 : 0.7 }}
        transition={{ duration: 0.2 }}
        style={{
          position: 'absolute', top: 10, right: 10,
          width: 30, height: 30, borderRadius: '50%',
          background: 'rgba(0,0,0,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff',
        }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/>
          <line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>
        </svg>
      </motion.div>
    </motion.div>
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

  const slides = galleryData.map(item => ({
    src: `/gallery/${item.category}/${item.filename}`,
    alt: item.caption,
  }))

  const openLightbox = (item) => {
    const idx = galleryData.findIndex(d => d.filename === item.filename && d.category === item.category)
    setLightboxIndex(idx)
  }

  return (
    <div>
      <AnimatePresence>
        {showIntro && <PolaroidIntro onDone={() => setShowIntro(false)} />}
      </AnimatePresence>

      {/* Header */}
      <section style={{
        paddingTop: 'clamp(100px, 14vw, 160px)',
        paddingBottom: 'clamp(40px, 5vw, 64px)',
        background: 'var(--bg)',
        textAlign: 'center',
      }}>
        <div className="page-container">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="section-label">Photography</span>
            <h1 style={{ fontSize: 'clamp(2.2rem, 6vw, 4rem)', marginTop: 8, marginBottom: 16 }}>
              Gallery
            </h1>
            <p style={{ color: 'var(--text)', maxWidth: 440, margin: '0 auto', lineHeight: 1.7 }}>
              Moments captured through the lens — from landscapes to city life.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Category filter bar */}
      <section style={{ paddingBottom: 'clamp(32px, 4vw, 48px)', background: 'var(--bg)' }}>
        <div className="page-container">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}
          >
            {categories.map(cat => (
              <FilterPill
                key={cat}
                label={cat}
                active={activeCategory === cat}
                onClick={() => setActiveCategory(cat)}
              />
            ))}
          </motion.div>

          {/* Image count */}
          <motion.p
            key={activeCategory}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ textAlign: 'center', color: 'var(--text)', fontSize: '0.8rem', marginTop: 12 }}
          >
            {filtered.length} {filtered.length === 1 ? 'photo' : 'photos'}
            {activeCategory !== 'all' && ` in ${activeCategory}`}
          </motion.p>
        </div>
      </section>

      {/* Masonry grid */}
      <section style={{ paddingBottom: 'clamp(64px, 8vw, 96px)', background: 'var(--bg)' }}>
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
                <p style={{ marginBottom: 8 }}>No photos in this category yet.</p>
                <p style={{ fontSize: '0.82rem' }}>
                  Add images to <code>public/gallery/{activeCategory}/</code>
                </p>
              </motion.div>
            ) : (
              <motion.div
                key={activeCategory}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                style={{ columns: '3 260px', columnGap: 16 }}
              >
                {filtered.map((item, i) => (
                  <GalleryItem
                    key={`${item.category}/${item.filename}`}
                    item={item}
                    onClick={() => openLightbox(item)}
                  />
                ))}
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
