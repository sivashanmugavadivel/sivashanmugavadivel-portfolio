import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence, useInView } from 'framer-motion'
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps'
import cfg from '../data/config.json'

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'

// Equirectangular projection maths — must match react-simple-maps' geoEquirectangular
const W = 800, H = 400, S = 125
const project = ([lon, lat]) => [
  W / 2 + S * (lon * Math.PI / 180),
  H / 2 - S * (lat * Math.PI / 180),
]

// Quadratic-bezier arc bowing north; flights bow high, ground legs stay flat.
function arcGeo(a, b, mode) {
  const [x1, y1] = project(a)
  const [x2, y2] = project(b)
  const dx = x2 - x1, dy = y2 - y1
  const dr = Math.hypot(dx, dy) || 1
  let nx = -dy / dr, ny = dx / dr
  if (ny > 0) { nx = -nx; ny = -ny }
  const air = mode === 'flight'
  const bow = Math.min(dr * (air ? 0.24 : 0.09), air ? 110 : 34)
  const cx = (x1 + x2) / 2 + nx * bow
  const cy = (y1 + y2) / 2 + ny * bow
  const d = `M${x1},${y1} Q${cx},${cy} ${x2},${y2}`
  const mid = [0.25 * x1 + 0.5 * cx + 0.25 * x2, 0.25 * y1 + 0.5 * cy + 0.25 * y2]
  // Approximate the quadratic-bezier length by sampling (used to keep travel speed constant)
  let len = 0, px = x1, py = y1
  for (let t = 0.05; t <= 1.0001; t += 0.05) {
    const mt = 1 - t
    const bx = mt * mt * x1 + 2 * mt * t * cx + t * t * x2
    const by = mt * mt * y1 + 2 * mt * t * cy + t * t * y2
    len += Math.hypot(bx - px, by - py); px = bx; py = by
  }
  return { d, mid, len }
}

