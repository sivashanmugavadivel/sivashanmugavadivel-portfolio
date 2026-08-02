/**
 * Leaflet mini-map for the "Rides & Routes" section.
 *
 * Loads Leaflet from CDN on demand, draws the OSRM-routed polylines, and
 * replays the stroke-dash draw every time the map scrolls into view.
 *
 * Uses `useNavigate` internally so callers don't have to thread it through.
 */

import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

function loadLeaflet() {
  return new Promise(resolve => {
    if (window.L) { resolve(window.L); return }
    if (!document.getElementById('lf-css')) {
      const l = document.createElement('link')
      l.id = 'lf-css'; l.rel = 'stylesheet'
      l.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(l)
    }
    const s = document.createElement('script')
    s.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
    s.onload = () => resolve(window.L)
    document.head.appendChild(s)
  })
}

function ensureMapStyle() {
  if (document.getElementById('v8-map-style')) return
  const s = document.createElement('style')
  s.id = 'v8-map-style'
  s.textContent = `
    @keyframes v8pulse{0%{transform:scale(1);opacity:.7}100%{transform:scale(2.4);opacity:0}}
    .v8tip{background:transparent!important;border:none!important;box-shadow:none!important;padding:0!important}
    .v8tip::before{display:none!important}
    .leaflet-container{background:#08070e!important}
  `
  document.head.appendChild(s)
}

/**
 * `home` gets the bigger accent pin. `dir` is which side the label sits on.
 * Dharapuram and Nathakadaiyur are within ~35 km of home, so at this zoom
 * their labels would sit on top of each other — they're hover-only
 * (`permanent: false`) and the cluster stays legible.
 */
export const MAP_CITIES = {
  kangayam:      { lat: 11.0057, lng: 77.5606, label: 'Kangayam',      home: true, dir: 'left'  },
  dharapuram:    { lat: 10.7300, lng: 77.5200, label: 'Dharapuram',    dir: 'left',  permanent: false },
  nathakadaiyur: { lat: 10.9400, lng: 77.5450, label: 'Nathakadaiyur', dir: 'right', permanent: false },
  coimbatore:    { lat: 11.0168, lng: 76.9558, label: 'Coimbatore',    dir: 'left'  },
  chennai:       { lat: 13.0827, lng: 80.2707, label: 'Chennai',       dir: 'right' },
  pondy:         { lat: 11.9416, lng: 79.8083, label: 'Pondicherry',   dir: 'right' },
}

/**
 * `via` holds the intermediate stops OSRM should route through. Rides that
 * have happened or have a date draw solid; the undated `planned: true` ones
 * are dashed, so the map reads the same way the ride list does.
 */
export const MAP_ROUTES = [
  { from: 'dharapuram', to: 'nathakadaiyur', via: ['kangayam'], color: '#a78bfa', rid: 'r1' },
  { from: 'kangayam',   to: 'coimbatore',                       color: '#22c55e', rid: 'r3', planned: true },
  { from: 'kangayam',   to: 'chennai',                          color: '#f97316', rid: 'r2', planned: true },
  { from: 'chennai',    to: 'pondy',                            color: '#38bdf8', rid: 'r4', planned: true },
]

