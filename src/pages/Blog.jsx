import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { loadAllPosts } from '../hooks/usePosts'
import PostCard from '../components/blog/PostCard'

const CARD_WIDTH = 364 // card width + gap

export default function Blog() {
  const [posts, setPosts] = useState(null)
  const [activeCategory, setActiveCategory] = useState('all')
  const [scrollX, setScrollX] = useState(0)
  const scrollRef = useRef(null)

  function scrollBy(dir) {
    const el = scrollRef.current
    if (!el) return
    const next = Math.max(0, Math.min(el.scrollWidth - el.clientWidth, el.scrollLeft + dir * CARD_WIDTH))
    el.scrollTo({ left: next, behavior: 'smooth' })
  }

  function onScroll() {
    if (scrollRef.current) setScrollX(scrollRef.current.scrollLeft)
  }

  useEffect(() => {
    loadAllPosts().then(setPosts).catch(() => setPosts([]))
  }, [])

  const categories = posts
    ? ['all', ...Array.from(new Set(posts.map(p => p.frontmatter.category).filter(Boolean)))]
    : ['all']

  const filtered = posts
    ? (activeCategory === 'all' ? posts : posts.filter(p => p.frontmatter.category === activeCategory))
    : []

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
          Thoughts on web development, design, and technology.
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
          {/* Scroll container */}
          <div
            ref={scrollRef}
            onScroll={onScroll}
            style={{
              overflowX: 'auto', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch',
              scrollSnapType: 'x mandatory', padding: '16px 4px 8px',
            }}
          >
            <div style={{ display: 'flex', gap: 24, width: 'max-content' }}>
              {filtered.map(({ slug, frontmatter }, i) => (
                <motion.div
                  key={slug}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: i * 0.07 }}
                  style={{ width: 'clamp(280px, 75vw, 340px)', flexShrink: 0, scrollSnapAlign: 'start' }}
                >
                  <PostCard slug={slug} frontmatter={frontmatter} />
                </motion.div>
              ))}
            </div>
          </div>

          {/* Arrow buttons */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 24 }}>
            <motion.button
              onClick={() => scrollBy(-1)}
              whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.92 }}
              style={{
                width: 44, height: 44, borderRadius: '50%',
                background: 'var(--card-bg)', border: '1.5px solid var(--border)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--text-h)', fontSize: '1.1rem',
                opacity: scrollX <= 0 ? 0.3 : 1, transition: 'opacity 0.2s',
              }}
            >
              ←
            </motion.button>
            <motion.button
              onClick={() => scrollBy(1)}
              whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.92 }}
              style={{
                width: 44, height: 44, borderRadius: '50%',
                background: 'var(--card-bg)', border: '1.5px solid var(--border)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--text-h)', fontSize: '1.1rem',
                opacity: scrollRef.current && scrollX >= scrollRef.current.scrollWidth - scrollRef.current.clientWidth - 4 ? 0.3 : 1,
                transition: 'opacity 0.2s',
              }}
            >
              →
            </motion.button>
          </div>
        </>
      )}
    </div>
  )
}
