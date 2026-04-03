import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'



const socialLinks = [
  { label: 'Instagram', href: 'https://instagram.com/', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
    </svg>
  )},
  { label: 'YouTube', href: 'https://youtube.com/', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.56 3.5 12 3.5 12 3.5s-7.56 0-9.38.55A3.02 3.02 0 0 0 .5 6.19C0 8.01 0 12 0 12s0 3.99.5 5.81a3.02 3.02 0 0 0 2.12 2.14C4.44 20.5 12 20.5 12 20.5s7.56 0 9.38-.55a3.02 3.02 0 0 0 2.12-2.14C24 15.99 24 12 24 12s0-3.99-.5-5.81zM9.75 15.52V8.48L15.5 12l-5.75 3.52z"/>
    </svg>
  )},
  { label: 'LinkedIn', href: 'https://linkedin.com/', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  )},
  { label: 'Facebook', href: 'https://facebook.com/', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  )},
]

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer style={{ background: 'var(--bg)', position: 'relative', overflow: 'hidden' }}>

      {/* Big background name — decorative watermark */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        whiteSpace: 'nowrap',
        textAlign: 'center',
        fontFamily: "'Archivo Black', sans-serif",
        fontSize: '4.2vw',
        fontWeight: 400,
        color: 'var(--border)',
        opacity: 0.5,
        userSelect: 'none',
        pointerEvents: 'none',
        letterSpacing: '-0.02em',
        lineHeight: 1,
        zIndex: 0,
        overflow: 'hidden',
      }}>
        SIVA SHANMUGA VADIVEL
      </div>

      {/* Top accent line */}
      <div style={{ height: 1, background: 'linear-gradient(to right, transparent, var(--accent), transparent)' }} />

      <div style={{ width: '100%', padding: '0 clamp(24px, 5vw, 80px)', boxSizing: 'border-box', position: 'relative', zIndex: 1 }}>

        {/* Row 1 — main content */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px 0 16px',
          gap: 16,
          flexWrap: 'wrap',
        }}>
          {/* Left — logo + name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <Link to="/">
              <img src={`${import.meta.env.BASE_URL}Logo.png`} alt="Siva" style={{ height: 34, width: 34, borderRadius: '50%', objectFit: 'cover' }} />
            </Link>
            <span style={{ fontSize: '0.78rem', color: 'var(--text)', fontWeight: 500 }}>
              Siva Shanmuga Vadivel
            </span>
          </div>

          {/* Center — social icons */}
          <div style={{ display: 'flex', gap: 6 }}>
            {socialLinks.map(({ label, href, icon }) => (
              <motion.a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ y: -2 }}
                title={label}
                style={{
                  width: 28, height: 28, borderRadius: '50%',
                  border: '1px solid var(--border)',
                  background: 'var(--card-bg)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--text)',
                  transition: 'color var(--transition), border-color var(--transition)',
                }}
              >
                <svg width="13" height="13" viewBox={icon.props.viewBox} fill="currentColor">
                  {icon.props.children}
                </svg>
              </motion.a>
            ))}
          </div>

          {/* Right — contact */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
            {/* <a
              href="mailto:hello@sivashanmuga.dev"
              style={{ fontSize: '0.78rem', color: 'var(--text)', textDecoration: 'none', transition: 'color var(--transition)' }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text)'}
            >
              hello@sivashanmuga.dev
            </a> */}
            <motion.div whileHover={{ x: 3 }} transition={{ duration: 0.15 }}>
              <Link
                to="/contact"
                style={{
                  fontSize: '0.78rem', fontWeight: 600,
                  color: 'var(--accent)', textDecoration: 'none',
                }}
              >
                Start a conversation →
              </Link>
            </motion.div>
          </div>
        </div>

        {/* Row 2 — bottom bar */}
        <div style={{
          borderTop: '1px solid var(--border)',
          padding: '10px 0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 8,
        }}>
          <p style={{ fontSize: '0.72rem', color: 'var(--text)', opacity: 0.5, margin: 0 }}>
            © {year} Siva Shanmuga Vadivel. All rights reserved.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Link
              to="/privacy"
              style={{ fontSize: '0.72rem', color: 'var(--text)', opacity: 0.5, textDecoration: 'none', transition: 'opacity 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.opacity = 1}
              onMouseLeave={e => e.currentTarget.style.opacity = 0.5}
            >
              Privacy Policy
            </Link>
            <p style={{ fontSize: '0.72rem', color: 'var(--text)', opacity: 0.5, margin: 0 }}>
              Built with Love & Care mixed in equal ratio
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
