import { useState, useEffect, useRef, useMemo } from 'react'
import { motion, AnimatePresence, useInView } from 'framer-motion'
import Lightbox from 'yet-another-react-lightbox'
import 'yet-another-react-lightbox/styles.css'
import { DESIGNS, STORAGE_KEY, getPositionStyle } from '../components/ToastDesignPicker'
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
function GalleryCarousel({ items, onOpen, lightboxOpen }) {
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)

  const prev = () => setActive(i => (i - 1 + items.length) % items.length)
  const next = () => setActive(i => (i + 1) % items.length)

  // Auto-scroll every 3s — pauses on hover or when lightbox is open
  useEffect(() => {
    if (paused || lightboxOpen || items.length <= 1) return
    const id = setInterval(() => setActive(i => (i + 1) % items.length), 5000)
    return () => clearInterval(id)
  }, [paused, lightboxOpen, items.length])

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

/* ── 360° Panorama viewer ──
   True spherical viewer powered by photo-sphere-viewer (three.js / WebGL).
   Drag to look around with correct perspective on any screen width; pinch or
   scroll zooms — and because fisheye is on, zooming out curves the scene into a
   round "little planet" globe (Insta360 / Street-View style). */
function Panorama360({ pano, onClose }) {
  const containerRef = useRef(null)
  const src = pano.src.startsWith('http') ? pano.src : `${BASE}${pano.src}`
  const [ready, setReady] = useState(false)

  // Build the WebGL sphere viewer once per panorama. photo-sphere-viewer + three.js
  // (~620 KB) are dynamically imported here so they only download when a 360 view is
  // actually opened — they never weigh down the gallery or any other page.
  useEffect(() => {
    let viewer
    let cancelled = false
    ;(async () => {
      const [{ Viewer }] = await Promise.all([
        import('@photo-sphere-viewer/core'),
        import('@photo-sphere-viewer/core/index.css'),
      ])
      if (cancelled || !containerRef.current) return
      viewer = new Viewer({
        container: containerRef.current,
        panorama: src,
        navbar: false,
        fisheye: true,        // curves into a globe as you zoom out
        defaultZoomLvl: 40,
        minFov: 30,
        maxFov: 130,          // allow zooming out far enough to see the whole globe
        mousewheel: true,
        touchmoveTwoFingers: false,
        loadingTxt: '',
      })
      viewer.addEventListener('ready', () => setReady(true), { once: true })
    })()
    return () => { cancelled = true; viewer?.destroy() }
  }, [src])

  // Escape to close + lock body scroll while open
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [onClose])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 300,
        background: '#000',
        display: 'flex', flexDirection: 'column',
      }}
    >
      <div ref={containerRef} style={{ flex: 1, background: '#000', touchAction: 'none' }} />

      {/* Hide photo-sphere-viewer's built-in loader — we use our own below */}
      <style>{`.psv-loader-container{display:none!important}`}</style>

      {/* Loading overlay — a 360°-themed animation until the sphere is ready */}
      {!ready && (
        <div style={{
          position: 'absolute', inset: 0, background: '#000', zIndex: 10,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 22, color: '#fff', pointerEvents: 'none',
        }}>
          <div style={{ position: 'relative', width: 96, height: 96 }}>
            {/* Soft pulsing glow */}
            <motion.div
              animate={{ opacity: [0.25, 0.6, 0.25], scale: [0.9, 1.12, 0.9] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
              style={{ position: 'absolute', inset: -16, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.55) 0%, transparent 70%)', filter: 'blur(8px)' }}
            />
            {/* Rotating gradient ring */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.6, repeat: Infinity, ease: 'linear' }}
              style={{
                position: 'absolute', inset: 0, borderRadius: '50%',
                background: 'conic-gradient(from 0deg, transparent 0deg, #7c3aed 300deg, #a855f7 360deg)',
                WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 4px), #000 calc(100% - 4px))',
                mask: 'radial-gradient(farthest-side, transparent calc(100% - 4px), #000 calc(100% - 4px))',
              }}
            />
            {/* Dashed orbit path */}
            <div style={{ position: 'absolute', inset: 16, borderRadius: '50%', border: '1px dashed rgba(255,255,255,0.18)' }} />
            {/* Orbiting dot */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2.4, repeat: Infinity, ease: 'linear' }}
              style={{ position: 'absolute', inset: 16 }}
            >
              <span style={{ position: 'absolute', top: -4, left: '50%', transform: 'translateX(-50%)', width: 9, height: 9, borderRadius: '50%', background: '#fff', boxShadow: '0 0 10px 2px rgba(167,139,250,0.9)' }} />
            </motion.div>
            {/* Center globe */}
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <motion.svg
                width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
                animate={{ scale: [1, 1.08, 1] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
              >
                <circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18"/>
              </motion.svg>
            </div>
          </div>
          <span style={{ fontSize: '0.9rem', fontWeight: 600, letterSpacing: '0.04em' }}>Loading 360° view…</span>
        </div>
      )}

      {/* Title */}
      <div style={{
        position: 'absolute', top: 'clamp(16px, 4vw, 28px)', left: 'clamp(16px, 4vw, 32px)',
        color: '#fff', pointerEvents: 'none', textShadow: '0 2px 8px rgba(0,0,0,0.6)',
      }}>
        <div style={{ fontWeight: 800, fontSize: 'clamp(1.1rem, 3vw, 1.5rem)' }}>{pano.title}</div>
        {pano.location && (
          <div style={{ fontSize: '0.85rem', opacity: 0.8, marginTop: 2 }}>{pano.location}</div>
        )}
      </div>

      {/* Hint */}
      <div style={{
        position: 'absolute', bottom: 'clamp(20px, 5vw, 36px)', left: '50%', transform: 'translateX(-50%)',
        color: '#fff', fontSize: '0.8rem', opacity: 0.75, pointerEvents: 'none',
        display: 'inline-flex', alignItems: 'center', gap: 8,
        background: 'rgba(0,0,0,0.4)', padding: '8px 16px', borderRadius: 999,
        whiteSpace: 'nowrap',
      }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8L22 12L18 16"/><path d="M6 8L2 12L6 16"/><line x1="2" y1="12" x2="22" y2="12"/>
        </svg>
        Drag to look around · pinch or scroll to zoom into a globe
      </div>

      {/* Close */}
      <motion.button
        onClick={onClose}
        whileHover={{ scale: 1.1, background: 'rgba(255,255,255,0.25)' }}
        whileTap={{ scale: 0.92 }}
        aria-label="Close 360 view"
        style={{
          position: 'absolute', top: 'clamp(16px, 4vw, 28px)', right: 'clamp(16px, 4vw, 32px)',
          width: 44, height: 44, borderRadius: '50%',
          border: '1.5px solid rgba(255,255,255,0.4)',
          background: 'rgba(0,0,0,0.4)', color: '#fff', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </motion.button>
    </motion.div>
  )
}

/* ── 360 hint toast — reuses the site's shared toast design system ── */
function Pano360HintToast({ onDone }) {
  const designId = parseInt(localStorage.getItem(STORAGE_KEY) || '17')
  const design = DESIGNS.find(d => d.id === designId) || DESIGNS[16]
  const { Component, pos } = design
  const message = (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <motion.span animate={{ rotate: [0, 360] }} transition={{ duration: 3, repeat: Infinity, ease: 'linear' }} style={{ display: 'inline-block' }}>🌐</motion.span>
      Click to explore in 360°
      <motion.span animate={{ y: [0, -4, 0] }} transition={{ duration: 0.8, repeat: Infinity, repeatDelay: 0.4 }} style={{ display: 'inline-block' }}>👆</motion.span>
    </span>
  )
  return <div style={getPositionStyle(pos)}><Component message={message} onDone={onDone} /></div>
}

/* ── 360° section — featured panorama card ── */
function Panorama360Section() {
  const panoramas = cfg.gallery?.panoramas ?? []
  const [activePano, setActivePano] = useState(null)
  const [index, setIndex] = useState(0)
  const [loaded, setLoaded] = useState({})
  const [showHint, setShowHint] = useState(false)
  const [darkPill, setDarkPill] = useState(true)
  const sectionRef = useRef(null)
  const inView = useInView(sectionRef, { once: false, margin: '-80px' })

  // Auto-detect brightness behind the "Explore in 360°" pill (top-right of the card)
  // so the pill always contrasts with each photo: dark pill on bright areas, light
  // pill on dark areas.
  useEffect(() => {
    const cur = panoramas[index]
    if (!cur) return
    const t = cur.thumbnail || cur.src
    const url = t.startsWith('http') ? t : `${BASE}${t}`
    let cancelled = false
    const img = new Image()
    img.onload = () => {
      if (cancelled) return
      try {
        const cw = 80, ch = 40
        const canvas = document.createElement('canvas')
        canvas.width = cw; canvas.height = ch
        const ctx = canvas.getContext('2d', { willReadFrequently: true })
        ctx.drawImage(img, 0, 0, cw, ch)
        // Sample the top-right region (where the pill sits)
        const x0 = Math.floor(cw * 0.6)
        const h = Math.floor(ch * 0.5)
        const { data } = ctx.getImageData(x0, 0, cw - x0, h)
        let sum = 0, n = 0
        for (let i = 0; i < data.length; i += 4) {
          sum += 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]
          n++
        }
        const lum = n ? sum / n : 0
        setDarkPill(lum > 145) // bright area → dark pill for contrast
      } catch { /* tainted (cross-origin) image: keep current style */ }
    }
    img.src = url
    return () => { cancelled = true }
  }, [index, panoramas])

  // Show the hint a moment after the 360 section scrolls into view — every time.
  // Hidden while the viewer is open or the section leaves view; re-entering re-triggers it.
  useEffect(() => {
    if (!inView || activePano) { setShowHint(false); return }
    const showT = setTimeout(() => setShowHint(true), 1200)
    return () => clearTimeout(showT)
  }, [inView, activePano])

  // Auto-hide the hint after it has been visible for a bit
  useEffect(() => {
    if (!showHint) return
    const hideT = setTimeout(() => setShowHint(false), 6500)
    return () => clearTimeout(hideT)
  }, [showHint])

  // Background prefetch the full-res panoramas during browser idle time, so the
  // card preview and the viewer are already cached — no lag, no blocking the page.
  useEffect(() => {
    if (panoramas.length === 0) return
    const idle = window.requestIdleCallback || (cb => setTimeout(cb, 1500))
    const cancelIdle = window.cancelIdleCallback || clearTimeout
    const handle = idle(() => {
      panoramas.forEach(p => {
        const img = new Image()
        img.src = p.src.startsWith('http') ? p.src : `${BASE}${p.src}`
      })
    })
    return () => cancelIdle(handle)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (panoramas.length === 0) return null

  const current = panoramas[index]
  // Card preview: use the dedicated thumbnail if provided, else fall back to the
  // full 360 image flattened. The viewer always loads the full `src`.
  const resolve = (p) => (p.startsWith('http') ? p : `${BASE}${p}`)
  const currentThumb = resolve(current.thumbnail || current.src)
  const multiple = panoramas.length > 1
  const go = (dir) => setIndex(i => (i + dir + panoramas.length) % panoramas.length)
  const openViewer = () => setActivePano(current)

  return (
    <section ref={sectionRef} style={{ paddingBottom: 'clamp(64px, 8vw, 96px)' }}>
      <div className="page-container">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          style={{ textAlign: 'center', marginBottom: 'clamp(28px, 4vw, 44px)' }}
        >
          <span className="section-label">Immersive</span>
          <h2 style={{ fontSize: 'clamp(1.8rem, 5vw, 3rem)', marginTop: 8, marginBottom: 12 }}>
            360° Interactive Views
          </h2>
          <p style={{ color: 'var(--text)', maxWidth: 460, margin: '0 auto', lineHeight: 1.7 }}>
            Step inside the scene — open a panorama and look all the way around.
          </p>
        </motion.div>

        {/* Featured panorama card — click anywhere to open the 360 viewer */}
        <motion.div
          className="pano-feature"
          onClick={openViewer}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openViewer() } }}
          aria-label={`Open ${current.title} in 360 view`}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Slide image (crossfades between panoramas) */}
          <AnimatePresence mode="wait">
            <motion.img
              key={current.src}
              src={currentThumb}
              alt={current.title}
              decoding="async"
              onLoad={() => setLoaded(s => ({ ...s, [index]: true }))}
              className="pano-feature-img"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            />
          </AnimatePresence>

          {!loaded[index] && <div className="pano-feature-shimmer" />}

          {/* Dark scrim for legibility */}
          <div className="pano-feature-scrim" />

          {/* Explore pill — colour auto-adapts to the area behind it */}
          <span
            className="pano-feature-explore"
            style={darkPill ? undefined : {
              background: 'rgba(255,255,255,0.82)',
              color: '#111',
              borderColor: 'rgba(0,0,0,0.12)',
              textShadow: 'none',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <ellipse cx="12" cy="12" rx="10" ry="4.5"/><path d="M2 12a10 4.5 0 0 0 20 0"/>
            </svg>
            Explore in 360°
          </span>

          {/* Headline caption */}
          <div className="pano-feature-caption-wrap">
            <p className="pano-feature-caption">{current.caption || current.title}</p>
          </div>

          {/* Bottom bar: identity · dots · arrows */}
          <div className="pano-feature-bar">
            <div className="pano-feature-id">
              <span className="pano-feature-id-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18"/>
                </svg>
              </span>
              <div>
                <div className="pano-feature-id-title">{current.title}</div>
                {current.location && <div className="pano-feature-id-sub">{current.location}</div>}
              </div>
            </div>

            {multiple && (
              <div className="pano-feature-dots" onClick={(e) => e.stopPropagation()}>
                {panoramas.map((p, i) => (
                  <button
                    key={p.title}
                    className={`pano-feature-dot${i === index ? ' is-active' : ''}`}
                    onClick={(e) => { e.stopPropagation(); setIndex(i) }}
                    aria-label={`Go to ${p.title}`}
                  />
                ))}
              </div>
            )}

            {multiple && (
              <div className="pano-feature-nav" onClick={(e) => e.stopPropagation()}>
                <button onClick={(e) => { e.stopPropagation(); go(-1) }} aria-label="Previous panorama">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                </button>
                <span className="pano-feature-nav-divider" />
                <button onClick={(e) => { e.stopPropagation(); go(1) }} aria-label="Next panorama">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {showHint && <Pano360HintToast onDone={() => setShowHint(false)} />}
      </AnimatePresence>

      <AnimatePresence>
        {activePano && <Panorama360 pano={activePano} onClose={() => setActivePano(null)} />}
      </AnimatePresence>

      {/* Scoped styles — mobile/desktop isolated via media query */}
      <style>{`
        .pano-feature {
          position: relative;
          width: 100%;
          aspect-ratio: 21 / 9;
          border-radius: clamp(16px, 2vw, 28px);
          overflow: hidden;
          cursor: pointer;
          background: var(--card-bg);
          box-shadow: 0 30px 70px rgba(0,0,0,0.35);
          outline: none;
        }
        .pano-feature:focus-visible { box-shadow: 0 0 0 3px var(--accent), 0 30px 70px rgba(0,0,0,0.35); }
        .pano-feature-img {
          position: absolute; inset: 0;
          width: 100%; height: 100%;
          object-fit: cover; display: block;
          transition: transform 0.6s ease;
        }
        .pano-feature:hover .pano-feature-img { transform: scale(1.04); }
        .pano-feature-shimmer {
          position: absolute; inset: 0;
          background: linear-gradient(100deg, var(--card-bg) 30%, var(--border) 50%, var(--card-bg) 70%);
          background-size: 200% 100%;
          animation: pano-shimmer 1.4s infinite linear;
        }
        @keyframes pano-shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .pano-feature-scrim {
          position: absolute; inset: 0; pointer-events: none;
          background:
            linear-gradient(95deg, rgba(0,0,0,0.74) 0%, rgba(0,0,0,0.42) 30%, rgba(0,0,0,0.05) 58%, rgba(0,0,0,0) 78%),
            linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0) 40%);
        }
        .pano-feature-explore {
          position: absolute; top: clamp(14px, 2vw, 22px); right: clamp(14px, 2vw, 22px);
          display: inline-flex; align-items: center; gap: 6px;
          padding: 7px 14px; border-radius: 999px;
          background: rgba(0,0,0,0.5); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.28);
          color: #fff; font-size: 0.74rem; font-weight: 700; letter-spacing: 0.02em;
          text-shadow: 0 1px 6px rgba(0,0,0,0.55);
          pointer-events: none;
        }
        .pano-feature-caption-wrap {
          position: absolute; inset: 0; pointer-events: none;
          display: flex; flex-direction: column; justify-content: center;
          padding: clamp(24px, 4vw, 56px);
        }
        .pano-feature-caption {
          margin: 0; max-width: 46%;
          color: #fff; font-weight: 700;
          font-size: clamp(1.15rem, 2.4vw, 2rem); line-height: 1.25;
          text-shadow: 0 2px 16px rgba(0,0,0,0.45);
        }
        .pano-feature-bar {
          position: absolute; left: 0; right: 0; bottom: 0;
          display: flex; align-items: center; justify-content: space-between; gap: 14px;
          padding: clamp(16px, 3vw, 28px) clamp(18px, 4vw, 40px);
        }
        .pano-feature-id { display: flex; align-items: center; gap: 12px; pointer-events: none; min-width: 0; }
        .pano-feature-id-icon {
          width: 44px; height: 44px; border-radius: 50%; flex-shrink: 0;
          background: rgba(255,255,255,0.16); border: 1px solid rgba(255,255,255,0.35);
          backdrop-filter: blur(6px); color: #fff;
          display: flex; align-items: center; justify-content: center;
        }
        .pano-feature-id-title { color: #fff; font-weight: 700; font-size: 0.95rem; }
        .pano-feature-id-sub { color: rgba(255,255,255,0.78); font-size: 0.8rem; margin-top: 1px; }
        .pano-feature-dots {
          display: flex; align-items: center; gap: 7px;
          padding: 9px 16px; border-radius: 999px;
          background: rgba(0,0,0,0.3); backdrop-filter: blur(6px);
        }
        .pano-feature-dot {
          width: 18px; height: 5px; border-radius: 999px; border: none; padding: 0;
          background: rgba(255,255,255,0.4); cursor: pointer;
          transition: width 0.3s ease, background 0.3s ease;
        }
        .pano-feature-dot.is-active { width: 30px; background: #fff; }
        .pano-feature-nav {
          display: flex; align-items: center; flex-shrink: 0;
          background: rgba(255,255,255,0.92); border-radius: 999px; overflow: hidden;
          backdrop-filter: blur(6px);
        }
        .pano-feature-nav button {
          border: none; background: transparent; cursor: pointer; color: #111;
          padding: 9px 13px; display: flex; align-items: center; justify-content: center;
          transition: background 0.2s ease;
        }
        .pano-feature-nav button:hover { background: rgba(0,0,0,0.07); }
        .pano-feature-nav-divider { width: 1px; align-self: stretch; background: rgba(0,0,0,0.15); }

        @media (max-width: 768px) {
          .pano-feature { aspect-ratio: 4 / 5; }
          .pano-feature-caption { max-width: 90%; }
          .pano-feature-bar { flex-wrap: wrap; gap: 12px; }
          .pano-feature-id-icon { width: 38px; height: 38px; }
        }
      `}</style>
    </section>
  )
}

/* ── 360° Spheres (TEST section) ──
   Image-Spheres style: panorama thumbnails are distributed on the surface of a
   3D globe that auto-rotates and can be dragged to spin. Back tiles are smaller
   and dimmer (depth). Clicking a tile opens it in the same WebGL 360 viewer. */

// Even point distribution on a unit sphere (Fibonacci lattice).
function fibonacciSphere(n) {
  if (n <= 0) return []
  if (n === 1) return [{ x: 0, y: 0, z: 1 }]
  const pts = []
  const phi = Math.PI * (3 - Math.sqrt(5)) // golden angle
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 2
    const r = Math.sqrt(1 - y * y)
    const theta = phi * i
    pts.push({ x: Math.cos(theta) * r, y, z: Math.sin(theta) * r })
  }
  return pts
}

function PanoramaSpheresSection() {
  const panoramas = cfg.gallery?.panoramas ?? []
  const [activePano, setActivePano] = useState(null)
  const stageRef = useRef(null)
  const tileRefs = useRef([])
  const anim = useRef({
    rotX: -0.25, rotY: 0, velX: 0, velY: 0.0022,
    dragging: false, lastX: 0, lastY: 0, moved: 0, R: 220, downIdx: -1,
  })

  const points = useMemo(() => fibonacciSphere(panoramas.length), [panoramas.length])
  const resolve = (p) => (p.startsWith('http') ? p : `${BASE}${p}`)

  // Keep sphere radius responsive to the stage size.
  useEffect(() => {
    const measure = () => {
      const el = stageRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      anim.current.R = Math.min(rect.width, rect.height) * 0.36
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  // Animation loop — rotate points, project to 2D, apply depth cues.
  useEffect(() => {
    const s = anim.current
    const BASE_SPIN_Y = 0.0022 // gentle idle drift…
    const BASE_SPIN_X = 0.0008 // …with a slight vertical tumble so all spheres move
    let raf
    const frame = () => {
      if (!s.dragging) {
        s.rotY += s.velY
        s.rotX += s.velX
        // ease inertia back toward the gentle diagonal auto-spin
        s.velY += (BASE_SPIN_Y - s.velY) * 0.03
        s.velX += (BASE_SPIN_X - s.velX) * 0.03
      }
      // no clamp — free rotation in every direction

      const cosY = Math.cos(s.rotY), sinY = Math.sin(s.rotY)
      const cosX = Math.cos(s.rotX), sinX = Math.sin(s.rotX)

      points.forEach((p, i) => {
        const el = tileRefs.current[i]
        if (!el) return
        // rotate around Y then X
        const x1 = p.x * cosY + p.z * sinY
        const z1 = -p.x * sinY + p.z * cosY
        const y2 = p.y * cosX - z1 * sinX
        const z2 = p.y * sinX + z1 * cosX
        const t = (z2 + 1) / 2 // 0 = back, 1 = front
        const scale = 0.3 + t * t * 1.15 // near → big, far → small (eased for depth)
        el.style.transform = `translate(-50%, -50%) translate3d(${(x1 * s.R).toFixed(2)}px, ${(y2 * s.R).toFixed(2)}px, 0) scale(${scale.toFixed(3)})`
        el.style.zIndex = String(Math.round(t * 100))
        el.style.opacity = (0.22 + t * 0.78).toFixed(3)
        el.style.filter = `brightness(${(0.5 + t * 0.5).toFixed(3)})`
      })
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [points])

  const onPointerDown = (e) => {
    const s = anim.current
    s.dragging = true; s.moved = 0
    s.lastX = e.clientX; s.lastY = e.clientY
    // Remember which sphere the press started on — pointer capture would
    // otherwise stop the button's own click from firing.
    const tileEl = e.target?.closest?.('.sph-tile')
    s.downIdx = tileEl ? Number(tileEl.dataset.idx) : -1
    e.currentTarget.setPointerCapture?.(e.pointerId)
  }
  const onPointerMove = (e) => {
    const s = anim.current
    if (!s.dragging) return
    const dx = e.clientX - s.lastX
    const dy = e.clientY - s.lastY
    s.lastX = e.clientX; s.lastY = e.clientY
    s.moved += Math.abs(dx) + Math.abs(dy)
    s.rotY += dx * 0.005
    s.rotX += dy * 0.005
    s.velY = dx * 0.005
    s.velX = dy * 0.005
  }
  const onPointerUp = (e) => {
    const s = anim.current
    // A tap (barely moved) on a sphere opens its 360 view.
    if (s.moved < 8 && s.downIdx >= 0 && panoramas[s.downIdx]) {
      setActivePano(panoramas[s.downIdx])
    }
    s.dragging = false
    s.downIdx = -1
    e.currentTarget.releasePointerCapture?.(e.pointerId)
  }

  if (panoramas.length === 0) return null

  return (
    <section style={{ paddingBottom: 'clamp(72px, 9vw, 120px)' }}>
      <div className="page-container">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          style={{ textAlign: 'center', marginBottom: 'clamp(28px, 4vw, 44px)' }}
        >
          <span className="section-label">Experimental</span>
          <h2 style={{ fontSize: 'clamp(1.8rem, 5vw, 3rem)', marginTop: 8, marginBottom: 12 }}>
            360° Spheres
          </h2>
          <p style={{ color: 'var(--text)', maxWidth: 460, margin: '0 auto', lineHeight: 1.7 }}>
            Drag to spin the globe — tap any image to step inside the panorama.
          </p>
        </motion.div>

        <div
          ref={stageRef}
          className="sph-stage"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <div className="sph-glow" />
          {panoramas.map((p, i) => {
            const thumb = resolve(p.thumbnail || p.src)
            return (
              <button
                key={p.title}
                ref={(el) => (tileRefs.current[i] = el)}
                className="sph-tile"
                data-idx={i}
                aria-label={`Open ${p.title} in 360 view`}
              >
                <img src={thumb} alt={p.title} draggable={false} />
                <span className="sph-tile-shade" />
                <span className="sph-tile-gloss" />
              </button>
            )
          })}
        </div>
      </div>

      <AnimatePresence>
        {activePano && <Panorama360 pano={activePano} onClose={() => setActivePano(null)} />}
      </AnimatePresence>

      {/* Scoped styles — mobile/desktop isolated via media query */}
      <style>{`
        .sph-stage {
          position: relative; width: 100%;
          height: clamp(380px, 58vw, 580px);
          perspective: 1400px;
          touch-action: none; cursor: grab;
          user-select: none; -webkit-user-select: none;
        }
        .sph-stage:active { cursor: grabbing; }
        .sph-glow {
          position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%);
          width: 62%; aspect-ratio: 1/1; border-radius: 50%; pointer-events: none;
          background: radial-gradient(circle, rgba(124,58,237,0.28) 0%, rgba(124,58,237,0.06) 45%, transparent 70%);
          filter: blur(34px); z-index: 0;
        }
        .sph-tile {
          position: absolute; left: 50%; top: 50%;
          width: clamp(80px, 10vw, 140px); aspect-ratio: 1 / 1;
          border: none; padding: 0; background: none; cursor: pointer;
          border-radius: 50%; overflow: hidden;
          box-shadow: 0 16px 40px rgba(0,0,0,0.5);
          will-change: transform, opacity, filter;
        }
        .sph-tile img {
          width: 100%; height: 100%; object-fit: cover; display: block;
          pointer-events: none; border-radius: 50%;
          transform: scale(1.12); /* slight zoom to read as a bulging sphere */
        }
        /* Spherical depth: bright convex centre → darkened rim (fisheye look) */
        .sph-tile-shade {
          position: absolute; inset: 0; border-radius: 50%; pointer-events: none;
          background: radial-gradient(circle at 50% 50%, rgba(0,0,0,0) 44%, rgba(0,0,0,0.55) 100%);
          box-shadow: inset 0 0 0 1.5px rgba(255,255,255,0.22), inset 0 0 20px rgba(0,0,0,0.45);
        }
        /* Glass specular highlights */
        .sph-tile-gloss {
          position: absolute; inset: 0; border-radius: 50%; pointer-events: none;
          background:
            radial-gradient(circle at 32% 25%, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0) 38%),
            radial-gradient(circle at 72% 80%, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0) 24%);
        }
        .sph-tile:hover { box-shadow: 0 0 0 3px var(--accent), 0 18px 46px rgba(124,58,237,0.5); }
        .sph-tile:focus-visible { outline: none; box-shadow: 0 0 0 3px var(--accent); }
      `}</style>
    </section>
  )
}

/* ── Main Gallery page ── */
export default function Gallery() {
  const [showIntro, setShowIntro] = useState(true)
  const categories = ['All', ...Array.from(new Set(galleryData.map(p => p.category))).sort()]
  const [activeCategory, setActiveCategory] = useState('All')
  const [lightboxIndex, setLightboxIndex] = useState(-1)

  const sortedData = galleryData.slice().sort((a, b) => {
    const catA = a.category === 'Portrait' ? '' : a.category
    const catB = b.category === 'Portrait' ? '' : b.category
    if (catA !== catB) return catA.localeCompare(catB)
    return a.filename.localeCompare(b.filename)
  })

  const filtered = activeCategory === 'All'
    ? sortedData
    : sortedData.filter(p => p.category === activeCategory)

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
            {activeCategory !== 'All' && ` in ${activeCategory}`}
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
                  lightboxOpen={lightboxIndex >= 0}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Shutterstock link */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false }}
            transition={{ duration: 0.5, delay: 0.2 }}
            style={{ textAlign: 'center', marginTop: 32, paddingBottom: 8 }}
          >
            <p style={{ fontSize: '0.82rem', color: 'var(--text)', opacity: 0.6, marginBottom: 10 }}>
              Want to see more of my photography?
            </p>
            <a
              href={cfg.gallery?.shutterstockUrl || 'https://www.shutterstock.com/g/siva+shanmuga+vadivel'}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '10px 24px', borderRadius: 999,
                background: 'var(--accent)', color: '#fff',
                fontSize: '0.8rem', fontWeight: 600,
                textDecoration: 'none', letterSpacing: '0.03em',
                boxShadow: '0 4px 16px rgba(124,58,237,0.3)',
                transition: 'filter 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.15)'}
              onMouseLeave={e => e.currentTarget.style.filter = 'none'}
            >
              Visit My Shutterstock
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 17L17 7M17 7H7M17 7v10" />
              </svg>
            </a>
          </motion.div>
        </div>
      </section>

      {/* ── 360° Interactive Views ── */}
      <Panorama360Section />

      {/* ── 360° Spheres (TEST section) ── */}
      <PanoramaSpheresSection />

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
