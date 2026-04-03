import { motion, AnimatePresence } from 'framer-motion'

const ease = [0.76, 0, 0.24, 1]
const BASE = import.meta.env.BASE_URL

export default function LoadingScreen({ isVisible }) {
  return (
    <AnimatePresence>
      {isVisible && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, pointerEvents: 'all' }}>

          {/* ── Left panel ── */}
          <motion.div
            initial={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ duration: 1.0, ease, delay: 0.2 }}
            style={{
              position: 'absolute',
              top: 0, left: 0, bottom: 0,
              width: '50%',
              background: '#f5f0eb',
            }}
          />

          {/* ── Right panel — GIF anchored to left (center seam) edge ── */}
          <motion.div
            initial={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 1.0, ease, delay: 0.2 }}
            style={{
              position: 'absolute',
              top: 0, right: 0, bottom: 0,
              width: '50%',
              background: '#f5f0eb',
              overflow: 'visible',
            }}
          >
            {/* GIF placed at the left edge of the right panel (center of screen) */}
            <motion.img
              src={`${BASE}gif/ava_gif2.gif`}
              alt=""
              aria-hidden="true"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                transform: 'translateX(-30%)',
                height: 'clamp(320px, 52vw, 540px)',
                width: 'auto',
                objectFit: 'contain',
                pointerEvents: 'none',
                zIndex: 20,
              }}
            />
          </motion.div>

          {/* ── Center seam glow ── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            style={{
              position: 'absolute',
              top: 0, bottom: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 2,
              background: 'linear-gradient(to bottom, transparent 0%, var(--accent) 30%, var(--accent) 70%, transparent 100%)',
              pointerEvents: 'none',
              zIndex: 15,
            }}
          />


        </div>
      )}
    </AnimatePresence>
  )
}
