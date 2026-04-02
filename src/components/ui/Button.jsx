import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

export default function Button({ children, to, href, variant = 'primary', onClick, type = 'button', disabled }) {
  const isPrimary = variant === 'primary'
  const isGhost = variant === 'ghost' // white outlined, for dark backgrounds

  const style = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 22px',
    borderRadius: 999,
    fontFamily: 'var(--sans)',
    fontSize: '0.88rem',
    fontWeight: 500,
    cursor: disabled ? 'not-allowed' : 'pointer',
    textDecoration: 'none',
    border: isPrimary ? 'none' : isGhost ? '1.5px solid rgba(255,255,255,0.5)' : '1.5px solid var(--accent-border)',
    background: isPrimary ? 'var(--accent)' : isGhost ? 'rgba(255,255,255,0.1)' : 'transparent',
    color: isPrimary ? '#fff' : isGhost ? '#fff' : 'var(--accent)',
    backdropFilter: isGhost ? 'blur(8px)' : undefined,
    opacity: disabled ? 0.6 : 1,
    transition: 'background var(--transition)',
    whiteSpace: 'nowrap',
  }

  const motionProps = {
    whileHover: disabled ? {} : { scale: 1.04, boxShadow: 'var(--glow)' },
    whileTap: disabled ? {} : { scale: 0.97 },
    transition: { duration: 0.15 },
  }

  if (to) {
    return (
      <motion.div {...motionProps} style={{ display: 'inline-flex' }}>
        <Link to={to} style={style}>{children}</Link>
      </motion.div>
    )
  }

  if (href) {
    return (
      <motion.div {...motionProps} style={{ display: 'inline-flex' }}>
        <a href={href} target="_blank" rel="noopener noreferrer" style={style}>{children}</a>
      </motion.div>
    )
  }

  return (
    <motion.button
      {...motionProps}
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={style}
    >
      {children}
    </motion.button>
  )
}
