import { useState, useEffect, Fragment } from 'react'
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

const hexA = (hex, a) => {
  const n = parseInt(hex.slice(1), 16)
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`
}

// Corner-bracket reticle marker (same shape as WorldMapArc's)
function bracket(x, y, b = 6, arm = 3) {
  return [
    `M${x - b},${y - b + arm} L${x - b},${y - b} L${x - b + arm},${y - b}`,
    `M${x + b - arm},${y - b} L${x + b},${y - b} L${x + b},${y - b + arm}`,
    `M${x + b},${y + b - arm} L${x + b},${y + b} L${x + b - arm},${y + b}`,
    `M${x - b + arm},${y + b} L${x - b},${y + b} L${x - b},${y + b - arm}`,
  ].join(' ')
}

/*
 * `theme` (optional) — passed by WorldMapArc so the popup matches the map's
 * current settings: { dark, type ('dots'|'flat'), pin ('bracket'|'dot'|'pin'),
 * land, arc (palette colours), bg, panelBorder }. Without it the modal keeps
 * its original standalone look (used by the old PlacesMap components).
 */
export default function CountryModal({ countryId, onClose, zIndex = 1000, theme }) {
  const info = cfg.countryInfo[countryId]
  const cities = cfg.places.filter(p => p.country === countryId)
  const [hoveredState, setHoveredState] = useState(null)
  const [activePin, setActivePin] = useState(null)
  const [pinTooltip, setPinTooltip] = useState(null) // { label, x, y }
  const statesUrl = STATE_GEO[countryId]
  const isMobile = window.matchMedia('(hover: none)').matches

  // Themed styling (falls back to the legacy CSS-variable look)
  const th = theme
  const dark = th ? th.dark : true
  const landFill = th
    ? (th.type === 'dots' ? 'url(#cm-dots)' : (th.dark ? th.land : hexA(th.land, 0.32)))
    : 'var(--accent)'
  const stateStroke = th
    ? (th.dark ? 'rgba(6,6,12,0.55)' : hexA(th.land, 0.55))
    : 'var(--card-bg)'
  const cardBg = th ? th.bg : 'var(--card-bg)'
  const cardBorder = th ? th.panelBorder : 'var(--border)'
  const titleColor = th && !th.dark ? '#111' : '#fff'
  const accent = th ? th.arc : 'var(--accent)'
  const statColor = th ? '#ef4444' : '#e53935'
  const labelColor = th ? (th.dark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.55)') : 'var(--text)'

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  if (!info) return null

  return (
    <Fragment>
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
            border: `1px solid ${cardBorder}`,
            borderRadius: 24,
            width: '100%',
            maxWidth: 520,
            maxHeight: '90vh',
            overflow: 'hidden',
            boxShadow: th ? '0 24px 60px rgba(0,0,0,0.4)' : 'var(--shadow)',
            position: 'relative',
            background: cardBg,
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
            color: titleColor, fontSize: '1.1rem', fontWeight: 700,
            textShadow: dark ? '0 2px 8px rgba(0,0,0,0.6)' : 'none',
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
              border: `1px solid ${th ? th.arc : '#e53935'}`,
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
                {/* Dotted-land pattern — matches the main map's Dots style */}
                {th && th.type === 'dots' && (
                  <defs>
                    <pattern id="cm-dots" width="6.4" height="6.4" patternUnits="userSpaceOnUse">
                      <circle cx="1.3" cy="1.3" r="1.35" fill={th.dark ? hexA(th.land, 0.85) : hexA(th.land, 0.7)} />
                    </pattern>
                  </defs>
                )}
                {statesUrl ? (
                  <Geographies geography={statesUrl}>
                    {({ geographies }) =>
                      geographies.map(geo => {
                        const stateName = getStateName(geo, countryId)
                        return (
                          <Geography
                            key={geo.rsmKey}
                            geography={geo}
                            fill={landFill}
                            stroke={stateStroke}
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
                            fill={landFill}
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

                  // Themed pins — same shapes/colours as the main map's Cities
                  // view, following the current Pin setting (gold home, red city).
                  if (th) {
                    const pinColor = home ? '#f5b301' : '#ef4444'
                    const tipLabel = home ? `🏠 ${label}` : label
                    const handlers = {
                      style: { cursor: 'pointer' },
                      onMouseEnter: (e) => { setPinTooltip({ label: tipLabel, x: e.clientX, y: e.clientY }); setActivePin(label) },
                      onMouseLeave: () => { setPinTooltip(null); setActivePin(null) },
                      onClick: (e) => { const next = isActive ? null : label; setActivePin(next); setPinTooltip(next ? { label: tipLabel, x: e.clientX, y: e.clientY } : null) },
                    }
                    return (
                      <Marker key={label} coordinates={coords}>
                        {/* Pulse ring (all styles) */}
                        <circle r={r} fill="none" stroke={pinColor} strokeWidth={1} opacity={0.5} style={{ pointerEvents: 'none' }}>
                          <animate attributeName="r" from={r} to={r * 2.6} dur="2.2s" repeatCount="indefinite" />
                          <animate attributeName="opacity" from="0.5" to="0" dur="2.2s" repeatCount="indefinite" />
                        </circle>
                        {th.pin === 'bracket' ? (
                          <g {...handlers}>
                            <path d={bracket(0, 0, r * 1.3, r * 0.6)} fill="none" stroke={pinColor} strokeWidth={r * 0.24} />
                            <circle cx={0} cy={0} r={r * 0.32} fill={pinColor} />
                          </g>
                        ) : th.pin === 'dot' ? (
                          <g {...handlers}>
                            <circle cx={0} cy={0} r={r * (home ? 0.8 : 0.6)} fill={pinColor} stroke={isActive ? '#fff' : 'none'} strokeWidth={1} />
                          </g>
                        ) : (
                          <g {...handlers} transform={`scale(${r * 0.1})`}>
                            {/* Floating teardrop pin — same path as the main map */}
                            <path d="M0,0 c-4.6,-6.2 -8,-10 -8,-14.4 a8,8 0 1,1 16,0 c0,4.4 -3.4,8.2 -8,14.4 z"
                              fill={pinColor} stroke={isActive ? '#fff' : 'rgba(0,0,0,0.25)'} strokeWidth={0.8} />
                            <circle cx={0} cy={-14.4} r={3} fill="#fff" />
                          </g>
                        )}
                      </Marker>
                    )
                  }

                  return (
                    <Marker key={label} coordinates={coords}>
                      {home ? (
                        /* ── Home icon marker ── */
                        <g
                          style={{ cursor: 'pointer' }}
                          onMouseEnter={e => { setPinTooltip({ label: `🏠 ${label}`, x: e.clientX, y: e.clientY }); setActivePin(label) }}
                          onMouseLeave={() => { setPinTooltip(null); setActivePin(null) }}
                          onClick={e => { const next = isActive ? null : label; setActivePin(next); setPinTooltip(next ? { label: `🏠 ${label}`, x: e.clientX, y: e.clientY } : null) }}
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
                          {/* Pulse ring — no pointer events so it doesn't block hover */}
                          <circle r={r} fill="#e53935" opacity={0.25} style={{ pointerEvents: 'none' }}>
                            <animate attributeName="r" from={r} to={r * 3} dur="1.8s" repeatCount="indefinite" />
                            <animate attributeName="opacity" from="0.25" to="0" dur="1.8s" repeatCount="indefinite" />
                          </circle>
                          {/* Pin shape */}
                          <g
                            style={{ cursor: 'pointer' }}
                            onMouseEnter={e => { setPinTooltip({ label, x: e.clientX, y: e.clientY }); setActivePin(label) }}
                            onMouseLeave={() => { setPinTooltip(null); setActivePin(null) }}
                            onClick={e => { const next = isActive ? null : label; setActivePin(next); setPinTooltip(next ? { label, x: e.clientX, y: e.clientY } : null) }}
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
          <div style={{ display: 'flex', borderTop: `1px solid ${cardBorder}` }}>
            <div style={{ flex: 1, padding: '14px 0', textAlign: 'center', borderRight: `1px solid ${cardBorder}` }}>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: statColor, lineHeight: 1 }}>{cities.length}</div>
              <div style={{ fontSize: '0.68rem', color: labelColor, opacity: th ? 1 : 0.55, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Cities Visited</div>
            </div>
            <div style={{ flex: 1, padding: '14px 0', textAlign: 'center' }}>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: statColor, lineHeight: 1 }}>{cities.length}</div>
              <div style={{ fontSize: '0.68rem', color: labelColor, opacity: th ? 1 : 0.55, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Places</div>
            </div>
          </div>
        </motion.div>
      </motion.div>

    </AnimatePresence>

    {/* Pin tooltip — portalled outside AnimatePresence so it's never unmounted by it */}
    {pinTooltip && createPortal(
      <div style={{
        position: 'fixed',
        top: pinTooltip.y - 44,
        left: pinTooltip.x,
        transform: 'translateX(-50%)',
        background: 'rgba(0,0,0,0.85)',
        border: `1px solid ${accent}`,
        borderRadius: 8, padding: '5px 14px',
        fontSize: '0.8rem', color: '#fff', fontWeight: 600,
        pointerEvents: 'none', whiteSpace: 'nowrap',
        zIndex: 999999,
      }}>
        {pinTooltip.label}
      </div>,
      document.body
    )}
    </Fragment>
  )
}
