import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const MESSAGES = {
  name:        "Hey, you found me! 😄",
  doubleClick: "Whoa, curious one aren't you? 🕵️",
  secret:      "You know the password 🔐 Welcome, insider!",
}

function EasterToast({ message, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <motion.div
      initial={{ opacity: 0, y: -32, scale: 0.88 }}
      animate={{ opacity: 1, y: 0,   scale: 1 }}
      exit={{    opacity: 0, y: -20, scale: 0.88 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      onClick={onDone}
      style={{
        position: 'fixed',
        top: 80,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        cursor: 'pointer',
        padding: '12px 28px',
        borderRadius: 999,
        background: 'var(--card-bg)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1.5px solid var(--accent)',
        boxShadow: '0 0 24px var(--accent), 0 8px 32px rgba(0,0,0,0.3)',
        color: 'var(--text-h)',
        fontFamily: 'var(--sans)',
        fontSize: '0.95rem',
        fontWeight: 600,
        whiteSpace: 'nowrap',
        userSelect: 'none',
      }}
    >
      {message}
    </motion.div>
  )
}

export default function EasterEgg() {
  const [toast, setToast] = useState(null)
  const keyBuffer = { current: '' }

  const trigger = useCallback((type) => {
    setToast({ msg: MESSAGES[type], id: Date.now() })
  }, [])

  /* Name click via custom event from Home.jsx */
  useEffect(() => {
    const handler = () => trigger('name')
    window.addEventListener('easter-egg', handler)
    return () => window.removeEventListener('easter-egg', handler)
  }, [trigger])

  /* Double-click background */
  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
      trigger('doubleClick')
    }
    window.addEventListener('dblclick', handler)
    return () => window.removeEventListener('dblclick', handler)
  }, [trigger])

  /* Type "siva" anywhere */
  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
      keyBuffer.current = (keyBuffer.current + e.key).slice(-4).toLowerCase()
      if (keyBuffer.current === 'siva') {
        keyBuffer.current = ''
        trigger('secret')
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [trigger])

  return (
    <AnimatePresence>
      {toast && (
        <EasterToast
          key={toast.id}
          message={toast.msg}
          onDone={() => setToast(null)}
        />
      )}
    </AnimatePresence>
  )
}
