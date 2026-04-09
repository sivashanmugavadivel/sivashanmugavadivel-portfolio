import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'

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

const GIF_H_DESKTOP = 'clamp(320px, 52vw, 540px)'
const FS_DESKTOP    = 'clamp(2.6rem, 5.5vw, 5rem)'

export default function LoadingScreen({ isVisible }) {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 640)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)')
    setIsMobile(mq.matches)
    const handler = (e) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])


  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="loading-screen"
          initial={{ opacity: 1 }}
          exit={{ opacity: 1 }}
          transition={{ duration: 1.2, ease }}
          style={{ position: 'fixed', inset: 0, zIndex: 9999, pointerEvents: 'all' }}
        >

          {isMobile ? (
            /* ══════════════════════════════
               MOBILE LAYOUT
            ══════════════════════════════ */
            <>
              {/* Top panel — slides up */}
              <motion.div
                initial={{ y: 0 }} exit={{ y: '-100%' }}
                transition={{ duration: 1.0, ease, delay: 0.2 }}
                style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '50%', background: '#f5f0eb' }}
              />

              {/* Bottom panel — slides down */}
              <motion.div
                initial={{ y: 0 }} exit={{ y: '100%' }}
                transition={{ duration: 1.0, ease, delay: 0.2 }}
                style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%', background: '#f5f0eb' }}
              />

              {/* Center seam line */}
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

              {/* "Journey" — right of seam, top area */}
              <motion.div
                custom={0.15} variants={wordVariants}
                initial="hidden" animate="show" exit="exit"
                style={{
                  position: 'absolute',
                  top: '12vh',
                  left: 'calc(50% + 12px)',
                  right: 0,
                  display: 'flex',
                  justifyContent: 'flex-start',
                  zIndex: 25, pointerEvents: 'none',
                }}
              >
                <span style={{
                  fontFamily: 'var(--heading)',
                  fontSize: 'clamp(2rem, 10vw, 3rem)',
                  fontWeight: 700, fontStyle: 'italic',
                  color: 'var(--accent)',
                  lineHeight: 1.2, letterSpacing: '-0.02em',
                }}>Journey</span>
              </motion.div>

              {/* "Begins" — left of seam, below Journey with gap */}
              <motion.div
                custom={0.35} variants={wordVariants}
                initial="hidden" animate="show" exit="exit"
                style={{
                  position: 'absolute',
                  top: 'calc(12vh + 10rem)',
                  left: 0,
                  width: 'calc(50% - 12px)',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  zIndex: 25, pointerEvents: 'none',
                }}
              >
                <span style={{
                  fontFamily: 'var(--heading)',
                  fontSize: 'clamp(2rem, 10vw, 3rem)',
                  fontWeight: 700, color: '#1a1512',
                  lineHeight: 1.2, letterSpacing: '-0.02em',
                  opacity: 0.35,
                }}>Begins</span>
              </motion.div>

              {/* Credit — bottom left, above GIF */}
              <motion.div
                custom={0.5} variants={wordVariants}
                initial="hidden" animate="show" exit="exit"
                style={{
                  position: 'absolute',
                  bottom: '24px',
                  left: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  zIndex: 25, pointerEvents: 'none',
                }}
              >
                <span style={{
                  fontFamily: 'var(--sans)',
                  fontSize: '0.5rem',
                  fontWeight: 400,
                  color: '#1a1512',
                  opacity: 0.4,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  marginBottom: '0.18em',
                }}>Designed &amp; Developed by</span>
                <span style={{
                  fontFamily: 'var(--heading)',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: '#1a1512',
                  opacity: 0.65,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                }}>Siva Shanmuga Vadivel</span>
              </motion.div>

              {/* GIF — bottom center */}
              <motion.img
                src={`${BASE}gif/ava_gif2.gif`}
                alt="" aria-hidden="true"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: '50%',
                  transform: 'translateX(-30%)',
                  height: 'clamp(200px, 55vw, 300px)',
                  width: 'auto',
                  objectFit: 'contain',
                  pointerEvents: 'none', zIndex: 20,
                }}
              />
            </>
          ) : (
            /* ══════════════════════════════
               DESKTOP LAYOUT
            ══════════════════════════════ */
            <>
              {/* Left panel */}
              <motion.div
                initial={{ x: 0 }} exit={{ x: '-100%' }}
                transition={{ duration: 1.0, ease, delay: 0.2 }}
                style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '50%', background: '#f5f0eb' }}
              />

              {/* Right panel */}
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
                    height: GIF_H_DESKTOP, width: 'auto',
                    objectFit: 'contain', pointerEvents: 'none', zIndex: 20,
                  }}
                />
              </motion.div>

              {/* Center seam line */}
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

              {/* "Journey" — right of seam */}
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
                  fontFamily: 'var(--heading)', fontSize: FS_DESKTOP,
                  fontWeight: 700, fontStyle: 'italic',
                  color: 'var(--accent)',
                  lineHeight: 1.2, letterSpacing: '-0.02em',
                }}>Journey</span>
              </motion.div>

              {/* "Begins" — left of seam */}
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
                  fontFamily: 'var(--heading)', fontSize: FS_DESKTOP,
                  fontWeight: 700, color: '#1a1512',
                  lineHeight: 1.2, letterSpacing: '-0.02em',
                  opacity: 0.35,
                }}>Begins</span>
              </motion.div>

              {/* Credit — bottom left */}
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
            </>
          )}

        </motion.div>
      )}
    </AnimatePresence>
  )
}
