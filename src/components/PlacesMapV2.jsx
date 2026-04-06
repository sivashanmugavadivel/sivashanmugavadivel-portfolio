/**
 * DESIGN V2 — "Passport Card" (Mobile)
 * Map on top, stats below. Expand button to go fullscreen landscape.
 */
import { useState, useRef, useEffect } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'
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

function ExpandIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M1 6V1h5M10 1h5v5M15 10v5h-5M6 15H1v-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function CollapseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M6 1v5H1M15 6h-5V1M10 15v-5h5M1 10h5v5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function MapContent({ onCountryClick, onTooltip }) {
  return (
    <ComposableMap
      projectionConfig={{ scale: 147, center: [20, 10] }}
      style={{ width: '100%', height: '100%', display: 'block' }}
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
                onClick={visited ? () => onCountryClick(String(geo.id)) : undefined}
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
          onMouseEnter={e => onTooltip({ label, x: e.clientX, y: e.clientY })}
          onMouseLeave={() => onTooltip(null)}
        >
          <circle r={5} fill="#e53935" opacity={0.3}>
            <animate attributeName="r" from="5" to="18" dur="2s" begin={`${i * 0.4}s`} repeatCount="indefinite" />
            <animate attributeName="opacity" from="0.3" to="0" dur="2s" begin={`${i * 0.4}s`} repeatCount="indefinite" />
          </circle>
          <circle r={5} fill="#fff" stroke="#e53935" strokeWidth={2} style={{ cursor: 'pointer' }} />
        </Marker>
      ))}
    </ComposableMap>
  )
}

export default function PlacesMapV2() {
  const [tooltip, setTooltip] = useState(null)
  const [selectedCountry, setSelectedCountry] = useState(null)
  const [expanded, setExpanded] = useState(false)
  const ref = useRef(null)
  const inView = useInView(ref, { once: false, margin: '-80px' })

  const countriesCount = useCountUp(cfg.visitedCountries.length, inView)
  const placesCount = useCountUp(cfg.places.length, inView)
  const continentsCount = useCountUp(2, inView)

  useEffect(() => {
    document.body.style.overflow = expanded ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [expanded])

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') setExpanded(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

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
    >
      {/* Normal (collapsed) view */}
      <div style={{ borderRadius: 20, overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
        <div style={{ position: 'relative' }}>
          {/* MapContent needs fixed height in collapsed view for auto height */}
          <div style={{ width: '100%' }}>
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
                <Marker key={label} coordinates={coords}
                  onMouseEnter={e => setTooltip({ label, x: e.clientX, y: e.clientY })}
                  onMouseLeave={() => setTooltip(null)}
                >
                  <circle r={5} fill="#e53935" opacity={0.3}>
                    <animate attributeName="r" from="5" to="18" dur="2s" begin={`${i * 0.4}s`} repeatCount="indefinite" />
                    <animate attributeName="opacity" from="0.3" to="0" dur="2s" begin={`${i * 0.4}s`} repeatCount="indefinite" />
                  </circle>
                  <circle r={5} fill="#fff" stroke="#e53935" strokeWidth={2} style={{ cursor: 'pointer' }} />
                </Marker>
              ))}
            </ComposableMap>
          </div>

          {/* Expand button */}
          <button
            onClick={() => setExpanded(true)}
            style={{
              position: 'absolute', top: 10, right: 10, zIndex: 30,
              background: 'var(--card-bg)', border: '1px solid var(--border)',
              borderRadius: 8, width: 34, height: 34, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-h)', backdropFilter: 'blur(8px)',
            }}
          >
            <ExpandIcon />
          </button>

          {/* Tap hint */}
          <div style={{
            position: 'absolute', top: 10, left: 10,
            background: 'var(--card-bg)', border: '1px solid var(--border)',
            borderRadius: 999, padding: '4px 10px',
            fontSize: '0.68rem', color: 'var(--text)', opacity: 0.75,
            backdropFilter: 'blur(8px)',
          }}>
            Tap a country
          </div>
        </div>

        {/* Stats — BELOW map */}
        <div style={{ display: 'flex', borderTop: '1px solid var(--border)', background: 'var(--card-bg)' }}>
          {stats.map(({ value, label, icon }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 16 }}
              animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
              transition={{ duration: 0.5, delay: 0.3 + i * 0.1 }}
              style={{
                flex: 1, padding: '14px 8px', textAlign: 'center',
                borderRight: i < stats.length - 1 ? '1px solid var(--border)' : 'none',
              }}
            >
              <div style={{ fontSize: '1rem', marginBottom: 3 }}>{icon}</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent)', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
              <div style={{ fontSize: '0.62rem', color: 'var(--text)', opacity: 0.6, marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Fullscreen landscape overlay */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            key="expanded"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{
              position: 'fixed',
              // Swap width/height and rotate to fake landscape
              top: 0,
              left: 0,
              width: '100vh',
              height: '100vw',
              transform: 'rotate(90deg) translateY(-100%)',
              transformOrigin: 'top left',
              zIndex: 900,
              background: 'var(--bg)',
              overflow: 'hidden',
            }}
          >
            {/* Map fills entire rotated space — 20% zoom vs normal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
              style={{ position: 'absolute', inset: 0 }}
            >
              <ComposableMap
                projectionConfig={{ scale: 176, center: [20, 10] }}
                style={{ width: '100%', height: '100%', display: 'block' }}
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
                  <Marker key={label} coordinates={coords}
                    onMouseEnter={e => setTooltip({ label, x: e.clientX, y: e.clientY })}
                    onMouseLeave={() => setTooltip(null)}
                  >
                    <circle r={5} fill="#e53935" opacity={0.3}>
                      <animate attributeName="r" from="5" to="18" dur="2s" begin={`${i * 0.4}s`} repeatCount="indefinite" />
                      <animate attributeName="opacity" from="0.3" to="0" dur="2s" begin={`${i * 0.4}s`} repeatCount="indefinite" />
                    </circle>
                    <circle r={5} fill="#fff" stroke="#e53935" strokeWidth={2} style={{ cursor: 'pointer' }} />
                  </Marker>
                ))}
              </ComposableMap>
            </motion.div>

            {/* Close button — bottom-left in rotated frame = top-left in landscape */}
            <button
              onClick={() => setExpanded(false)}
              style={{
                position: 'absolute',
                top: 12, left: 12,
                zIndex: 20,
                background: 'rgba(0,0,0,0.6)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 8, width: 38, height: 38, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff',
                // Counter-rotate so icon reads upright in landscape
                transform: 'rotate(-90deg)',
              }}
            >
              <CollapseIcon />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

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
