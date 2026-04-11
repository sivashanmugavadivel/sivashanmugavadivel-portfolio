import { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { motion } from 'framer-motion'
import { tagColor } from '../../data/tagMeta'
import Lightbox from 'yet-another-react-lightbox'
import 'yet-another-react-lightbox/styles.css'

const BASE = import.meta.env.BASE_URL

function imgSrc(src) {
  if (!src) return ''
  if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('//')) return src
  return `${BASE}${src.replace(/^\//, '')}`
}

// ─── Callout variant colors ───────────────────────────────────────────────────
const CALLOUT_COLORS = {
  tip:     '#22c55e',
  warning: '#f59e0b',
  info:    '#3b82f6',
  note:    '#7c3aed',
}
const CALLOUT_ICONS = { tip: '💡', warning: '⚠️', info: 'ℹ️', note: '📌' }

// ─── Section renderers ────────────────────────────────────────────────────────
function SectionText({ section }) {
  return (
    <div className="magazine-prose jp-text" style={{ overflow: 'hidden' }}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{section.body}</ReactMarkdown>
    </div>
  )
}

const SectionHeading = ({ heading, color }) => heading ? (
  <h3 style={{
    margin: '0 0 10px', fontSize: '0.88rem', fontWeight: 800,
    textTransform: 'uppercase', letterSpacing: '0.08em', color: color || 'var(--text-h)',
  }}>{heading}</h3>
) : null

function SectionImage({ section, color }) {
  const [open, setOpen] = useState(false)
  const align = section.align || 'center'
  const float = section.float
  const size = section.size || 'full'
  const sizeMap = { small: '30%', medium: '50%', large: '75%', full: '100%' }
  const resolvedWidth = sizeMap[size] || size

  const imgEl = (maxH) => (
    <img
      src={imgSrc(section.src)}
      alt={section.alt || ''}
      onClick={() => setOpen(true)}
      style={{ width: '100%', display: 'block', objectFit: 'cover', maxHeight: maxH, cursor: 'zoom-in' }}
    />
  )

  // Float mode
  if (float) {
    return (
      <>
        <SectionHeading heading={section.heading} color={color} />
        <motion.figure
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: false }}
          transition={{ duration: 0.5 }}
          style={{
            float, width: resolvedWidth,
            margin: float === 'right' ? '8px 0 16px 24px' : '8px 24px 16px 0',
            borderRadius: 12, overflow: 'hidden',
            boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
          }}
        >
          {imgEl(300)}
          {section.caption && (
            <figcaption style={{ textAlign: 'center', fontSize: '0.72rem', color: 'var(--text)', opacity: 0.6, padding: '6px 8px', fontStyle: 'italic', background: 'var(--card-bg)' }}>
              {section.caption}
            </figcaption>
          )}
        </motion.figure>
        <Lightbox open={open} close={() => setOpen(false)} slides={[{ src: imgSrc(section.src) }]} />
      </>
    )
  }

  // Normal block mode
  const alignStyles = {
    left:   { marginRight: 'auto', marginLeft: 0 },
    center: { marginRight: 'auto', marginLeft: 'auto' },
    right:  { marginRight: 0,      marginLeft: 'auto' },
  }

  return (
    <>
      <SectionHeading heading={section.heading} color={color} />
      <motion.figure
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false }}
        transition={{ duration: 0.5 }}
        style={{ margin: '4px 0 24px', width: resolvedWidth, borderRadius: 12, overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.12)', ...alignStyles[align] }}
      >
        {imgEl(420)}
        {section.caption && (
          <figcaption style={{ textAlign: align === 'center' ? 'center' : align, fontSize: '0.78rem', color: 'var(--text)', opacity: 0.6, padding: '6px 8px', fontStyle: 'italic' }}>
            {section.caption}
          </figcaption>
        )}
      </motion.figure>
      <Lightbox open={open} close={() => setOpen(false)} slides={[{ src: imgSrc(section.src) }]} />
    </>
  )
}

