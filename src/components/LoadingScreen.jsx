import { motion, AnimatePresence } from 'framer-motion'

const ease = [0.76, 0, 0.24, 1]

export default function LoadingScreen({ isVisible }) {
  return (
    <AnimatePresence>
      {isVisible && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, pointerEvents: 'all' }}>

          {/* ── Left panel ── */}
          <motion.div
            initial={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ duration: 0.9, ease, delay: 0.15 }}
            style={{
              position: 'absolute',
              top: 0, left: 0, bottom: 0,
              width: '50%',
              background: '#0a0a0a',
              overflow: 'hidden',
            }}
          />

          {/* ── Right panel ── */}
          <motion.div
            initial={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.9, ease, delay: 0.15 }}
            style={{
              position: 'absolute',
              top: 0, right: 0, bottom: 0,
              width: '50%',
              background: '#0a0a0a',
              overflow: 'hidden',
            }}
          />

          {/* ── Centered content — name + GIF ── */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.25 }}
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 10,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 24,
              pointerEvents: 'none',
            }}
          >
            <img
              src="/sivashanmugavadivel-portfolio/gif/ava_gif1.gif"
              alt=""
              aria-hidden="true"
              style={{
                height: 'clamp(280px, 46vw, 460px)',
                width: 'auto',
                objectFit: 'contain',
              }}
            />
            <div style={{
              fontFamily: "'Lilita One', cursive",
              fontSize: 'clamp(1.6rem, 4.5vw, 3.2rem)',
              fontWeight: 400,
              color: '#ffffff',
              letterSpacing: '-0.01em',
              lineHeight: 1,
              whiteSpace: 'nowrap',
            }}>
              Siva Shanmuga Vadivel
            </div>
            {/* Accent line */}
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1], delay: 0.35 }}
              style={{
                width: 'clamp(200px, 30vw, 400px)',
                height: 2,
                background: 'var(--accent)',
                borderRadius: 2,
                transformOrigin: 'left',
              }}
            />
          </motion.div>

          {/* ── Center seam glow ── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, delay: 0.5 }}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 1,
              height: '60vh',
              background: 'linear-gradient(to bottom, transparent, var(--accent), transparent)',
              pointerEvents: 'none',
              zIndex: 5,
            }}
          />

        </div>
      )}
    </AnimatePresence>
  )
}
