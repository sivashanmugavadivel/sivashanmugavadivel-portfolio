import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

const TAG_COLORS = {
  recipe: '#f59e0b', breakfast: '#10b981', 'high-protein': '#3b82f6',
  healthy: '#22c55e', shrimp: '#f97316', react: '#61dafb',
  design: '#a78bfa', animation: '#ec4899', tech: '#6366f1',
}
const TAG_ICONS = {
  recipe: '🍳', breakfast: '🌅', 'high-protein': '💪',
  healthy: '🥗', shrimp: '🦐', react: '⚛️', design: '🎨',
  animation: '✨', tech: '💻',
}

const tagColor = tag => TAG_COLORS[tag] || '#7c3aed'
const tagIcon = tags => { for (const t of tags) if (TAG_ICONS[t]) return TAG_ICONS[t]; return '📝' }

function formatDate(d) {
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

export default function PostCard({ slug, frontmatter }) {
  const { title, date, excerpt, tags = [] } = frontmatter
  const [flipped, setFlipped] = useState(false)
  const icon = tagIcon(tags)
  const color = tagColor(tags[0])

  return (
    <div
      style={{ perspective: 1000, height: 280, cursor: 'pointer' }}
      onMouseEnter={() => setFlipped(true)}
      onMouseLeave={() => setFlipped(false)}
    >
      <motion.div
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.55, ease: [0.23, 1, 0.32, 1] }}
        style={{ width: '100%', height: '100%', position: 'relative', transformStyle: 'preserve-3d' }}
      >
        {/* FRONT */}
        <div style={{
          position: 'absolute', inset: 0,
          backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
          borderRadius: 16, overflow: 'hidden',
          background: `linear-gradient(145deg, var(--card-bg) 0%, ${color}11 100%)`,
          border: `1px solid ${color}33`,
          boxShadow: `0 4px 24px ${color}18`,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 14, padding: 24,
        }}>
          {/* Shine sweep */}
          <motion.div
            animate={flipped ? {} : { x: ['-100%', '200%'] }}
            transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 3, ease: 'easeInOut' }}
            style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.18) 50%, transparent 60%)',
              pointerEvents: 'none',
            }}
          />
          <motion.div
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            style={{ fontSize: 56, lineHeight: 1, filter: `drop-shadow(0 4px 16px ${color}88)` }}
          >
            {icon}
          </motion.div>
          <h3 style={{
            margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-h)',
            textAlign: 'center', lineHeight: 1.35,
          }}>{title}</h3>
          <time style={{ fontSize: '0.75rem', color: 'var(--text)', opacity: 0.6 }}>
            {formatDate(date)}
          </time>
          <div style={{
            position: 'absolute', bottom: 14, right: 16,
            fontSize: '0.7rem', color, opacity: 0.6, fontWeight: 600,
          }}>
            hover to flip ↻
          </div>
        </div>

        {/* BACK */}
        <Link to={`/blog/${slug}`} style={{
          textDecoration: 'none',
          position: 'absolute', inset: 0,
          backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
          transform: 'rotateY(180deg)',
          borderRadius: 16, overflow: 'hidden',
          background: `linear-gradient(145deg, ${color}ee 0%, ${color}bb 100%)`,
          display: 'flex', flexDirection: 'column', gap: 12, padding: 24,
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {tags.map(tag => (
              <span key={tag} style={{
                fontSize: '0.68rem', fontWeight: 700, padding: '3px 9px', borderRadius: 999,
                background: 'rgba(255,255,255,0.25)', color: '#fff',
              }}>{tag}</span>
            ))}
          </div>
          <p style={{
            margin: 0, fontSize: '0.85rem', color: 'rgba(255,255,255,0.92)', lineHeight: 1.6,
            display: '-webkit-box', WebkitLineClamp: 4,
            WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>{excerpt}</p>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '10px 20px', borderRadius: 999,
            background: 'rgba(255,255,255,0.22)',
            color: '#fff', fontWeight: 700, fontSize: '0.88rem',
            alignSelf: 'flex-start', border: '1.5px solid rgba(255,255,255,0.4)',
          }}>
            Read Post →
          </div>
        </Link>
      </motion.div>
    </div>
  )
}
