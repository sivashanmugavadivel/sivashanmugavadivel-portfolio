import { motion, AnimatePresence } from 'framer-motion'

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

/* GIF height — keep in sync with the img style below */
const GIF_H = 'clamp(320px, 52vw, 540px)'
const FS    = 'clamp(2.6rem, 5.5vw, 5rem)'
const GAP   = '0.25em'

export default function LoadingScreen({ isVisible }) {
  return (
    <AnimatePresence>
      {isVisible && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, pointerEvents: 'all' }}>

          {/* ── Left panel ── */}
          <motion.div
            initial={{ x: 0 }} exit={{ x: '-100%' }}
            transition={{ duration: 1.0, ease, delay: 0.2 }}
            style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '50%', background: '#f5f0eb' }}
          />

          {/* ── Right panel ── */}
          <motion.div
            initial={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ duration: 1.0, ease, delay: 0.2 }}
            style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: '50%', background: '#f5f0eb', overflow: 'visible' }}
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

          {/* ── Center seam glow ── */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            style={{
              position: 'absolute', top: 0, bottom: 0,
              left: '50%', transform: 'translateX(-50%)',
              width: 2,
              background: 'linear-gradient(to bottom, transparent 0%, var(--accent) 30%, var(--accent) 70%, transparent 100%)',
              pointerEvents: 'none', zIndex: 15,
            }}
          />

          {/* ══════════════════════════════════════════
              Text block — sits in the safe zone ABOVE
              the GIF. Each row is absolutely positioned
              from the TOP so nothing can overlap.
              Layout (% of viewport height):
                ROW 1 "A"       → top 12vh
                ROW 2 "Journey" → top 12vh + 1 line
                ROW 3 "begins"  → top 12vh + 2 lines
              Line height ≈ clamp(2.6rem,5.5vw,5rem)*1.25
              At worst-case 5rem * 1.25 = 6.25rem ≈ 100px
              3 rows × 100px = 300px — well above 540px GIF bottom.
          ══════════════════════════════════════════ */}

          {/* ROW 1 — "Journey"  left-aligned starting from seam */}
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
              fontFamily: 'var(--heading)', fontSize: FS,
              fontWeight: 700, fontStyle: 'italic',
              color: 'var(--accent)',
              lineHeight: 1.2, letterSpacing: '-0.02em',
            }}>Journey</span>
          </motion.div>

          {/* ROW 2 — "begins"  right-aligned ending at seam */}
          <motion.div
            custom={0.35} variants={wordVariants}
            initial="hidden" animate="show" exit="exit"
            style={{
              position: 'absolute',
              top: `calc(10vh + ${FS} * 1.35)`,
              left: 0,
              width: 'calc(50% - 20px)',
              display: 'flex',
              justifyContent: 'flex-end',
              zIndex: 25, pointerEvents: 'none',
            }}
          >
            <span style={{
              fontFamily: 'var(--heading)', fontSize: FS,
              fontWeight: 700, color: '#1a1512',
              lineHeight: 1.2, letterSpacing: '-0.02em',
              opacity: 0.35,
            }}>Begins</span>
          </motion.div>

          {/* ── Bottom credit ── */}
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
              fontSize: '0.6rem',
              fontWeight: 400,
              color: '#1a1512',
              opacity: 0.4,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              marginBottom: '0.25em',
            }}>Designed &amp; Developed by</span>
            <span style={{
              fontFamily: 'var(--heading)',
              fontSize: 'clamp(0.85rem, 1.6vw, 1.1rem)',
              fontWeight: 700,
              color: '#1a1512',
              opacity: 0.65,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
            }}>Siva Shanmuga Vadivel</span>
          </motion.div>

        </div>
      )}
    </AnimatePresence>
  )
}
