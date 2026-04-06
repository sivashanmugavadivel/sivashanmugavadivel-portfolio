import { useState } from 'react'
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps'
import cfg from '../data/config.json'

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'

export default function PlacesMap() {
  const [tooltip, setTooltip] = useState(null)

  return (
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
                  style={{
                    default: { outline: 'none', opacity: visited ? 0.75 : 1 },
                    hover:   { outline: 'none', opacity: visited ? 0.9 : 1 },
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
            {/* Pulse ring */}
            <circle r={5} fill="var(--accent)" opacity={0.35}>
              <animate attributeName="r" from="5" to="16" dur="1.8s" repeatCount="indefinite" />
              <animate attributeName="opacity" from="0.35" to="0" dur="1.8s" repeatCount="indefinite" />
            </circle>
            {/* Pin dot */}
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
    </div>
  )
}
