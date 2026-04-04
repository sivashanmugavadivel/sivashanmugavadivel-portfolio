import { useState, useEffect } from 'react'
import { NavLink, Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import ThemeToggle from '../ui/ThemeToggle'

const links = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About' },
  { to: '/blog', label: 'Blog' },
  { to: '/gallery', label: 'Gallery' },
  { to: '/videos', label: 'Videos' },
  { to: '/contact', label: 'Contact' },
]

const linkItemVariants = {
  closed: { opacity: 0, y: -8 },
  open: i => ({ opacity: 1, y: 0, transition: { delay: i * 0.05, duration: 0.22 } }),
}

export default function Navbar({ theme, onToggleTheme }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const location = useLocation()

  useEffect(() => { setMenuOpen(false) }, [location])

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Use white text on home hero; switch to theme text on other pages or after scrolling past hero
  const isHome = location.pathname === '/'
  const useWhite = isHome && !scrolled

  return (
    <header style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100 }}>

      {/* ── Transparent nav bar — adds subtle bg when scrolled on non-home pages ── */}
      <motion.nav
        className="nav-bar"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          minHeight: 64,
          padding: '0 28px',
          gap: 12,
          background: 'transparent',
          backdropFilter: 'none',
          WebkitBackdropFilter: 'none',
          transition: 'background 0.3s ease',
        }}>

          {/* Logo */}
          <Link to="/" style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center' }}>
            <img src={`${import.meta.env.BASE_URL}Logo.png`} alt="Siva Shanmuga Vadivel" style={{ height: 55, width: 55, display: 'block', borderRadius: '50%', objectFit: 'cover' }} />
          </Link>

          {/* Desktop links */}
          <div
            className="nav-desktop"
            style={{ display: 'flex', alignItems: 'center', gap: 2 }}
          >
            {links.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                style={({ isActive }) => ({
                  position: 'relative',
                  padding: '6px 14px',
                  borderRadius: 999,
                  fontFamily: 'var(--sans)',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: isActive ? (useWhite ? '#fff' : 'var(--accent)') : (useWhite ? 'rgba(255,255,255,0.75)' : 'var(--text-h)'),
                  textDecoration: 'none',
                  background: isActive ? (useWhite ? 'rgba(255,255,255,0.15)' : 'var(--accent-bg)') : 'transparent',
                  transition: 'color 0.2s, background 0.2s',
                })}
              >
                {({ isActive }) => (
                  <>
                    {label}
                    {isActive && (
                      <motion.span
                        layoutId="nav-indicator"
                        style={{
                          position: 'absolute',
                          inset: 0,
                          borderRadius: 999,
                          background: 'rgba(255,255,255,0.12)',
                          border: '1px solid rgba(255,255,255,0.2)',
                          zIndex: -1,
                        }}
                        transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                      />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </div>

          {/* Right — theme toggle + hamburger */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <ThemeToggle theme={theme} onToggle={onToggleTheme} />

            <motion.button
              onClick={() => setMenuOpen(v => !v)}
              whileTap={{ scale: 0.9 }}
              aria-label="Toggle menu"
              className="nav-hamburger"
              style={{
                background: 'rgba(255,255,255,0.12)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 999,
                width: 38, height: 38,
                cursor: 'pointer',
                display: 'none',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
                padding: 0,
              }}
            >
              {[0, 1, 2].map(i => (
                <motion.span
                  key={i}
                  animate={
                    i === 0 ? (menuOpen ? { rotate: 45, y: 6 }  : { rotate: 0, y: 0 }) :
                    i === 1 ? (menuOpen ? { opacity: 0, scaleX: 0 } : { opacity: 1, scaleX: 1 }) :
                              (menuOpen ? { rotate: -45, y: -6 } : { rotate: 0, y: 0 })
                  }
                  transition={{ duration: 0.2 }}
                  style={{ display: 'block', width: 16, height: 1.5, background: useWhite ? '#fff' : 'var(--text-h)', borderRadius: 1 }}
                />
              ))}
            </motion.button>
          </div>
      </motion.nav>

      {/* ── Mobile dropdown menu ── */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            style={{
              margin: '8px 16px 0',
              borderRadius: 20,
              background: 'rgba(15,15,20,0.85)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: '1px solid rgba(255,255,255,0.12)',
              boxShadow: '0 16px 40px rgba(0,0,0,0.3)',
              overflow: 'hidden',
              padding: '12px',
            }}
          >
            {links.map(({ to, label }, i) => (
              <motion.div
                key={to}
                custom={i}
                variants={linkItemVariants}
                initial="closed"
                animate="open"
              >
                <NavLink
                  to={to}
                  end={to === '/'}
                  style={({ isActive }) => ({
                    display: 'block',
                    padding: '12px 16px',
                    borderRadius: 12,
                    fontFamily: 'var(--sans)',
                    fontWeight: 500,
                    fontSize: '0.95rem',
                    color: isActive ? '#fff' : 'rgba(255,255,255,0.6)',
                    textDecoration: 'none',
                    background: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
                    transition: 'background 0.2s, color 0.2s',
                  })}
                >
                  {label}
                </NavLink>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @media (max-width: 768px) {
          .nav-desktop { display: none !important; }
          .nav-hamburger { display: flex !important; }
        }
      `}</style>
    </header>
  )
}
