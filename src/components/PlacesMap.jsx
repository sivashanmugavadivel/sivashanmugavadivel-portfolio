import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps'
import cfg from '../data/config.json'

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'
const USA_STATES_URL = 'https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json'
const INDIA_STATES_URL = '/india_states.geojson'

// Countries that have state-level data
const STATE_GEO = {
  '840': USA_STATES_URL,
  '356': INDIA_STATES_URL,
}

function getStateName(geo, countryId) {
  if (countryId === '840') return geo.properties.name
  if (countryId === '356') return geo.properties.NAME_1
  return null
}

function CountryModal({ countryId, onClose }) {
  const info = cfg.countryInfo[countryId]
  const cities = cfg.places.filter(p => p.country === countryId)
  const [hoveredState, setHoveredState] = useState(null)
  const statesUrl = STATE_GEO[countryId]

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  if (!info) return null

  return (
    <AnimatePresence>
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.72)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '20px',
        }}
      >
        <motion.div
          key="modal"
          initial={{ opacity: 0, scale: 0.82, y: 32 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.88, y: 16 }}
          transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
          onClick={e => e.stopPropagation()}
          style={{
            border: '1px solid var(--border)',
            borderRadius: 24,
            width: '100%',
            maxWidth: 520,
            maxHeight: '90vh',
            overflow: 'hidden',
            boxShadow: 'var(--shadow)',
            position: 'relative',
            background: 'var(--card-bg)',
          }}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            style={{
              position: 'absolute', top: 14, right: 14, zIndex: 20,
              background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '50%', width: 32, height: 32, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: '1rem', lineHeight: 1,
            }}
          >✕</button>

          {/* Country name top-left */}
          <div style={{
            position: 'absolute', top: 16, left: 20, zIndex: 20,
            color: '#fff', fontSize: '1.1rem', fontWeight: 700,
            textShadow: '0 2px 8px rgba(0,0,0,0.6)',
            fontFamily: 'var(--sans)',
          }}>
            {info.name}
          </div>

          {/* Hovered state tooltip */}
          {hoveredState && (
            <div style={{
              position: 'absolute', bottom: 68, left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 20,
              background: 'rgba(0,0,0,0.75)',
              border: '1px solid var(--accent)',
              borderRadius: 8,
              padding: '5px 14px',
              fontSize: '0.8rem',
              color: '#fff',
              fontWeight: 600,
              pointerEvents: 'none',
              whiteSpace: 'nowrap',
            }}>
              {hoveredState}
            </div>
          )}

          {/* Map area */}
          <div style={{
            width: '100%',
            paddingTop: '90%',
            position: 'relative',
            background: 'transparent',
          }}>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ComposableMap
                projectionConfig={{ scale: info.mapScale, center: info.mapCenter }}
                width={560}
                height={560}
                style={{ width: '100%', height: '100%', display: 'block' }}
              >
                {statesUrl ? (
                  /* State-level view for India & USA */
                  <Geographies geography={statesUrl}>
                    {({ geographies }) =>
                      geographies.map(geo => {
                        const stateName = getStateName(geo, countryId)
                        return (
                          <Geography
                            key={geo.rsmKey}
                            geography={geo}
                            fill="var(--accent)"
                            stroke="var(--card-bg)"
                            strokeWidth={0.8}
                            onMouseEnter={() => setHoveredState(stateName)}
                            onMouseLeave={() => setHoveredState(null)}
                            style={{
                              default: { outline: 'none', opacity: 0.75, cursor: 'default' },
                              hover:   { outline: 'none', opacity: 1, cursor: 'default' },
                              pressed: { outline: 'none' },
                            }}
                          />
                        )
                      })
                    }
                  </Geographies>
                ) : (
                  /* Fallback: country outline only */
                  <Geographies geography={GEO_URL}>
                    {({ geographies }) =>
                      geographies.map(geo => {
                        if (String(geo.id) !== countryId) return null
                        return (
                          <Geography
                            key={geo.rsmKey}
                            geography={geo}
                            fill="var(--accent)"
                            stroke="transparent"
                            strokeWidth={0}
                            style={{
                              default: { outline: 'none', opacity: 0.9 },
                              hover:   { outline: 'none' },
                              pressed: { outline: 'none' },
                            }}
                          />
                        )
                      })
                    }
                  </Geographies>
                )}

                {cities.map(({ label, coords }) => (
                  <Marker key={label} coordinates={coords}>
                    <circle r={info.pinR ?? 8} fill="var(--accent)" opacity={0.3}>
                      <animate attributeName="r" from={info.pinR ?? 8} to={(info.pinR ?? 8) * 2.5} dur="1.8s" repeatCount="indefinite" />
                      <animate attributeName="opacity" from="0.3" to="0" dur="1.8s" repeatCount="indefinite" />
                    </circle>
                    <circle r={info.pinR ?? 8} fill="#fff" stroke="var(--accent)" strokeWidth={Math.max(2, (info.pinR ?? 8) * 0.4)} />
                  </Marker>
                ))}
              </ComposableMap>
            </div>
          </div>

          {/* Stats bar */}
          <div style={{ display: 'flex', borderTop: '1px solid var(--border)' }}>
            <div style={{ flex: 1, padding: '14px 0', textAlign: 'center', borderRight: '1px solid var(--border)' }}>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--accent)', lineHeight: 1 }}>{cities.length}</div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text)', opacity: 0.55, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Cities Visited</div>
            </div>
            <div style={{ flex: 1, padding: '14px 0', textAlign: 'center' }}>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--accent)', lineHeight: 1 }}>{cities.length}</div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text)', opacity: 0.55, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Places</div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default function PlacesMap() {
  const [tooltip, setTooltip] = useState(null)
  const [selectedCountry, setSelectedCountry] = useState(null)

  return (
    <>
      <div style={{ position: 'relative', width: '100%', maxWidth: 860, margin: '0 auto' }}>
        <ComposableMap
          projectionConfig={{ scale: 147, center: [20, 10] }}
          style={{ width: '100%', height: 'auto' }}
        >
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map(geo => {
                const visited = cfg.visitedCountries.includes(String(geo.id))
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={visited ? 'var(--accent)' : 'var(--bg-secondary)'}
                    stroke="var(--border)"
                    strokeWidth={0.4}
                    onClick={visited ? () => setSelectedCountry(String(geo.id)) : undefined}
                    style={{
                      default: { outline: 'none', opacity: visited ? 0.75 : 1, cursor: visited ? 'pointer' : 'default' },
                      hover:   { outline: 'none', opacity: visited ? 0.95 : 1, cursor: visited ? 'pointer' : 'default' },
                      pressed: { outline: 'none' },
                    }}
                  />
                )
              })
            }
          </Geographies>

          {cfg.places.map(({ label, coords }) => (
            <Marker
              key={label}
              coordinates={coords}
              onMouseEnter={e => setTooltip({ label, x: e.clientX, y: e.clientY })}
              onMouseLeave={() => setTooltip(null)}
            >
              <circle r={5} fill="var(--accent)" opacity={0.35}>
                <animate attributeName="r" from="5" to="16" dur="1.8s" repeatCount="indefinite" />
                <animate attributeName="opacity" from="0.35" to="0" dur="1.8s" repeatCount="indefinite" />
              </circle>
              <circle r={5} fill="#fff" stroke="var(--accent)" strokeWidth={2} style={{ cursor: 'pointer' }} />
            </Marker>
          ))}
        </ComposableMap>

        {tooltip && (
          <div style={{
            position: 'fixed',
            top: tooltip.y - 44,
            left: tooltip.x,
            transform: 'translateX(-50%)',
            background: 'var(--card-bg)',
            border: '1px solid var(--accent)',
            borderRadius: 8,
            padding: '5px 14px',
            fontSize: '0.8rem',
            color: 'var(--text-h)',
            fontWeight: 600,
            pointerEvents: 'none',
            boxShadow: 'var(--shadow)',
            zIndex: 9999,
            whiteSpace: 'nowrap',
          }}>
            📍 {tooltip.label}
          </div>
        )}

        <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text)', opacity: 0.4, marginTop: 8 }}>
          Click a highlighted country to explore
        </p>
      </div>

      {selectedCountry && (
        <CountryModal countryId={selectedCountry} onClose={() => setSelectedCountry(null)} />
      )}
    </>
  )
}
