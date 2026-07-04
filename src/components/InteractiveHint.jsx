import { useRef, useState, useEffect } from 'react'
import { motion, AnimatePresence, useInView } from 'framer-motion'

/*
 * InteractiveHint — small floating pill that teaches first-time visitors that a
 * section is interactive ("✋ Drag to spin…"). Rendered absolutely inside the
 * host's relative container; fades in when its spot scrolls into view, bobs
 * gently, auto-hides after a few seconds, and re-appears on the next visit
 * until the host reports a real interaction (dismiss from useHint()).
 * pointerEvents: none — it never intercepts the interaction it advertises.
 */
export default function InteractiveHint({ show, label, style, delay = 0.35, autoHide = 6000 }) {
  const ref = useRef(null)
  const inView = useInView(ref)
  const [timedOut, setTimedOut] = useState(false)

  useEffect(() => {
    if (!inView) { setTimedOut(false); return }
    const t = setTimeout(() => setTimedOut(true), autoHide)
    return () => clearTimeout(t)
  }, [inView, autoHide])

  const visible = show && inView && !timedOut

  return (
    <div ref={ref} style={{ position: 'absolute', zIndex: 30, pointerEvents: 'none', ...style }}>
      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.88, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: [0, -5, 0] }}
            exit={{ opacity: 0, scale: 0.92, y: 4, transition: { duration: 0.25 } }}
            transition={{
              opacity: { duration: 0.35, delay },
              scale: { duration: 0.35, delay },
              y: { duration: 1.9, repeat: Infinity, ease: 'easeInOut', delay },
            }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              padding: '8px 14px', borderRadius: 999, whiteSpace: 'nowrap',
              background: 'rgba(14,12,20,0.88)',
              border: '1px solid rgba(139,92,246,0.45)',
              boxShadow: '0 10px 30px rgba(0,0,0,0.45), 0 0 18px rgba(139,92,246,0.22)',
              backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
              color: '#fff', fontSize: '0.82rem', fontWeight: 600,
              letterSpacing: '0.01em', fontFamily: 'var(--sans)',
            }}
          >
            {label}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
