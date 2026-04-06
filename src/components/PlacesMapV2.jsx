/**
 * DESIGN V2 — "Passport Card"
 * Full-width map as hero, floating stat pills scroll up from bottom.
 * Stats overlay bottom of map. Visited countries pulse with glow.
 * Clean minimal aesthetic — map IS the design.
 */
import { useState, useRef, useEffect } from 'react'
import { motion, useInView } from 'framer-motion'
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps'
import cfg from '../data/config.json'
import CountryModal from './CountryModal'

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'

function useCountUp(target, inView) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (!inView) { setVal(0); return }
    let start = null
    const step = ts => {
      if (!start) start = ts
      const p = Math.min((ts - start) / 1400, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setVal(Math.round(eased * target))
      if (p < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [inView, target])
  return val
}

export default function PlacesMapV2() {
  const [tooltip, setTooltip] = useState(null)
  const [selectedCountry, setSelectedCountry] = useState(null)
  const ref = useRef(null)
  const inView = useInView(ref, { once: false, margin: '-80px' })

  const countriesCount = useCountUp(cfg.visitedCountries.length, inView)
  const placesCount = useCountUp(cfg.places.length, inView)
  const continentsCount = useCountUp(3, inView)

  const stats = [
    { value: countriesCount, label: 'Countries', icon: '🌍' },
    { value: placesCount,    label: 'Places',    icon: '📍' },
    { value: continentsCount, label: 'Continents', icon: '✈️' },
  ]

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
      style={{ position: 'relative', borderRadius: 20, overflow: 'hidden', border: '1px solid var(--border)' }}
    >
      {/* Map fills entire card */}
      <div style={{ background: 'var(--bg-secondary)' }}>
        <ComposableMap
          projectionConfig={{ scale: 147, center: [20, 10] }}
          style={{ width: '100%', height: 'auto', display: 'block' }}
        >
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map(geo => {
                const visited = cfg.visitedCountries.includes(String(geo.id))
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={visited ? 'var(--accent)' : 'var(--bg)'}
                    stroke="var(--border)"
                    strokeWidth={0.4}
                    onClick={visited ? () => setSelectedCountry(String(geo.id)) : undefined}
                    style={{
                      default: { outline: 'none', opacity: visited ? 0.9 : 1, cursor: visited ? 'pointer' : 'default' },
                      hover:   { outline: 'none', opacity: 1, cursor: visited ? 'pointer' : 'default' },
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
                <animate attributeName="r" from="5" to="18" dur="2s" begin={`${i * 0.4}s`} repeatCount="indefinite" />
                <animate attributeName="opacity" from="0.3" to="0" dur="2s" begin={`${i * 0.4}s`} repeatCount="indefinite" />
              </circle>
              <circle r={5} fill="#fff" stroke="var(--accent)" strokeWidth={2} style={{ cursor: 'pointer' }} />
            </Marker>
          ))}
        </ComposableMap>
      </div>

      {/* Bottom gradient fade into stats */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        height: 120,
        background: 'linear-gradient(to top, var(--bg) 0%, transparent 100%)',
        pointerEvents: 'none',
      }} />

      {/* Stats row floating over bottom of map */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        display: 'flex', justifyContent: 'center', gap: 12,
        padding: '0 24px 20px',
      }}>
        {stats.map(({ value, label, icon }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 24 }}
            animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
            transition={{ duration: 0.55, delay: 0.3 + i * 0.1, ease: [0.23, 1, 0.32, 1] }}
            style={{
              flex: 1, maxWidth: 130,
              background: 'var(--card-bg)',
              border: '1px solid var(--border)',
              borderRadius: 14,
              padding: '12px 8px',
              textAlign: 'center',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
            }}
          >
            <div style={{ fontSize: '1.1rem', marginBottom: 2 }}>{icon}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent)', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text)', opacity: 0.6, marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
          </motion.div>
        ))}
      </div>

      {/* Click hint */}
      <div style={{
        position: 'absolute', top: 16, right: 16,
        background: 'var(--card-bg)', border: '1px solid var(--border)',
        borderRadius: 999, padding: '5px 12px',
        fontSize: '0.7rem', color: 'var(--text)', opacity: 0.7,
        backdropFilter: 'blur(8px)',
      }}>
        Click a country to explore
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

      {selectedCountry && (
        <CountryModal countryId={selectedCountry} onClose={() => setSelectedCountry(null)} />
      )}
    </motion.div>
  )
}