function SectionGallery({ section, color }) {
  const images = section.images || []
  const [active, setActive] = useState(0)
  const [lightboxIndex, setLightboxIndex] = useState(-1)
  const [paused, setPaused] = useState(false)
  const touchX = { current: null }

  const prev = () => setActive(i => (i - 1 + images.length) % images.length)
  const next = () => setActive(i => (i + 1) % images.length)

  // Auto-scroll every 2s, pauses on hover
  useEffect(() => {
    if (paused || images.length <= 1) return
    const id = setInterval(() => setActive(i => (i + 1) % images.length), 2000)
    return () => clearInterval(id)
  }, [paused, images.length])

  const handleTouchStart = (e) => { touchX.current = e.touches[0].clientX }
  const handleTouchEnd = (e) => {
    if (touchX.current === null) return
    const dx = e.changedTouches[0].clientX - touchX.current
    if (Math.abs(dx) > 40) dx < 0 ? next() : prev()
    touchX.current = null
  }

  // Position config relative to active index
  function getPos(i) {
    const total = images.length
    let diff = i - active
    // Wrap around
    if (diff > total / 2) diff -= total
    if (diff < -total / 2) diff += total

    if (diff === 0)  return { x: '0%',    scale: 1,    zIndex: 10, rotateY: 0,   opacity: 1,    blur: 0 }
    if (diff === 1)  return { x: '52%',   scale: 0.78, zIndex: 7,  rotateY: -28, opacity: 0.85, blur: 0 }
    if (diff === -1) return { x: '-52%',  scale: 0.78, zIndex: 7,  rotateY: 28,  opacity: 0.85, blur: 0 }
    if (diff === 2)  return { x: '88%',   scale: 0.58, zIndex: 4,  rotateY: -42, opacity: 0.55, blur: 2 }
    if (diff === -2) return { x: '-88%',  scale: 0.58, zIndex: 4,  rotateY: 42,  opacity: 0.55, blur: 2 }
    return                  { x: '120%',  scale: 0.4,  zIndex: 1,  rotateY: -55, opacity: 0,    blur: 4 }
  }

  return (
    <div style={{ margin: '32px 0' }}>
      {section.heading && (
        <h3 style={{ margin: '0 0 20px', fontSize: '0.88rem', color: color || 'var(--text-h)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'center' }}>
          {section.heading}
        </h3>
      )}

      {/* Carousel */}
      <div
        style={{ position: 'relative', height: 320, perspective: 1200, overflow: 'hidden' }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {images.map((img, i) => {
          const pos = getPos(i)
          return (
            <motion.div
              key={i}
              onClick={() => i === active ? setLightboxIndex(i) : setActive(i)}
              animate={{
                x: pos.x, scale: pos.scale, rotateY: pos.rotateY,
                opacity: pos.opacity, filter: `blur(${pos.blur}px)`,
                zIndex: pos.zIndex,
              }}
              transition={{ type: 'spring', stiffness: 260, damping: 28 }}
              style={{
                position: 'absolute',
                top: '50%', left: '50%',
                marginTop: -130, marginLeft: -140,
                width: 280, height: 260,
                borderRadius: 16, overflow: 'hidden',
                cursor: 'pointer',
                boxShadow: i === active
                  ? '0 20px 60px rgba(0,0,0,0.35)'
                  : '0 8px 24px rgba(0,0,0,0.2)',
                transformStyle: 'preserve-3d',
              }}
            >
              <img
                src={imgSrc(img.src)}
                alt={img.alt || ''}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
              {/* Caption overlay on active */}
              {i === active && img.caption && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0,
                    padding: '10px 14px',
                    background: 'linear-gradient(transparent, rgba(0,0,0,0.6))',
                    color: '#fff', fontSize: '0.75rem', fontStyle: 'italic',
                  }}
                >
                  {img.caption}
                </motion.div>
              )}
              {/* Expand icon on active card */}
              {i === active && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{
                    position: 'absolute', top: 8, right: 8,
                    background: 'rgba(0,0,0,0.45)', borderRadius: 6,
                    padding: '4px 6px', color: '#fff', fontSize: '0.7rem',
                    pointerEvents: 'none',
                  }}
                >
                  ⛶
                </motion.div>
              )}
            </motion.div>
          )
        })}
      </div>

      {/* Navigation */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 20 }}>
        <motion.button
          onClick={prev} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
          style={{
            width: 40, height: 40, borderRadius: '50%', border: '1.5px solid var(--border)',
            background: 'var(--card-bg)', cursor: 'pointer', color: 'var(--text)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem',
          }}
        >←</motion.button>
        <motion.div
          key={active}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          style={{ minWidth: 64, textAlign: 'center', fontFamily: 'var(--sans)', userSelect: 'none' }}
        >
          <span style={{ fontSize: '1.2rem', fontWeight: 700, color: color || 'var(--accent)' }}>{active + 1}</span>
          <span style={{ fontSize: '0.95rem', color: 'var(--text)', margin: '0 4px' }}>/</span>
          <span style={{ fontSize: '0.95rem', color: 'var(--text)' }}>{images.length}</span>
        </motion.div>
        <motion.button
          onClick={next} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
          style={{
            width: 40, height: 40, borderRadius: '50%', border: '1.5px solid var(--border)',
            background: 'var(--card-bg)', cursor: 'pointer', color: 'var(--text)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem',
          }}
        >→</motion.button>
      </div>

      <Lightbox
        open={lightboxIndex >= 0}
        index={lightboxIndex}
        close={() => setLightboxIndex(-1)}
        slides={images.map(img => ({ src: imgSrc(img.src), alt: img.alt || '' }))}
        on={{ view: ({ index }) => setLightboxIndex(index) }}
      />
    </div>
  )
}