const hexA = (hex, a) => {
  const n = parseInt(hex.slice(1), 16)
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`
}

// STYLE swatches — land fill + arc/pin accent
const STYLES = [
  { land: '#2f6bff', arc: '#6ea8ff' },
  { land: '#8b5cf6', arc: '#c4b5fd' },
  { land: '#14b8a6', arc: '#5eead4' },
  { land: '#22c55e', arc: '#86efac' },
  { land: '#ef4444', arc: '#fca5a5' },
  { land: '#64748b', arc: '#cbd5e1' },
  { land: '#4b5563', arc: '#9ca3af' },
]

const MODE_ICON = { flight: '✈', bus: '🚌', train: '🚆', car: '🚗' }
const MODE_LABEL = { flight: 'Flight', bus: 'Bus', train: 'Train', car: 'Car' }

// Corner-bracket reticle marker
function bracket(x, y, b = 6, arm = 3) {
  return [
    `M${x - b},${y - b + arm} L${x - b},${y - b} L${x - b + arm},${y - b}`,
    `M${x + b - arm},${y - b} L${x + b},${y - b} L${x + b},${y - b + arm}`,
    `M${x + b},${y + b - arm} L${x + b},${y + b} L${x + b - arm},${y + b}`,
    `M${x - b + arm},${y + b} L${x - b},${y + b} L${x - b},${y + b - arm}`,
  ].join(' ')
}

/* ── Segmented control ── */
function Seg({ options, value, onChange, dark }) {
  return (
    <div style={{
      display: 'inline-flex', padding: 3, borderRadius: 9,
      background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
    }}>
      {options.map(o => {
        const active = value === o.value
        return (
          <button key={o.value} onClick={() => onChange(o.value)} style={{
            border: 'none', cursor: 'pointer',
            padding: '5px 11px', borderRadius: 7,
            fontSize: '0.66rem', fontWeight: 700, letterSpacing: '0.04em',
            fontFamily: 'var(--sans)', textTransform: 'uppercase',
            background: active ? (dark ? '#fff' : '#111') : 'transparent',
            color: active ? (dark ? '#111' : '#fff') : (dark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.55)'),
            transition: 'all 0.15s',
          }}>
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

function CtrlGroup({ label, children, dark }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 6 }}>
      <span style={{
        fontSize: '0.54rem', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase',
        color: dark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.4)', fontFamily: 'var(--sans)',
      }}>{label}</span>
      {children}
    </div>
  )
}

export default function WorldMapArc() {
  const T = cfg.travel

  const [dark, setDark]   = useState(true)
  const [type, setType]   = useState('flat')   // dots | flat
  const anim = 'seq'                            // route arcs animate sequentially
  const [view, setView]   = useState('route')  // route (arcs) | cities (visited pins)
  const [pin, setPin]     = useState('pin') // bracket | dot | pin
  const [styleIdx, setStyleIdx] = useState(6)   // default grey / monochrome
  const [hoverLeg, setHoverLeg]     = useState(null)
  const [hoverPlace, setHoverPlace] = useState(null)
  const [zoom, setZoom]     = useState(1)
  const [center, setCenter] = useState([0, 0])
  const [playId, setPlayId] = useState(0)      // bumps each time the section enters view → replays once
  const [settingsOpen, setSettingsOpen] = useState(false) // settings live behind a gear button
  const [fullscreen, setFullscreen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const rootRef = useRef(null)
  const mapRef = useRef(null)
  const posRef = useRef({ x: 0, y: 0 })        // cursor pos in a ref → no re-render on mouse move
  const tipRef = useRef(null)
  const inView = useInView(mapRef, { amount: 0.3 })
  useEffect(() => { if (inView) setPlayId(p => p + 1) }, [inView])

  // Mobile-only tweaks (settings panel sizing) — desktop stays untouched.
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)')
    const apply = () => setIsMobile(mq.matches)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])

  // Move the tooltip by writing to the DOM directly (avoids re-rendering the map on every move)
  const onMapMove = (e) => {
    const r = mapRef.current?.getBoundingClientRect()
    if (!r) return
    posRef.current = { x: e.clientX - r.left, y: e.clientY - r.top }
    const el = tipRef.current
    if (el) { el.style.left = `${posRef.current.x}px`; el.style.top = `${posRef.current.y}px` }
  }
  const zoomBy = f => setZoom(z => Math.min(8, Math.max(1, z * f)))
  const resetView = () => { setZoom(1); setCenter([0, 0]) }

  // Fullscreen — fills the screen; on mobile it also tries to lock to landscape
  // so the wide map has room. Falls back gracefully where unsupported (e.g. iOS).
  const enterFullscreen = async () => {
    setFullscreen(true)
    try { await rootRef.current?.requestFullscreen?.() } catch { /* CSS overlay fallback */ }
    try { await window.screen?.orientation?.lock?.('landscape') } catch { /* not supported */ }
  }
  const exitFullscreen = async () => {
    try { window.screen?.orientation?.unlock?.() } catch { /* noop */ }
    try { if (document.fullscreenElement) await document.exitFullscreen?.() } catch { /* noop */ }
    setFullscreen(false)
  }
  // Keep state in sync when the user leaves native fullscreen (Esc / system gesture).
  useEffect(() => {
    const onFs = () => { if (!document.fullscreenElement) setFullscreen(false) }
    const onKey = (e) => { if (e.key === 'Escape') setFullscreen(false) }
    document.addEventListener('fullscreenchange', onFs)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('fullscreenchange', onFs)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  if (!T || !T.places || !T.home) return null

  const homeKey = T.home
  const routes = T.routes || []
  const P = STYLES[styleIdx]
  const kz = 1 / zoom   // counter-scale overlays so lines/icons/pins stay constant on screen

  // Palette derived from dark mode + chosen style
  const bg = dark
    ? 'radial-gradient(130% 130% at 50% 15%, #060608 0%, #000 72%)'
    : '#e9edf7'
  const landFill   = type === 'dots' ? 'url(#wma-dots)' : (dark ? P.land : hexA(P.land, 0.32))
  const landStroke = type === 'flat' ? (dark ? 'rgba(6,6,12,0.55)' : hexA(P.land, 0.55)) : 'none'
  const arcColor   = dark ? P.arc : P.land
  const dotColor   = dark ? P.arc : P.land
  const lightDot   = dark ? '#fff' : '#0b0a12'
  const panelBg    = dark ? 'rgba(18,16,28,0.92)' : 'rgba(255,255,255,0.94)'
  const panelBorder= dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'
  const divider    = dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'

  // Ordered route legs
  const legs = []
  routes.forEach((route, ri) => {
    route.legs.forEach((leg, li) => {
      const from = T.places[leg.from], to = T.places[leg.to]
      if (!from || !to) return
      const geo = arcGeo(from.coords, to.coords, leg.mode)
      legs.push({
        key: `${ri}-${li}`, d: geo.d, mid: geo.mid, len: geo.len, mode: leg.mode,
        fromLabel: from.label, toLabel: to.label, route: route.label,
        westward: to.coords[0] < from.coords[0],   // travelling right→left
        // Route-major stagger: each route plays after the previous, legs in order
        seqDelay: 0.2 + ri * 1.0 + li * 0.4,
      })
    })
  })

  const placeKeys = [...new Set(routes.flatMap(r => r.legs.flatMap(l => [l.from, l.to])))].filter(k => T.places[k])

  const DRAW = 1.0
  const legDelay = leg => (anim === 'all' ? 0.15 : leg.seqDelay)          // draw-in start
  const iconBegin = leg => (anim === 'all' ? 1.2 : leg.seqDelay + DRAW)    // vehicle starts after its arc draws

  const zBtn = {
    width: 30, height: 30, borderRadius: 8, cursor: 'pointer',
    border: `1px solid ${panelBorder}`, background: panelBg, color: dark ? '#fff' : '#111',
    fontSize: '1.05rem', fontWeight: 700, lineHeight: 1, fontFamily: 'var(--sans)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
  }

  return (
    <div ref={rootRef} style={{
      position: fullscreen ? 'fixed' : 'relative',
      inset: fullscreen ? 0 : undefined,
      zIndex: fullscreen ? 2000 : undefined,
      display: fullscreen ? 'flex' : undefined,
      alignItems: fullscreen ? 'center' : undefined,
      justifyContent: fullscreen ? 'center' : undefined,
      borderRadius: fullscreen ? 0 : 20, overflow: 'hidden',
      background: bg,
      border: fullscreen ? 'none' : `1px solid ${dark ? 'rgba(139,92,246,0.18)' : 'rgba(0,0,0,0.08)'}`,
      boxShadow: fullscreen ? 'none' : '0 24px 60px rgba(0,0,0,0.4)', transition: 'background 0.3s',
    }}>
      {/* ── Settings gear — click to open the control panel ── */}
      <button
        onClick={() => setSettingsOpen(o => !o)}
        aria-label={settingsOpen ? 'Close map settings' : 'Open map settings'}
        style={{
          position: 'absolute', top: 14, left: 14, zIndex: 22,
          width: 38, height: 38, borderRadius: 11, cursor: 'pointer',
          border: `1px solid ${panelBorder}`, background: panelBg, color: dark ? '#fff' : '#111',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
        }}
      >
        {settingsOpen ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        ) : (
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
        )}
      </button>

      {/* ── Control panel — opens from the gear ── */}
      <AnimatePresence>
      {settingsOpen && (
      <motion.div
        initial={{ opacity: 0, y: -8, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -8, scale: 0.96 }}
        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
        style={{
        position: 'absolute', top: 60, left: 14, zIndex: 21,
        display: 'flex', flexDirection: 'column', gap: isMobile ? 7 : 9, width: 'max-content',
        maxWidth: 'calc(100% - 28px)', transformOrigin: 'top left',
        background: panelBg, backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
        border: `1px solid ${panelBorder}`, borderRadius: 14, padding: isMobile ? '9px 11px' : '11px 13px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
        // On mobile the map is short — cap the panel height and let it scroll so
        // every control (View, Pin, Style…) stays reachable.
        ...(isMobile ? { maxHeight: 'calc(100% - 74px)', overflowY: 'auto' } : {}),
      }}>
        <CtrlGroup label="Dark" dark={dark}>
          <button onClick={() => setDark(d => !d)} aria-label="Toggle dark" style={{
            width: 38, height: 20, borderRadius: 999, border: 'none', cursor: 'pointer', position: 'relative',
            background: dark ? '#8b5cf6' : 'rgba(0,0,0,0.15)', transition: 'background 0.2s',
          }}>
            <span style={{
              position: 'absolute', top: 2, left: dark ? 20 : 2, width: 16, height: 16, borderRadius: '50%',
              background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
            }} />
          </button>
        </CtrlGroup>
        <div style={{ height: 1, width: '100%', background: divider }} />
        <CtrlGroup label="Type" dark={dark}>
          <Seg dark={dark} value={type} onChange={setType}
               options={[{ value: 'dots', label: 'Dots' }, { value: 'flat', label: 'Flat' }]} />
        </CtrlGroup>
        <div style={{ height: 1, width: '100%', background: divider }} />
        <CtrlGroup label="View" dark={dark}>
          <Seg dark={dark} value={view} onChange={setView}
               options={[{ value: 'route', label: 'Route' }, { value: 'cities', label: 'Cities' }]} />
        </CtrlGroup>
        <div style={{ height: 1, width: '100%', background: divider }} />
        <CtrlGroup label="Pin" dark={dark}>
          <Seg dark={dark} value={pin} onChange={setPin}
               options={[{ value: 'bracket', label: '⌜⌟' }, { value: 'dot', label: '●' }, { value: 'pin', label: '📍' }]} />
        </CtrlGroup>
        <div style={{ height: 1, width: '100%', background: divider }} />
        <CtrlGroup label="Style" dark={dark}>
          <div style={{ display: 'flex', gap: 6, maxWidth: 130, flexWrap: 'wrap' }}>
            {STYLES.map((s, i) => (
              <button key={i} onClick={() => setStyleIdx(i)} aria-label={`Style ${i + 1}`} style={{
                width: 16, height: 16, borderRadius: '50%', cursor: 'pointer',
                background: s.land, border: styleIdx === i ? '2px solid #fff' : `2px solid ${hexA(s.land, 0.4)}`,
                boxShadow: styleIdx === i ? `0 0 0 2px ${s.land}` : 'none', transition: 'all 0.15s',
              }} />
            ))}
          </div>
        </CtrlGroup>
      </motion.div>
      )}
      </AnimatePresence>

      {/* ── Map ── */}
      <div ref={mapRef} onMouseMove={onMapMove} style={{ position: 'relative', width: '100%', ...(fullscreen ? { display: 'flex', alignItems: 'center', justifyContent: 'center' } : {}) }}>
        <ComposableMap
          projection="geoEquirectangular"
          projectionConfig={{ scale: S, center: [0, 0] }}
          width={W} height={H}
          style={fullscreen
            ? { width: '100%', height: '100vh', display: 'block' }
            : { width: '100%', height: 'auto', display: 'block' }}
        >
          <defs>
            <pattern id="wma-dots" width="6.4" height="6.4" patternUnits="userSpaceOnUse">
              <circle cx="1.3" cy="1.3" r="1.35" fill={dark ? hexA(P.land, 0.85) : hexA(P.land, 0.7)} />
            </pattern>
            <filter id="wma-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="1.5" result="b" />
              <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          <ZoomableGroup
            zoom={zoom}
            center={center}
            minZoom={1}
            maxZoom={8}
            translateExtent={[[0, 0], [W, H]]}
            onMove={(m) => { const z = m && (m.zoom ?? m.k); if (z) setZoom(z) }}
            onMoveEnd={({ coordinates, zoom: z }) => { setCenter(coordinates); setZoom(z) }}
            filterZoomEvent={(evt) => (evt.type === 'wheel' ? evt.ctrlKey : true)}
          >

          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map(geo => (
                <Geography key={geo.rsmKey} geography={geo}
                  fill={landFill} stroke={landStroke} strokeWidth={0.4}
                  style={{ default: { outline: 'none' }, hover: { outline: 'none' }, pressed: { outline: 'none' } }} />
              ))
            }
          </Geographies>

          {/* Arcs + travelling transport icons — Route view only.
              Keyed on `anim`+`playId` so it replays once each time the section enters view. */}
          {view === 'route' && (
          <g key={`${anim}-${playId}`}>
            {/* Glowing route lines */}
            <g fill="none" filter="url(#wma-glow)">
              {legs.map((leg, i) => {
                const active = hoverLeg === leg.key
                return (
                  <motion.path
                    key={leg.key} id={`wma-arc-${i}`} d={leg.d}
                    stroke={arcColor} strokeWidth={(active ? 1.8 : 1) * kz} strokeLinecap="round"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: active ? 1 : 0.8 }}
                    transition={{ duration: DRAW, delay: legDelay(leg), ease: [0.16, 1, 0.3, 1] }}
                  />
                )
              })}
            </g>
            {/* Transport vehicle riding each route once, by mode. */}
            <g>
              {legs.map((leg, i) => {
                const isFlight = leg.mode === 'flight'
                const flip = leg.westward   // face left when travelling right→left
                // Constant speed → long flights take longer (no longer whip across the map).
                // Flights move slower (lower units/sec) than ground legs.
                const speed = isFlight ? 42 : 80
                const travelDur = Math.min(14, Math.max(isFlight ? 3.5 : 1.6, leg.len / speed))
                return (
                  <g key={leg.key}>
                    <animateMotion
                      dur={`${travelDur}s`}
                      begin={`${iconBegin(leg)}s`}
                      repeatCount="1" fill="freeze">
                      <mpath href={`#wma-arc-${i}`} />
                    </animateMotion>
                    <text
                      x={0} y={0} textAnchor="middle" dominantBaseline="central"
                      fontSize={13 * kz}
                      transform={flip ? 'scale(-1,1)' : undefined}
                      fill={isFlight ? lightDot : undefined}
                    >
                      {MODE_ICON[leg.mode] || '•'}
                      {/* Fade the vehicle out once it reaches the destination */}
                      <animate attributeName="opacity" from="1" to="0"
                               begin={`${iconBegin(leg) + travelDur}s`} dur="0.45s" fill="freeze" />
                    </text>
                  </g>
                )
              })}
            </g>
          </g>
          )}

          {/* Arc hover hit-areas (invisible, thick) — Route view only */}
          {view === 'route' && (
          <g fill="none" stroke="transparent" strokeWidth={12 * kz} style={{ pointerEvents: 'stroke' }}>
            {legs.map(leg => (
              <path key={leg.key} d={leg.d}
                onMouseEnter={() => setHoverLeg(leg.key)}
                onMouseLeave={() => setHoverLeg(h => (h === leg.key ? null : h))} />
            ))}
          </g>
          )}

          {/* Place markers — Route view */}
          {view === 'route' && (
          <g key={`markers-${playId}`}>
            {placeKeys.map((k, i) => {
              const [x, y] = project(T.places[k].coords)
              const isHome = k === homeKey
              const c = isHome ? '#f5b301' : dotColor
              const hovered = hoverPlace === k
              return (
                <g key={k}
                   onMouseEnter={() => setHoverPlace(k)}
                   onMouseLeave={() => setHoverPlace(h => (h === k ? null : h))}
                   style={{ cursor: 'pointer' }}>
                  <circle cx={x} cy={y} r={9 * kz} fill="transparent" />
                  {pin === 'bracket' ? (
                    <>
                      <motion.path d={bracket(x, y, (hovered ? 8 : 6) * kz, 3 * kz)}
                        fill="none" stroke={c} strokeWidth={(hovered ? 1.6 : 1.2) * kz}
                        initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 + i * 0.08 }}
                        style={{ transformBox: 'fill-box', transformOrigin: 'center' }} />
                      <circle cx={x} cy={y} r={1.6 * kz} fill={c} />
                    </>
                  ) : pin === 'pin' ? (
                    <>
                      {/* Same floating red pin as the Cities view */}
                      <motion.circle cx={x} cy={y} fill="none" stroke={isHome ? '#f5b301' : '#ef4444'} strokeWidth={0.8 * kz}
                        initial={{ r: 1.2 * kz, opacity: 0 }}
                        animate={{ r: [1.2 * kz, 6 * kz], opacity: [0.55, 0] }}
                        transition={{ duration: 2.2, delay: i * 0.14, repeat: Infinity, ease: 'easeOut' }} />
                      <motion.g animate={{ y: [0, -4 * kz, 0] }} transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut', delay: i * 0.12 }}>
                        <g transform={`translate(${x},${y}) scale(${kz * 0.55})`}>
                          <path d="M0,0 c-4.6,-6.2 -8,-10 -8,-14.4 a8,8 0 1,1 16,0 c0,4.4 -3.4,8.2 -8,14.4 z"
                            fill={isHome ? '#f5b301' : '#ef4444'} stroke={hovered ? '#fff' : 'rgba(0,0,0,0.25)'} strokeWidth={0.8}
                            filter="url(#wma-glow)" />
                          <circle cx={0} cy={-14.4} r={3} fill="#fff" />
                        </g>
                      </motion.g>
                    </>
                  ) : (
                    <>
                      <motion.circle cx={x} cy={y} fill="none" stroke={c} strokeWidth={kz}
                        initial={{ r: 2 * kz, opacity: 0 }} animate={{ r: [2 * kz, (isHome ? 12 : 9) * kz], opacity: [0.75, 0] }}
                        transition={{ duration: isHome ? 2.2 : 2.4, delay: i * 0.15, ease: 'easeOut' }} />
                      <motion.circle cx={x} cy={y} r={(isHome ? 4 : 2.8) * kz}
                        fill={hovered ? lightDot : c} filter={isHome ? 'url(#wma-glow)' : undefined}
                        initial={{ scale: 0 }} animate={{ scale: 1 }}
                        transition={{ delay: 0.3 + i * 0.08, type: 'spring', stiffness: 300 }}
                        style={{ transformBox: 'fill-box', transformOrigin: 'center' }} />
                    </>
                  )}
                </g>
              )
            })}
          </g>
          )}

          {/* Visited-city pins — Cities view (red pin floats on each city) */}
          {view === 'cities' && (
          <g key={`cities-${playId}`}>
            {placeKeys.map((k, i) => {
              const [x, y] = project(T.places[k].coords)
              const isHome = k === homeKey
              const pinColor = isHome ? '#f5b301' : '#ef4444' // home gold, visited red
              const hovered = hoverPlace === k
              return (
                <g key={k}
                   onMouseEnter={() => setHoverPlace(k)}
                   onMouseLeave={() => setHoverPlace(h => (h === k ? null : h))}
                   style={{ cursor: 'pointer' }}>
                  <circle cx={x} cy={y} r={9 * kz} fill="transparent" />
                  {/* Marker style follows the Pin setting (red/gold city colours) */}
                  {pin === 'bracket' ? (
                    <>
                      <motion.path d={bracket(x, y, (hovered ? 8 : 6) * kz, 3 * kz)}
                        fill="none" stroke={pinColor} strokeWidth={(hovered ? 1.6 : 1.2) * kz}
                        initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 + i * 0.08 }}
                        style={{ transformBox: 'fill-box', transformOrigin: 'center' }} />
                      <circle cx={x} cy={y} r={1.6 * kz} fill={pinColor} />
                    </>
                  ) : pin === 'dot' ? (
                    <>
                      <motion.circle cx={x} cy={y} fill="none" stroke={pinColor} strokeWidth={kz}
                        initial={{ r: 2 * kz, opacity: 0 }} animate={{ r: [2 * kz, (isHome ? 12 : 9) * kz], opacity: [0.75, 0] }}
                        transition={{ duration: isHome ? 2.2 : 2.4, delay: i * 0.15, ease: 'easeOut', repeat: Infinity }} />
                      <motion.circle cx={x} cy={y} r={(isHome ? 4 : 2.8) * kz}
                        fill={hovered ? lightDot : pinColor} filter={isHome ? 'url(#wma-glow)' : undefined}
                        initial={{ scale: 0 }} animate={{ scale: 1 }}
                        transition={{ delay: 0.3 + i * 0.08, type: 'spring', stiffness: 300 }}
                        style={{ transformBox: 'fill-box', transformOrigin: 'center' }} />
                    </>
                  ) : (
                    <>
                      {/* Floating teardrop pin */}
                      <motion.circle cx={x} cy={y} fill="none" stroke={pinColor} strokeWidth={0.8 * kz}
                        initial={{ r: 1.2 * kz, opacity: 0 }}
                        animate={{ r: [1.2 * kz, 6 * kz], opacity: [0.55, 0] }}
                        transition={{ duration: 2.2, delay: i * 0.14, repeat: Infinity, ease: 'easeOut' }} />
                      <motion.g animate={{ y: [0, -2.5 * kz, 0] }} transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut', delay: i * 0.12 }}>
                        <g transform={`translate(${x},${y}) scale(${kz * 0.55})`}>
                          <path d="M0,0 c-4.6,-6.2 -8,-10 -8,-14.4 a8,8 0 1,1 16,0 c0,4.4 -3.4,8.2 -8,14.4 z"
                            fill={pinColor} stroke={hovered ? '#fff' : 'rgba(0,0,0,0.25)'} strokeWidth={0.8}
                            filter="url(#wma-glow)" />
                          <circle cx={0} cy={-14.4} r={3} fill="#fff" />
                        </g>
                      </motion.g>
                    </>
                  )}
                </g>
              )
            })}
          </g>
          )}
          </ZoomableGroup>
        </ComposableMap>

        {/* ── Hover tooltips (positioned via ref on mouse-move, so the map never re-renders) ── */}
        {hoverPlace && (() => {
          const p = T.places[hoverPlace]
          return (
            <div ref={tipRef} style={{
              position: 'absolute', left: posRef.current.x, top: posRef.current.y, transform: 'translate(-50%, calc(-100% - 14px))',
              pointerEvents: 'none', zIndex: 15,
              background: dark ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.96)',
              color: dark ? '#fff' : '#111', border: `1px solid ${panelBorder}`,
              padding: '5px 11px', borderRadius: 8, fontSize: '0.72rem', fontWeight: 700,
              whiteSpace: 'nowrap', fontFamily: 'var(--sans)', boxShadow: '0 6px 20px rgba(0,0,0,0.3)',
            }}>
              {hoverPlace === homeKey ? '🏠 ' : '📍 '}{p.label}
            </div>
          )
        })()}

        {hoverLeg && !hoverPlace && (() => {
          const leg = legs.find(l => l.key === hoverLeg)
          if (!leg) return null
          return (
            <div ref={tipRef} style={{
              position: 'absolute', left: posRef.current.x, top: posRef.current.y, transform: 'translate(-50%, calc(-100% - 14px))',
              pointerEvents: 'none', zIndex: 16, minWidth: 170,
              background: dark ? 'rgba(10,9,16,0.94)' : 'rgba(255,255,255,0.97)',
              color: dark ? '#fff' : '#111', border: `1px solid ${panelBorder}`,
              padding: '11px 13px', borderRadius: 12, fontFamily: 'var(--sans)',
              boxShadow: '0 12px 34px rgba(0,0,0,0.4)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 7 }}>
                <span style={{ fontSize: '0.6rem', fontWeight: 700, padding: '2px 7px', borderRadius: 5,
                  background: hexA(P.land, dark ? 0.25 : 0.14), color: arcColor }}>{leg.fromLabel}</span>
                <span style={{ opacity: 0.5, fontSize: '0.7rem' }}>→</span>
                <span style={{ fontSize: '0.6rem', fontWeight: 700, padding: '2px 7px', borderRadius: 5,
                  background: hexA(P.land, dark ? 0.25 : 0.14), color: arcColor }}>{leg.toLabel}</span>
              </div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: arcColor, marginBottom: 3 }}>
                {MODE_ICON[leg.mode] || '•'} {MODE_LABEL[leg.mode] || leg.mode}
              </div>
              <div style={{ fontSize: '0.7rem', opacity: 0.6 }}>{leg.route}</div>
            </div>
          )
        })()}

        {/* Zoom + fullscreen controls */}
        <div style={{ position: 'absolute', right: 14, bottom: 14, zIndex: 15, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <button aria-label="Zoom in" style={zBtn} onClick={() => zoomBy(1.5)}>+</button>
          <button aria-label="Zoom out" style={zBtn} onClick={() => zoomBy(1 / 1.5)}>−</button>
          <button aria-label="Reset view" style={{ ...zBtn, fontSize: '0.85rem' }} onClick={resetView}>⟳</button>
          <button aria-label={fullscreen ? 'Exit fullscreen' : 'Open fullscreen map'} style={zBtn} onClick={fullscreen ? exitFullscreen : enterFullscreen}>
            {fullscreen ? (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3v3a2 2 0 0 1-2 2H3M21 8h-3a2 2 0 0 1-2-2V3M3 16h3a2 2 0 0 1 2 2v3M16 21v-3a2 2 0 0 1 2-2h3"/></svg>
            ) : (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3"/></svg>
            )}
          </button>
        </div>

        {/* Exit-fullscreen button — top-right, only while fullscreen */}
        {fullscreen && (
          <button aria-label="Exit fullscreen" onClick={exitFullscreen} style={{
            position: 'absolute', top: 14, right: 14, zIndex: 25,
            width: 40, height: 40, borderRadius: 11, cursor: 'pointer',
            border: `1px solid ${panelBorder}`, background: panelBg, color: dark ? '#fff' : '#111',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        )}
      </div>

      {/* Legend */}
      <div style={{
        position: 'absolute', bottom: 12, left: 16, display: 'flex', gap: 16,
        fontSize: '0.7rem', color: dark ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.55)',
        fontFamily: 'var(--sans)', flexWrap: 'wrap', pointerEvents: 'none',
      }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f5b301' }} /> Home
        </span>
        {view === 'route' ? (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 14, height: 2, borderRadius: 2, background: arcColor }} /> Route · hover for details
          </span>
        ) : (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444' }} /> Visited city
          </span>
        )}
        <span style={{ opacity: 0.7 }}>Pinch / Ctrl+scroll to zoom · drag to pan</span>
      </div>
    </div>
  )
}
