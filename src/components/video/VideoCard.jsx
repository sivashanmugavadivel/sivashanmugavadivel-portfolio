import { useState } from 'react'
import { motion } from 'framer-motion'

function youtubeId(raw) {
  if (!raw) return raw
  try {
    const url = new URL(raw)
    if (url.hostname === 'youtu.be') return url.pathname.slice(1).split('?')[0]
    if (url.searchParams.get('v')) return url.searchParams.get('v')
    const m = url.pathname.match(/\/(shorts|embed)\/([^/?]+)/)
    if (m) return m[2]
  } catch {}
  return raw
}

export default function VideoCard({ video }) {
  const { title, description } = video
  const id = youtubeId(video.id)
  const [playing, setPlaying] = useState(false)
  const thumb = `https://img.youtube.com/vi/${id}/hqdefault.jpg`

  return (
    <motion.div
      whileHover={{ y: -4, boxShadow: 'var(--shadow-hover)' }}
      transition={{ duration: 0.2 }}
      style={{
        background: 'var(--card-bg)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Video area */}
      <div style={{ position: 'relative', paddingBottom: '56.25%', background: '#000' }}>
        {playing ? (
          <iframe
            src={`https://www.youtube.com/embed/${id}?autoplay=1`}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
          />
        ) : (
          <motion.button
            onClick={() => setPlaying(true)}
            whileHover="hover"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              padding: 0,
              border: 0,
              background: 'none',
              cursor: 'pointer',
            }}
          >
            <img
              src={thumb}
              alt={title}
              loading="lazy"
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
            {/* Play button overlay */}
            <motion.div
              variants={{ hover: { scale: 1.1 } }}
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(0,0,0,0.3)',
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  background: 'var(--accent)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: 'var(--glow)',
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </motion.div>
          </motion.button>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
        <h3 style={{ fontFamily: 'var(--sans)', fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-h)', margin: 0, lineHeight: 1.4 }}>
          {title}
        </h3>
        {description && (
          <p style={{ fontSize: '0.82rem', color: 'var(--text)', lineHeight: 1.5, margin: 0, opacity: 0.85 }}>
            {description}
          </p>
        )}
      </div>
    </motion.div>
  )
}
