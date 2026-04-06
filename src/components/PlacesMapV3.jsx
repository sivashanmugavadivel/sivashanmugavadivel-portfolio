/**
 * DESIGN V3 — "Explorer Board"
 * Map on top, animated stat cards below in a row with stagger + count-up.
 * Each stat card has a subtle animated gradient border.
 * Visited countries revealed one-by-one on scroll entrance.
 */
import { useState, useRef, useEffect } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps'
import cfg from '../data/config.json'

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'

function useCountUp(target, inView, delay = 0) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (!inView) { setVal(0); return }
    const timeout = setTimeout(() => {
      let start = null
      const step = ts => {
        if (!start) start = ts
        const p = Math.min((ts - start) / 1200, 1)
        const eased = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2
        setVal(Math.round(eased * target))
        if (p < 1) requestAnimationFrame(step)
      }
      requestAnimationFrame(step)
    }, delay * 1000)
    return () => clearTimeout(timeout)
  }, [inView, target, delay])
  return val
}

function StatCard({ icon, value, label, desc, delay, inView }) {
  const count = useCountUp(value, inView, delay)
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={inView ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 30, scale: 0.95 }}
      transition={{ duration: 0.6, delay, ease: [0.23, 1, 0.32, 1] }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      style={{
        flex: 1,
        minWidth: 0,
        borderRadius: 18,
        padding: '22px 18px',
        background: 'var(--card-bg)',
        border: '1px solid var(--border)',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Subtle top accent line */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={inView ? { scaleX: 1 } : { scaleX: 0 }}
        transition={{ duration: 0.5, delay: delay + 0.2 }}
        style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 2,
          background: 'var(--accent)', transformOrigin: 'left',
          opacity: 0.7,
        }}
      />

      <div style={{ fontSize: '1.6rem', marginBottom: 8 }}>{icon}</div>
      <div style={{
        fontSize: '2.4rem', fontWeight: 800, color: 'var(--text-h)',
        lineHeight: 1, fontVariantNumeric: 'tabular-nums',
      }}>
        <span style={{ color: 'var(--accent)' }}>{count}</span>
      </div>
      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-h)', marginTop: 6 }}>{label}</div>
      {desc && (
        <div style={{ fontSize: '0.7rem', color: 'var(--text)', opacity: 0.5, marginTop: 3 }}>{desc}</div>
      )}
    </motion.div>
  )
}

export default function PlacesMapV3() {
  const [tooltip, setTooltip] = useState(null)
  const [revealed, setRevealed] = useState([])
  const ref = useRef(null)
  const inView = useInView(ref, { once: false, margin: '-80px' })

  // Stagger-reveal visited countries on scroll
  useEffect(() => {
    if (!inView) { setRevealed([]); return }
    const ids = cfg.visitedCountries
    ids.forEach((id, i) => {
      setTimeout(() => setRevealed(prev => [...prev, id]), i * 300 + 400)
    })
  }, [inView])

  const stats = [
    { icon: '🌍', value: cfg.visitedCountries.length, label: 'Countries Visited', desc: 'India · UAE · USA' },
    { icon: '📍', value: cfg.places.length, label: 'Cities & Places', desc: 'Pinned on the map' },
    { icon: '✈️', value: 3, label: 'Continents', desc: 'Asia · Middle East · Americas' },
    { icon: '🗺️', value: cfg.places.length, label: 'Experiences', desc: 'And counting...' },
  ]

  return (
    <div ref={ref}>
      {/* Map */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
        transition={{ duration: 0.75, ease: [0.23, 1, 0.32, 1] }}
        style={{
          borderRadius: 20,
          overflow: 'hidden',
          border: '1px solid var(--border)',
          background: 'var(--bg-secondary)',
          marginBottom: 16,
          position: 'relative',
        }}
      >
        <ComposableMap
          projectionConfig={{ scale: 147, center: [20, 10] }}
          style={{ width: '100%', height: 'auto', display: 'block' }}
        >
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map(geo => {
                const visited = cfg.visitedCountries.includes(String(geo.id))
                const isRevealed = revealed.includes(String(geo.id))
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={isRevealed ? 'var(--accent)' : visited ? 'var(--accent)' : 'var(--bg)'}
                    stroke="var(--border)"
                    strokeWidth={0.4}
                    style={{
                      default: {
                        outline: 'none',
                        opacity: visited ? (isRevealed ? 0.85 : 0.1) : 1,
                        cursor: visited ? 'pointer' : 'default',
                        transition: 'opacity 0.4s ease',
                      },
                      hover: { outline: 'none', opacity: visited ? 1 : 1, cursor: visited ? 'pointer' : 'default' },
                      pressed: { outline: 'none' },
                    }}
                  />
                )
              })
            }
          </Geographies>

          {cfg.places.map(({ label, coords }, i) => (
            <Marker
              key={label}
              coordinates={coords}
              onMouseEnter={e => setTooltip({ label, x: e.clientX, y: e.clientY })}
              onMouseLeave={() => setTooltip(null)}
            >
              <circle r={5} fill="var(--accent)" opacity={0.3}>
                <animate attributeName="r" from="5" to="16" dur="2s" begin={`${i * 0.35}s`} repeatCount="indefinite" />
                <animate attributeName="opacity" from="0.3" to="0" dur="2s" begin={`${i * 0.35}s`} repeatCount="indefinite" />
              </circle>
              <circle r={5} fill="#fff" stroke="var(--accent)" strokeWidth={2} style={{ cursor: 'pointer' }} />
            </Marker>
          ))}
        </ComposableMap>

        {/* Top-right badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={inView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          style={{
            position: 'absolute', top: 14, right: 14,
            background: 'var(--card-bg)', border: '1px solid var(--border)',
            borderRadius: 999, padding: '6px 14px',
            fontSize: '0.72rem', color: 'var(--text-h)', fontWeight: 600,
            backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', gap: 6,
          }}
        >
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block' }} />
          {cfg.visitedCountries.length} countries visited
        </motion.div>
      </motion.div>

      {/* Stat cards row */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {stats.map((s, i) => (
          <StatCard key={s.label} {...s} delay={0.15 + i * 0.1} inView={inView} />
        ))}
      </div>

      {tooltip && (
        <div style={{
          position: 'fixed', top: tooltip.y - 44, left: tooltip.x,
          transform: 'translateX(-50%)',
          background: 'var(--card-bg)', border: '1px solid var(--accent)',
          borderRadius: 8, padding: '5px 14px', fontSize: '0.8rem',
          color: 'var(--text-h)', fontWeight: 600, pointerEvents: 'none',
          boxShadow: 'var(--shadow)', zIndex: 9999, whiteSpace: 'nowrap',
        }}>
          📍 {tooltip.label}
        </div>
      )}
    </div>
  )
}
