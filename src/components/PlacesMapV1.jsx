/**
 * DESIGN V1 — "Command Center"
 * Dark glassmorphism panel. Stats float left as animated counters,
 * map fills the right. Neon glow on visited countries. Cinematic entrance.
 */
import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion, useInView } from 'framer-motion'
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps'
import cfg from '../data/config.json'
import CountryModal from './CountryModal'

function ExpandIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
      <path d="M1 6V1h5M10 1h5v5M15 10v5h-5M6 15H1v-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}
function CollapseIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
      <path d="M6 1v5H1M15 6h-5V1M10 15v-5h5M1 10h5v5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

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

function MapContent({ onCountryClick, onTooltip }) {
  return (
    <ComposableMap projectionConfig={{ scale: 147, center: [20, 10] }} width={800} height={500} style={{ width: '100%', height: '100%', display: 'block' }}>
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
                onClick={visited ? () => onCountryClick(String(geo.id)) : undefined}
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
      {cfg.places.map(({ label, coords, home }, i) => (
        <Marker key={label} coordinates={coords}
          onMouseEnter={e => {
            const rect = e.currentTarget.getBoundingClientRect()
            onTooltip({ label: home ? `🏠 ${label}` : label, x: rect.left + rect.width / 2, y: rect.top })
          }}
          onMouseLeave={() => onTooltip(null)}
        >
          {home ? (
            /* Home icon on world map */
            <g style={{ cursor: 'pointer' }} transform="translate(-6, -12)">
              <polygon points="6,0 0,6 12,6" fill="var(--accent)" stroke="#fff" strokeWidth={1} />
              <rect x={2} y={6} width={8} height={6} fill="var(--accent)" stroke="#fff" strokeWidth={1} />
              <rect x={4.5} y={8.5} width={3} height={3.5} fill="#fff" opacity={0.9} />
            </g>
          ) : (
            <>
              <circle r={5} fill="#e53935" opacity={0.3}>
                <animate attributeName="r" from="5" to="16" dur="1.8s" begin={`${i * 0.3}s`} repeatCount="indefinite" />
                <animate attributeName="opacity" from="0.3" to="0" dur="1.8s" begin={`${i * 0.3}s`} repeatCount="indefinite" />
              </circle>
              <circle r={5} fill="#fff" stroke="#e53935" strokeWidth={2} style={{ cursor: 'pointer' }} />
            </>
          )}
        </Marker>
      ))}
    </ComposableMap>
  )
}

export default function PlacesMapV1() {
  const [tooltip, setTooltip] = useState(null)
  const [selectedCountry, setSelectedCountry] = useState(null)
  const [expanded, setExpanded] = useState(false)
  const ref = useRef(null)
  const inView = useInView(ref, { once: false, margin: '0px' })

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') setExpanded(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const countriesVisited = cfg.visitedCountries.length
  const placesVisited = cfg.places.length

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 60 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 60 }}
      transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
      style={{
        width: '100%',
        borderRadius: 24,
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.08)',
        background: 'linear-gradient(135deg, rgba(10,10,20,0.95) 0%, rgba(20,20,40,0.9) 100%)',
        backdropFilter: 'blur(20px)',
        display: 'grid',
        gridTemplateColumns: '220px 1fr',
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
        <StatItem value={2} label="Continents" delay={0.4} inView={inView} />

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
        {/* Aspect ratio box: 800×500 = 62.5% — drives the card height naturally */}
        <div style={{ paddingTop: '62.5%', position: 'relative' }}>
          {/* Radial glow overlay */}
          <div style={{
            position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none',
            background: 'radial-gradient(ellipse at 60% 50%, rgba(var(--accent-rgb,130,80,255),0.08) 0%, transparent 70%)',
          }} />
          {/* Map fills the aspect-ratio box */}
          <motion.div
            initial={{ opacity: 0, scale: 1.04 }}
            animate={inView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 1.04 }}
            transition={{ duration: 1.1, delay: 0.2, ease: [0.23, 1, 0.32, 1] }}
            style={{ position: 'absolute', inset: 0 }}
          >
            <MapContent onCountryClick={setSelectedCountry} onTooltip={setTooltip} />
          </motion.div>
          {/* Name overlaid on top of map */}
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
            style={{
              position: 'absolute', top: 16, left: 0, right: 0, zIndex: 2,
              textAlign: 'center',
              fontSize: '1.8rem', fontWeight: 800, color: '#fff',
              letterSpacing: '0.04em', textTransform: 'uppercase', opacity: 0.9,
              pointerEvents: 'none',
            }}
          >
            {cfg.personal.name}
          </motion.div>
        </div>

        {/* Expand button */}
        <button
          onClick={() => setExpanded(true)}
          style={{
            position: 'absolute', bottom: 14, right: 14, zIndex: 10,
            background: 'rgba(0,0,0,0.45)', border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 8, padding: '6px 10px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6,
            color: 'rgba(255,255,255,0.8)', fontSize: '0.72rem', fontWeight: 500,
            backdropFilter: 'blur(8px)',
          }}
          title="Expand map"
        >
          <ExpandIcon /> Expand
        </button>
      </div>

      {/* Fullscreen expanded overlay — portalled above navbar */}
      {expanded && createPortal(
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'linear-gradient(135deg, rgba(10,10,20,0.98) 0%, rgba(20,20,40,0.96) 100%)',
            overflow: 'hidden',
          }}
        >
          {/* Map fills entire screen */}
          <div style={{ position: 'absolute', inset: 0 }}>
            <MapContent
              onCountryClick={id => setSelectedCountry(id)}
              onTooltip={setTooltip}
            />
          </div>

          {/* Floating collapse button */}
          <button
            onClick={() => setExpanded(false)}
            style={{
              position: 'absolute', top: 16, right: 16, zIndex: 10,
              background: 'rgba(0,0,0,0.55)', border: '1px solid rgba(255,255,255,0.18)',
              borderRadius: 8, padding: '7px 14px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 7,
              color: 'rgba(255,255,255,0.9)', fontSize: '0.75rem', fontWeight: 500,
              backdropFilter: 'blur(10px)',
            }}
          >
            <CollapseIcon /> Collapse
          </button>

          {/* CountryModal rendered INSIDE the portal so it sits above the overlay */}
          {selectedCountry && (
            <CountryModal
              countryId={selectedCountry}
              onClose={() => setSelectedCountry(null)}
              zIndex={10000}
            />
          )}
        </div>,
        document.body
      )}

      {/* Tooltip — portalled to body so it always floats above everything */}
      {tooltip && createPortal(
        <div style={{
          position: 'fixed', top: tooltip.y - 44, left: tooltip.x,
          transform: 'translateX(-50%)',
          background: 'rgba(0,0,0,0.85)', border: '1px solid var(--accent)',
          borderRadius: 8, padding: '5px 14px', fontSize: '0.8rem',
          color: '#fff', fontWeight: 600, pointerEvents: 'none',
          zIndex: 10001, whiteSpace: 'nowrap',
        }}>
          📍 {tooltip.label}
        </div>,
        document.body
      )}

      {/* CountryModal in normal (non-expanded) mode — portalled to escape overflow:hidden */}
      {!expanded && selectedCountry && createPortal(
        <CountryModal countryId={selectedCountry} onClose={() => setSelectedCountry(null)} zIndex={10000} />,
        document.body
      )}
    </motion.div>
  )
}
