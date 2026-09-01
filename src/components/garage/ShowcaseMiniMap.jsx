/**
 * Leaflet mini-map for the "Rides & Routes" section.
 *
 * Loads Leaflet from CDN on demand, draws the OSRM-routed polylines, and
 * replays the stroke-dash draw every time the map scrolls into view.
 *
 * Deliberately STATIC: it is a picture of the route network, not a map to
 * explore. Panning, every flavour of zoom, and keyboard control are all off, and
 * the lines and pins are non-interactive, so the panel can't swallow a scroll or
 * a swipe on the way past it. The ride list beside it is what navigates — which
 * is why this takes no `basePath`. The only motion left is the route-draw
 * reveal, which is on scroll position rather than on input.
 *
 * Both the pins and the lines come from the ride JSON in
 * public/mygarage/rideandroute/ — see src/data/rides.js.
 */

import { useEffect, useRef } from 'react'
import { mapCities, mapRoutes } from '../../data/rides'
import { addBasemap } from '../../utils/basemap'

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
  if (document.getElementById('v8-map-style-2')) return
  const s = document.createElement('style')
  s.id = 'v8-map-style-2'
  s.textContent = `
    @keyframes v8pulse{0%{transform:scale(1);opacity:.7}100%{transform:scale(2.4);opacity:0}}
    .v8tip{background:transparent!important;border:none!important;box-shadow:none!important;padding:0!important}
    .v8tip::before{display:none!important}
    .leaflet-container{background:#08070e!important}
    /* Inert by design — see the note on the component. Disabling Leaflet's
       handlers stops it *acting* on input but the container is still a hit
       target: it keeps the grab cursor, its text selects, and Leaflet's own
       \`touch-action:none\` eats a swipe that starts over the map. Taking the
       whole thing out of hit-testing is what actually makes it a picture. */
    .v8map,.v8map *{pointer-events:none!important;touch-action:auto!important;
      user-select:none!important;-webkit-user-select:none!important;cursor:default!important}
  `
  document.head.appendChild(s)
}

/**
 * The pins and the route lines both come from the ride files in
 * public/mygarage/rideandroute/ — see src/data/rides.js. This component used to
 * carry its own copy of the coordinates, colours and ride ids, which meant every
 * new ride had to be written down twice and could disagree with itself.
 *
 * `mapCities` is every stop of every drawable ride, deduped: `home` gets the
 * bigger accent pin and `dir` is which side the label sits on. Since the map is
 * static every label is always on, so `dir` is the only thing keeping close pins
 * legible — Dharapuram and Nathakadaiyur sit within ~35 km of home, and their
 * files point their labels opposite ways so the cluster stays readable.
 *
 * `mapRoutes` is one entry per ride, carrying the whole stop chain so OSRM routes
 * *through* the intermediate stops. Rides that have happened or have a date draw
 * solid; undated (`planned`) ones are dashed, so the map reads the same way the
 * ride list does.
 */
const MAP_CITIES = mapCities
const MAP_ROUTES = mapRoutes

