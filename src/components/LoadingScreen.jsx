import { motion, AnimatePresence } from 'framer-motion'

const name = 'Siva Shanmuga Vadivel'
const chars = name.split('')

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.04, delayChildren: 0.3 },
  },
}

const charVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
}

const topPanelVariants = {
  initial: { y: 0 },
  exit: { y: '-100%', transition: { duration: 0.7, ease: [0.76, 0, 0.24, 1], delay: 0.1 } },
}

const bottomPanelVariants = {
  initial: { y: 0 },
  exit: { y: '100%', transition: { duration: 0.7, ease: [0.76, 0, 0.24, 1], delay: 0.1 } },
}

const dotVariants = {
  hidden: { scaleX: 0 },
  visible: {
    scaleX: 1,
    transition: { duration: 0.4, ease: 'easeOut', delay: name.length * 0.04 + 0.5 },
  },
}

export default function LoadingScreen({ isVisible }) {
  return (
    <AnimatePresence>
      {isVisible && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            pointerEvents: 'all',
          }}
        >
          {/* Top half */}
          <motion.div
            variants={topPanelVariants}
            initial="initial"
            exit="exit"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '50%',
              background: 'var(--accent)',
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'center',
              paddingBottom: '8px',
            }}
          >
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              style={{
                fontFamily: 'var(--heading)',
                fontSize: 'clamp(1.5rem, 4vw, 3rem)',
                fontWeight: 700,
                color: '#fff',
                letterSpacing: '-0.02em',
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'center',
                gap: '0',
                lineHeight: 1,
              }}
            >
              {chars.map((char, i) =>
                char === ' ' ? (
                  <span key={i} style={{ width: '0.3em', display: 'inline-block' }} />
                ) : (
                  <motion.span key={i} variants={charVariants}>
                    {char}
                  </motion.span>
                )
              )}
            </motion.div>
          </motion.div>

          {/* Bottom half */}
          <motion.div
            variants={bottomPanelVariants}
            initial="initial"
            exit="exit"
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '50%',
              background: 'var(--accent)',
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'center',
              paddingTop: '8px',
            }}
          >
            <motion.div
              variants={dotVariants}
              initial="hidden"
              animate="visible"
              style={{
                width: 48,
                height: 4,
                background: 'rgba(255,255,255,0.5)',
                borderRadius: 2,
                transformOrigin: 'left',
              }}
            />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
