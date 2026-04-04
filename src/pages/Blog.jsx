import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { loadAllPosts } from '../hooks/usePosts'
import PostCard from '../components/blog/PostCard'

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
}

export default function Blog() {
  const [posts, setPosts] = useState(null)
  const [activeCategory, setActiveCategory] = useState('all')

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
        <motion.div
          className="grid-3"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {filtered.map(({ slug, frontmatter }) => (
            <motion.div key={slug} variants={itemVariants}>
              <PostCard slug={slug} frontmatter={frontmatter} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  )
}
