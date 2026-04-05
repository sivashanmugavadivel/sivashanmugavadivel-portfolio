import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { loadAllPosts } from '../hooks/usePosts'
import PostCard from '../components/blog/PostCard'

export default function Blog() {
  const [posts, setPosts] = useState(null)
  const [activeCategory, setActiveCategory] = useState('all')
  const [activeIndex, setActiveIndex] = useState(0)
  useEffect(() => {
    loadAllPosts().then(setPosts).catch(() => setPosts([]))
  }, [])

  useEffect(() => { setActiveIndex(0) }, [activeCategory])

  const categories = posts
    ? ['all', ...Array.from(new Set(posts.map(p => p.frontmatter.category).filter(Boolean)))]
    : ['all']

  const filtered = posts
    ? (activeCategory === 'all' ? posts : posts.filter(p => p.frontmatter.category === activeCategory))
    : []

  function go(dir) {
    setActiveIndex(i => Math.max(0, Math.min(filtered.length - 1, i + dir)))
  }

  // Get card style based on its offset from active
  const isMobile = window.innerWidth <= 768
  function getCardStyle(offset) {
    if (offset === 0) return { x: 0, rotate: 0, scale: 1, zIndex: 10, opacity: 1 }
    const sign = offset > 0 ? 1 : -1
    const abs = Math.abs(offset)
    const xBase = isMobile ? 120 : 200
    const xFar  = isMobile ? 160 : 260
    return {
      x: sign * (abs === 1 ? xBase : xFar),
      rotate: sign * (abs === 1 ? 12 : 20),
      scale: abs === 1 ? 0.82 : 0.68,
      zIndex: 10 - abs,
      opacity: abs === 1 ? 0.75 : 0.45,
    }
  }

  // Which indices to render around active
  function getVisibleIndices() {
    const indices = []
    for (let offset = -2; offset <= 2; offset++) {
      const idx = activeIndex + offset
      if (idx >= 0 && idx < filtered.length) indices.push({ idx, offset })
    }
    return indices
  }

  return (
    <div className="page-container section">
      <motion.div
        className="section-header"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <span className="section-label">Writing</span>
        <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}>Blog</h1>
        <p style={{ maxWidth: 480, margin: '12px auto 0', color: 'var(--text)' }}>
          Thoughts, experiences, food, travel, and things I notice along the way.
        </p>
      </motion.div>

      {/* Category pills */}
      {categories.length > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 40 }}
        >
          {categories.map((cat, i) => (
            <motion.button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.04 }}
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
      )}

      {posts === null ? (
        <p style={{ textAlign: 'center', color: 'var(--text)' }}>Loading posts…</p>
      ) : filtered.length === 0 ? (
        <p style={{ textAlign: 'center', color: 'var(--text)' }}>No posts found.</p>
      ) : (
        <>
          {/* Card deck */}
          <div style={{
            position: 'relative',
            height: 340,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 52,
            overflow: 'hidden',
          }}>
            {getVisibleIndices().map(({ idx, offset }) => {
              const style = getCardStyle(offset)
              return (
                <motion.div
                  key={filtered[idx].slug}
                  animate={{
                    x: style.x,
                    rotate: style.rotate,
                    scale: style.scale,
                    opacity: style.opacity,
                    zIndex: style.zIndex,
                  }}
                  transition={{ duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
                  drag={offset === 0 ? 'x' : false}
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.2}
                  onDragEnd={(_, info) => {
                    if (info.offset.x < -60) go(1)
                    else if (info.offset.x > 60) go(-1)
                  }}
                  onClick={() => {
                    if (offset !== 0) setActiveIndex(idx)
                  }}
                  style={{
                    position: 'absolute',
                    width: 'clamp(280px, 40vw, 340px)',
                    cursor: offset !== 0 ? 'pointer' : 'grab',
                    transformOrigin: 'bottom center',
                  }}
                >
                  {offset === 0 ? (
                    <PostCard slug={filtered[idx].slug} frontmatter={filtered[idx].frontmatter} />
                  ) : (
                    /* Placeholder back card — no flip interaction */
                    <div style={{
                      height: 280,
                      borderRadius: 16,
                      background: 'var(--card-bg)',
                      border: '1px solid var(--border)',
                      display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24,
                    }}>
                      <div style={{ fontSize: 48 }}>{filtered[idx].frontmatter.icon || '📝'}</div>
                      <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-h)', textAlign: 'center', lineHeight: 1.35 }}>
                        {filtered[idx].frontmatter.title}
                      </p>
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>

          {/* Counter with arrows */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
            <motion.span
              onClick={() => go(-1)}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
              style={{ fontSize: '1.2rem', cursor: activeIndex === 0 ? 'default' : 'pointer', opacity: activeIndex === 0 ? 0.2 : 0.7, color: 'var(--text-h)', userSelect: 'none' }}
            >‹</motion.span>
            <span style={{ fontSize: '0.95rem', color: 'var(--text)', opacity: 0.5, fontVariantNumeric: 'tabular-nums', minWidth: 48, textAlign: 'center' }}>
              {activeIndex + 1} / {filtered.length}
            </span>
            <motion.span
              onClick={() => go(1)}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
              style={{ fontSize: '1.2rem', cursor: activeIndex === filtered.length - 1 ? 'default' : 'pointer', opacity: activeIndex === filtered.length - 1 ? 0.2 : 0.7, color: 'var(--text-h)', userSelect: 'none' }}
            >›</motion.span>
          </div>

        </>
      )}
    </div>
  )
}
