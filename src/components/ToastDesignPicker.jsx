import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence, useAnimation } from 'framer-motion'
import { getGreeting } from '../utils/timeGreeting'

/* ═══════════════════════════════════════════════════════════════
   TOAST DESIGNS  — each receives { message, onDone, position }
   position: 'bottom-center' | 'top-center' | 'bottom-right'
═══════════════════════════════════════════════════════════════ */

/* 1 ─ Glass Pill */
function Toast1({ message, onDone }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.85 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 30, scale: 0.85 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      onClick={onDone}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 10,
        padding: '13px 26px', borderRadius: 999,
        background: 'rgba(255,255,255,0.08)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.18)',
        boxShadow: '0 8px 40px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.15)',
        color: '#fff', fontFamily: 'var(--sans)', fontSize: '0.95rem',
        fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap',
      }}
    >
      <motion.span animate={{ rotate: [0, 20, -10, 20, 0] }} transition={{ delay: 0.3, duration: 0.6 }}>
        👋
      </motion.span>
      {message}
    </motion.div>
  )
}

/* 2 ─ Neon Glow */
function Toast2({ message, onDone }) {
  return (
    <motion.div
      initial={{ opacity: 0, scaleX: 0.2 }}
      animate={{ opacity: 1, scaleX: 1 }}
      exit={{ opacity: 0, scaleX: 0.2 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      onClick={onDone}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 12,
        padding: '11px 28px', borderRadius: 6,
        background: 'linear-gradient(90deg, #7c3aed, #a855f7, #ec4899)',
        boxShadow: '0 0 30px #7c3aed99, 0 0 60px #7c3aed44',
        color: '#fff', fontFamily: 'var(--sans)',
        fontSize: '0.95rem', fontWeight: 700, cursor: 'pointer',
      }}
    >
      <motion.span
        animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
        transition={{ duration: 1, repeat: Infinity }}
        style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff', flexShrink: 0, display: 'inline-block' }}
      />
      {message}
    </motion.div>
  )
}

/* 3 ─ Bouncy Cartoon Card */
function Toast3({ message, onDone }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -80, rotate: -6 }}
      animate={{ opacity: 1, y: 0, rotate: 0 }}
      exit={{ opacity: 0, scale: 0.5, rotate: 12 }}
      transition={{ type: 'spring', stiffness: 220, damping: 14 }}
      onClick={onDone}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 14,
        padding: '14px 22px', borderRadius: 20,
        background: 'linear-gradient(135deg, #fef9c3, #fde68a)',
        border: '3px solid #f59e0b',
        boxShadow: '4px 4px 0px #d97706, 0 12px 40px rgba(245,158,11,0.3)',
        color: '#92400e', fontFamily: 'var(--sans)', cursor: 'pointer',
      }}
    >
      <motion.span
        animate={{ rotate: [0, -15, 15, -10, 10, 0], scale: [1, 1.3, 1] }}
        transition={{ delay: 0.2, duration: 0.8 }}
        style={{ fontSize: '1.8rem', lineHeight: 1 }}
      >☀️</motion.span>
      <div>
        <div style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.6 }}>Hey there!</div>
        <div style={{ fontSize: '1rem', fontWeight: 700 }}>{message}</div>
      </div>
    </motion.div>
  )
}

/* 4 ─ Slide Banner (from right) */
function Toast4({ message, onDone }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 160 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 160 }}
      transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      onClick={onDone}
      style={{
        display: 'inline-flex', alignItems: 'stretch', gap: 0,
        borderRadius: 14, overflow: 'hidden',
        boxShadow: '0 12px 40px rgba(0,0,0,0.35)',
        cursor: 'pointer', fontFamily: 'var(--sans)',
      }}
    >
      <div style={{
        background: 'linear-gradient(180deg,#7c3aed,#4f46e5)',
        padding: '0 16px', display: 'flex', alignItems: 'center',
        fontSize: '1.5rem',
      }}>
        <motion.span
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 0.8, repeat: 2, repeatType: 'loop' }}
        >✨</motion.span>
      </div>
      <div style={{
        background: 'var(--card-bg)', padding: '14px 20px',
        color: 'var(--text-h)', fontSize: '0.93rem', fontWeight: 500,
        borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)',
        borderRight: '1px solid var(--border)', borderRadius: '0 14px 14px 0',
      }}>
        {message}
      </div>
    </motion.div>
  )
}

