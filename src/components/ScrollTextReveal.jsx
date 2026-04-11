import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'

/**
 * Text that reveals word by word as you scroll past it.
 * <ScrollTextReveal text="Your text here" />
 */
export default function ScrollTextReveal({ text, style = {}, className = '' }) {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start 0.85', 'end 0.4'],
  })

  const words = text.split(' ')

  return (
    <span ref={ref} className={className} style={{ display: 'inline', ...style }}>
      {words.map((word, i) => (
        <Word key={i} index={i} total={words.length} progress={scrollYProgress}>
          {word}
        </Word>
      ))}
    </span>
  )
}

function Word({ children, index, total, progress }) {
  // Each word has its own reveal window within the overall scroll progress
  const start = index / total
  const end = start + (1 / total)
  const opacity = useTransform(progress, [start, end], [0.15, 1])
  const y = useTransform(progress, [start, end], [4, 0])

  return (
    <motion.span
      style={{
        display: 'inline-block',
        opacity,
        y,
        marginRight: '0.3em',
        transition: 'color 0.3s',
      }}
    >
      {children}
    </motion.span>
  )
}
