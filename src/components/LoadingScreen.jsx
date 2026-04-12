import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useRef } from 'react'
import StarfieldCanvas from './StarfieldCanvas'

const ease = [0.76, 0, 0.24, 1]
const BASE = import.meta.env.BASE_URL

const wordVariants = {
  hidden: { opacity: 0, y: 32 },
  show: (delay) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.7, ease: [0.25, 0.1, 0.25, 1], delay },
  }),
  exit: { opacity: 0, transition: { duration: 0.2 } },
}

const GIF_H = 'clamp(320px, 52vw, 540px)'
const FS    = 'clamp(2.6rem, 5.5vw, 5rem)'

// ── Design B colors ──
const LEFT_BG  = '#16141a'
const RIGHT_BG = '#f5f0eb'
const SEAM_COLOR = '#fb923c'

const FW_COLORS = [
  '#f0abfc','#a78bfa','#7c3aed','#c084fc',
  '#fbbf24','#f472b6','#38bdf8','#ffffff',
]

// ── Fireworks canvas ──
function FireworksCanvas({ active }) {
  const canvasRef = useRef(null)
  const rafRef    = useRef(null)
  const particles = useRef([])
  const running   = useRef(false)

  useEffect(() => {
    if (!active) {
      running.current = false
      cancelAnimationFrame(rafRef.current)
      return
    }

    const cvs = canvasRef.current
    if (!cvs) return
    const ctx = cvs.getContext('2d')

    function resize() {
      cvs.width  = window.innerWidth
      cvs.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)
    running.current = true

    function burst(x, y) {
      const color = FW_COLORS[Math.floor(Math.random() * FW_COLORS.length)]
      const count = 60 + Math.floor(Math.random() * 30)
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 / count) * i + Math.random() * 0.3
        const speed = 2 + Math.random() * 5
        particles.current.push({
          x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
          color, alpha: 1, radius: 1.5 + Math.random() * 2.5,
          decay: 0.012 + Math.random() * 0.01, gravity: 0.07,
        })
      }
      const c2 = FW_COLORS[Math.floor(Math.random() * FW_COLORS.length)]
      for (let i = 0; i < 14; i++) {
        const angle = (Math.PI * 2 / 14) * i
        particles.current.push({
          x, y, vx: Math.cos(angle) * (1 + Math.random() * 2),
          vy: Math.sin(angle) * (1 + Math.random() * 2),
          color: c2, alpha: 0.9, radius: 1, decay: 0.02, gravity: 0.03,
        })
      }
    }

    const W = cvs.width, H = cvs.height
    const schedule = [1500, 1750, 2050, 2400, 2800, 3250, 3750]
    const timers = schedule.map((delay, idx) => setTimeout(() => {
      if (!running.current) return
      burst(W * (0.2 + Math.random() * 0.6), H * (0.1 + Math.random() * 0.55))
      if (idx % 3 === 0) {
        setTimeout(() => {
          if (!running.current) return
          burst(W * (0.25 + Math.random() * 0.5), H * (0.15 + Math.random() * 0.45))
        }, 160)
      }
    }, delay))

    function loop() {
      ctx.clearRect(0, 0, cvs.width, cvs.height)
      const ps = particles.current
      for (let i = ps.length - 1; i >= 0; i--) {
        const p = ps[i]
        p.x += p.vx; p.y += p.vy
        p.vy += p.gravity; p.vx *= 0.97; p.vy *= 0.97
        p.alpha -= p.decay
        if (p.alpha <= 0) { ps.splice(i, 1); continue }
        ctx.save(); ctx.globalAlpha = p.alpha * 0.35
        const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius * 3)
        grd.addColorStop(0, p.color); grd.addColorStop(1, 'transparent')
        ctx.fillStyle = grd
        ctx.beginPath(); ctx.arc(p.x, p.y, p.radius * 3, 0, Math.PI * 2); ctx.fill()
        ctx.restore()
        ctx.save(); ctx.globalAlpha = p.alpha
        ctx.fillStyle = p.color; ctx.shadowColor = p.color; ctx.shadowBlur = 5
        ctx.beginPath(); ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2); ctx.fill()
        ctx.restore()
      }
      if (running.current || ps.length > 0) {
        rafRef.current = requestAnimationFrame(loop)
      }
    }
    loop()

    return () => {
      running.current = false
      cancelAnimationFrame(rafRef.current)
      timers.forEach(clearTimeout)
      window.removeEventListener('resize', resize)
    }
  }, [active])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed', inset: 0, zIndex: 10000,
        pointerEvents: 'none',
        opacity: active ? 1 : 0,
        transition: 'opacity 0.5s ease',
      }}
    />
  )
}