/* 5 ─ Terminal Typewriter */
function Toast5({ message, onDone }) {
  const [text, setText] = useState('')
  useEffect(() => {
    let i = 0
    const iv = setInterval(() => { i++; setText(message.slice(0, i)); if (i >= message.length) clearInterval(iv) }, 32)
    return () => clearInterval(iv)
  }, [message])
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 16 }}
      transition={{ duration: 0.3 }}
      onClick={onDone}
      style={{
        padding: '14px 22px', borderRadius: 10,
        background: '#0d1117', border: '1px solid #30363d',
        boxShadow: '0 0 0 1px #21262d, 0 16px 40px rgba(0,0,0,0.6)',
        fontFamily: "'Courier New', monospace", fontSize: '0.9rem',
        color: '#58a6ff', cursor: 'pointer', minWidth: 260,
      }}
    >
      <div style={{ color: '#3fb950', fontSize: '0.7rem', marginBottom: 6, fontWeight: 600 }}>● portfolio.js</div>
      <span style={{ color: '#8b949e' }}>$ </span>
      {text}
      <motion.span
        animate={{ opacity: [1, 0] }}
        transition={{ duration: 0.5, repeat: Infinity }}
        style={{ display: 'inline-block', width: 7, height: '0.9em', background: '#58a6ff', marginLeft: 2, verticalAlign: 'text-bottom', borderRadius: 1 }}
      />
    </motion.div>
  )
}

/* 6 ─ Confetti Pop */
function Toast6({ message, onDone }) {
  const confetti = Array.from({ length: 10 }, (_, i) => ({
    color: ['#f59e0b','#ef4444','#22c55e','#3b82f6','#a855f7','#ec4899','#06b6d4','#f97316','#84cc16','#e879f9'][i],
    x: (Math.random() - 0.5) * 120,
    y: -(40 + Math.random() * 60),
    rotate: Math.random() * 360,
  }))
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.4, rotate: -10 }}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      exit={{ opacity: 0, scale: 0.3, rotate: 10 }}
      transition={{ type: 'spring', stiffness: 350, damping: 18 }}
      onClick={onDone}
      style={{
        display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 6,
        padding: '20px 32px', borderRadius: 24,
        background: 'linear-gradient(135deg,#1e1b4b,#312e81)',
        boxShadow: '0 20px 60px rgba(124,58,237,0.5)',
        color: '#fff', fontFamily: 'var(--sans)', cursor: 'pointer',
        position: 'relative', overflow: 'visible',
      }}
    >
      {confetti.map((c, i) => (
        <motion.div key={i}
          initial={{ x: 0, y: 0, opacity: 1, rotate: 0, scale: 1 }}
          animate={{ x: c.x, y: c.y, opacity: 0, rotate: c.rotate, scale: 0.4 }}
          transition={{ delay: i * 0.04, duration: 0.9, ease: 'easeOut' }}
          style={{ position: 'absolute', top: '50%', left: '50%', width: 8, height: 8, borderRadius: 2, background: c.color, marginLeft: -4, marginTop: -4 }}
        />
      ))}
      <motion.span animate={{ scale: [1, 1.4, 1], rotate: [0, 15, -15, 0] }} transition={{ delay: 0.2, duration: 0.7 }} style={{ fontSize: '2rem' }}>🎉</motion.span>
      <span style={{ fontSize: '0.95rem', fontWeight: 700 }}>{message}</span>
    </motion.div>
  )
}

/* 7 ─ Cartoon Character Bubble */
function Toast7({ message, onDone }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0, originX: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      onClick={onDone}
      style={{ display: 'inline-flex', alignItems: 'flex-end', gap: 10, cursor: 'pointer' }}
    >
      {/* Character */}
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
        style={{ fontSize: '2.8rem', lineHeight: 1, flexShrink: 0 }}
      >🧑‍💻</motion.div>
      {/* Speech bubble */}
      <div style={{ position: 'relative' }}>
        <div style={{
          background: '#fff', color: '#1a1a1a', padding: '12px 18px',
          borderRadius: '18px 18px 18px 4px',
          boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
          fontFamily: 'var(--sans)', fontSize: '0.95rem', fontWeight: 600,
          whiteSpace: 'nowrap',
        }}>
          {message}
          <motion.span
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
            style={{ marginLeft: 6, fontSize: '0.7rem', color: '#888' }}
          >•••</motion.span>
        </div>
      </div>
    </motion.div>
  )
}

