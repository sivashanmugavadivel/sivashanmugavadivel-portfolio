import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import Tag from '../ui/Tag'

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export default function PostCard({ slug, frontmatter }) {
  const { title, date, excerpt, tags = [] } = frontmatter

  return (
    <motion.article
      whileHover={{ y: -4, boxShadow: 'var(--shadow-hover)' }}
      transition={{ duration: 0.2 }}
      style={{
        background: 'var(--card-bg)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: '28px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        textDecoration: 'none',
        transition: 'border-color var(--transition)',
      }}
    >
      <Link to={`/blog/${slug}`} style={{ textDecoration: 'none', flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {tags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {tags.slice(0, 3).map(tag => (
              <Tag key={tag} label={tag} />
            ))}
          </div>
        )}

        <h3
          style={{
            fontFamily: 'var(--heading)',
            fontSize: '1.25rem',
            fontWeight: 700,
            color: 'var(--text-h)',
            margin: 0,
            lineHeight: 1.3,
            transition: 'color var(--transition)',
          }}
        >
          {title}
        </h3>

        {excerpt && (
          <p style={{ fontSize: '0.9rem', color: 'var(--text)', lineHeight: 1.6, margin: 0 }}>
            {excerpt}
          </p>
        )}
      </Link>

      {date && (
        <time
          dateTime={date}
          style={{ fontSize: '0.8rem', color: 'var(--text)', opacity: 0.7, marginTop: 'auto' }}
        >
          {formatDate(date)}
        </time>
      )}
    </motion.article>
  )
}
