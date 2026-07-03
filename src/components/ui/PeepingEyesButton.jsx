import { useRef, useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

/*
 * PeepingEyesButton — a primary CTA with a pair of googly eyes that peek over
 * the top edge on hover and whose pupils follow the cursor. Retracts on leave.
 * Inspired by the Framer "Peeping Eyes Button", rebuilt in React + framer-motion.
 */
export default function PeepingEyesButton({ children, to, href, onClick, type = 'button' }) {
  const [hover, setHover] = useState(false)
  const [blink, setBlink] = useState(false)
  const eyeRefs = [useRef(null), useRef(null)]
  const pupilRefs = [useRef(null), useRef(null)]

  // Blink while the eyes are peeking — a prompt first blink, then repeating.
  useEffect(() => {
    if (!hover) { setBlink(false); return }
    let alive = true
    let openT
    const doBlink = () => {
      if (!alive) return
      setBlink(true)
      openT = setTimeout(() => {
        if (!alive) return
        setBlink(false)
        openT = setTimeout(doBlink, 1500 + Math.random() * 1500)
      }, 150)
    }
    const startT = setTimeout(doBlink, 600)
    return () => { alive = false; clearTimeout(openT); clearTimeout(startT) }
  }, [hover])

  // Pupils track the cursor while hovered; recenter otherwise.
  useEffect(() => {
    if (!hover) {
      pupilRefs.forEach(p => { if (p.current) p.current.style.transform = 'translate(0px, 0px)' })
      return
    }
    const onMove = (e) => {
      eyeRefs.forEach((eyeRef, i) => {
        const eye = eyeRef.current, pupil = pupilRefs[i].current
        if (!eye || !pupil) return
        const r = eye.getBoundingClientRect()
        const dx = e.clientX - (r.left + r.width / 2)
        const dy = e.clientY - (r.top + r.height / 2)
        const dist = Math.hypot(dx, dy) || 1
        const max = r.width * 0.24                 // pupil travel radius
        const mag = Math.min(max, dist / 5)
        pupil.style.transform = `translate(${((dx / dist) * mag).toFixed(1)}px, ${((dy / dist) * mag).toFixed(1)}px)`
      })
    }
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [hover])

  const style = {
    position: 'relative', zIndex: 1,
    display: 'inline-flex', alignItems: 'center', gap: 8,
    padding: '10px 22px', borderRadius: 999,
    fontFamily: 'var(--sans)', fontSize: '0.88rem', fontWeight: 500,
    cursor: 'pointer', textDecoration: 'none', border: 'none',
    background: 'var(--accent)', color: '#fff', whiteSpace: 'nowrap',
    transition: 'background var(--transition)',
  }

  const eyes = (
    <div style={{ position: 'absolute', left: '50%', top: 0, transform: 'translateX(-50%)', zIndex: 0, pointerEvents: 'none' }}>
      <motion.div
        initial={false}
        animate={{ y: hover ? -9 : 13 }}
        transition={{ type: 'spring', stiffness: 420, damping: 20 }}
        style={{ display: 'flex', gap: 8, marginTop: -12 }}
      >
        {[0, 1].map(i => (
          <motion.div
            key={i}
            ref={eyeRefs[i]}
            // Blink (both eyes together) — driven by the blink timer above.
            animate={{ scaleY: blink ? 0.1 : 1 }}
            transition={{ duration: 0.09, ease: 'easeInOut' }}
            style={{
              width: 24, height: 24, borderRadius: '50%', background: '#fff',
              boxShadow: '0 2px 6px rgba(0,0,0,0.35)', transformOrigin: 'center',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <div ref={pupilRefs[i]} style={{
              width: 10, height: 10, borderRadius: '50%', background: '#141414',
              transition: 'transform 0.06s linear',
            }} />
          </motion.div>
        ))}
      </motion.div>
    </div>
  )

  const inner = to
    ? <Link to={to} style={style}>{children}</Link>
    : href
      ? <a href={href} target="_blank" rel="noopener noreferrer" style={style}>{children}</a>
      : <button type={type} onClick={onClick} style={style}>{children}</button>

  return (
    <motion.div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.15 }}
      style={{ position: 'relative', display: 'inline-flex' }}
    >
      {eyes}
      {inner}
    </motion.div>
  )
}