export default function LoadingScreen({ isVisible, onExitComplete }) {
  return (
    <>
      <StarfieldCanvas active={isVisible} />
      <FireworksCanvas active={isVisible} />
      <AnimatePresence onExitComplete={onExitComplete}>
        {isVisible && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 9999, pointerEvents: 'all' }}>

            {/* ── Left panel — dark ── */}
            <motion.div
              initial={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ duration: 1.0, ease, delay: 0.2 }}
              style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '50%', background: 'rgba(22,20,26,0.88)' }}
            />

            {/* ── Right panel — light ── */}
            <motion.div
              initial={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ duration: 1.0, ease, delay: 0.2 }}
              style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: '50%', background: 'rgba(245,240,235,0.88)', overflow: 'visible' }}
            >
              <motion.img
                src={`${BASE}gif/ava_gif2.gif`}
                alt="" aria-hidden="true"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                style={{
                  position: 'absolute', bottom: 0, left: 0,
                  transform: 'translateX(-30%)',
                  height: GIF_H, width: 'auto',
                  objectFit: 'contain', pointerEvents: 'none', zIndex: 20,
                }}
              />
            </motion.div>

            {/* ── Center seam line + glow ── */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              style={{
                position: 'absolute', top: 0, bottom: 0,
                left: '50%', transform: 'translateX(-50%)',
                width: 2,
                background: `linear-gradient(to bottom, transparent 0%, ${SEAM_COLOR} 30%, ${SEAM_COLOR} 70%, transparent 100%)`,
                boxShadow: `0 0 8px 3px ${SEAM_COLOR}99, 0 0 20px 6px ${SEAM_COLOR}44`,
                pointerEvents: 'none', zIndex: 15,
              }}
            />

            {/* ── "Journey" — Merienda font, orange ── */}
            <motion.div
              custom={0.15} variants={wordVariants}
              initial="hidden" animate="show" exit="exit"
              style={{
                position: 'absolute',
                top: '10vh',
                left: 'calc(50% + 20px)',
                right: 0,
                display: 'flex',
                justifyContent: 'flex-start',
                zIndex: 25, pointerEvents: 'none',
              }}
            >
              <span style={{
                fontFamily: "'Merienda', cursive", fontSize: FS,
                fontWeight: 700,
                color: SEAM_COLOR,
                lineHeight: 1.2, letterSpacing: '-0.01em',
              }}>Journey</span>
            </motion.div>

            {/* ── "Begins" — light text on dark side ── */}
            <motion.div
              custom={0.35} variants={wordVariants}
              initial="hidden" animate="show" exit="exit"
              style={{
                position: 'absolute',
                top: 'calc(10vh + 7rem)',
                left: 0,
                width: 'calc(50% - 20px)',
                display: 'flex',
                justifyContent: 'flex-end',
                zIndex: 25, pointerEvents: 'none',
              }}
            >
              <span style={{
                fontFamily: 'var(--heading)', fontSize: FS,
                fontWeight: 700, color: '#f3f0ff',
                lineHeight: 1.2, letterSpacing: '-0.02em',
                opacity: 0.35,
              }}>Begins</span>
            </motion.div>

            {/* ── Credit — light text ── */}
            <motion.div
              custom={0.55} variants={wordVariants}
              initial="hidden" animate="show" exit="exit"
              style={{
                position: 'absolute',
                bottom: '5vh',
                left: '32px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                zIndex: 25, pointerEvents: 'none',
              }}
            >
              <span style={{
                fontFamily: 'var(--sans)',
                fontSize: window.innerWidth <= 639 ? '0.36rem' : '0.6rem',
                fontWeight: 400,
                color: '#f3f0ff', opacity: 0.4,
                letterSpacing: '0.1em', textTransform: 'uppercase',
                marginBottom: '0.25em',
              }}>Designed &amp; Developed by</span>
              <span style={{
                fontFamily: 'var(--heading)',
                fontSize: window.innerWidth <= 639 ? '0.5rem' : 'clamp(0.85rem, 1.6vw, 1.1rem)',
                fontWeight: 700, color: '#f3f0ff', opacity: 0.65,
                letterSpacing: window.innerWidth <= 639 ? '0.06em' : '0.12em',
                textTransform: 'uppercase',
              }}>Siva Shanmuga Vadivel</span>
            </motion.div>

          </div>
        )}
      </AnimatePresence>
    </>
  )
}