/* 8 ─ Retro Game */
function Toast8({ message, onDone }) {
  const [score] = useState(Math.floor(Math.random() * 900) + 100)
  return (
    <motion.div
      initial={{ opacity: 0, y: -60 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -60 }}
      transition={{ type: 'spring', stiffness: 280, damping: 20 }}
      onClick={onDone}
      style={{
        padding: '14px 24px', borderRadius: 0,
        background: '#000', border: '3px solid #fff',
        boxShadow: '4px 4px 0 #fff, 8px 8px 0 rgba(255,255,255,0.2)',
        fontFamily: "'Courier New', monospace",
        color: '#fff', cursor: 'pointer',
        imageRendering: 'pixelated',
      }}
    >
      <div style={{ color: '#facc15', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.15em', marginBottom: 6 }}>
        ★ PLAYER 1 READY ★
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <motion.span
          animate={{ opacity: [1, 0, 1] }}
          transition={{ duration: 0.6, repeat: 3 }}
          style={{ fontSize: '1.2rem' }}
        >👾</motion.span>
        <span style={{ fontSize: '0.88rem', letterSpacing: '0.05em' }}>{message}</span>
      </div>
      <div style={{ color: '#4ade80', fontSize: '0.6rem', marginTop: 6, letterSpacing: '0.12em' }}>
        SCORE: {score} &nbsp;|&nbsp; PRESS ANY KEY
      </div>
    </motion.div>
  )
}

/* 9 ─ Sticker Drop */
function Toast9({ message, onDone }) {
  const stickers = ['⭐','💫','✨','🌟']
  return (
    <motion.div
      initial={{ opacity: 0, y: -120, rotate: 8 }}
      animate={{ opacity: 1, y: 0, rotate: -2 }}
      exit={{ opacity: 0, y: 60, rotate: -8, scale: 0.7 }}
      transition={{ type: 'spring', stiffness: 180, damping: 14 }}
      onClick={onDone}
      style={{
        padding: '16px 24px 20px', borderRadius: 4,
        background: '#fef3c7',
        boxShadow: '2px 2px 0 #f59e0b, 4px 4px 0 rgba(245,158,11,0.4), 0 20px 50px rgba(0,0,0,0.25)',
        fontFamily: 'var(--sans)', color: '#78350f',
        cursor: 'pointer', position: 'relative', minWidth: 220,
      }}
    >
      {/* Tape strip at top */}
      <div style={{
        position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)',
        width: 60, height: 20, background: 'rgba(251,191,36,0.7)',
        borderRadius: 3, backdropFilter: 'blur(2px)',
      }} />
      <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
        {stickers.map((s, i) => (
          <motion.span key={i}
            initial={{ scale: 0, rotate: -30 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.1 + i * 0.08, type: 'spring', stiffness: 400 }}
            style={{ fontSize: '0.9rem' }}
          >{s}</motion.span>
        ))}
      </div>
      <div style={{ fontSize: '1rem', fontWeight: 700, lineHeight: 1.3 }}>{message}</div>
      <div style={{ fontSize: '0.65rem', opacity: 0.5, marginTop: 6, fontStyle: 'italic' }}>tap to dismiss</div>
    </motion.div>
  )
}

/* 10 ─ Aurora Wave */
function Toast10({ message, onDone }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 30, scale: 0.85 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      onClick={onDone}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 12,
        padding: '13px 26px', borderRadius: 16,
        background: 'linear-gradient(120deg,#0ea5e9,#6366f1,#a855f7,#ec4899)',
        backgroundSize: '300% 300%',
        boxShadow: '0 12px 40px rgba(99,102,241,0.5)',
        color: '#fff', fontFamily: 'var(--sans)',
        fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer',
        position: 'relative', overflow: 'hidden',
      }}
    >
      {/* Animated shimmer */}
      <motion.div
        animate={{ x: ['-100%', '200%'] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
        style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
          pointerEvents: 'none',
        }}
      />
      <motion.span
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        style={{ fontSize: '1.2rem' }}
      >🌈</motion.span>
      {message}
    </motion.div>
  )
}