// Extract YouTube video ID from any URL format or bare ID
function extractYouTubeId(input) {
  if (!input) return null
  // Already a bare ID (no slashes or dots)
  if (/^[a-zA-Z0-9_-]{11}$/.test(input)) return input
  // youtube.com/watch?v=ID
  const watchMatch = input.match(/[?&]v=([a-zA-Z0-9_-]{11})/)
  if (watchMatch) return watchMatch[1]
  // youtu.be/ID or youtube.com/shorts/ID or youtube.com/embed/ID
  const pathMatch = input.match(/(?:youtu\.be\/|\/shorts\/|\/embed\/|\/v\/)([a-zA-Z0-9_-]{11})/)
  if (pathMatch) return pathMatch[1]
  return null
}

/* Single video embed */
function SingleVideo({ youtubeId, src, caption, color }) {
  return (
    <div>
      <div style={{
        position: 'relative', paddingBottom: '56.25%', height: 0,
        borderRadius: 12, overflow: 'hidden',
        boxShadow: `0 4px 24px ${color}22`,
        border: `1px solid ${color}33`,
      }}>
        {youtubeId ? (
          <iframe
            src={`https://www.youtube.com/embed/${youtubeId}`}
            title={caption || 'Video'}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
          />
        ) : src ? (
          <video controls style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
            <source src={imgSrc(src)} />
          </video>
        ) : null}
      </div>
      {caption && (
        <p style={{ textAlign: 'center', fontSize: '0.78rem', color: 'var(--text)', opacity: 0.6, marginTop: 8, fontStyle: 'italic' }}>
          {caption}
        </p>
      )}
    </div>
  )
}