export default function ShowcaseMiniMap() {
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
      /* Static by design — this is a picture of the route network, not a map to
         explore. Every handler Leaflet installs is off, so the panel never
         swallows a scroll, a swipe or a pinch on the way past it; the ride list
         beside the map is what navigates. `zoomSnap: 0` lets the narrow-width
         fitBounds below land on a fractional zoom instead of rounding to a whole
         level and cropping the outer cities. */
      const map = L.map(mapRef.current, {
        center: [11.9, 78.6], zoom: 7,
        zoomControl: false, attributionControl: false,
        dragging: false, scrollWheelZoom: false, doubleClickZoom: false,
        touchZoom: false, boxZoom: false, keyboard: false, tap: false,
        inertia: false, zoomSnap: 0,
      })
      lMap.current = map
      addBasemap(L, map)

      // Observe map visibility — replay the route draw every time it enters view
      ioRef.current = new IntersectionObserver(entries => {
        if (entries[0]?.isIntersecting) playAnimation()
      }, { threshold: 0.35 })
      if (mapRef.current) ioRef.current.observe(mapRef.current)

      // Fetch all routes in parallel; draw fully but keep hidden until in view
      MAP_ROUTES.forEach((r, i) => {
        // Already start → intermediate stops → end, straight off the ride file
        const pts = r.stops.map(c => `${c.lng},${c.lat}`).join(';')
        const url = `https://router.project-osrm.org/route/v1/driving/${pts}?overview=full&geometries=geojson`
        fetch(url).then(res => res.json()).then(data => {
          if (!mounted || !data.routes?.[0]) return
          const coords = data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng])
          // Glow line behind
          L.polyline(coords, { color: r.color, weight: 7, opacity: r.planned ? 0.08 : 0.12, interactive: false }).addTo(map)
          // Main line — planned rides dashed and dimmer than ones already ridden
          const poly = L.polyline(coords, {
            color: r.color, weight: 2.5, opacity: r.planned ? 0.6 : 0.9, lineCap: 'round',
            interactive: false,
            ...(r.planned ? { dashArray: '5 7' } : {}),
          }).addTo(map)
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
      /* ── frame the whole network, at every width ──────────────────
         The fixed centre/zoom above is only the view Leaflet opens on before
         the tiles and the city list are ready. It used to be left alone on
         desktop, which framed a squarish region inside a wide pane: the routes
         ended up bunched in the middle with dead space either side, and the
         short southern legs were too small to read.

         Fitting the pins instead spends the pane's whole long axis on the run
         from the first stop to the last. The network is wider than it is tall
         (Coimbatore→Chennai is ~3.3° of longitude against ~2.4° of latitude), so
         in a landscape pane the fit is bounded by width and the map fills it —
         which is the point. `zoomSnap: 0` on the map lets this land on a
         fractional zoom rather than rounding down a whole level and leaving a
         margin it doesn't need. */
      const fitCities = () => {
        const el = mapRef.current
        if (!el || !el.clientWidth) return
        /* Leaflet renders at the size it last measured, so a pane that changed
           size needs this before any fit or the bounds are computed against
           stale dimensions. */
        map.invalidateSize()
        const bounds = L.latLngBounds(
          Object.values(MAP_CITIES).map(c => [c.lat, c.lng]),
        )
        if (!bounds.isValid()) return
        /* Generous horizontal padding: the bounds only cover the pins, and each
           one carries a permanent label hanging 60–80px off to its side.
           Fitting the pins alone clips "Coimbatore" and "Chennai" at the edges. */
        map.fitBounds(bounds, { padding: [64, 34], animate: false })
      }
      fitCities()
      /* re-fit on rotate/resize; Leaflet also needs invalidateSize when its
         container changes size or it keeps rendering at the old dimensions */
      roRef.current = new ResizeObserver(() => fitCities())
      roRef.current.observe(mapRef.current)

      Object.values(MAP_CITIES).forEach(c => {
        const col = c.home ? '#a78bfa' : '#c4b5fd'
        const sz = c.home ? 14 : 11
        const icon = L.divIcon({ className: '', html: `<div style="position:relative;display:flex;align-items:center;justify-content:center;width:${sz+12}px;height:${sz+12}px">
          <div style="width:${sz}px;height:${sz}px;border-radius:50%;background:${col};border:2px solid rgba(255,255,255,0.85);box-shadow:0 0 8px ${col}88;z-index:2"></div>
          <div style="position:absolute;width:${sz+12}px;height:${sz+12}px;border-radius:50%;background:${col}28;animation:v8pulse 2.2s ease-out infinite;z-index:1"></div></div>`, iconSize: [sz+12, sz+12], iconAnchor: [(sz+12)/2, (sz+12)/2] })
        const dir = c.dir || 'left'
        /* `interactive: false` — nothing here reacts to a pointer, so labels have
           to be permanent: a hover-only one could never be opened. */
        L.marker([c.lat, c.lng], { icon, interactive: false }).addTo(map).bindTooltip(
          `<div style="background:rgba(8,7,14,0.95);border:1px solid rgba(167,139,250,0.35);color:#f0eef6;font-family:system-ui,sans-serif;font-size:10px;font-weight:700;padding:2px 7px;border-radius:4px;white-space:nowrap">${c.home?'🏍️ ':''}${c.label}</div>`,
          { permanent: true, direction: dir, offset: [dir==='right'?8:-8, 0], className: 'v8tip' })
      })
    })
    return () => {
      mounted = false
      if (ioRef.current) { ioRef.current.disconnect(); ioRef.current = null }
      if (roRef.current) { roRef.current.disconnect(); roRef.current = null }
      if (lMap.current) { lMap.current.remove(); lMap.current = null }
    }
  }, [])
  /* `aria-hidden` for the same reason as the pointer-events rule in
     ensureMapStyle: there is nothing here to operate, and the ride list beside
     it already names every place the map draws. */
  return <div ref={mapRef} className="v8map" aria-hidden="true"
    style={{ position: 'absolute', inset: 0, pointerEvents: 'none', userSelect: 'none' }} />
}
