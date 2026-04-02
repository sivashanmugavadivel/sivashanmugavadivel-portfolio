import { motion } from 'framer-motion'

export default function ThemeToggle({ theme, onToggle }) {
  const isDark = theme === 'dark'

  return (
    <motion.button
      onClick={onToggle}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      style={{
        background: 'var(--accent-bg)',
        border: '1px solid var(--accent-border)',
        borderRadius: 'var(--radius)',
        padding: '8px',
        cursor: 'pointer',
        color: 'var(--accent)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 38,
        height: 38,
        flexShrink: 0,
      }}
    >
      <motion.span
        key={theme}
        initial={{ rotate: -90, opacity: 0 }}
        animate={{ rotate: 0, opacity: 1 }}
        exit={{ rotate: 90, opacity: 0 }}
        transition={{ duration: 0.25 }}
        style={{ display: 'flex', fontSize: 18, lineHeight: 1 }}
      >
        {isDark ? '☀️' : '🌙'}
      </motion.span>
    </motion.button>
  )
}
