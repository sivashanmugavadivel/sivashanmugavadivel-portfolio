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

/* ── Shorts card — vertical 9:16 ── */
function ShortsCard({ video }) {
  const [playing, setPlaying] = useState(false)
  const thumb = `https://img.youtube.com/vi/${video.id}/hqdefault.jpg`

  return (
    <motion.div
      whileHover={!playing ? { y: -6, boxShadow: 'var(--shadow-hover)' } : {}}
      transition={{ duration: 0.25 }}
      style={{
        flex: '0 0 180px',
        background: 'var(--card-bg)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow)',
        scrollSnapAlign: 'start',
      }}
    >
      {/* 9:16 area */}
      <div style={{
        position: 'relative',
        aspectRatio: '9/16',
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
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.2)' }} />
            <motion.button
              onClick={() => setPlaying(true)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              aria-label={`Play ${video.title}`}
              style={{
                position: 'absolute',
                top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 44, height: 44,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.9)',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 12px rgba(0,0,0,0.25)',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="var(--accent)" style={{ marginLeft: 2 }}>
                <polygon points="5,3 19,12 5,21"/>
              </svg>
            </motion.button>
            {/* Shorts label */}
            <div style={{
              position: 'absolute',
              top: 8, left: 8,
              padding: '2px 8px',
              borderRadius: 999,
              background: '#ff0000',
              color: '#fff',
              fontSize: '0.62rem',
              fontWeight: 700,
              letterSpacing: '0.06em',
            }}>
              SHORT
            </div>
          </>
        )}
      </div>

      {/* Title */}
      <div style={{ padding: '10px 12px' }}>
        <p style={{
          fontSize: '0.78rem',
          fontWeight: 500,
          color: 'var(--text-h)',
          margin: 0,
          lineHeight: 1.4,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {video.title}
        </p>
      </div>
    </motion.div>
  )
}

/* ── Main Videos page ── */
export default function Videos() {
  const regularVideos = videosData.filter(v => v.type === 'video')
  const shorts = videosData.filter(v => v.type === 'short')
  const [featured, ...rest] = regularVideos

  const cardVariants = {
    hidden: { opacity: 0, y: 36 },
    show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: 'easeOut' } },
  }
  const containerVariants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.09 } },
  }

  return (
    <div>
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
            <span className="section-label">Watch</span>
            <h1 style={{ fontSize: 'clamp(2.2rem, 6vw, 4rem)', marginTop: 8, marginBottom: 16 }}>
              Videos
            </h1>
            <p style={{ color: 'var(--text)', maxWidth: 440, margin: '0 auto', lineHeight: 1.7 }}>
              YouTube videos, tutorials, vlogs, and short-form content.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Featured Video */}
      {featured && (
        <section style={{ paddingBottom: 'clamp(48px, 6vw, 80px)', background: 'var(--bg)' }}>
          <div className="page-container">
            <Reveal delay={0.1}>
              <span className="section-label" style={{ display: 'block', marginBottom: 16 }}>Featured</span>
            </Reveal>
            <Reveal delay={0.2} y={24}>
              <VideoCardFull video={featured} featured />
            </Reveal>
          </div>
        </section>
      )}

      {/* Video grid */}
      {rest.length > 0 && (
        <section className="section" style={{ paddingTop: 0, background: 'var(--bg-secondary)' }}>
          <div className="page-container">
            <Reveal delay={0}>
              <h2 style={{ marginBottom: 32 }}>More Videos</h2>
            </Reveal>
            <motion.div
              className="grid-2"
              variants={containerVariants}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: '-40px' }}
            >
              {rest.map(video => (
                <motion.div key={video.id} variants={cardVariants}>
                  <VideoCardFull video={video} />
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      )}

      {/* Shorts row */}
      {shorts.length > 0 && (
        <section className="section" style={{ background: 'var(--bg)' }}>
          <div className="page-container">
            <Reveal delay={0}>
              <div style={{ marginBottom: 28 }}>
                <span className="section-label" style={{ display: 'block', marginBottom: 4 }}>Short Form</span>
                <h2>YouTube Shorts</h2>
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <div style={{
                display: 'flex',
                gap: 16,
                overflowX: 'auto',
                scrollSnapType: 'x mandatory',
                paddingBottom: 16,
                scrollbarWidth: 'thin',
              }}>
                {shorts.map((video, i) => (
                  <motion.div
                    key={video.id}
                    initial={{ opacity: 0, x: 30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.45, delay: i * 0.08 }}
                  >
                    <ShortsCard video={video} />
                  </motion.div>
                ))}
              </div>
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
