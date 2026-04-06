import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps'
import cfg from '../data/config.json'

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'
const USA_STATES_URL = 'https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json'
const INDIA_STATES_URL = '/india_states.geojson'

const STATE_GEO = {
  '840': USA_STATES_URL,
  '356': INDIA_STATES_URL,
}

function getStateName(geo, countryId) {
  if (countryId === '840') return geo.properties.name
  if (countryId === '356') return geo.properties.NAME_1
  return null
}

export default function CountryModal({ countryId, onClose, zIndex = 1000 }) {
  const info = cfg.countryInfo[countryId]
  const cities = cfg.places.filter(p => p.country === countryId)
  const [hoveredState, setHoveredState] = useState(null)
  const [activePin, setActivePin] = useState(null)
  const [pinTooltip, setPinTooltip] = useState(null) // { label, x, y }
  const statesUrl = STATE_GEO[countryId]
  const isMobile = window.matchMedia('(hover: none)').matches

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
          zIndex: zIndex,
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
            onClick={e => { e.stopPropagation(); onClose() }}
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
              border: '1px solid #e53935',
              borderRadius: 8, padding: '5px 14px',
              fontSize: '0.8rem', color: '#fff', fontWeight: 600,
              pointerEvents: 'none', whiteSpace: 'nowrap',
            }}>
              {hoveredState}
            </div>
          )}

          {/* Map area */}
          <div style={{ width: '100%', paddingTop: '90%', position: 'relative', background: 'transparent' }}>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ComposableMap
                projectionConfig={{ scale: info.mapScale, center: info.mapCenter }}
                width={560}
                height={560}
                style={{ width: '100%', height: '100%', display: 'block' }}
              >
                {statesUrl ? (
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

                {cities.map(({ label, coords, home }) => {
                  const r = info.pinR ?? 7
                  const isActive = activePin === label
                  return (
                    <Marker key={label} coordinates={coords}>
                      {home ? (
                        /* ── Home icon marker ── */
                        <g
                          style={{ cursor: 'pointer' }}
                          onMouseEnter={isMobile ? undefined : e => { const rect = e.currentTarget.getBoundingClientRect(); setPinTooltip({ label: `🏠 ${label}`, x: rect.left + rect.width / 2, y: rect.top }); setActivePin(label) }}
                          onMouseLeave={isMobile ? undefined : () => { setPinTooltip(null); setActivePin(null) }}
                          onClick={isMobile ? e => { const rect = e.currentTarget.getBoundingClientRect(); const next = isActive ? null : label; setActivePin(next); setPinTooltip(next ? { label: `🏠 ${label}`, x: rect.left + rect.width / 2, y: rect.top } : null) } : undefined}
                          transform={`translate(${-r * 2}, ${-r * 4.5}) scale(${r * 0.28})`}
                        >
                          {/* Glow */}
                          <circle cx={7} cy={9} r={9} fill="var(--accent)" opacity={0.25} />
                          {/* Roof */}
                          <polygon points="7,0 0,7 14,7" fill="var(--accent)" stroke="#fff" strokeWidth={1} />
                          {/* Body */}
                          <rect x={2} y={7} width={10} height={8} fill="var(--accent)" stroke="#fff" strokeWidth={1} />
                          {/* Door */}
                          <rect x={5} y={10} width={4} height={5} fill="#fff" opacity={0.95} rx={0.5} />
                        </g>
                      ) : (
                        <>
                          {/* Pulse ring */}
                          <circle r={r} fill="#e53935" opacity={0.25}>
                            <animate attributeName="r" from={r} to={r * 3} dur="1.8s" repeatCount="indefinite" />
                            <animate attributeName="opacity" from="0.25" to="0" dur="1.8s" repeatCount="indefinite" />
                          </circle>
                          {/* Pin shape */}
                          <g
                            style={{ cursor: 'pointer' }}
                            onMouseEnter={isMobile ? undefined : e => { const rect = e.currentTarget.getBoundingClientRect(); setPinTooltip({ label, x: rect.left + rect.width / 2, y: rect.top }); setActivePin(label) }}
                            onMouseLeave={isMobile ? undefined : () => { setPinTooltip(null); setActivePin(null) }}
                            onClick={isMobile ? e => { const rect = e.currentTarget.getBoundingClientRect(); const next = isActive ? null : label; setActivePin(next); setPinTooltip(next ? { label, x: rect.left + rect.width / 2, y: rect.top } : null) } : undefined}
                          >
                            <circle cx={0} cy={-r * 1.4} r={r * 1.2} fill="#e53935" stroke="#fff" strokeWidth={r * 0.25} />
                            <polygon points={`${-r * 0.5},${-r * 0.5} ${r * 0.5},${-r * 0.5} 0,${r * 0.8}`} fill="#e53935" />
                            <circle cx={0} cy={-r * 1.4} r={r * 0.45} fill="#fff" opacity={0.9} />
                          </g>
                        </>
                      )}
                    </Marker>
                  )
                })}
              </ComposableMap>
            </div>
          </div>

          {/* Stats bar */}
          <div style={{ display: 'flex', borderTop: '1px solid var(--border)' }}>
            <div style={{ flex: 1, padding: '14px 0', textAlign: 'center', borderRight: '1px solid var(--border)' }}>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#e53935', lineHeight: 1 }}>{cities.length}</div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text)', opacity: 0.55, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Cities Visited</div>
            </div>
            <div style={{ flex: 1, padding: '14px 0', textAlign: 'center' }}>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#e53935', lineHeight: 1 }}>{cities.length}</div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text)', opacity: 0.55, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Places</div>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Pin tooltip — portalled above everything */}
      {pinTooltip && createPortal(
        <div style={{
          position: 'fixed',
          top: pinTooltip.y - 44,
          left: pinTooltip.x,
          transform: 'translateX(-50%)',
          background: 'rgba(0,0,0,0.85)',
          border: '1px solid var(--accent)',
          borderRadius: 8, padding: '5px 14px',
          fontSize: '0.8rem', color: '#fff', fontWeight: 600,
          pointerEvents: 'none', whiteSpace: 'nowrap',
          zIndex: 99999,
        }}>
          {pinTooltip.label}
        </div>,
        document.body
      )}
    </AnimatePresence>
  )
}
