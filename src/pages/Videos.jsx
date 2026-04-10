import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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

/* ── Video modal popup ── */
function VideoModal({ video, onClose }) {
  const id = youtubeId(video.id)
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.85)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px',
      }}
    >
      <motion.div
        initial={{ scale: 0.88, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.88, opacity: 0 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 860,
          borderRadius: 16, overflow: 'hidden',
          boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
          background: '#000',
          position: 'relative',
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 12, right: 12, zIndex: 10,
            width: 36, height: 36, borderRadius: '50%',
            background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.2)',
            color: '#fff', cursor: 'pointer', fontSize: '1.1rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >✕</button>
        {/* 16:9 iframe */}
        <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
          <iframe
            src={`https://www.youtube.com/embed/${id}?autoplay=1&rel=0`}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
          />
        </div>
        {/* Title below */}
        <div style={{ padding: '14px 20px', background: 'var(--card-bg)' }}>
          <p style={{ margin: 0, fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-h)' }}>{video.title}</p>
        </div>
      </motion.div>
    </motion.div>
  )
}

/* ── Video card — thumbnail only, click opens modal ── */
function VideoCardFull({ video, featured = false, onPlay }) {
  const id = youtubeId(video.id)
  const thumb = `https://img.youtube.com/vi/${id}/hqdefault.jpg`

  return (
    <motion.div
      whileHover={{ y: -4, boxShadow: 'var(--shadow-hover)' }}
      transition={{ duration: 0.25 }}
      style={{
        background: 'var(--card-bg)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow)',
        display: 'flex', flexDirection: 'column', height: '100%',
      }}
    >
      {/* Thumbnail */}
      <div style={{ position: 'relative', aspectRatio: '16/9', background: '#000', cursor: 'pointer' }}
        onClick={onPlay}>
        <img
          src={thumb} alt={video.title} loading="lazy"
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.5))' }} />
        <motion.div
          whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}
          style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: featured ? 72 : 56, height: featured ? 72 : 56,
            borderRadius: '50%', background: 'rgba(255,255,255,0.95)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
          }}
        >
          <svg width={featured ? 28 : 22} height={featured ? 28 : 22} viewBox="0 0 24 24" fill="var(--accent)" style={{ marginLeft: 3 }}>
            <polygon points="5,3 19,12 5,21"/>
          </svg>
        </motion.div>
      </div>

      {/* Info */}
      <div style={{ padding: featured ? '20px 24px' : '14px 18px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
          {video.tags.map(tag => (
            <span key={tag} style={{
              padding: '2px 10px', borderRadius: 999, fontSize: '0.7rem', fontWeight: 600,
              textTransform: 'uppercase', letterSpacing: '0.06em',
              background: 'var(--accent-bg)', color: 'var(--accent)', border: '1px solid var(--accent-border)',
            }}>{tag}</span>
          ))}
        </div>
        <h3 style={{
          fontSize: featured ? '1.2rem' : '0.95rem', margin: '0 0 6px', color: 'var(--text-h)',
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>{video.title}</h3>
        <p style={{
          fontSize: '0.83rem', color: 'var(--text)', margin: 0, lineHeight: 1.5,
          display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>{video.description}</p>
        <p style={{ fontSize: '0.72rem', color: 'var(--text)', marginTop: 8, opacity: 0.7 }}>
          {new Date(video.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>
    </motion.div>
  )
}

/* ── Shorts section with category filter ── */
function ShortsSection({ shorts }) {
  const categories = ['Favourite', 'All', ...Array.from(new Set(shorts.map(s => s.category).filter(Boolean))).sort()]
  const [activeCategory, setActiveCategory] = useState('Favourite')

  const filtered = activeCategory === 'Favourite'
    ? shorts.filter(s => s.fav)
    : activeCategory === 'All'
      ? shorts
      : shorts.filter(s => s.category === activeCategory)

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
              {cat === 'Favourite' ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  Fav
                  <motion.span
                    animate={{ scale: [1, 1.15, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                    style={{
                      display: 'inline-block',
                      lineHeight: 1,
                      transformOrigin: 'center',
                      willChange: 'transform',
                      backfaceVisibility: 'hidden'
                    }}
                  >
                    ❤️
                  </motion.span>
                </span>
              ) : (
                cat.charAt(0).toUpperCase() + cat.slice(1)
              )}
            </motion.button>
          ))}
        </motion.div>

        {/* Count */}
        <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text)', opacity: 0.6, marginBottom: 32 }}>
          {filtered.length} {filtered.length === 1 ? 'short' : 'shorts'}
          {activeCategory !== 'All' && ` in ${activeCategory}`}
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

  // Reset active when shorts list changes to prevent out of bounds
  useEffect(() => { setActive(0); setPlaying(false) }, [shorts])


  const stopPlay = () => { setPlaying(false) }
  const prev = () => { stopPlay(); setActive(i => (i - 1 + shorts.length) % shorts.length) }
  const next = () => { stopPlay(); setActive(i => (i + 1) % shorts.length) }

  // Auto-advance when video ends using postMessage
  const activeRef = useRef(active)
  useEffect(() => { activeRef.current = active }, [active])

  // YouTube IFrame API — load script once, create player when playing starts
  const ytPlayerRef = useRef(null)
  const ytContainerRef = useRef(null)

  useEffect(() => {
    if (!playing) {
      // Destroy player when stopped
      if (ytPlayerRef.current) {
        try { ytPlayerRef.current.destroy() } catch {}
        ytPlayerRef.current = null
      }
      return
    }

    const vid = youtubeId(shorts[activeRef.current]?.id)
    if (!vid) return

    function createPlayer() {
      if (!ytContainerRef.current) return
      ytContainerRef.current.innerHTML = ''
      const div = document.createElement('div')
      div.id = 'yt-shorts-player-' + Date.now()
      ytContainerRef.current.appendChild(div)

      const container = ytContainerRef.current
      ytPlayerRef.current = new window.YT.Player(div.id, {
        videoId: vid,
        width: container ? container.offsetWidth : '100%',
        height: container ? container.offsetHeight : '100%',
        playerVars: { autoplay: 1, rel: 0, playsinline: 1 },
        events: {
          onStateChange: (e) => {
            if (e.data === window.YT.PlayerState.ENDED) {
              const nextIdx = activeRef.current + 1
              if (nextIdx < shorts.length) {
                setActive(nextIdx)
                setPlaying(true)
              } else {
                setPlaying(false)
              }
            } else if (e.data === window.YT.PlayerState.PAUSED) {
              setPlaying(false)
            }
          }
        }
      })
    }

    if (window.YT && window.YT.Player) {
      createPlayer()
    } else {
      // Load YT script if not already loaded
      if (!document.getElementById('yt-api-script')) {
        const tag = document.createElement('script')
        tag.id = 'yt-api-script'
        tag.src = 'https://www.youtube.com/iframe_api'
        document.head.appendChild(tag)
      }
      window.onYouTubeIframeAPIReady = createPlayer
    }

    return () => {
      if (ytPlayerRef.current) {
        try { ytPlayerRef.current.destroy() } catch {}
        ytPlayerRef.current = null
      }
    }
  }, [playing, active, shorts])

  if (!shorts || shorts.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text)', opacity: 0.6 }}>
        <p style={{ fontSize: '1.1rem', marginBottom: 8 }}>No videos to display here yet.</p>
        <p style={{ fontSize: '0.9rem' }}>Select a different category.</p>
      </div>
    )
  }

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
    center: { x:    '0%', scale: 1,    opacity: 1,   zIndex: 5, rotateY:   0 },
    left1:  { x:  '-52%', scale: 0.80, opacity: 0.85, zIndex: 4, rotateY:  12 },
    right1: { x:   '52%', scale: 0.80, opacity: 0.85, zIndex: 4, rotateY: -12 },
    left2:  { x:  '-95%', scale: 0.62, opacity: 0.55, zIndex: 3, rotateY:  20 },
    right2: { x:   '95%', scale: 0.62, opacity: 0.55, zIndex: 3, rotateY: -20 },
    hidden: { x:    '0%', scale: 0.4,  opacity: 0,   zIndex: 1, rotateY:   0 },
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 32 }}>
      <style>{`
        @keyframes shortsGlowPulse {
          0%,100% { box-shadow: 0 0 20px #ff0000, 0 0 40px rgba(255,0,0,0.3), 0 24px 60px rgba(0,0,0,0.45); }
          50%      { box-shadow: 0 0 55px #ff0000, 0 0 100px rgba(255,0,0,0.65), 0 24px 60px rgba(0,0,0,0.45); }
        }
        /* Force YT iframe to fill container */
        #yt-shorts-player iframe,
        [id^="yt-shorts-player-"] {
          position: absolute !important;
          inset: 0 !important;
          width: 100% !important;
          height: 100% !important;
          border: none !important;
        }
      `}</style>

      {/* Carousel stage */}
      <div style={{ width: '100%', overflow: 'hidden' }}>
      <div style={{
        position: 'relative',
        width: '100%',
        height: 'clamp(400px, 60vw, 600px)',
        perspective: 1200,
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
                width: 'clamp(180px, 22vw, 280px)',
                aspectRatio: '9/16',
                borderRadius: 20,
                overflow: 'hidden',
                cursor: isCenter ? 'grab' : 'pointer',
                transformStyle: 'preserve-3d',
                boxShadow: isCenter && (playing || hovered)
                  ? '0 0 40px #ff0000, 0 0 80px rgba(255,0,0,0.5), 0 24px 60px rgba(0,0,0,0.45)'
                  : isCenter
                  ? '0 24px 60px rgba(0,0,0,0.45)'
                  : '0 8px 24px rgba(0,0,0,0.2)',
                transition: playing
                  ? 'box-shadow 0.8s ease-in-out'
                  : 'box-shadow 0.3s ease',
                animation: isCenter && playing ? 'shortsGlowPulse 2s ease-in-out infinite' : 'none',
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
                    background: '#ff0000',
                    border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 0 28px #ff0000, 0 0 60px rgba(255,0,0,0.5)',
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff" style={{ marginLeft: 3 }}>
                    <polygon points="5,3 19,12 5,21"/>
                  </svg>
                </motion.button>
              )}

              {/* YT Player container when playing */}
              {isCenter && playing && (
                <div
                  ref={ytContainerRef}
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'hidden' }}
                />
              )}


              {/* Tap-to-stop overlay — sits above iframe, catches taps when playing */}
              {isCenter && playing && (
                <div
                  onClick={() => stopPlay()}
                  style={{
                    position: 'absolute', inset: 0, zIndex: 25,
                    cursor: 'pointer', background: 'transparent',
                  }}
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
            width: 40, height: 40, borderRadius: '50%', border: '1.5px solid #ff0000',
            background: 'transparent', color: '#ff0000', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15,18 9,12 15,6"/></svg>
        </motion.button>

        <motion.div
          key={active}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          style={{ minWidth: 72, textAlign: 'center', fontFamily: 'var(--sans)', userSelect: 'none' }}
        >
          <span style={{ fontSize: '1.3rem', fontWeight: 700, color: '#ff0000' }}>{active + 1}</span>
          <span style={{ fontSize: '1rem', color: 'var(--text)', margin: '0 4px' }}>/</span>
          <span style={{ fontSize: '1rem', color: 'var(--text)' }}>{shorts.length}</span>
        </motion.div>

        <motion.button
          onClick={next} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.92 }}
          style={{
            width: 40, height: 40, borderRadius: '50%', border: '1.5px solid #ff0000',
            background: 'transparent', color: '#ff0000', cursor: 'pointer',
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
          Movements I've captured along the way with my journey 👣.
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
        <motion.div animate={{ y:[0,-8,0] }}
          transition={{ duration:3, repeat:Infinity, ease:'easeInOut' }}
          style={{ marginBottom:16, display:'inline-block',
            filter:'drop-shadow(0 0 20px rgba(0,200,255,0.6))' }}>
          <img src="/sub-gif1.gif" alt="dolphin"
            style={{ width:'clamp(80px,12vw,140px)', height:'auto', display:'block' }} />
        </motion.div>
        <motion.h2 animate={{ opacity:[0.8,1,0.8] }} transition={{ duration:2.5, repeat:Infinity }}
          style={{ color:'#7dd3fc', fontSize:'clamp(1.4rem,4vw,2.4rem)',
            fontFamily:'var(--display)', marginBottom:8,
            textShadow:'0 0 24px rgba(125,211,252,0.6)' }}>
          🐬Dive Into More Content
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

const IGIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
  </svg>
)

/* ── Instagram Carousel (same 3D style as ShortsCarousel) ── */
function InstagramCarousel({ posts }) {
  const [active, setActive] = useState(0)
  const [hovered, setHovered] = useState(false) // eslint-disable-line
  const [vw, setVw] = useState(window.innerWidth)

  const prev = () => { setActive(i => (i - 1 + posts.length) % posts.length) }
  const next = () => { setActive(i => (i + 1) % posts.length) }

  // Reset active index when posts list changes (category filter)
  useEffect(() => { setActive(0) }, [posts])

  // Track viewport width for responsive embed scale
  useEffect(() => {
    function onResize() { setVw(window.innerWidth) }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // Compute card pixel width from clamp(140px, 42vw, 280px)
  const cardPx = Math.min(280, Math.max(140, vw * 0.42))

  // Load Instagram embed script once, then process
  useEffect(() => {
    const process = () => { if (window.instgrm) window.instgrm.Embeds.process() }
    if (!window.instgrm) {
      const s = document.createElement('script')
      s.src = 'https://www.instagram.com/embed.js'
      s.async = true
      s.onload = process
      document.body.appendChild(s)
    } else {
      process()
    }
  }, [])

  // Re-process embeds whenever visible posts or active index changes
  useEffect(() => {
    // Small delay to let React finish rendering the new blockquotes
    const t = setTimeout(() => {
      if (window.instgrm) window.instgrm.Embeds.process()
    }, 80)
    return () => clearTimeout(t)
  }, [active, posts])

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
    center: { x:    '0%', scale: 1,    opacity: 1,    zIndex: 5, rotateY:   0 },
    left1:  { x:  '-52%', scale: 0.80, opacity: 0.85, zIndex: 4, rotateY:  12 },
    right1: { x:   '52%', scale: 0.80, opacity: 0.85, zIndex: 4, rotateY: -12 },
    left2:  { x:  '-95%', scale: 0.62, opacity: 0.55, zIndex: 3, rotateY:  20 },
    right2: { x:   '95%', scale: 0.62, opacity: 0.55, zIndex: 3, rotateY: -20 },
    hidden: { x:    '0%', scale: 0.4,  opacity: 0,    zIndex: 1, rotateY:   0 },
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 32 }}>

      {/* Stage */}
      <div style={{ width: '100%', overflow: 'hidden' }}>
        <div style={{
          position: 'relative', width: '100%',
          height: 'clamp(400px, 80vw, 600px)',
          perspective: 1200, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
        }}>
          {posts.map((post, i) => {
            const pos = getPos(i)
            const isCenter = pos === 'center'
            return (
              <motion.div
                key={post.url}
                animate={posStyles[pos]}
                transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                drag={isCenter ? 'x' : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.2}
                onDragEnd={(_, info) => {
                  if (info.offset.x < -60) next()
                  else if (info.offset.x > 60) prev()
                }}
                onClick={() => { if (!isCenter) setActive(i) }}
                onHoverStart={() => isCenter && setHovered(true)}
                onHoverEnd={() => setHovered(false)}
                style={{
                  position: 'absolute',
                  width: 'clamp(140px, 42vw, 280px)',
                  aspectRatio: '9/16',
                  borderRadius: 20,
                  overflow: 'hidden',
                  cursor: isCenter ? 'grab' : 'pointer',
                  transformStyle: 'preserve-3d',
                  boxShadow: isCenter && hovered
                    ? '0 0 40px rgba(220,39,67,0.7), 0 0 80px rgba(188,24,136,0.4), 0 24px 60px rgba(220,39,67,0.5)'
                    : isCenter
                    ? '0 24px 60px rgba(220,39,67,0.35), 0 0 40px rgba(220,39,67,0.15)'
                    : '0 8px 24px rgba(0,0,0,0.2)',
                  transition: 'box-shadow 0.3s ease',
                  background: 'linear-gradient(135deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)',
                }}
              >
                {/* Embed preview for all cards — pointer-events off, scaled to fit */}
                {pos !== 'hidden' && (
                  <div style={{ position: 'absolute', inset: 0, background: '#fff',
                    overflow: 'hidden', pointerEvents: 'none' }}>
                        {/* Scale embed to fit card — cardPx mirrors the CSS clamp */}
                    <div style={{
                      width: 328, transformOrigin: 'top left',
                      transform: `scale(${isCenter ? (cardPx / 328).toFixed(3) : ((cardPx * 0.75) / 328).toFixed(3)})`,
                    }}>
                      <blockquote
                        className="instagram-media"
                        data-instgrm-permalink={post.url}
                        data-instgrm-version="14"
                        data-instgrm-captioned
                        style={{ margin: 0, width: '328px', minWidth: 'unset', border: 0 }}
                      />
                    </div>
                  </div>
                )}
                {/* Transparent overlay — captures drag/click, blocks IG navigation */}
                <div style={{ position: 'absolute', inset: 0, zIndex: 2 }} />
                {/* View Post button — only on center card */}
                {isCenter && (
                  <div style={{ position: 'absolute', bottom: 16, left: 0, right: 0,
                    display: 'flex', justifyContent: 'center', zIndex: 3 }}>
                    <motion.a
                      href={post.url} target="_blank" rel="noopener noreferrer"
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

      {/* Nav controls — same as ShortsCarousel */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <motion.button onClick={prev} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.92 }}
          style={{ width: 40, height: 40, borderRadius: '50%', border: '1.5px solid #dc2743',
            background: 'transparent', color: '#dc2743', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15,18 9,12 15,6"/></svg>
        </motion.button>

        <motion.div
          key={active}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          style={{ minWidth: 72, textAlign: 'center', fontFamily: 'var(--sans)', userSelect: 'none' }}
        >
          <span style={{ fontSize: '1.3rem', fontWeight: 700, color: '#dc2743' }}>{active + 1}</span>
          <span style={{ fontSize: '1rem', color: 'var(--text)', margin: '0 4px' }}>/</span>
          <span style={{ fontSize: '1rem', color: 'var(--text)' }}>{posts.length}</span>
        </motion.div>

        <motion.button onClick={next} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.92 }}
          style={{ width: 40, height: 40, borderRadius: '50%', border: '1.5px solid #dc2743',
            background: 'transparent', color: '#dc2743', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9,18 15,12 9,6"/></svg>
        </motion.button>
      </div>
    </div>
  )
}

/* ── Instagram Section ── */
function InstagramSection() {
  const posts = cfg.instagram || []
  const categories = ['All', ...Array.from(new Set(posts.map(p => p.category).filter(Boolean)))]
  const [activeCategory, setActiveCategory] = useState('All')

  const filtered = activeCategory === 'All' ? posts : posts.filter(p => p.category === activeCategory)

  if (!posts.length) return null

  return (
    <section style={{ padding: 'clamp(48px,6vw,80px) 0', background: 'var(--bg-secondary)', overflow: 'hidden' }}>
      <div className="page-container">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.5 }}
          style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10,
              background: 'linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)',
              display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IGIcon />
            </div>
            <h2 style={{ margin: 0 }}>Instagram</h2>
          </div>
          <p style={{ color: 'var(--text)', opacity: 0.65, fontSize: '0.88rem', margin: '4px 0 0' }}>
            Posts from{' '}
            <a href={cfg.social.instagram.href} target="_blank" rel="noopener noreferrer"
              style={{ color: '#dc2743', textDecoration: 'none', fontWeight: 600 }}>
              {cfg.social.instagram.handle}
            </a>
          </p>
        </motion.div>

        {/* Category pills */}
        {categories.length > 1 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 32 }}>
            {categories.map((cat, i) => (
              <motion.button key={cat} onClick={() => setActiveCategory(cat)}
                whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                style={{ padding: '8px 20px', borderRadius: 999, cursor: 'pointer',
                  fontFamily: 'var(--sans)', fontSize: '0.85rem', fontWeight: 500,
                  border: activeCategory === cat ? '1.5px solid var(--text-h)' : '1.5px solid var(--border)',
                  background: activeCategory === cat ? 'var(--text-h)' : 'transparent',
                  color: activeCategory === cat ? 'var(--bg)' : 'var(--text-h)',
                  transition: 'all 0.2s' }}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </motion.button>
            ))}
          </motion.div>
        )}

        {/* 3D Carousel */}
        <InstagramCarousel posts={filtered} />

        {/* Follow CTA */}
        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.2 }}
          style={{ textAlign: 'center', marginTop: 40 }}>
          <motion.a href={cfg.social.instagram.href} target="_blank" rel="noopener noreferrer"
            whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 10,
              padding: '12px 28px', borderRadius: 999, textDecoration: 'none',
              background: 'linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)',
              color: '#fff', fontWeight: 700, fontSize: '0.95rem',
              fontFamily: 'var(--sans)', boxShadow: '0 6px 24px rgba(220,39,67,0.35)' }}>
            <IGIcon /> Follow on Instagram
          </motion.a>
        </motion.div>
      </div>
    </section>
  )
}

