import { motion } from 'framer-motion'

export default function Tag({ label, active, onClick }) {
  const isClickable = typeof onClick === 'function'

  return (
    <motion.span
      layout
      onClick={isClickable ? onClick : undefined}
      whileHover={isClickable ? { scale: 1.05 } : {}}
      whileTap={isClickable ? { scale: 0.95 } : {}}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '4px 12px',
        borderRadius: 999,
        fontSize: '0.78rem',
        fontWeight: 500,
        fontFamily: 'var(--sans)',
        letterSpacing: '0.02em',
        cursor: isClickable ? 'pointer' : 'default',
        border: '1px solid',
        borderColor: active ? 'var(--accent)' : 'var(--border)',
        background: active ? 'var(--accent-bg)' : 'transparent',
        color: active ? 'var(--accent)' : 'var(--text)',
        transition: 'background var(--transition), color var(--transition), border-color var(--transition)',
        userSelect: 'none',
      }}
    >
      {label}
    </motion.span>
  )
}
