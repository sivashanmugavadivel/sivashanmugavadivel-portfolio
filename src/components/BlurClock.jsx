import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

/*
 * BlurClock — a live clock (with seconds) whose digits morph with a blur+fade as
 * they change. Inspired by the Framer "Blur Animated Timer", rebuilt in React +
 * framer-motion. Timezone-aware; each digit only re-animates when its value flips.
 */
function Digit({ char }) {
  return (
    <span style={{ position: 'relative', display: 'inline-block', width: '0.62em', height: '1.15em' }}>
      <AnimatePresence initial={false}>
        <motion.span
          key={char}
          initial={{ opacity: 0, filter: 'blur(10px)', y: '-74%' }}
          animate={{ opacity: 1, filter: 'blur(0px)', y: '-50%' }}
          exit={{ opacity: 0, filter: 'blur(10px)', y: '-26%' }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          style={{ position: 'absolute', left: 0, right: 0, top: '50%', textAlign: 'center' }}
        >
          {char}
        </motion.span>
      </AnimatePresence>
    </span>
  )
}

export default function BlurClock({ timeZone = 'Asia/Kolkata' }) {
  const [now, setNow] = useState(() => new Date())
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  // Mobile-only: smaller clock so the full time + AM/PM clears the avatar GIF.
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)')
    const apply = () => setIsMobile(mq.matches)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])

  const str = now.toLocaleTimeString('en-US', {
    timeZone, hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit',
  })
  const [clock, period] = str.split(' ') // "03:24:15", "PM"

  return (
    <div style={{ display: 'inline-flex', alignItems: 'baseline', gap: isMobile ? 5 : 6, color: 'var(--text-h)', fontVariantNumeric: 'tabular-nums' }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', fontSize: isMobile ? '1.25rem' : '1.6rem', fontWeight: 800, letterSpacing: '0.01em' }}>
        {clock.split('').map((ch, i) =>
          ch === ':'
            ? <span key={i} style={{ padding: '0 1px', opacity: 0.45 }}>:</span>
            : <Digit key={i} char={ch} />
        )}
      </span>
      {period && <span style={{ fontSize: isMobile ? '0.66rem' : '0.72rem', fontWeight: 700, color: 'var(--text)', opacity: 0.7, flexShrink: 0 }}>{period}</span>}
    </div>
  )
}
