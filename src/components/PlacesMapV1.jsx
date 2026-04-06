/**
 * DESIGN V1 — "Command Center"
 * Dark glassmorphism panel. Stats float left as animated counters,
 * map fills the right. Neon glow on visited countries. Cinematic entrance.
 */
import { useState, useEffect, useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps'
import cfg from '../data/config.json'
import CountryModal from './CountryModal'

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'

function useCountUp(target, duration = 1.2, inView) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (!inView) { setVal(0); return }
    let start = null
    const step = ts => {
      if (!start) start = ts
      const p = Math.min((ts - start) / (duration * 1000), 1)
      setVal(Math.round(p * target))
      if (p < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [inView, target, duration])
  return val
}

function StatItem({ value, label, delay, inView }) {
  const count = useCountUp(value, 1.2, inView)
  return (
    <motion.div
      initial={{ opacity: 0, x: -30 }}
      animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: -30 }}
      transition={{ duration: 0.6, delay, ease: [0.23, 1, 0.32, 1] }}
      style={{
        padding: '16px 20px',
        borderRadius: 14,
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--accent)', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
        {count}
      </div>
      <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', marginTop: 5, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
        {label}
      </div>
    </motion.div>
  )
}

export default function PlacesMapV1() {
  const [tooltip, setTooltip] = useState(null)
  const [selectedCountry, setSelectedCountry] = useState(null)
  const ref = useRef(null)
  const inView = useInView(ref, { once: false, margin: '-100px' })

  const countriesVisited = cfg.visitedCountries.length
  const placesVisited = cfg.places.length

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 60 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 60 }}
      transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
      style={{
        borderRadius: 24,
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.08)',
        background: 'linear-gradient(135deg, rgba(10,10,20,0.95) 0%, rgba(20,20,40,0.9) 100%)',
        backdropFilter: 'blur(20px)',
        display: 'grid',
        gridTemplateColumns: '220px 1fr',
        minHeight: 380,
        position: 'relative',
      }}
    >
      {/* Left — stats panel */}
      <div style={{
        padding: '32px 20px',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        justifyContent: 'center',
      }}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ delay: 0.1 }}
          style={{ marginBottom: 8 }}
        >
          <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--accent)', opacity: 0.8, marginBottom: 6 }}>Travel Log</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>Where I've Been</div>
        </motion.div>

        <StatItem value={countriesVisited} label="Countries" delay={0.2} inView={inView} />
        <StatItem value={placesVisited} label="Cities & Places" delay={0.3} inView={inView} />
        <StatItem value={3} label="Continents" delay={0.4} inView={inView} />

        <motion.p
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ delay: 0.55 }}
          style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)', lineHeight: 1.6, marginTop: 8 }}
        >
          Click a highlighted country to explore.
        </motion.p>
      </div>

      {/* Right — map */}
      <div style={{ position: 'relative', overflow: 'hidden' }}>
        {/* Glow overlay on visited countries */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none',
          background: 'radial-gradient(ellipse at 60% 50%, rgba(var(--accent-rgb,130,80,255),0.08) 0%, transparent 70%)',
        }} />

        <motion.div
          initial={{ opacity: 0, scale: 1.04 }}
          animate={inView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 1.04 }}
          transition={{ duration: 1.1, delay: 0.2, ease: [0.23, 1, 0.32, 1] }}
          style={{ width: '100%', height: '100%' }}
        >
          <ComposableMap
            projectionConfig={{ scale: 147, center: [20, 10] }}
            style={{ width: '100%', height: '100%' }}
          >
            <Geographies geography={GEO_URL}>
              {({ geographies }) =>
                geographies.map(geo => {
                  const visited = cfg.visitedCountries.includes(String(geo.id))
                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill={visited ? 'var(--accent)' : 'rgba(255,255,255,0.05)'}
                      stroke="rgba(255,255,255,0.07)"
                      strokeWidth={0.4}
                      onClick={visited ? () => setSelectedCountry(String(geo.id)) : undefined}
                      style={{
                        default: { outline: 'none', opacity: visited ? 0.85 : 1, cursor: visited ? 'pointer' : 'default',
                          filter: visited ? 'drop-shadow(0 0 6px color-mix(in srgb, var(--accent) 60%, transparent))' : 'none',
                        },
                        hover: { outline: 'none', opacity: visited ? 1 : 1,
                          filter: visited ? 'drop-shadow(0 0 12px var(--accent))' : 'none',
                          cursor: visited ? 'pointer' : 'default',
                        },
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
                  <animate attributeName="r" from="5" to="16" dur="1.8s" begin={`${i * 0.3}s`} repeatCount="indefinite" />
                  <animate attributeName="opacity" from="0.3" to="0" dur="1.8s" begin={`${i * 0.3}s`} repeatCount="indefinite" />
                </circle>
                <circle r={5} fill="#fff" stroke="var(--accent)" strokeWidth={2} style={{ cursor: 'pointer' }} />
              </Marker>
            ))}
          </ComposableMap>
        </motion.div>
      </div>

      {tooltip && (
        <div style={{
          position: 'fixed', top: tooltip.y - 44, left: tooltip.x,
          transform: 'translateX(-50%)',
          background: 'rgba(0,0,0,0.85)', border: '1px solid var(--accent)',
          borderRadius: 8, padding: '5px 14px', fontSize: '0.8rem',
          color: '#fff', fontWeight: 600, pointerEvents: 'none',
          zIndex: 9999, whiteSpace: 'nowrap',
        }}>
          📍 {tooltip.label}
        </div>
      )}

      {selectedCountry && (
        <CountryModal countryId={selectedCountry} onClose={() => setSelectedCountry(null)} />
      )}
    </motion.div>
  )
}
