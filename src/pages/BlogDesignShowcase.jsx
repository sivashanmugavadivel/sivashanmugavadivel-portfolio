import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { tagColor, tagIcon } from '../data/tagMeta'

// ─── Sample posts for preview ───────────────────────────────────────────────
const SAMPLE_POSTS = [
  {
    slug: 'spicy-mushroom-masala-omelet',
    frontmatter: {
      title: 'Spicy Mushroom Masala Omelet – Easy High-Protein Breakfast',
      date: '2026-02-10',
      tags: ['recipe', 'breakfast', 'high-protein', 'healthy'],
      excerpt: 'If you\'re looking for a quick, flavorful, and protein-packed breakfast, this Mushroom Masala Omelet is a perfect choice. Bold spices, earthy mushrooms, and fluffy eggs come together in minutes.',
    },
  },
  {
    slug: 'spiced-shrimp-veggie-yogurt-salad-bowl',
    frontmatter: {
      title: 'Spiced Shrimp & Veggie Yogurt Salad Bowl – High Protein Breakfast',
      date: '2026-03-18',
      tags: ['recipe', 'breakfast', 'high-protein', 'shrimp'],
      excerpt: 'A fresh, protein-rich breakfast bowl made with juicy shrimp, lightly cooked vegetables, and a creamy yogurt finish. Bold spices, crunch, and refreshing tang.',
    },
  },
  {
    slug: 'sample-tech-post',
    frontmatter: {
      title: 'Building Modern UIs with React & Framer Motion',
      date: '2026-01-15',
      tags: ['react', 'design', 'animation'],
      excerpt: 'Explore how to craft buttery-smooth interfaces using Framer Motion\'s spring physics, layout animations, and gesture-driven interactions.',
    },
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(d) {
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}
function readTime(excerpt = '') {
  return Math.max(2, Math.ceil(excerpt.split(' ').length / 200)) + ' min read'
}

// ══════════════════════════════════════════════════════════════════════════════
// DESIGN 1 — Magazine Cover
// ══════════════════════════════════════════════════════════════════════════════
function MagazineCard({ slug, frontmatter }) {
  const { title, date, excerpt, tags = [] } = frontmatter
  const icon = tagIcon(tags)
  const color = tagColor(tags[0])
  const [hovered, setHovered] = useState(false)

  return (
    <motion.article
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      whileHover={{ y: -8, scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      style={{
        borderRadius: 16, overflow: 'hidden',
        boxShadow: hovered
          ? `0 20px 60px ${color}33, 0 4px 20px rgba(0,0,0,0.15)`
          : '0 4px 20px rgba(0,0,0,0.1)',
        cursor: 'pointer', background: 'var(--card-bg)',
        transition: 'box-shadow 0.3s ease',
        display: 'flex', flexDirection: 'column',
      }}
    >
      {/* Banner */}
      <div style={{
        height: 180, position: 'relative', overflow: 'hidden',
        background: `linear-gradient(135deg, ${color}dd 0%, ${color}88 50%, ${color}22 100%)`,
      }}>
        {/* Animated shimmer */}
        <motion.div
          animate={hovered ? { x: ['−100%', '200%'] } : { x: '-100%' }}
          transition={{ duration: 0.7, ease: 'easeInOut' }}
          style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.25) 50%, transparent 100%)',
            pointerEvents: 'none',
          }}
        />
        {/* Big icon */}
        <motion.div
          animate={hovered ? { scale: 1.2, rotate: 10 } : { scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: 72, lineHeight: 1,
            filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.2))',
          }}
        >
          {icon}
        </motion.div>
        {/* Post number */}
        <div style={{
          position: 'absolute', top: 12, left: 14,
          fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.15em',
          color: 'rgba(255,255,255,0.85)', textTransform: 'uppercase',
          background: 'rgba(0,0,0,0.2)', padding: '3px 8px', borderRadius: 999,
        }}>
          {formatDate(date)}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '20px 22px 22px', display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
        {/* Tags */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {tags.slice(0, 3).map(tag => (
            <span key={tag} style={{
              fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase',
              letterSpacing: '0.1em', padding: '3px 9px', borderRadius: 999,
              background: `${tagColor(tag)}22`, color: tagColor(tag),
              border: `1px solid ${tagColor(tag)}44`,
            }}>{tag}</span>
          ))}
        </div>

        <h3 style={{
          margin: 0, fontSize: '1.1rem', fontWeight: 700,
          color: 'var(--text-h)', lineHeight: 1.35,
        }}>{title}</h3>

        {excerpt && (
          <p style={{
            margin: 0, fontSize: '0.85rem', color: 'var(--text)',
            lineHeight: 1.6, flex: 1,
            display: '-webkit-box', WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>{excerpt}</p>
        )}

        {/* Footer row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text)', opacity: 0.6 }}>
            ⏱ {readTime(excerpt)}
          </span>
          <motion.span
            animate={hovered ? { x: 4 } : { x: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            style={{ fontSize: '0.82rem', fontWeight: 600, color: color }}
          >
            Read more →
          </motion.span>
        </div>
      </div>
    </motion.article>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// DESIGN 2 — Glassmorphism
// ══════════════════════════════════════════════════════════════════════════════
function GlassCard({ slug, frontmatter }) {
  const { title, date, excerpt, tags = [] } = frontmatter
  const icon = tagIcon(tags)
  const color = tagColor(tags[0])
  const [hovered, setHovered] = useState(false)

  return (
    <motion.article
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      whileHover={{ y: -6, scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 280, damping: 22 }}
      style={{
        position: 'relative', borderRadius: 20, overflow: 'hidden',
        padding: '24px',
        background: 'rgba(255,255,255,0.07)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: hovered ? `1.5px solid ${color}88` : '1.5px solid rgba(255,255,255,0.12)',
        boxShadow: hovered
          ? `0 0 0 1px ${color}33, 0 16px 48px ${color}22, inset 0 1px 0 rgba(255,255,255,0.15)`
          : '0 4px 24px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.1)',
        cursor: 'pointer',
        transition: 'border 0.3s ease, box-shadow 0.3s ease',
        display: 'flex', flexDirection: 'column', gap: 14,
      }}
    >
      {/* Glow blob */}
      <motion.div
        animate={hovered ? { opacity: 0.18, scale: 1.2 } : { opacity: 0, scale: 0.8 }}
        transition={{ duration: 0.4 }}
        style={{
          position: 'absolute', top: -40, right: -40,
          width: 180, height: 180, borderRadius: '50%',
          background: color, filter: 'blur(60px)', pointerEvents: 'none',
        }}
      />

      {/* Icon + category */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <motion.div
          whileHover={{ rotate: 12 }}
          style={{
            width: 48, height: 48, borderRadius: 12, fontSize: 24,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: `${color}22`, border: `1px solid ${color}44`,
            flexShrink: 0,
          }}
        >
          {icon}
        </motion.div>
        <div>
          <div style={{
            fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: '0.12em', color: color,
          }}>
            {tags[0]} · {formatDate(date)}
          </div>
        </div>
      </div>

      <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-h)', lineHeight: 1.35 }}>
        {title}
      </h3>

      {excerpt && (
        <p style={{
          margin: 0, fontSize: '0.85rem', color: 'var(--text)', lineHeight: 1.6,
          display: '-webkit-box', WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>{excerpt}</p>
      )}

      <div style={{ height: '1px', background: 'rgba(255,255,255,0.08)' }} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {tags.slice(0, 2).map(tag => (
            <span key={tag} style={{
              fontSize: '0.7rem', padding: '2px 8px', borderRadius: 999,
              background: `${tagColor(tag)}18`, color: tagColor(tag),
            }}>⭐ {tag}</span>
          ))}
        </div>
        <span style={{ fontSize: '0.75rem', color: 'var(--text)', opacity: 0.5 }}>
          {readTime(excerpt)}
        </span>
      </div>
    </motion.article>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// DESIGN 3 — Horizontal Timeline Strip
// ══════════════════════════════════════════════════════════════════════════════
function TimelineCard({ slug, frontmatter, index }) {
  const { title, date, excerpt, tags = [] } = frontmatter
  const color = tagColor(tags[0])
  const icon = tagIcon(tags)
  const [hovered, setHovered] = useState(false)

  return (
    <motion.article
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      whileHover={{ x: 6 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      style={{
        display: 'flex', gap: 0, borderRadius: 14, overflow: 'hidden',
        background: 'var(--card-bg)',
        border: '1px solid var(--border)',
        boxShadow: hovered ? `0 8px 32px ${color}22` : '0 2px 12px rgba(0,0,0,0.06)',
        cursor: 'pointer', transition: 'box-shadow 0.3s ease',
      }}
    >
      {/* Left accent bar */}
      <motion.div
        animate={{ height: hovered ? '100%' : '60%', background: hovered ? color : `${color}88` }}
        style={{
          width: 5, alignSelf: 'center', borderRadius: '0 3px 3px 0',
          background: `${color}88`, transition: 'all 0.3s ease', flexShrink: 0,
        }}
      />

      {/* Number badge */}
      <div style={{
        width: 52, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px 0',
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          background: `${color}18`, border: `1.5px solid ${color}44`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.1rem',
        }}>
          {icon}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: '20px 20px 20px 8px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {tags.slice(0, 3).map(tag => (
            <span key={tag} style={{
              fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase',
              letterSpacing: '0.1em', color: tagColor(tag),
            }}>
              {tag}
            </span>
          ))}
          <span style={{ fontSize: '0.65rem', color: 'var(--text)', opacity: 0.5, marginLeft: 'auto' }}>
            {formatDate(date)}
          </span>
        </div>

        <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-h)', lineHeight: 1.3 }}>
          {title}
        </h3>

        {excerpt && (
          <p style={{
            margin: 0, fontSize: '0.82rem', color: 'var(--text)', lineHeight: 1.55,
            display: '-webkit-box', WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>{excerpt}</p>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text)', opacity: 0.5 }}>⏱ {readTime(excerpt)}</span>
          <motion.span
            animate={hovered ? { x: 4, opacity: 1 } : { x: 0, opacity: 0.6 }}
            style={{ fontSize: '0.8rem', fontWeight: 600, color }}
          >
            Read more →
          </motion.span>
        </div>
      </div>
    </motion.article>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// DESIGN 4 — Flip Card
// ══════════════════════════════════════════════════════════════════════════════
function FlipCard({ slug, frontmatter }) {
  const { title, date, excerpt, tags = [] } = frontmatter
  const icon = tagIcon(tags)
  const color = tagColor(tags[0])
  const [flipped, setFlipped] = useState(false)

  return (
    <div
      style={{ perspective: 1000, height: 280, cursor: 'pointer' }}
      onMouseEnter={() => setFlipped(true)}
      onMouseLeave={() => setFlipped(false)}
    >
      <motion.div
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.55, ease: [0.23, 1, 0.32, 1] }}
        style={{
          width: '100%', height: '100%', position: 'relative',
          transformStyle: 'preserve-3d',
        }}
      >
        {/* FRONT */}
        <div style={{
          position: 'absolute', inset: 0, backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
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
            fontSize: '0.7rem', color: color, opacity: 0.7, fontWeight: 600,
          }}>
            hover to flip ↻
          </div>
        </div>

        {/* BACK */}
        <div style={{
          position: 'absolute', inset: 0, backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
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
            margin: 0, fontSize: '0.85rem', color: 'rgba(255,255,255,0.92)',
            lineHeight: 1.6,
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
        </div>
      </motion.div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// DESIGN 5 — Neon Glow Dark Card (Bonus)
// ══════════════════════════════════════════════════════════════════════════════
function NeonCard({ slug, frontmatter }) {
  const { title, date, excerpt, tags = [] } = frontmatter
  const icon = tagIcon(tags)
  const color = tagColor(tags[0])
  const [hovered, setHovered] = useState(false)

  return (
    <motion.article
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      whileHover={{ y: -6 }}
      transition={{ type: 'spring', stiffness: 280, damping: 20 }}
      style={{
        borderRadius: 16, overflow: 'hidden', cursor: 'pointer',
        background: '#0f0f14',
        border: hovered ? `1px solid ${color}` : '1px solid #2a2a3a',
        boxShadow: hovered
          ? `0 0 0 1px ${color}44, 0 0 30px ${color}33, inset 0 0 60px ${color}08`
          : '0 4px 20px rgba(0,0,0,0.3)',
        transition: 'border 0.3s ease, box-shadow 0.3s ease',
        display: 'flex', flexDirection: 'column',
      }}
    >
      {/* Top strip */}
      <div style={{
        height: 4,
        background: hovered
          ? `linear-gradient(90deg, ${color}, ${color}88, transparent)`
          : `linear-gradient(90deg, ${color}44, transparent)`,
        transition: 'background 0.4s ease',
      }} />

      <div style={{ padding: '22px 22px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Icon + date */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <motion.div
            animate={hovered ? { rotate: [0, -10, 10, 0], scale: 1.15 } : { rotate: 0, scale: 1 }}
            transition={{ duration: 0.4 }}
            style={{ fontSize: 32 }}
          >
            {icon}
          </motion.div>
          <span style={{ fontSize: '0.72rem', color: `${color}cc`, fontFamily: 'monospace', letterSpacing: '0.05em' }}>
            {formatDate(date)}
          </span>
        </div>

        <h3 style={{
          margin: 0, fontSize: '1.05rem', fontWeight: 700, lineHeight: 1.3,
          color: hovered ? '#fff' : '#e0dff0',
          transition: 'color 0.25s ease',
          textShadow: hovered ? `0 0 20px ${color}66` : 'none',
        }}>{title}</h3>

        {excerpt && (
          <p style={{
            margin: 0, fontSize: '0.82rem', color: '#6b6880', lineHeight: 1.6,
            display: '-webkit-box', WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>{excerpt}</p>
        )}

        {/* Tags */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {tags.slice(0, 3).map(tag => (
            <span key={tag} style={{
              fontSize: '0.66rem', padding: '2px 8px', borderRadius: 4,
              border: `1px solid ${tagColor(tag)}55`,
              color: tagColor(tag), background: `${tagColor(tag)}10`,
              fontFamily: 'monospace',
            }}>#{tag}</span>
          ))}
        </div>

        {/* Bottom row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 4, borderTop: '1px solid #2a2a3a' }}>
          <span style={{ fontSize: '0.72rem', color: '#444460', fontFamily: 'monospace' }}>
            ⏱ {readTime(excerpt)}
          </span>
          <motion.div
            animate={hovered ? { opacity: 1, x: 0 } : { opacity: 0, x: -8 }}
            style={{
              fontSize: '0.78rem', fontWeight: 700, color,
              display: 'flex', alignItems: 'center', gap: 4,
            }}
          >
            Read <span style={{ fontSize: '1rem' }}>→</span>
          </motion.div>
        </div>
      </div>
    </motion.article>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// SHOWCASE PAGE
// ══════════════════════════════════════════════════════════════════════════════
const DESIGNS = [
  {
    id: 1, name: 'Magazine Cover',
    desc: 'Big gradient banner, emoji icon, shimmer on hover, colored tags',
    emoji: '🗞️',
    Component: MagazineCard,
    grid: 'grid',
  },
  {
    id: 2, name: 'Glassmorphism',
    desc: 'Frosted glass, glow blob, neon border on hover, icon box',
    emoji: '💎',
    Component: GlassCard,
    grid: 'grid',
  },
  {
    id: 3, name: 'Timeline Strip',
    desc: 'Horizontal editorial style, accent bar, slides right on hover',
    emoji: '📰',
    Component: TimelineCard,
    grid: 'list',
  },
  {
    id: 4, name: 'Flip Card',
    desc: '3D flip on hover — front shows teaser, back reveals excerpt & CTA',
    emoji: '🃏',
    Component: FlipCard,
    grid: 'grid',
  },
  {
    id: 5, name: 'Neon Dark',
    desc: 'Dark background, neon glow border, monospace tags, text glow',
    emoji: '⚡',
    Component: NeonCard,
    grid: 'grid',
  },
]

export default function BlogDesignShowcase() {
  const [selected, setSelected] = useState(null)
  const [confirmed, setConfirmed] = useState(false)

  return (
    <div style={{ minHeight: '100vh', padding: '60px 24px 100px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ textAlign: 'center', marginBottom: 56 }}
        >
          <span style={{
            fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: '0.15em', color: 'var(--accent)',
            display: 'block', marginBottom: 10,
          }}>
            Design Picker
          </span>
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', margin: '0 0 12px', color: 'var(--text-h)' }}>
            Blog Card Designs
          </h1>
          <p style={{ color: 'var(--text)', maxWidth: 480, margin: '0 auto' }}>
            Hover over each design to see animations. Click a design to select it, then confirm.
          </p>
        </motion.div>

        {/* Design sections */}
        {DESIGNS.map((design, di) => {
          const { Component, grid, id, name, desc, emoji } = design
          const isSelected = selected === id

          return (
            <motion.section
              key={id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: di * 0.08 }}
              style={{ marginBottom: 64 }}
            >
              {/* Section header */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginBottom: 20, flexWrap: 'wrap', gap: 12,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 28 }}>{emoji}</span>
                  <div>
                    <h2 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-h)', fontWeight: 700 }}>
                      Design {id} — {name}
                    </h2>
                    <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text)', opacity: 0.7 }}>{desc}</p>
                  </div>
                </div>

                <motion.button
                  onClick={() => setSelected(isSelected ? null : id)}
                  whileTap={{ scale: 0.96 }}
                  whileHover={{ scale: 1.04 }}
                  style={{
                    padding: '10px 22px', borderRadius: 999, fontWeight: 700,
                    fontSize: '0.85rem', cursor: 'pointer', border: 'none',
                    background: isSelected ? 'var(--accent)' : 'var(--accent-bg)',
                    color: isSelected ? '#fff' : 'var(--accent)',
                    border: `1.5px solid var(--accent-border)`,
                    transition: 'all 0.2s ease',
                    boxShadow: isSelected ? '0 4px 20px rgba(124,58,237,0.35)' : 'none',
                  }}
                >
                  {isSelected ? '✓ Selected' : 'Select this design'}
                </motion.button>
              </div>

              {/* Divider */}
              <div style={{
                height: 2, borderRadius: 2, marginBottom: 24,
                background: isSelected
                  ? 'linear-gradient(90deg, var(--accent), transparent)'
                  : 'var(--border)',
                transition: 'background 0.3s ease',
              }} />

              {/* Cards preview */}
              <div style={
                grid === 'list'
                  ? { display: 'flex', flexDirection: 'column', gap: 16 }
                  : {
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                      gap: 20,
                    }
              }>
                {SAMPLE_POSTS.map((post, i) => (
                  <Component key={post.slug} {...post} index={i} />
                ))}
              </div>
            </motion.section>
          )
        })}

        {/* Sticky confirm bar */}
        <AnimatePresence>
          {selected && (
            <motion.div
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 80, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              style={{
                position: 'fixed', bottom: 24, left: '50%',
                marginLeft: -220, width: 440,
                background: 'var(--card-bg)',
                border: '1.5px solid var(--accent-border)',
                borderRadius: 16,
                boxShadow: '0 8px 40px rgba(124,58,237,0.25)',
                padding: '16px 24px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
                zIndex: 200,
              }}
            >
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--accent)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  Selected
                </div>
                <div style={{ fontWeight: 700, color: 'var(--text-h)', fontSize: '0.95rem' }}>
                  {DESIGNS.find(d => d.id === selected)?.emoji} Design {selected} — {DESIGNS.find(d => d.id === selected)?.name}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <motion.button
                  onClick={() => setSelected(null)}
                  whileTap={{ scale: 0.96 }}
                  style={{
                    padding: '8px 16px', borderRadius: 999, cursor: 'pointer',
                    background: 'none', border: '1px solid var(--border)',
                    color: 'var(--text)', fontSize: '0.82rem', fontWeight: 600,
                  }}
                >
                  Cancel
                </motion.button>
                <Link to="/blog-design-confirm" state={{ design: selected }}>
                  <motion.button
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    style={{
                      padding: '8px 20px', borderRadius: 999, cursor: 'pointer',
                      background: 'var(--accent)', border: 'none',
                      color: '#fff', fontSize: '0.82rem', fontWeight: 700,
                      boxShadow: '0 4px 16px rgba(124,58,237,0.4)',
                    }}
                  >
                    Use this design ✓
                  </motion.button>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  )
}
