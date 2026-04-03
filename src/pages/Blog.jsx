import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
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

  useEffect(() => {
    loadAllPosts().then(setPosts).catch(() => setPosts([]))
  }, [])

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
        <Link to="/blog-post-design-picker">
          <motion.button
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }}
            style={{
              marginTop: 20, padding: '10px 24px', borderRadius: 999,
              background: 'var(--accent)', color: '#fff', border: 'none',
              cursor: 'pointer', fontWeight: 700, fontSize: '0.88rem',
              boxShadow: '0 4px 16px rgba(124,58,237,0.35)',
            }}
          >
            🎨 Pick a post design
          </motion.button>
        </Link>
      </motion.div>

      {posts === null ? (
        <p style={{ textAlign: 'center', color: 'var(--text)' }}>Loading posts…</p>
      ) : posts.length === 0 ? (
        <p style={{ textAlign: 'center', color: 'var(--text)' }}>No posts found.</p>
      ) : (
        <motion.div
          className="grid-3"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {posts.map(({ slug, frontmatter }) => (
            <motion.div key={slug} variants={itemVariants}>
              <PostCard slug={slug} frontmatter={frontmatter} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  )
}
