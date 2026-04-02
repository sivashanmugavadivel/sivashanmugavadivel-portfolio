import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="page-container" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '80px 24px' }}>
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}
      >
        <span style={{ fontSize: '6rem', lineHeight: 1, fontFamily: 'var(--heading)', fontWeight: 700, color: 'var(--accent)', opacity: 0.3 }}>
          404
        </span>
        <h2 style={{ margin: 0 }}>Page not found</h2>
        <p style={{ color: 'var(--text)', maxWidth: 360 }}>
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link
          to="/"
          style={{
            marginTop: 8,
            padding: '12px 28px',
            background: 'var(--accent)',
            color: '#fff',
            borderRadius: 'var(--radius)',
            fontWeight: 500,
            textDecoration: 'none',
          }}
        >
          Go Home
        </Link>
      </motion.div>
    </div>
  )
}