/* ── Video strip with arrows below ── */
function VideoStrip({ videos }) {
  const scrollRef = useRef(null)
  const [activeVideo, setActiveVideo] = useState(null)
  const CARD_W = 420
  const SCROLL_BY = CARD_W + 16

  const scroll = (dir) => {
    scrollRef.current?.scrollBy({ left: dir * SCROLL_BY, behavior: 'smooth' })
  }

  return (
    <section className="section" style={{ paddingTop: 'clamp(48px, 6vw, 80px)', background: 'var(--bg)', overflow: 'hidden' }}>
      <div className="page-container">
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ margin: 0 }}>Videos</h2>
        </div>

        {/* Scrollable strip */}
        <div ref={scrollRef} style={{ overflowX: 'auto', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
          <div style={{ display: 'flex', gap: 16, paddingBottom: 8, scrollSnapType: 'x mandatory', width: 'max-content' }}>
            {videos.map((video) => (
              <div key={video.id} style={{ width: CARD_W, height: 420, scrollSnapAlign: 'start', flexShrink: 0 }}>
                <VideoCardFull video={video} onPlay={() => setActiveVideo(video)} />
              </div>
            ))}
          </div>
        </div>

        {/* Arrows below */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 24 }}>
          <motion.button onClick={() => scroll(-1)} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.92 }}
            style={{ width: 44, height: 44, borderRadius: '50%', border: '1.5px solid var(--accent)', background: 'var(--card-bg)', color: 'var(--accent)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15,18 9,12 15,6"/></svg>
          </motion.button>
          <motion.button onClick={() => scroll(1)} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.92 }}
            style={{ width: 44, height: 44, borderRadius: '50%', border: '1.5px solid var(--accent)', background: 'var(--card-bg)', color: 'var(--accent)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9,18 15,12 9,6"/></svg>
          </motion.button>
        </div>
      </div>

      {/* Video modal */}
      <AnimatePresence>
        {activeVideo && <VideoModal video={activeVideo} onClose={() => setActiveVideo(null)} />}
      </AnimatePresence>
    </section>
  )
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
        <VideoStrip videos={regularVideos} />
      )}


      {/* Shorts */}
      {shorts.length > 0 && (
        <ShortsSection shorts={shorts} />
      )}

      {/* Instagram */}
      <InstagramSection />

      {/* CTA — Subscribe Button Design Picker */}
      <SubscribeDesignPicker />
    </div>
  )
}
