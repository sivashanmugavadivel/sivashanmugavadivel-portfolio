import { motion } from 'framer-motion'
import { useRef } from 'react'

export default function ThemeToggle({ theme, onToggle }) {
  const isDark = theme === 'dark'
  const btnRef = useRef(null)

  const handleToggle = (e) => {
    // Get click position for circular wipe origin
    const rect = btnRef.current?.getBoundingClientRect()
    const x = rect ? rect.left + rect.width / 2 : e.clientX
    const y = rect ? rect.top + rect.height / 2 : e.clientY

    // Check if View Transitions API is available
    if (document.startViewTransition) {
      // Set CSS custom properties for the wipe origin
      document.documentElement.style.setProperty('--wipe-x', `${x}px`)
      document.documentElement.style.setProperty('--wipe-y', `${y}px`)
      document.startViewTransition(() => onToggle())
    } else {
      // Fallback: use clip-path animation
      const overlay = document.createElement('div')
      const newTheme = isDark ? 'light' : 'dark'
      const bg = newTheme === 'dark' ? '#16141a' : '#faf9f7'

      Object.assign(overlay.style, {
        position: 'fixed', top: '0', left: '0', width: '100vw', height: '100vh',
        zIndex: '999999', pointerEvents: 'none', background: bg,
        clipPath: `circle(0% at ${x}px ${y}px)`,
        transition: 'clip-path 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
      })
      document.body.appendChild(overlay)

      requestAnimationFrame(() => {
        // Calculate max radius to cover entire screen
        const maxR = Math.hypot(
          Math.max(x, window.innerWidth - x),
          Math.max(y, window.innerHeight - y)
        )
        overlay.style.clipPath = `circle(${maxR}px at ${x}px ${y}px)`
      })

      // Toggle theme after a tiny delay so overlay starts expanding first
      setTimeout(() => onToggle(), 50)

      // Remove overlay after animation
      setTimeout(() => overlay.remove(), 700)
    }
  }

  return (
    <motion.button
      ref={btnRef}
      onClick={handleToggle}
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
