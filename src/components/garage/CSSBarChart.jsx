import { motion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef } from 'react'

export default function CSSBarChart({ data, color = 'var(--accent)', maxHeight = 140, barWidth = 32 }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  const max = Math.max(...data.map(d => d.value), 1)

  return (
    <div ref={ref} style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: maxHeight + 32, paddingBottom: 24, position: 'relative' }}>
      {data.map((d, i) => {
        const h = Math.round((d.value / max) * maxHeight)
        return (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flex: 1, minWidth: barWidth }}>
            <div style={{ fontSize: '0.65rem', color: 'var(--text)', opacity: 0.7 }}>
              {d.value > 0 ? (d.value >= 1000 ? `${(d.value / 1000).toFixed(1)}k` : d.value) : ''}
            </div>
            <motion.div
              initial={{ height: 0 }}
              animate={inView ? { height: h } : { height: 0 }}
              transition={{ duration: 0.6, delay: i * 0.04, ease: 'easeOut' }}
              style={{
                width: '100%',
                background: color,
                borderRadius: '4px 4px 0 0',
                minHeight: h > 0 ? 4 : 0,
              }}
            />
            <div style={{ fontSize: '0.65rem', color: 'var(--text)', opacity: 0.6, textAlign: 'center', position: 'absolute', bottom: 0 }}>
              {d.label}
            </div>
          </div>
        )
      })}
    </div>
  )
}