/** @param {string} basePath  where clicking a route line lands */
export default function ShowcaseMiniMap({ basePath = '/mygarage/rides' }) {
  const navigate = useNavigate()
  const mapRef = useRef(null)
  const lMap = useRef(null)
  const ioRef = useRef(null)     // intersection observer handle
  const roRef = useRef(null)     // resize observer handle
  const pending = useRef([])     // route line elements that can animate

  // (Re)play the reveal on all loaded route lines. Completed rides draw
  // themselves in with a stroke-dash sweep; planned rides keep their dashed
  // stroke (which the sweep would overwrite) and fade in instead.
  const playAnimation = () => {
    pending.current.forEach(({ el, i, planned }) => {
      if (!el) return
      if (planned) {
        el.style.transition = 'none'
        el.style.opacity = '0'
        void el.getBoundingClientRect()
        el.style.transition = `opacity 0.9s ${0.15 * i}s ease-out`
        requestAnimationFrame(() => { el.style.opacity = '' })
        return
      }
      if (!el.getTotalLength) return
      const len = el.getTotalLength()
      // Reset to hidden (no transition), then animate to drawn
      el.style.transition = 'none'
      el.style.strokeDasharray = len
      el.style.strokeDashoffset = len
      // Force reflow so the reset takes effect before the transition
      void el.getBoundingClientRect()
      el.style.transition = `stroke-dashoffset 1.1s ${0.15 * i}s ease-out`
      requestAnimationFrame(() => { el.style.strokeDashoffset = '0' })
    })
  }

  useEffect(() => {
    let mounted = true
    loadLeaflet().then(L => {
      if (!mounted || !mapRef.current || lMap.current) return
      ensureMapStyle()
      const map = L.map(mapRef.current, { center: [11.9, 78.6], zoom: 7, zoomControl: false, attributionControl: false, scrollWheelZoom: false })
      lMap.current = map
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { subdomains: 'abcd', maxZoom: 19 }).addTo(map)

      // Observe map visibility — replay the route draw every time it enters view
      ioRef.current = new IntersectionObserver(entries => {
        if (entries[0]?.isIntersecting) playAnimation()
      }, { threshold: 0.35 })
      if (mapRef.current) ioRef.current.observe(mapRef.current)

      // Fetch all routes in parallel; draw fully but keep hidden until in view
      MAP_ROUTES.forEach((r, i) => {
        const stops = [r.from, ...(r.via || []), r.to].map(k => MAP_CITIES[k])
        const pts = stops.map(c => `${c.lng},${c.lat}`).join(';')
        const url = `https://router.project-osrm.org/route/v1/driving/${pts}?overview=full&geometries=geojson`
        fetch(url).then(res => res.json()).then(data => {
          if (!mounted || !data.routes?.[0]) return
          const coords = data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng])
          // Glow line behind
          L.polyline(coords, { color: r.color, weight: 7, opacity: r.planned ? 0.08 : 0.12, interactive: false }).addTo(map)
          // Main line — planned rides dashed and dimmer than ones already ridden
          const poly = L.polyline(coords, {
            color: r.color, weight: 2.5, opacity: r.planned ? 0.6 : 0.9, lineCap: 'round',
            ...(r.planned ? { dashArray: '5 7' } : {}),
          }).addTo(map)
          poly.on('click', () => navigate(`${basePath}/${r.rid}`))
          const el = poly.getElement()
          if (!el) return
          // Pre-hide the line so it can reveal itself when the map scrolls in
          if (r.planned) {
            el.style.opacity = '0'
          } else if (el.getTotalLength) {
            const len = el.getTotalLength()
            el.style.strokeDasharray = len
            el.style.strokeDashoffset = len
          } else {
            return
          }
          pending.current.push({ el, i, planned: r.planned })
          // Play immediately if the map is already in view when data arrives
          const rect = mapRef.current?.getBoundingClientRect()
          if (rect && rect.top < window.innerHeight && rect.bottom > 0) {
            if (r.planned) {
              el.style.transition = `opacity 0.9s ${0.15 * i}s ease-out`
              requestAnimationFrame(() => { el.style.opacity = '' })
            } else {
              el.style.transition = `stroke-dashoffset 1.1s ${0.15 * i}s ease-out`
              requestAnimationFrame(() => { el.style.strokeDashoffset = '0' })
            }
          }
        }).catch(() => {})
      })
      /* ── narrow containers only ──────────────────────────────────
         The centre/zoom above is framed for the wide desktop pane; in
         a phone-width column that same view lands on a tall slice with
         the cities pushed off the edges. Below 760px, fit the map to
         the cities instead so the whole route network is in frame.
         Desktop keeps the original view untouched. */
      const NARROW = 760
      const fitIfNarrow = () => {
        const el = mapRef.current
        if (!el) return
        map.invalidateSize()
        if (el.clientWidth > 0 && el.clientWidth <= NARROW) {
          const bounds = L.latLngBounds(
            Object.values(MAP_CITIES).map(c => [c.lat, c.lng]),
          )
          /* generous horizontal padding: the bounds only cover the pins, and
             each one carries a permanent label that hangs 60–80px off to its
             side. Fitting the pins alone clips "Coimbatore" and "Chennai"
             against the edges. */
          map.fitBounds(bounds, { padding: [56, 30], animate: false })
        }
      }
      fitIfNarrow()
      /* re-fit on rotate/resize; Leaflet also needs invalidateSize when its
         container changes size or it keeps rendering at the old dimensions */
      roRef.current = new ResizeObserver(() => fitIfNarrow())
      roRef.current.observe(mapRef.current)

      Object.values(MAP_CITIES).forEach(c => {
        const col = c.home ? '#a78bfa' : '#c4b5fd'
        const sz = c.home ? 14 : 11
        const icon = L.divIcon({ className: '', html: `<div style="position:relative;display:flex;align-items:center;justify-content:center;width:${sz+12}px;height:${sz+12}px">
          <div style="width:${sz}px;height:${sz}px;border-radius:50%;background:${col};border:2px solid rgba(255,255,255,0.85);box-shadow:0 0 8px ${col}88;z-index:2"></div>
          <div style="position:absolute;width:${sz+12}px;height:${sz+12}px;border-radius:50%;background:${col}28;animation:v8pulse 2.2s ease-out infinite;z-index:1"></div></div>`, iconSize: [sz+12, sz+12], iconAnchor: [(sz+12)/2, (sz+12)/2] })
        const dir = c.dir || 'left'
        L.marker([c.lat, c.lng], { icon }).addTo(map).bindTooltip(
          `<div style="background:rgba(8,7,14,0.95);border:1px solid rgba(167,139,250,0.35);color:#f0eef6;font-family:system-ui,sans-serif;font-size:10px;font-weight:700;padding:2px 7px;border-radius:4px;white-space:nowrap">${c.home?'🏍️ ':''}${c.label}</div>`,
          { permanent: c.permanent !== false, direction: dir, offset: [dir==='right'?8:-8, 0], className: 'v8tip' })
      })
    })
    return () => {
      mounted = false
      if (ioRef.current) { ioRef.current.disconnect(); ioRef.current = null }
      if (roRef.current) { roRef.current.disconnect(); roRef.current = null }
      if (lMap.current) { lMap.current.remove(); lMap.current = null }
    }
  }, [])
  return <div ref={mapRef} style={{ position: 'absolute', inset: 0 }} />
}
