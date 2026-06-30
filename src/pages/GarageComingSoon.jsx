import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

/* ── Rotating gear (lucide cog) ── */
function Gear({ size, duration, reverse = false, style }) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      animate={{ rotate: reverse ? -360 : 360 }}
      transition={{ duration, repeat: Infinity, ease: 'linear' }}
      style={style}
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </motion.svg>
  )
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
}
const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
}

export default function GarageComingSoon() {
  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      style={{
        position: 'relative',
        minHeight: 'calc(100vh - 80px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        background: 'var(--bg)',
        padding: '120px 24px 80px',
      }}
    >
      {/* Soft accent glow */}
      <motion.div
        animate={{ opacity: [0.25, 0.5, 0.25], scale: [0.9, 1.1, 0.9] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)',
          width: 'min(680px, 90vw)', height: 420, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(124,58,237,0.28) 0%, transparent 68%)',
          filter: 'blur(40px)', pointerEvents: 'none',
        }}
      />

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        style={{
          position: 'relative', zIndex: 1,
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          textAlign: 'center', maxWidth: 620,
        }}
      >
        {/* Interlocking gears */}
        <motion.div variants={item} style={{ position: 'relative', height: 130, marginBottom: 28, color: 'var(--accent)' }}>
          <Gear size={110} duration={9} style={{ filter: 'drop-shadow(0 8px 24px rgba(124,58,237,0.35))' }} />
          <Gear size={64} duration={6} reverse style={{ position: 'absolute', right: -34, bottom: -6, opacity: 0.85 }} />
        </motion.div>

        {/* Under construction tag */}
        <motion.div
          variants={item}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '6px 16px', borderRadius: 999, marginBottom: 22,
            background: 'var(--accent-bg)', border: '1px solid var(--accent-border)',
            color: 'var(--accent)', fontSize: '0.72rem', fontWeight: 700,
            letterSpacing: '0.14em', textTransform: 'uppercase',
          }}
        >
          🚧 Under Construction
        </motion.div>

        {/* Heading */}
        <motion.h1
          variants={item}
          style={{
            margin: 0, fontWeight: 900, color: 'var(--text-h)',
            fontSize: 'clamp(2.4rem, 8vw, 4.5rem)', lineHeight: 1.02, letterSpacing: '-0.02em',
          }}
        >
          My Garage is<br />
          <span style={{ color: 'var(--accent)' }}>Coming Soon</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          variants={item}
          style={{
            margin: '20px 0 0', color: 'var(--text)', lineHeight: 1.7,
            fontSize: 'clamp(0.95rem, 2.4vw, 1.1rem)', maxWidth: 440,
          }}
        >
          I'm tuning up something special — rides, gear, and the stories behind them.
          Park here a little longer. 🏍️
        </motion.p>

        {/* Indeterminate progress bar */}
        <motion.div
          variants={item}
          style={{
            position: 'relative', width: 'min(300px, 80vw)', height: 6,
            borderRadius: 999, background: 'var(--border)', overflow: 'hidden', marginTop: 36,
          }}
        >
          <motion.div
            animate={{ x: ['-100%', '350%'] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              position: 'absolute', top: 0, bottom: 0, width: '40%', borderRadius: 999,
              background: 'linear-gradient(90deg, transparent, var(--accent), transparent)',
            }}
          />
        </motion.div>

        {/* Back home */}
        <motion.div variants={item} style={{ marginTop: 40 }}>
          <Link
            to="/"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '11px 26px', borderRadius: 999,
              background: 'var(--accent)', color: '#fff',
              fontSize: '0.88rem', fontWeight: 600, textDecoration: 'none',
              boxShadow: '0 8px 24px rgba(124,58,237,0.3)',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back to Home
          </Link>
        </motion.div>
      </motion.div>

      {/* Construction stripe at the very bottom */}
      <motion.div
        animate={{ backgroundPositionX: ['0px', '56px'] }}
        transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
        style={{
          position: 'absolute', left: 0, right: 0, bottom: 0, height: 10,
          backgroundImage: 'repeating-linear-gradient(45deg, #f5b301 0 14px, #1a1a1a 14px 28px)',
          backgroundSize: '56px 56px', opacity: 0.85,
        }}
      />
    </motion.section>
  )
}
