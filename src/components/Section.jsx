import { motion } from 'framer-motion'

export default function Section({ children, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1], delay }}
      viewport={{ once: false, margin: '-80px' }}
      className="section"
    >
      {children}
    </motion.div>
  )
}
