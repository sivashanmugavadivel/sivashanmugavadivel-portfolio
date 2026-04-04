import { motion, AnimatePresence } from 'framer-motion'
import { useLocation } from 'react-router-dom'

const pageVariants = {
  '/': {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -8 },
  },
  '/about': {
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -12 },
  },
  '/contact': {
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -12 },
  },
  '/gallery': {
    initial: { opacity: 0, y: 32 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -16 },
  },
  '/videos': {
    initial: { opacity: 0, y: -32 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 16 },
  },
  '/blog': {
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -12 },
  },
}

const defaultVariant = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
}

const transition = { duration: 0.38, ease: [0.25, 0.1, 0.25, 1] }

export default function PageWrapper({ children }) {
  const location = useLocation()
  const variant = pageVariants[location.pathname] || defaultVariant

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={variant.initial}
        animate={variant.animate}
        exit={variant.exit}
        transition={transition}
        style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