/* Video carousel — same 3D drag style as SectionGallery */
function VideoCarousel({ videos, color }) {
  const [active, setActive] = useState(0)
  const touchX = { current: null }

  const prev = () => setActive(i => (i - 1 + videos.length) % videos.length)
  const next = () => setActive(i => (i + 1) % videos.length)

  const handleTouchStart = (e) => { touchX.current = e.touches[0].clientX }
  const handleTouchEnd = (e) => {
    if (touchX.current === null) return
    const dx = e.changedTouches[0].clientX - touchX.current
    if (Math.abs(dx) > 40) dx < 0 ? next() : prev()
    touchX.current = null
  }

  function getPos(i) {
    const total = videos.length
    let diff = i - active
    if (diff > total / 2) diff -= total
    if (diff < -total / 2) diff += total
    if (diff === 0)  return { x: '0%',   scale: 1,    zIndex: 10, rotateY: 0,   opacity: 1,    blur: 0 }
    if (diff === 1)  return { x: '52%',  scale: 0.78, zIndex: 7,  rotateY: -28, opacity: 0.85, blur: 0 }
    if (diff === -1) return { x: '-52%', scale: 0.78, zIndex: 7,  rotateY: 28,  opacity: 0.85, blur: 0 }
    if (diff === 2)  return { x: '88%',  scale: 0.58, zIndex: 4,  rotateY: -42, opacity: 0.55, blur: 2 }
    if (diff === -2) return { x: '-88%', scale: 0.58, zIndex: 4,  rotateY: 42,  opacity: 0.55, blur: 2 }
    return                 { x: '120%', scale: 0.4,  zIndex: 1,  rotateY: -55, opacity: 0,    blur: 4 }
  }

  return (
    <div>
      {/* Stage */}
      <div
        style={{ position: 'relative', height: 260, perspective: 1200, overflow: 'hidden' }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {videos.map((v, i) => {
          const pos = getPos(i)
          const vid = extractYouTubeId(v.youtubeId)
          const thumb = vid ? `https://img.youtube.com/vi/${vid}/hqdefault.jpg` : null
          const isCenter = i === active
          if (pos.opacity === 0) return null
          return (
            <motion.div
              key={i}
              onClick={() => !isCenter && setActive(i)}
              animate={{ x: pos.x, scale: pos.scale, rotateY: pos.rotateY, opacity: pos.opacity, filter: `blur(${pos.blur}px)`, zIndex: pos.zIndex }}
              transition={{ type: 'spring', stiffness: 260, damping: 28 }}
              drag={isCenter ? 'x' : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.15}
              onDragEnd={(_, info) => { if (info.offset.x < -60) next(); else if (info.offset.x > 60) prev() }}
              style={{
                position: 'absolute', top: '50%', left: '50%',
                marginTop: -110, marginLeft: -160,
                width: 320, height: 220,
                borderRadius: 12, overflow: 'hidden',
                cursor: isCenter ? 'grab' : 'pointer',
                boxShadow: isCenter ? `0 20px 60px ${color}44` : '0 8px 24px rgba(0,0,0,0.2)',
                transformStyle: 'preserve-3d',
                background: '#000',
              }}
            >
              {isCenter ? (
                /* Center — show actual iframe */
                <iframe
                  src={vid ? `https://www.youtube.com/embed/${vid}` : undefined}
                  title={v.caption || 'Video'}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  style={{ width: '100%', height: '100%', border: 'none' }}
                />
              ) : (
                /* Side cards — show thumbnail */
                <>
                  {thumb && <img src={thumb} alt={v.caption || ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="#000"><polygon points="5,3 19,12 5,21"/></svg>
                    </div>
                  </div>
                </>
              )}
              {/* Caption on center */}
              {isCenter && v.caption && (
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '6px 12px', background: 'linear-gradient(transparent, rgba(0,0,0,0.7))', color: '#fff', fontSize: '0.72rem', fontStyle: 'italic' }}>
                  {v.caption}
                </div>
              )}
            </motion.div>
          )
        })}
      </div>
      {/* Nav */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 16, alignItems: 'center' }}>
        <motion.button onClick={prev} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
          style={{ width: 40, height: 40, borderRadius: '50%', border: `1.5px solid ${color}`, background: 'transparent', cursor: 'pointer', color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15,18 9,12 15,6"/></svg>
        </motion.button>
        <motion.div key={active} initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
          style={{ minWidth: 56, textAlign: 'center', fontFamily: 'var(--sans)', userSelect: 'none' }}>
          <span style={{ fontSize: '1.1rem', fontWeight: 700, color }}>{active + 1}</span>
          <span style={{ fontSize: '0.9rem', color: 'var(--text)', margin: '0 3px' }}>/</span>
          <span style={{ fontSize: '0.9rem', color: 'var(--text)' }}>{videos.length}</span>
        </motion.div>
        <motion.button onClick={next} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
          style={{ width: 40, height: 40, borderRadius: '50%', border: `1.5px solid ${color}`, background: 'transparent', cursor: 'pointer', color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9,18 15,12 9,6"/></svg>
        </motion.button>
      </div>
    </div>
  )
}

function SectionVideo({ section, color }) {
  const videos = section.videos  // array mode
  const youtubeId = extractYouTubeId(section.youtubeId)

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: false }}
      transition={{ duration: 0.5 }}
      style={{ margin: '24px 0' }}
    >
      <SectionHeading heading={section.heading} color={color} />
      {videos && videos.length > 0
        ? <VideoCarousel videos={videos} color={color} />
        : <SingleVideo youtubeId={youtubeId} src={section.src} caption={section.caption} color={color} />
      }
    </motion.div>
  )
}

/* ── YouTube Shorts carousel — same design as Videos page ── */
function SectionShorts({ section }) {
  const shorts = section.items || []
  const [active, setActive] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [hovered, setHovered] = useState(false)

  const prev = () => { setPlaying(false); setActive(i => (i - 1 + shorts.length) % shorts.length) }
  const next = () => { setPlaying(false); setActive(i => (i + 1) % shorts.length) }

  const getPos = (i) => {
    const diff = i - active
    const wrapped = ((diff + shorts.length) % shorts.length)
    if (wrapped === 0) return 'center'
    if (wrapped === 1 || wrapped === -(shorts.length - 1)) return 'right1'
    if (wrapped === shorts.length - 1 || wrapped === -1) return 'left1'
    if (wrapped === 2 || wrapped === -(shorts.length - 2)) return 'right2'
    if (wrapped === shorts.length - 2 || wrapped === -2) return 'left2'
    return 'hidden'
  }

  const posStyles = {
    center: { x: '0%',   scale: 1,    opacity: 1,    zIndex: 5, rotateY:   0 },
    left1:  { x: '-52%', scale: 0.80, opacity: 0.85, zIndex: 4, rotateY:  12 },
    right1: { x:  '52%', scale: 0.80, opacity: 0.85, zIndex: 4, rotateY: -12 },
    left2:  { x: '-95%', scale: 0.62, opacity: 0.55, zIndex: 3, rotateY:  20 },
    right2: { x:  '95%', scale: 0.62, opacity: 0.55, zIndex: 3, rotateY: -20 },
    hidden: { x:   '0%', scale: 0.4,  opacity: 0,    zIndex: 1, rotateY:   0 },
  }

  if (!shorts.length) return null

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: false }} transition={{ duration: 0.5 }} style={{ margin: '24px 0' }}>
      <SectionHeading heading={section.heading} color="#ff0000" />
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
        <div style={{ width: '100%', overflow: 'hidden' }}>
          <div style={{ position: 'relative', width: '100%', height: 'clamp(340px, 55vw, 500px)',
            perspective: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {shorts.map((v, i) => {
              const pos = getPos(i)
              if (pos === 'hidden') return null
              const isCenter = pos === 'center'
              const vid = extractYouTubeId(v.youtubeId || v.id)
              const thumb = `https://img.youtube.com/vi/${vid}/hqdefault.jpg`
              return (
                <motion.div key={i}
                  animate={posStyles[pos]}
                  transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                  drag={isCenter ? 'x' : false}
                  dragConstraints={{ left: 0, right: 0 }} dragElastic={0.2}
                  onDragEnd={(_, info) => { if (info.offset.x < -60) next(); else if (info.offset.x > 60) prev() }}
                  onClick={() => { if (!isCenter) { setPlaying(false); setActive(i) } }}
                  onHoverStart={() => isCenter && setHovered(true)}
                  onHoverEnd={() => setHovered(false)}
                  style={{
                    position: 'absolute', width: 'clamp(140px, 22vw, 240px)', aspectRatio: '9/16',
                    borderRadius: 20, overflow: 'hidden', cursor: isCenter ? 'grab' : 'pointer',
                    transformStyle: 'preserve-3d',
                    boxShadow: isCenter && hovered
                      ? '0 0 40px #ff0000, 0 0 80px rgba(255,0,0,0.5), 0 24px 60px rgba(0,0,0,0.45)'
                      : isCenter ? '0 24px 60px rgba(0,0,0,0.45)' : '0 8px 24px rgba(0,0,0,0.2)',
                    transition: 'box-shadow 0.3s ease',
                  }}>
                  <img src={thumb} alt={v.title || ''} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  <div style={{ position: 'absolute', inset: 0, background: isCenter ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.45)', transition: 'background 0.3s' }} />
                  <div style={{ position: 'absolute', top: 10, left: 10, padding: '3px 10px', borderRadius: 999, background: '#ff0000', color: '#fff', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.08em' }}>SHORT</div>
                  {isCenter && !playing && (
                    <motion.button animate={{ scale: hovered ? 1.1 : 1 }} transition={{ duration: 0.25 }}
                      onClick={(e) => { e.stopPropagation(); setPlaying(true) }} whileTap={{ scale: 0.92 }}
                      style={{ position: 'absolute', top: '50%', left: '50%', marginTop: -28, marginLeft: -28,
                        width: 56, height: 56, borderRadius: '50%', background: '#ff0000', border: 'none',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 0 28px #ff0000, 0 0 60px rgba(255,0,0,0.5)' }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff" style={{ marginLeft: 3 }}><polygon points="5,3 19,12 5,21"/></svg>
                    </motion.button>
                  )}
                  {isCenter && playing && (
                    <iframe src={`https://www.youtube.com/embed/${vid}?autoplay=1&rel=0`} title={v.title || 'Short'}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }} />
                  )}
                  {isCenter && !playing && v.title && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                      style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '32px 14px 14px',
                        background: 'linear-gradient(to top, rgba(0,0,0,0.85), transparent)' }}>
                      <p style={{ color: '#fff', fontSize: '0.78rem', fontWeight: 600, margin: 0, lineHeight: 1.4,
                        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {v.title}
                      </p>
                    </motion.div>
                  )}
                </motion.div>
              )
            })}
          </div>
        </div>
        {/* Nav */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <motion.button onClick={prev} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.92 }}
            style={{ width: 40, height: 40, borderRadius: '50%', border: '1.5px solid #ff0000',
              background: 'transparent', color: '#ff0000', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15,18 9,12 15,6"/></svg>
          </motion.button>
          <motion.div key={active} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}
            style={{ minWidth: 64, textAlign: 'center', fontFamily: 'var(--sans)', userSelect: 'none' }}>
            <span style={{ fontSize: '1.2rem', fontWeight: 700, color: '#ff0000' }}>{active + 1}</span>
            <span style={{ fontSize: '0.9rem', color: 'var(--text)', margin: '0 4px' }}>/</span>
            <span style={{ fontSize: '0.9rem', color: 'var(--text)' }}>{shorts.length}</span>
          </motion.div>
          <motion.button onClick={next} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.92 }}
            style={{ width: 40, height: 40, borderRadius: '50%', border: '1.5px solid #ff0000',
              background: 'transparent', color: '#ff0000', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9,18 15,12 9,6"/></svg>
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}

/* ── Instagram carousel — same design as Videos page ── */
function SectionInstagram({ section }) {
  const posts = section.items || []
  const [active, setActive] = useState(0)
  const [hovered, setHovered] = useState(false)
  const [vw, setVw] = useState(window.innerWidth)

  const prev = () => setActive(i => (i - 1 + posts.length) % posts.length)
  const next = () => setActive(i => (i + 1) % posts.length)

  useEffect(() => { setActive(0) }, [posts])

  useEffect(() => {
    const onResize = () => setVw(window.innerWidth)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    const process = () => { if (window.instgrm) window.instgrm.Embeds.process() }
    if (!window.instgrm) {
      const s = document.createElement('script')
      s.src = 'https://www.instagram.com/embed.js'
      s.async = true; s.onload = process
      document.body.appendChild(s)
    } else { process() }
  }, [])

  useEffect(() => {
    const t = setTimeout(() => { if (window.instgrm) window.instgrm.Embeds.process() }, 80)
    return () => clearTimeout(t)
  }, [active, posts])

  const cardPx = Math.min(280, Math.max(140, vw * 0.42))

  const getPos = (i) => {
    const diff = i - active
    const wrapped = ((diff + posts.length) % posts.length)
    if (wrapped === 0) return 'center'
    if (wrapped === 1 || wrapped === -(posts.length - 1)) return 'right1'
    if (wrapped === posts.length - 1 || wrapped === -1) return 'left1'
    if (wrapped === 2 || wrapped === -(posts.length - 2)) return 'right2'
    if (wrapped === posts.length - 2 || wrapped === -2) return 'left2'
    return 'hidden'
  }

  const posStyles = {
    center: { x: '0%',   scale: 1,    opacity: 1,    zIndex: 5, rotateY:   0 },
    left1:  { x: '-52%', scale: 0.80, opacity: 0.85, zIndex: 4, rotateY:  12 },
    right1: { x:  '52%', scale: 0.80, opacity: 0.85, zIndex: 4, rotateY: -12 },
    left2:  { x: '-95%', scale: 0.62, opacity: 0.55, zIndex: 3, rotateY:  20 },
    right2: { x:  '95%', scale: 0.62, opacity: 0.55, zIndex: 3, rotateY: -20 },
    hidden: { x:   '0%', scale: 0.4,  opacity: 0,    zIndex: 1, rotateY:   0 },
  }

  if (!posts.length) return null

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: false }} transition={{ duration: 0.5 }} style={{ margin: '24px 0' }}>
      <SectionHeading heading={section.heading} color="#dc2743" />
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
        <div style={{ width: '100%', overflow: 'hidden' }}>
          <div style={{ position: 'relative', width: '100%', height: 'clamp(380px, 80vw, 560px)',
            perspective: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {posts.map((post, i) => {
              const pos = getPos(i)
              if (pos === 'hidden') return null
              const isCenter = pos === 'center'
              return (
                <motion.div key={post.url || i}
                  animate={posStyles[pos]}
                  transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                  drag={isCenter ? 'x' : false}
                  dragConstraints={{ left: 0, right: 0 }} dragElastic={0.2}
                  onDragEnd={(_, info) => { if (info.offset.x < -60) next(); else if (info.offset.x > 60) prev() }}
                  onClick={() => { if (!isCenter) setActive(i) }}
                  onHoverStart={() => isCenter && setHovered(true)}
                  onHoverEnd={() => setHovered(false)}
                  style={{
                    position: 'absolute', width: 'clamp(140px, 42vw, 280px)', aspectRatio: '9/16',
                    borderRadius: 20, overflow: 'hidden', cursor: isCenter ? 'grab' : 'pointer',
                    transformStyle: 'preserve-3d',
                    boxShadow: isCenter && hovered
                      ? '0 0 40px rgba(220,39,67,0.7), 0 0 80px rgba(188,24,136,0.4), 0 24px 60px rgba(220,39,67,0.5)'
                      : isCenter ? '0 24px 60px rgba(220,39,67,0.35), 0 0 40px rgba(220,39,67,0.15)' : '0 8px 24px rgba(0,0,0,0.2)',
                    transition: 'box-shadow 0.3s ease',
                    background: 'linear-gradient(135deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)',
                  }}>
                  {/* Embed preview — pointer-events off */}
                  <div style={{ position: 'absolute', inset: 0, background: '#fff', overflow: 'hidden', pointerEvents: 'none' }}>
                    <div style={{ width: 328, transformOrigin: 'top left',
                      transform: `scale(${isCenter ? (cardPx / 328).toFixed(3) : ((cardPx * 0.75) / 328).toFixed(3)})` }}>
                      <blockquote className="instagram-media" data-instgrm-permalink={post.url}
                        data-instgrm-version="14" data-instgrm-captioned
                        style={{ margin: 0, width: '328px', minWidth: 'unset', border: 0 }} />
                    </div>
                  </div>
                  {/* Overlay blocks IG clicks */}
                  <div style={{ position: 'absolute', inset: 0, zIndex: 2 }} />
                  {/* View Post button on center */}
                  {isCenter && (
                    <div style={{ position: 'absolute', bottom: 16, left: 0, right: 0, display: 'flex', justifyContent: 'center', zIndex: 3 }}>
                      <motion.a href={post.url} target="_blank" rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.93 }}
                        style={{ padding: '7px 18px', borderRadius: 999,
                          background: 'linear-gradient(135deg,#f09433,#dc2743,#bc1888)',
                          color: '#fff', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700,
                          fontFamily: 'var(--sans)', textDecoration: 'none', display: 'inline-block',
                          boxShadow: '0 4px 14px rgba(220,39,67,0.4)' }}>
                        View Post ↗
                      </motion.a>
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>
        </div>
        {/* Nav */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <motion.button onClick={prev} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.92 }}
            style={{ width: 40, height: 40, borderRadius: '50%', border: '1.5px solid #dc2743',
              background: 'transparent', color: '#dc2743', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15,18 9,12 15,6"/></svg>
          </motion.button>
          <motion.div key={active} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}
            style={{ minWidth: 64, textAlign: 'center', fontFamily: 'var(--sans)', userSelect: 'none' }}>
            <span style={{ fontSize: '1.2rem', fontWeight: 700, color: '#dc2743' }}>{active + 1}</span>
            <span style={{ fontSize: '0.9rem', color: 'var(--text)', margin: '0 4px' }}>/</span>
            <span style={{ fontSize: '0.9rem', color: 'var(--text)' }}>{posts.length}</span>
          </motion.div>
          <motion.button onClick={next} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.92 }}
            style={{ width: 40, height: 40, borderRadius: '50%', border: '1.5px solid #dc2743',
              background: 'transparent', color: '#dc2743', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9,18 15,12 9,6"/></svg>
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}

function SectionIngredientGroup({ section, color }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: false }}
      transition={{ duration: 0.4 }}
      style={{ margin: '20px 0' }}
    >
      <h3 style={{
        margin: '0 0 10px', fontSize: '0.82rem', fontWeight: 800,
        textTransform: 'uppercase', letterSpacing: '0.08em', color,
      }}>
        {section.heading}
      </h3>
      <ul style={{ margin: 0, padding: '0 0 0 18px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {(section.items || []).map((item, i) => (
          <li key={i} style={{ fontSize: '0.88rem', color: 'var(--text)', lineHeight: 1.5 }}>
            {item}
          </li>
        ))}
      </ul>
    </motion.div>
  )
}

function SectionSteps({ section, color }) {
  return (
    <div style={{ margin: '20px 0' }}>
      {section.heading && (
        <h3 style={{
          margin: '0 0 14px', fontSize: '0.82rem', fontWeight: 800,
          textTransform: 'uppercase', letterSpacing: '0.08em', color,
        }}>
          {section.heading}
        </h3>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {(section.items || []).map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false }}
            transition={{ duration: 0.4, delay: i * 0.06 }}
            style={{
              display: 'flex', gap: 14, alignItems: 'flex-start',
              padding: '14px 16px', borderRadius: 10,
              background: 'var(--card-bg)', border: '1px solid var(--border)',
            }}
          >
            <div style={{
              width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
              background: `${color}22`, border: `2px solid ${color}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.8rem', fontWeight: 800, color,
            }}>
              {item.step || i + 1}
            </div>
            <div style={{ flex: 1 }}>
              {item.title && (
                <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-h)', marginBottom: 4 }}>
                  {item.title}
                </div>
              )}
              <div style={{ fontSize: '0.85rem', color: 'var(--text)', lineHeight: 1.6 }}>
                {item.body}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

function SectionNutrition({ section, color }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: false }}
      transition={{ duration: 0.5 }}
      style={{ margin: '20px 0' }}
    >
      {section.heading && (
        <h3 style={{
          margin: '0 0 12px', fontSize: '0.82rem', fontWeight: 800,
          textTransform: 'uppercase', letterSpacing: '0.08em', color,
        }}>
          {section.heading}
        </h3>
      )}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
        <tbody>
          {(section.rows || []).map((row, i) => (
            <tr key={i}>
              <td style={{
                padding: '8px 12px', color: 'var(--text)',
                borderBottom: '1px solid var(--border)', fontWeight: 500,
              }}>
                {row.nutrient}
              </td>
              <td style={{
                padding: '8px 12px', color: 'var(--text-h)',
                borderBottom: '1px solid var(--border)', fontWeight: 700, textAlign: 'right',
              }}>
                {row.amount}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {section.notes && (
        <p style={{ margin: '10px 0 0', fontSize: '0.78rem', color: 'var(--text)', opacity: 0.7, lineHeight: 1.5 }}>
          {section.notes}
        </p>
      )}
      {section.score && (
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          marginTop: 10, padding: '5px 14px', borderRadius: 999,
          background: `${color}18`, border: `1px solid ${color}44`,
          fontSize: '0.82rem', fontWeight: 700, color,
        }}>
          ⭐ Nutrition score: {section.score}
        </div>
      )}
    </motion.div>
  )
}

function SectionCallout({ section }) {
  const variant = section.variant || 'note'
  const c = CALLOUT_COLORS[variant] || CALLOUT_COLORS.note
  const icon = CALLOUT_ICONS[variant] || '📌'
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: false }}
      transition={{ duration: 0.4 }}
      style={{
        margin: '20px 0', padding: '14px 16px',
        borderRadius: 10, borderLeft: `4px solid ${c}`,
        background: `${c}12`,
        display: 'flex', gap: 10, alignItems: 'flex-start',
      }}
    >
      <span style={{ fontSize: '1rem', flexShrink: 0, marginTop: 1 }}>{icon}</span>
      <div style={{ fontSize: '0.87rem', color: 'var(--text)', lineHeight: 1.65 }}>
        {section.body}
      </div>
    </motion.div>
  )
}

function SectionPlaces({ section, color }) {
  return (
    <div style={{ margin: '20px 0' }}>
      {section.heading && (
        <h3 style={{
          margin: '0 0 14px', fontSize: '0.82rem', fontWeight: 800,
          textTransform: 'uppercase', letterSpacing: '0.08em', color,
        }}>
          {section.heading}
        </h3>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {(section.items || []).map((place, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false }}
            transition={{ duration: 0.4, delay: i * 0.06 }}
            style={{
              padding: '14px 16px', borderRadius: 10,
              background: 'var(--card-bg)', border: '1px solid var(--border)',
              borderLeft: `3px solid ${color}`,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: '0.9rem' }}>📍</span>
              <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-h)' }}>
                {place.name}
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--text)', lineHeight: 1.6 }}>
              {place.description}
            </p>
            {place.tip && (
              <div style={{
                marginTop: 8, fontSize: '0.78rem', color: CALLOUT_COLORS.tip,
                display: 'flex', gap: 6, alignItems: 'flex-start',
              }}>
                <span>💡</span> {place.tip}
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  )
}

function SectionDivider({ color }) {
  return (
    <div style={{ clear: 'both' }}>
      <hr style={{
        border: 'none', height: 1,
        background: `linear-gradient(90deg, ${color}, transparent)`,
        margin: '24px 0',
      }} />
    </div>
  )
}

// ─── Meta pills row ───────────────────────────────────────────────────────────
function MetaPills({ meta, color }) {
  if (!meta) return null
  const pills = []
  if (meta.cookTime)   pills.push({ icon: '⏱', label: meta.cookTime })
  if (meta.difficulty) pills.push({ icon: '📊', label: meta.difficulty })
  if (meta.servings)   pills.push({ icon: '🍽️', label: `Serves ${meta.servings}` })
  if (meta.location)   pills.push({ icon: '📍', label: meta.location })
  if (meta.duration)   pills.push({ icon: '🗓️', label: meta.duration })
  if (pills.length === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}
    >
      {pills.map((p, i) => (
        <span key={i} style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          padding: '5px 12px', borderRadius: 999, fontSize: '0.78rem', fontWeight: 600,
          background: `${color}14`, color,
          border: `1px solid ${color}33`,
        }}>
          {p.icon} {p.label}
        </span>
      ))}
    </motion.div>
  )
}

// ─── Main renderer ────────────────────────────────────────────────────────────
export default function JsonPostRenderer({ sections = [], meta, color }) {
  const c = color || '#7c3aed'

  function renderSection(section, i) {
    switch (section.type) {
      case 'text':             return <SectionText key={i} section={section} />
      case 'image':            return <SectionImage key={i} section={section} color={c} />
      case 'gallery':          return <SectionGallery key={i} section={section} color={c} />
      case 'video':            return <SectionVideo key={i} section={section} color={c} />
      case 'shorts':           return <SectionShorts key={i} section={section} />
      case 'instagram':        return <SectionInstagram key={i} section={section} />
      case 'ingredient-group': return <SectionIngredientGroup key={i} section={section} color={c} />
      case 'steps':            return <SectionSteps key={i} section={section} color={c} />
      case 'nutrition':        return <SectionNutrition key={i} section={section} color={c} />
      case 'callout':          return <SectionCallout key={i} section={section} />
      case 'places':           return <SectionPlaces key={i} section={section} color={c} />
      case 'divider':          return <SectionDivider key={i} color={c} />
      default:                 return null
    }
  }

  // Group: a float image followed immediately by a text section renders together
  // so the text wraps around the float. All other sections render normally.
  const rendered = []
  let i = 0
  while (i < sections.length) {
    const s = sections[i]
    const next = sections[i + 1]
    if (s.type === 'image' && s.float && next?.type === 'text') {
      rendered.push(
        <div key={i} style={{ overflow: 'hidden' }}>
          {renderSection(s, i)}
          {renderSection(next, i + 1)}
        </div>
      )
      i += 2
    } else {
      rendered.push(renderSection(s, i))
      i++
    }
  }

  return (
    <div>
      <MetaPills meta={meta} color={c} />
      {rendered}
    </div>
  )
}