/* 11 ─ Rocket Launch */
function Toast11({ message, onDone }) {
  return (
    <motion.div
      initial={{ y: 120, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -120, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 16 }}
      onClick={onDone}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 14,
        padding: '14px 24px', borderRadius: 20,
        background: 'linear-gradient(135deg,#0f172a,#1e293b)',
        border: '1px solid #334155',
        boxShadow: '0 0 40px rgba(99,102,241,0.4), 0 20px 60px rgba(0,0,0,0.5)',
        color: '#e2e8f0', fontFamily: 'var(--sans)', cursor: 'pointer',
        position: 'relative', overflow: 'hidden',
      }}
    >
      {/* Stars */}
      {[...Array(6)].map((_, i) => (
        <motion.div key={i}
          animate={{ opacity: [0, 1, 0], scale: [0.5, 1, 0.5] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
          style={{
            position: 'absolute',
            top: `${10 + Math.sin(i * 1.5) * 30}%`,
            left: `${8 + i * 14}%`,
            width: 3, height: 3, borderRadius: '50%', background: '#fff',
          }}
        />
      ))}
      <div style={{ position: 'relative' }}>
        <motion.div
          animate={{ y: [0, -4, 0], rotate: [-5, 5, -5] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          style={{ fontSize: '2rem', lineHeight: 1 }}
        >🚀</motion.div>
        {/* Exhaust */}
        <motion.div
          animate={{ scaleY: [1, 1.6, 0.8, 1], opacity: [0.8, 0.4, 0.9, 0.8] }}
          transition={{ duration: 0.4, repeat: Infinity }}
          style={{
            position: 'absolute', bottom: -8, left: '50%', transform: 'translateX(-50%)',
            width: 8, height: 12, borderRadius: '0 0 50% 50%',
            background: 'linear-gradient(180deg, #f97316, #ef4444, transparent)',
            filter: 'blur(2px)',
          }}
        />
      </div>
      <div>
        <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 2 }}>Launching</div>
        <div style={{ fontSize: '0.95rem', fontWeight: 600 }}>{message}</div>
      </div>
    </motion.div>
  )
}

