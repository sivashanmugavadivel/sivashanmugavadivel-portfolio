import { motion } from 'framer-motion'
import { useLocation } from 'react-router-dom'

const transition = { duration: 0.38, ease: [0.25, 0.1, 0.25, 1] }

export default function PageWrapper({ children }) {
  const location = useLocation()

  return (
    <motion.div
      key={location.pathname}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={transition}
      style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
    >
      {children}
    </motion.div>
  )
}
