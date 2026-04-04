import { useState } from 'react'
import { motion } from 'framer-motion'
import videosData from '../data/videos.json'
import cfg from '../data/config.json'

/* ── Scroll-reveal wrapper ── */
function Reveal({ children, delay = 0, y = 32, style }) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1], delay }}
      style={style}
    >
      {children}
    </motion.div>
  )
}

/* ── Video card — thumbnail that swaps to iframe on click ── */
function VideoCardFull({ video, featured = false }) {
  const [playing, setPlaying] = useState(false)
  const thumb = `https://img.youtube.com/vi/${video.id}/hqdefault.jpg`

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
            src={`https://www.youtube.com/embed/${video.id}?autoplay=1&rel=0`}
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
          const vthumb = `https://img.youtube.com/vi/${v.id}/hqdefault.jpg`

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

              {/* Play button — center card, reveal on hover with glow */}
              {isCenter && !playing && (
                <motion.button
                  animate={{ opacity: hovered ? 1 : 0, scale: hovered ? 1 : 0.75 }}
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
                  src={`https://www.youtube.com/embed/${v.id}?autoplay=1&rel=0`}
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

        {/* Dots */}
        <div style={{ display: 'flex', gap: 8 }}>
          {shorts.map((_, i) => (
            <motion.button
              key={i}
              onClick={() => { setPlaying(false); setActive(i) }}
              animate={{ width: i === active ? 24 : 8, background: i === active ? 'var(--accent)' : 'var(--border)' }}
              transition={{ duration: 0.3 }}
              style={{ height: 8, borderRadius: 999, border: 'none', cursor: 'pointer', padding: 0 }}
            />
          ))}
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
      background: '#0a0a0a',
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
                color: '#ffffff',
                lineHeight: 1,
                textShadow: '0 0 40px rgba(124,58,237,0.5)',
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
          style={{ color: 'rgba(255,255,255,0.5)', maxWidth: 440, margin: '0 auto', lineHeight: 1.7 }}
        >
          YouTube videos, tutorials, vlogs, and short-form content.
        </motion.p>
      </div>
    </section>
  )
}


/* ── Main Videos page ── */
export default function Videos() {
  const regularVideos = videosData.filter(v => v.type === 'video')
  const shorts = videosData.filter(v => v.type === 'short')
  const [featured, ...rest] = regularVideos

  return (
    <div>
      <VideosHeader1 />

      {/* Featured Video */}
      {featured && (
        <section style={{ paddingBottom: 'clamp(48px, 6vw, 80px)', background: 'var(--bg)' }}>
          <div className="page-container">
            <motion.span
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              style={{ display: 'block', marginBottom: 16 }}
            >
              <span className="section-label">Featured</span>
            </motion.span>
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <VideoCardFull video={featured} featured />
            </motion.div>
          </div>
        </section>
      )}

      {/* ── More Videos ── */}
      {rest.length > 0 && (
        <section className="section" style={{ paddingTop: 0, background: 'var(--bg)', overflow: 'hidden' }}>
          <div className="page-container">
            <Reveal delay={0}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
                <h2 style={{ margin: 0 }}>More Videos</h2>
                <span style={{ fontSize: '0.8rem', color: 'var(--accent)' }}>← drag →</span>
              </div>
            </Reveal>
            <motion.div
              style={{ display: 'flex', gap: 20, overflowX: 'auto', paddingBottom: 16, scrollSnapType: 'x mandatory', scrollbarWidth: 'none', cursor: 'grab' }}
              drag="x"
              dragConstraints={{ right: 0, left: -(rest.length * 420) }}
              whileTap={{ cursor: 'grabbing' }}
            >
              {rest.map((video, i) => (
                <motion.div
                  key={video.id}
                  initial={{ opacity: 0, x: 60 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  style={{ flex: '0 0 clamp(280px, 38vw, 440px)', scrollSnapAlign: 'start' }}
                >
                  <VideoCardFull video={video} />
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      )}


      {/* Shorts */}
      {shorts.length > 0 && (
        <section className="section" style={{ background: 'var(--bg)' }}>
          <div className="page-container">
            <Reveal delay={0}>
              <div style={{ marginBottom: 40, textAlign: 'center' }}>
                <span className="section-label" style={{ display: 'block', marginBottom: 4 }}>Short Form</span>
                <h2>YouTube Shorts</h2>
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <ShortsCarousel shorts={shorts} />
            </Reveal>
          </div>
        </section>
      )}

      {/* CTA */}
      <section style={{ paddingBottom: 'clamp(64px, 8vw, 96px)', background: 'var(--bg-secondary)' }}>
        <div className="page-container" style={{ textAlign: 'center' }}>
          <Reveal y={20}>
            <p style={{ color: 'var(--text)', marginBottom: 20, lineHeight: 1.7, maxWidth: 420, margin: '0 auto 24px' }}>
              Replace the video IDs in <code>src/data/videos.json</code> with your real YouTube video IDs.
            </p>
            <a
              href={cfg.social.youtube.href}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 22px',
                borderRadius: 999,
                background: '#ff0000',
                color: '#fff',
                fontWeight: 600,
                fontSize: '0.9rem',
                textDecoration: 'none',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.56 3.5 12 3.5 12 3.5s-7.56 0-9.38.55A3.02 3.02 0 0 0 .5 6.19C0 8.01 0 12 0 12s0 3.99.5 5.81a3.02 3.02 0 0 0 2.12 2.14C4.44 20.5 12 20.5 12 20.5s7.56 0 9.38-.55a3.02 3.02 0 0 0 2.12-2.14C24 15.99 24 12 24 12s0-3.99-.5-5.81zM9.75 15.52V8.48L15.5 12l-5.75 3.52z"/>
              </svg>
              Subscribe on YouTube
            </a>
          </Reveal>
        </div>
      </section>
    </div>
  )
}