/* 12 ─ Bubble Chat (typing dots → reveal) */
function Toast12({ message, onDone }) {
  const [phase, setPhase] = useState('typing')
  useEffect(() => {
    const t = setTimeout(() => setPhase('message'), 1400)
    return () => clearTimeout(t)
  }, [])
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.7, y: 30 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.7, y: 20 }}
      transition={{ type: 'spring', stiffness: 320, damping: 22 }}
      onClick={onDone}
      style={{ display: 'inline-flex', alignItems: 'flex-end', gap: 10, cursor: 'pointer' }}
    >
      <motion.div
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        style={{ fontSize: '2.2rem', lineHeight: 1, flexShrink: 0 }}
      >😊</motion.div>
      <div style={{
        background: '#25d366', color: '#fff',
        padding: '11px 16px', borderRadius: '18px 18px 4px 18px',
        fontFamily: 'var(--sans)', fontSize: '0.92rem', fontWeight: 500,
        boxShadow: '0 4px 20px rgba(37,211,102,0.4)',
        minWidth: 120, minHeight: 42, display: 'flex', alignItems: 'center',
      }}>
        <AnimatePresence mode="wait">
          {phase === 'typing' ? (
            <motion.div key="dots" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              {[0, 1, 2].map(i => (
                <motion.span key={i}
                  animate={{ y: [0, -5, 0], opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.15 }}
                  style={{ width: 7, height: 7, borderRadius: '50%', background: '#fff', display: 'inline-block' }}
                />
              ))}
            </motion.div>
          ) : (
            <motion.span key="msg" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>{message}</motion.span>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

/* 13 ─ Stamp Approval */
function Toast13({ message, onDone }) {
  const [stamped, setStamped] = useState(false)
  useEffect(() => { const t = setTimeout(() => setStamped(true), 300); return () => clearTimeout(t) }, [])
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      onClick={onDone}
      style={{
        padding: '20px 28px', borderRadius: 12,
        background: '#fff', color: '#1a1a1a',
        boxShadow: '0 16px 50px rgba(0,0,0,0.3)',
        fontFamily: 'var(--sans)', cursor: 'pointer',
        position: 'relative', overflow: 'hidden', minWidth: 240,
      }}
    >
      <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: 6 }}>Notification</div>
      <div style={{ fontSize: '1rem', fontWeight: 600 }}>{message}</div>
      {/* Stamp */}
      <AnimatePresence>
        {stamped && (
          <motion.div
            initial={{ scale: 3, opacity: 0, rotate: -15 }}
            animate={{ scale: 1, opacity: 1, rotate: -12 }}
            transition={{ type: 'spring', stiffness: 400, damping: 18 }}
            style={{
              position: 'absolute', top: 8, right: 10,
              border: '3px solid #22c55e', borderRadius: 8,
              padding: '3px 8px', color: '#22c55e',
              fontSize: '0.7rem', fontWeight: 900, letterSpacing: '0.1em',
              textTransform: 'uppercase', opacity: 0.85,
            }}
          >✓ Approved</motion.div>
        )}
      </AnimatePresence>
      {/* Ink splatter dots */}
      {stamped && [0,1,2,3,4].map(i => (
        <motion.div key={i}
          initial={{ scale: 0, opacity: 0.8 }}
          animate={{ scale: 1, opacity: 0, x: (i-2)*12, y: (i%2===0 ? -1:1)*8 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          style={{
            position: 'absolute', top: 16, right: 38,
            width: 5, height: 5, borderRadius: '50%', background: '#22c55e',
          }}
        />
      ))}
    </motion.div>
  )
}

/* 14 ─ Weather Widget */
function Toast14({ message, onDone }) {
  const h = new Date().getHours()
  const isDay = h >= 6 && h < 19
  const icon = h < 6 ? '🌙' : h < 12 ? '🌤️' : h < 17 ? '☀️' : h < 20 ? '🌅' : '🌙'
  const bg = isDay
    ? 'linear-gradient(135deg,#38bdf8,#0ea5e9)'
    : 'linear-gradient(135deg,#1e3a5f,#0f172a)'
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: -30 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, y: -20 }}
      transition={{ type: 'spring', stiffness: 280, damping: 20 }}
      onClick={onDone}
      style={{
        padding: '16px 22px', borderRadius: 20,
        background: bg, color: '#fff',
        boxShadow: '0 16px 50px rgba(14,165,233,0.5)',
        fontFamily: 'var(--sans)', cursor: 'pointer',
        minWidth: 220, position: 'relative', overflow: 'hidden',
      }}
    >
      {/* Cloud drifts */}
      {isDay && (
        <motion.div
          animate={{ x: [0, 20, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          style={{ position: 'absolute', top: 6, right: 16, fontSize: '1.1rem', opacity: 0.4 }}
        >☁️</motion.div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <motion.div
          animate={isDay ? { rotate: [0, 20, 0], scale: [1, 1.1, 1] } : { scale: [1, 1.05, 1] }}
          transition={{ duration: 3, repeat: Infinity }}
          style={{ fontSize: '2.4rem', lineHeight: 1 }}
        >{icon}</motion.div>
        <div>
          <div style={{ fontSize: '0.65rem', opacity: 0.75, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            {isDay ? 'Good Day' : 'Good Night'}
          </div>
          <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>{message}</div>
        </div>
      </div>
    </motion.div>
  )
}

/* 15 ─ VHS Rewind */
function Toast15({ message, onDone }) {
  const [glitch, setGlitch] = useState(false)
  useEffect(() => {
    const t = setInterval(() => { setGlitch(true); setTimeout(() => setGlitch(false), 120) }, 2200)
    return () => clearInterval(t)
  }, [])
  return (
    <motion.div
      initial={{ opacity: 0, scaleY: 0.1 }}
      animate={{ opacity: 1, scaleY: 1 }}
      exit={{ opacity: 0, scaleY: 0.1 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      onClick={onDone}
      style={{
        padding: '14px 24px', borderRadius: 4,
        background: '#0a0a0a', border: '2px solid #ff0040',
        boxShadow: '0 0 20px #ff004066, 4px 0 0 #00ffff, -4px 0 0 #ff0040',
        fontFamily: "'Courier New', monospace", color: '#fff',
        cursor: 'pointer', position: 'relative', minWidth: 260,
      }}
    >
      <div style={{ color: '#ff0040', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.2em', marginBottom: 6 }}>
        ▶ REC &nbsp;●&nbsp; PLAY
      </div>
      <motion.div
        animate={glitch ? { x: [0, 4, -4, 0], skewX: [0, 6, -6, 0] } : {}}
        transition={{ duration: 0.12 }}
        style={{ fontSize: '0.9rem', letterSpacing: '0.05em' }}
      >
        {message}
      </motion.div>
      <div style={{ color: '#444', fontSize: '0.58rem', marginTop: 6, letterSpacing: '0.12em' }}>
        {new Date().toLocaleTimeString()}
      </div>
      {/* Scanlines */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)',
        borderRadius: 2,
      }} />
    </motion.div>
  )
}

/* 16 ─ Kawaii Bounce */
function Toast16({ message, onDone }) {
  const faces = ['(＾▽＾)', '(◕‿◕)', '(✿◠‿◠)', '(ﾉ◕ヮ◕)ﾉ']
  const [face] = useState(faces[Math.floor(Math.random() * faces.length)])
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0, rotate: -20 }}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      exit={{ opacity: 0, scale: 0, rotate: 20 }}
      transition={{ type: 'spring', stiffness: 380, damping: 16 }}
      onClick={onDone}
      style={{
        display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 8,
        padding: '18px 28px', borderRadius: 24,
        background: 'linear-gradient(135deg,#fce7f3,#fbcfe8)',
        border: '2px solid #f9a8d4',
        boxShadow: '0 12px 40px rgba(249,168,212,0.5), 4px 4px 0 #f9a8d4',
        color: '#9d174d', fontFamily: 'var(--sans)', cursor: 'pointer',
      }}
    >
      <motion.div
        animate={{ y: [0, -8, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
        style={{ fontSize: '1.5rem', letterSpacing: '0.05em', fontWeight: 700 }}
      >{face}</motion.div>
      <div style={{ fontSize: '0.92rem', fontWeight: 700 }}>{message}</div>
      <div style={{ display: 'flex', gap: 6 }}>
        {['💕','⭐','🌸'].map((s, i) => (
          <motion.span key={i}
            animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.2, 1] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.3 }}
            style={{ fontSize: '0.85rem' }}
          >{s}</motion.span>
        ))}
      </div>
    </motion.div>
  )
}

/* 17 ─ Dev Bubble (Character + Glass Pill combined) */
function Toast17({ message, onDone }) {
  const [phase, setPhase] = useState('typing')

  useEffect(() => {
    const t = setTimeout(() => setPhase('message'), 1800)
    return () => clearTimeout(t)
  }, [])

  const bubbleBase = {
    display: 'inline-flex', alignItems: 'center',
    borderRadius: 999,
    background: 'rgba(255,255,255,0.1)',
    backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.22)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.18)',
    // flat bottom-left corner = tail toward character
    borderBottomLeftRadius: 6,
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 48 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 32 }}
      transition={{ type: 'spring', stiffness: 240, damping: 22 }}
      onClick={onDone}
      style={{ display: 'inline-flex', alignItems: 'flex-end', gap: 12, cursor: 'pointer' }}
    >
      {/* Floating gif character */}
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        style={{ flexShrink: 0, userSelect: 'none' }}
      >
        <img src={`${import.meta.env.BASE_URL}toast-gif.gif`} alt="" style={{ width: 64, height: 64, objectFit: 'contain', display: 'block' }} />
      </motion.div>

      {/* Bubble — swaps from dots to message */}
      <AnimatePresence mode="wait">
        {phase === 'typing' ? (
          <motion.div
            key="dots"
            initial={{ opacity: 0, scale: 0.75 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.75 }}
            transition={{ type: 'spring', stiffness: 360, damping: 24 }}
            style={{ ...bubbleBase, padding: '14px 20px', gap: 7 }}
          >
            {[0, 1, 2].map(i => (
              <motion.span
                key={i}
                animate={{ y: [0, -6, 0], opacity: [0.35, 1, 0.35] }}
                transition={{ duration: 0.65, repeat: Infinity, delay: i * 0.16, ease: 'easeInOut' }}
                style={{
                  width: 9, height: 9, borderRadius: '50%',
                  background: 'rgba(255,255,255,0.85)',
                  display: 'inline-block', flexShrink: 0,
                }}
              />
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="msg"
            initial={{ opacity: 0, scale: 0.75 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: 'spring', stiffness: 360, damping: 24 }}
            style={{
              ...bubbleBase,
              padding: '13px 22px', gap: 10,
              color: '#fff', fontFamily: 'var(--sans)',
              fontSize: '0.95rem', fontWeight: 500,
              whiteSpace: 'nowrap',
            }}
          >
            <motion.span
              animate={{ rotate: [0, 18, -10, 14, 0] }}
              transition={{ delay: 0.15, duration: 0.6 }}
            >👋</motion.span>
            {message}
            <span style={{ opacity: 0.4, fontSize: '0.7rem', marginLeft: 2 }}>· tap</span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   Design registry
═══════════════════════════════════════════════════════════════ */
const DESIGNS = [
  { id: 1,  name: 'Glass Pill',         desc: 'Frosted glass · wave hand',            Component: Toast1,  pos: 'bottom-center' },
  { id: 2,  name: 'Neon Glow',          desc: 'Gradient bar · pulse dot · scaleX',    Component: Toast2,  pos: 'bottom-center' },
  { id: 3,  name: 'Cartoon Card',       desc: 'Sticky note · sun spin · drop shadow', Component: Toast3,  pos: 'bottom-center' },
  { id: 4,  name: 'Slide Banner',       desc: 'Two-panel · bouncing icon · spring',   Component: Toast4,  pos: 'bottom-right'  },
  { id: 5,  name: 'Terminal',           desc: 'GitHub dark · typewriter · cursor',    Component: Toast5,  pos: 'bottom-center' },
  { id: 6,  name: 'Confetti Pop',       desc: 'Scale bounce · 10 confetti pieces',    Component: Toast6,  pos: 'bottom-center' },
  { id: 7,  name: 'Character Bubble',   desc: 'Floating dev · speech bubble',         Component: Toast7,  pos: 'bottom-left'   },
  { id: 8,  name: 'Retro Game',         desc: 'Pixel font · flashing alien · score',  Component: Toast8,  pos: 'top-center'    },
  { id: 9,  name: 'Sticker Drop',       desc: 'Post-it drop · tape · star stickers',  Component: Toast9,  pos: 'bottom-right'  },
  { id: 10, name: 'Aurora Wave',        desc: 'Rainbow shimmer · spinning globe',     Component: Toast10, pos: 'bottom-center' },
  { id: 11, name: 'Rocket Launch',      desc: 'Rocket with exhaust · starfield',       Component: Toast11, pos: 'bottom-center' },
  { id: 12, name: 'Bubble Chat',        desc: 'Typing dots → WhatsApp reveal',         Component: Toast12, pos: 'bottom-left'   },
  { id: 13, name: 'Stamp Approval',     desc: 'Stamp slam · ink splatter · approved',  Component: Toast13, pos: 'bottom-center' },
  { id: 14, name: 'Weather Widget',     desc: 'Time-aware sky · drifting clouds',       Component: Toast14, pos: 'bottom-center' },
  { id: 15, name: 'VHS Rewind',         desc: 'Glitch effect · scanlines · REC dot',   Component: Toast15, pos: 'bottom-center' },
  { id: 16, name: 'Kawaii Bounce',      desc: 'Bouncy faces · pink gradient · hearts', Component: Toast16, pos: 'bottom-center' },
  { id: 17, name: 'Dev Bubble',         desc: 'Floating dev · typing dots → glass pill', Component: Toast17, pos: 'bottom-left'   },
]

export const STORAGE_KEY = 'selected_toast_design'

/* ═══════════════════════════════════════════════════════════════
   Full-screen toast overlay — fires on the real page
═══════════════════════════════════════════════════════════════ */
function getPositionStyle(pos) {
  const base = { position: 'fixed', zIndex: 9999 }
  if (pos === 'top-center')    return { ...base, top: 80,    left: '50%', transform: 'translateX(-50%)' }
  if (pos === 'bottom-right')  return { ...base, bottom: 32, right: 28 }
  if (pos === 'bottom-left')   return { ...base, bottom: 32, left: 28 }
  return                              { ...base, bottom: 32, left: '50%', transform: 'translateX(-50%)' }
}

function ScreenToast({ design, message, onClose }) {
  const { Component, pos } = design
  return (
    <div style={getPositionStyle(pos)}>
      <Component message={message} onDone={onClose} />
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   Design card
═══════════════════════════════════════════════════════════════ */
function DesignCard({ design, selected, onSelect, onPreview }) {
  const isSelected = selected === design.id
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      style={{
        borderRadius: 16, overflow: 'hidden',
        border: isSelected ? '2px solid var(--accent)' : '1px solid var(--border)',
        background: 'var(--card-bg)',
        boxShadow: isSelected ? '0 0 0 4px var(--accent-bg), 0 8px 32px rgba(0,0,0,0.15)' : '0 2px 12px rgba(0,0,0,0.1)',
        transition: 'border-color 0.2s, box-shadow 0.2s',
      }}
    >
      {/* Header */}
      <div style={{ padding: '16px 18px 14px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-h)' }}>{design.name}</div>
          <span style={{
            fontSize: '0.65rem', fontWeight: 700, padding: '3px 8px', borderRadius: 999,
            background: 'var(--accent-bg)', color: 'var(--accent)',
            textTransform: 'uppercase', letterSpacing: '0.07em',
          }}>#{design.id}</span>
        </div>
        <div style={{ fontSize: '0.73rem', color: 'var(--text)', opacity: 0.55, marginTop: 3 }}>{design.desc}</div>
      </div>

      {/* Buttons */}
      <div style={{ padding: '12px 18px', display: 'flex', gap: 8 }}>
        <motion.button
          onClick={onPreview}
          whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
          style={{
            flex: 1, padding: '9px 0', borderRadius: 8, cursor: 'pointer',
            background: 'linear-gradient(90deg, var(--accent), #a855f7)',
            border: 'none', color: '#fff',
            fontFamily: 'var(--sans)', fontSize: '0.8rem', fontWeight: 700,
          }}
        >▶ Preview live</motion.button>

        <motion.button
          onClick={onSelect}
          whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
          style={{
            flex: 1, padding: '9px 0', borderRadius: 8, cursor: 'pointer',
            background: isSelected ? '#22c55e' : 'transparent',
            border: isSelected ? 'none' : '1.5px solid var(--border)',
            color: isSelected ? '#fff' : 'var(--text)',
            fontFamily: 'var(--sans)', fontSize: '0.8rem', fontWeight: 700,
            transition: 'all 0.2s',
          }}
        >{isSelected ? '✓ Active' : 'Select'}</motion.button>
      </div>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   Main export
═══════════════════════════════════════════════════════════════ */
export default function ToastDesignPicker() {
  const [selected, setSelected] = useState(() => parseInt(localStorage.getItem(STORAGE_KEY) || '1'))
  const [preview, setPreview] = useState(null)   // design id being previewed on screen
  const message = getGreeting() + ' Welcome!'

  const handleSelect = (id) => {
    setSelected(id)
    localStorage.setItem(STORAGE_KEY, String(id))
  }

  const handlePreview = (id) => {
    setPreview(null)
    setTimeout(() => setPreview(id), 60)
  }

  const activeDesign = DESIGNS.find(d => d.id === preview)

  return (
    <section className="section" style={{ background: 'var(--bg-secondary)' }}>
      <div className="page-container">
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <span className="section-label" style={{ display: 'block', marginBottom: 6 }}>Customise</span>
          <h2 style={{ margin: 0 }}>Toast Notification Style</h2>
          <p style={{ color: 'var(--text)', opacity: 0.6, fontSize: '0.9rem', marginTop: 10, maxWidth: 480, margin: '10px auto 0' }}>
            Click <strong style={{ color: 'var(--accent)' }}>▶ Preview live</strong> to see the real toast appear on screen.
            Click <strong style={{ color: 'var(--text-h)' }}>Select</strong> to use it as your greeting.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: 16,
        }}>
          {DESIGNS.map(design => (
            <DesignCard
              key={design.id}
              design={design}
              selected={selected}
              onSelect={() => handleSelect(design.id)}
              onPreview={() => handlePreview(design.id)}
            />
          ))}
        </div>

        <p style={{ textAlign: 'center', fontSize: '0.76rem', color: 'var(--text)', opacity: 0.4, marginTop: 28 }}>
          Selection saved automatically · shown once per session on page load
        </p>
      </div>

      {/* Real on-screen toast preview */}
      <AnimatePresence>
        {preview && activeDesign && (
          <ScreenToast
            key={preview}
            design={activeDesign}
            message={message}
            onClose={() => setPreview(null)}
          />
        )}
      </AnimatePresence>
    </section>
  )
}

export { DESIGNS }
