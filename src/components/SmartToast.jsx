import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getGreeting } from '../utils/timeGreeting'

const SESSION_KEY = 'smart_toast_shown'
const LOADING_DELAY = 4000  // wait for loading screen to finish

export default function SmartToast() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY)) return
    const t = setTimeout(() => {
      setVisible(true)
      sessionStorage.setItem(SESSION_KEY, '1')
    }, LOADING_DELAY)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (!visible) return
    const t = setTimeout(() => setVisible(false), 4000)
    return () => clearTimeout(t)
  }, [visible])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.92 }}
          animate={{ opacity: 1, y: 0,  scale: 1 }}
          exit={{    opacity: 0, y: 20, scale: 0.92 }}
          transition={{ type: 'spring', stiffness: 260, damping: 22 }}
          onClick={() => setVisible(false)}
          style={{
            position: 'fixed',
            bottom: 32,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '12px 24px',
            borderRadius: 999,
            background: 'var(--card-bg)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid var(--accent)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.25), 0 0 0 1px var(--accent-border)',
            color: 'var(--text-h)',
            fontFamily: 'var(--sans)',
            fontSize: '0.95rem',
            fontWeight: 500,
            whiteSpace: 'nowrap',
            userSelect: 'none',
          }}
        >
          <span style={{ fontSize: '1.1rem' }}>{getGreeting()}</span>
          <span style={{ opacity: 0.5, fontSize: '0.75rem', marginLeft: 4 }}>· tap to dismiss</span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
