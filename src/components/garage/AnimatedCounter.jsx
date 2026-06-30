import { useState, useEffect, useRef } from 'react'
import { useInView } from 'framer-motion'

export default function AnimatedCounter({ value, suffix = '', prefix = '', duration = 1800, style = {} }) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  const started = useRef(false)

  useEffect(() => {
    if (!inView || started.current) return
    started.current = true
    const steps = 60
    const increment = value / steps
    const interval = duration / steps
    let current = 0
    const timer = setInterval(() => {
      current += increment
      if (current >= value) {
        setCount(value)
        clearInterval(timer)
      } else {
        setCount(Math.floor(current))
      }
    }, interval)
    return () => clearInterval(timer)
  }, [inView, value, duration])

  return (
    <span ref={ref} style={style}>
      {prefix}{count.toLocaleString('en-IN')}{suffix}
    </span>
  )
}
