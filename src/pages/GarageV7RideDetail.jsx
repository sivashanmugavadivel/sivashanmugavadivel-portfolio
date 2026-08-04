/**
 * GarageV7RideDetail — /mygarage/rides/:id (and /garage/v7/rides/:id in dev)
 * Full detail page for a single ride:
 *  - Hero with ride name, stats, mode badge
 *  - Real road-routed Leaflet map (OSRM)
 *  - Story / narrative
 *  - Highlights strip
 *  - Photo gallery (lightbox)
 *  - Ride video embed
 *  - Complete stats table
 *  - Route waypoints
 *  - Other rides sidebar
 */

import { useState, useRef, useEffect } from 'react'
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Lightbox from 'yet-another-react-lightbox'
import 'yet-another-react-lightbox/styles.css'
import { routes, ridesByMode, ridesInOrder, RIDE_MODES } from '../data/garage'
import { labelFromSeconds } from '../data/rides'

/**
 * These pages are mounted under two roots: /mygarage/rides (the real garage)
 * and /garage/v7/rides (the dev-only V7 variant). Every internal link is
 * built from whichever root the visitor actually arrived through, so a ride
 * opened from My Garage never bounces them into the V7 variant.
 */
function useGarageRoot() {
  const { pathname } = useLocation()
  // Back goes to the rides block, not the top — that's where you came from
  return pathname.startsWith('/mygarage')
    ? { garage: '/mygarage#rides', rides: '/mygarage/rides', label: 'My Garage' }
    : { garage: '/garage/v7', rides: '/garage/v7/rides', label: 'Garage' }
}

/** Badge colour per ride mode; `dream` has none and falls back to the ride's own. */
const MODE_COLOR = Object.fromEntries(RIDE_MODES.map(m => [m.key, m.color]))

// ─── Tokens ───────────────────────────────────────────────────────────────────
const BG  = '#0d0b14'
const BG2 = '#13111c'
const BG3 = '#1a1826'
const BD  = 'rgba(255,255,255,0.07)'
const BD2 = 'rgba(255,255,255,0.12)'
const OFF = '#f0eee8'
const D1  = 'rgba(240,238,232,0.7)'
const D2  = 'rgba(240,238,232,0.4)'
const D3  = 'rgba(240,238,232,0.2)'
const up  = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] },
})

// ─── Leaflet loader ───────────────────────────────────────────────────────────
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

function ensureDetailMapStyles() {
  if (document.getElementById('v7d-style')) return
  const s = document.createElement('style')
  s.id = 'v7d-style'
  s.textContent = `
    .v7dtip{background:transparent!important;border:none!important;box-shadow:none!important;padding:0!important}
    .v7dtip::before{display:none!important}
    .leaflet-container{background:#0d0b14!important}
    /* The quarter turn is on the Leaflet container, so everything inside it —
       tiles, route, pins, labels — turns with it. Each pin and each label spins
       itself back; see the pin builder for why they do it individually rather
       than through one shared class. */
    .v7d-turn{transform-origin:center center}

    /* ── Floating pins ───────────────────────────────────────────────────
       The pin hovers and its shadow shrinks as it rises, which is what sells
       the height — a bobbing pin over a fixed shadow just looks like it is
       sliding. Both run off one duration so they stay in step, and the shadow
       is offset half a cycle by running the same clock in reverse. */
    @keyframes v7dbob { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-7px)} }
    @keyframes v7dcast{ 0%,100%{transform:translateX(-50%) scale(1);opacity:.42}
                        50%    {transform:translateX(-50%) scale(.68);opacity:.18} }
    .v7dpin{animation:v7dbob 2.6s ease-in-out infinite}
    .v7dcast{animation:v7dcast 2.6s ease-in-out infinite}

  `
  document.head.appendChild(s)
}

/* ── Route pins ──────────────────────────────────────────────────────────────
   Pin geometry. PIN_H is the whole icon including the shadow it floats over;
   the teardrop itself is 6px shorter, which is the gap it hovers by. The label
   offsets and the fit padding are both derived from these, so changing a pin's
   size doesn't leave its label or the framing behind. */
const PIN_W = 30
const PIN_H = 46

/**
 * Default pin colours, in stop order — green away, red home, with the stops
 * between reading as a progression. This is what makes the direction of travel
 * legible when nothing is moving; a stop can override it with its own `color`.
 * Routes longer than this reuse the last colour rather than wrapping back to
 * green, which would put a "start" colour in the middle of a ride.
 */
const STOP_COLORS = ['#22c55e', '#f59e0b', '#ef4444', '#38bdf8', '#a78bfa', '#ec4899']

/**
 * What a place LOOKS like on the map, by the kind of place it is.
 *
 * A stop's `icon` in the ride file is a name from here, and it gets that symbol
 * on a badge instead of the lettered pin — the way a map shows a temple as a
 * temple rather than as "stop B". Synonyms are deliberate: whoever writes the
 * ride file shouldn't have to remember whether it's "petrol" or "fuel".
 *
 * To add a kind of place, add a line. Nothing else knows these names — the ride
 * files name them and this resolves them.
 */
const PLACE_ICONS = {
  // faith
  temple: '🛕', kovil: '🛕', church: '⛪', mosque: '🕌', gurudwara: '🛕',
  // living and working
  home: '🏠', house: '🏠', office: '🏢', work: '🏢', factory: '🏭',
  // eating and staying
  restaurant: '🍽️', food: '🍽️', mess: '🍽️', hotel: '🏨', lodge: '🏨',
  stay: '🏨', resort: '🏝️', cafe: '☕', coffee: '☕', tea: '🍵', bakery: '🥐',
  // buying
  shop: '🏪', store: '🏪', market: '🛒', mall: '🏬',
  showroom: '🏍️', dealer: '🏍️', service: '🔧', garage: '🔧',
  fuel: '⛽', petrol: '⛽', gas: '⛽', charging: '🔌',
  // outdoors
  beach: '🏖️', sea: '🌊', lake: '🏞️', river: '🏞️', waterfall: '💧',
  dam: '🌊', mountain: '⛰️', hills: '⛰️', ghat: '⛰️', viewpoint: '🔭',
  park: '🌳', forest: '🌲', camp: '⛺', trek: '🥾',
  // landmarks and transit
  fort: '🏰', palace: '🏛️', museum: '🏛️', monument: '🗿', bridge: '🌉',
  airport: '✈️', station: '🚉', bus: '🚌', port: '⚓',
  // useful
  hospital: '🏥', pharmacy: '💊', school: '🏫', college: '🎓',
  police: '🚓', atm: '🏧', bank: '🏦',
  // generic
  city: '🏙️', town: '🏘️', village: '🏘️', photo: '📸', start: '🚩', finish: '🏁',
}

/**
 * The symbol for a stop, or '' to fall back to the lettered pin.
 *
 * Matching ignores case, spaces, hyphens and underscores, so "Fuel Stop",
 * "fuel-stop" and "fuelstop" all land on the same entry. A name that isn't in the
 * table but isn't plain ASCII is taken to BE the symbol, so a ride file can use
 * any emoji directly for a place the table has no word for. An unrecognised
 * ASCII word — almost always a typo — gives '' and the stop keeps its lettered
 * pin, which is a visible "that didn't match" rather than a mystery glyph.
 */
function placeGlyph(name) {
  const raw = String(name ?? '').trim()
  if (!raw) return ''
  const key = raw.toLowerCase().replace(/[\s_-]+/g, '')
  if (PLACE_ICONS[key]) return PLACE_ICONS[key]
  return /^[\x20-\x7E]*$/.test(raw) ? '' : raw
}

/* ── Riding the route ────────────────────────────────────────────────────────
   How long the bike takes to cover the whole route, once. Unhurried on purpose —
   this is the one moment the page shows the journey happening, and at half this
   it read as a flick rather than a ride. Raise it to slow the bike down further;
   the line's draw follows automatically, since both come off the same clock.

   This is time spent MOVING, shared out across the legs by length. The pauses sit
   on top, so a two-leg ride actually lasts RIDE_MS + one PAUSE_MS. */
const RIDE_MS = 7200

/**
 * The beat at each intermediate stop: the bike vanishes on arrival and is back,
 * pointing the right way for the next leg, this long afterwards.
 */
const PAUSE_MS = 1000

/* ── The bike ────────────────────────────────────────────────────────────────
   The Bear itself, taken from the 360° spin frames in public/bear650/ that
   /mygarage already uses for its scroll-driven turntable — so this is the same
   bike in the same paint, not a stand-in glyph.

   Two frames out of the 37, chosen because they are the clean side-on profiles
   180° apart: 01 has the nose to the RIGHT, 19 has it to the LEFT. Which one is
   showing depends on which way the current leg travels across the screen, so the
   Bear is always pointing where it's going rather than reversing up the route.

   Mirroring one frame with scaleX(-1) would be lighter, but it would put the
   exhaust, the gear lever and the BEAR 650 badge on the wrong side — these are
   photographs of an asymmetric object, and the real other side already exists in
   the frame set. */
const bearFrame = n => `${import.meta.env.BASE_URL}bear650/wild-honey${String(n).padStart(2, '0')}.png`
const BEAR_NOSE_RIGHT = bearFrame(1)
const BEAR_NOSE_LEFT  = bearFrame(19)

/* Rendered size. The frames are 800×480-ish, so this holds their 5:3 aspect. */
const BIKE_W = 56
const BIKE_H = 34

/**
 * Rough separation between two [lat, lng] points.
 *
 * Planar, with longitude squashed by the latitude — over a few tens of km that
 * is well inside the error a Mercator tile already has, and only the RATIO
 * between segments matters here, never the absolute figure. Haversine would cost
 * a call per segment per frame to buy nothing visible.
 */
function spanOf(a, b) {
  const dLat = b[0] - a[0]
  const dLng = (b[1] - a[1]) * Math.cos(((a[0] + b[0]) / 2) * Math.PI / 180)
  return Math.hypot(dLat, dLng)
}

/**
 * The point `d` along `coords`, given `cum` — the running total of segment
 * lengths. Binary search rather than a walk, so a route with a couple of
 * thousand OSRM vertices still costs ~11 comparisons a frame instead of a
 * thousand.
 */
function pointAt(coords, cum, d) {
  const n = coords.length
  if (n === 0) return null
  if (d <= 0) return coords[0]
  if (d >= cum[n - 1]) return coords[n - 1]
  let lo = 0, hi = n - 1
  while (lo < hi - 1) {
    const mid = (lo + hi) >> 1
    if (cum[mid] <= d) lo = mid; else hi = mid
  }
  const seg = cum[lo + 1] - cum[lo]
  const t = seg > 0 ? (d - cum[lo]) / seg : 0
  return [
    coords[lo][0] + (coords[lo + 1][0] - coords[lo][0]) * t,
    coords[lo][1] + (coords[lo + 1][1] - coords[lo][1]) * t,
  ]
}

/**
 * Pulls away and eases to a stop, the way a ride actually starts and finishes.
 *
 * Quadratic, not cubic. A cubic ease is far too flat at the ends for a run this
 * long — it spent the first quarter of the time covering six percent of the
 * route, which doesn't read as pulling away, it reads as the animation being
 * stuck. This keeps a recognisable start and stop while holding a steady pace
 * through the middle.
 */
const easeInOut = t => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2)

/**
 * Is this route taller than it is wide, on the ground?
 *
 * Longitude is compared in real distance, not degrees — a degree of longitude is
 * only ~0.98 of a degree of latitude at these latitudes, and comparing the raw
 * numbers would call a square route portrait.
 */
function isPortraitRoute(ride) {
  const o = ride?.osrm
  if (!o) return false
  const midLat = ((o.fromLat + o.toLat) / 2) * Math.PI / 180
  const dLat = Math.abs(o.toLat - o.fromLat)
  const dLng = Math.abs(o.toLng - o.fromLng) * Math.cos(midLat)
  return dLat > dLng
}

// ─── Detail Map ────────────────────────────────────────────────────────────────
/**
 * The route map on a ride's page. Two things it deliberately is:
 *
 * STATIC — a drawing of the route, not a map to explore. Panning, every flavour
 *   of zoom and keyboard control are off, the line and pins ignore the pointer,
 *   and the zoom buttons and zoom badge are gone with them. A route the reader
 *   can't wander off is also a route that can be framed once, correctly, which
 *   is what makes the quarter turn below safe.
 *
 * QUARTER-TURNED, when the route runs north–south — which most of these do.
 *   `fitBounds` can only zoom until the longer side of the route fills the
 *   matching side of the pane. A 30 km tall by 4 km wide route in a landscape
 *   pane is therefore limited by the pane's *height*, and draws as a thin
 *   vertical line with dead space either side — the whole ride rendered at half
 *   the scale it had room for. Turning the container a quarter puts the route's
 *   long axis across the pane's long axis, which roughly doubles the scale and
 *   spends the width on the run from the first stop to the last.
 *
 *   The turn is on the Leaflet container, so the tiles turn too: any place name
 *   baked into the basemap reads sideways. On this dark basemap those are sparse
 *   and the trade buys 2× the detail. Our own pins and labels each spin back
 *   upright. To switch the whole behaviour off, return false from
 *   `isPortraitRoute`.
 *
 * RIDDEN ONCE, STOP BY STOP — the route draws itself with the Bear travelling at
 *   the head of the line: it rides the first leg, drops out of sight at the stop,
 *   comes back a beat later facing the way the next leg goes, and carries on to
 *   the destination, where it parks and stays. It starts when the pane first comes
 *   on screen and never runs again. See `rideAlong`.
 */
/**
 * @param {(seconds:number)=>void} [onEstimate]
 *   Handed the router's own duration for this route, in seconds, as soon as it
 *   arrives. That is where a ride's estimated time comes from when its file
 *   doesn't state one — the same response that supplies the geometry also carries
 *   how long the road network thinks it takes, so the estimate costs no extra
 *   request and always describes the exact stops currently authored.
 */
function DetailMap({ ride, onEstimate }) {
  const boxRef = useRef(null)   // the upright pane, which does the clipping
  const mapRef = useRef(null)   // the Leaflet container, which is what turns
  const lMap   = useRef(null)
  const roRef  = useRef(null)
  const fitRef = useRef(null)   // the drawn route's bounds, so a resize can re-fit
  const rafRef = useRef(null)   // the ride-along frame handle
  const ioRef  = useRef(null)   // waits for the map to be on screen before riding
  const timersRef = useRef([])  // the pauses between legs, so unmount can cancel

  // Only turn when it actually buys scale; an east–west route already uses the
  // pane's long axis and turning it would only make things worse.
  const turned = isPortraitRoute(ride)

  useEffect(() => {
    if (!ride) return
    let mounted = true

    /* Room reserved around the route so the end pins and their labels aren't
       clipped by the pane edge — the "start and end not showing" problem.
       `padding` is a container-space [x, y], and when the container is turned its
       axes are swapped relative to what the reader sees:
         x  ->  screen VERTICAL   — a floating pin stands PIN_H above its anchor
                                    and a `left` label clears the head by another
                                    14 plus its own height
         y  ->  screen HORIZONTAL — a label is centred on its pin, and the longest
                                    here runs ~175px, so half of that plus slack
       Upright the axes are the obvious way round, but the pin is still tall, so
       the vertical figure has to cover it there too.

       Both figures are PIXEL COUNTS — half a label, or the height of a pin — so
       they don't shrink with the pane, and on a phone they stop being reserve and
       start being most of the map. Turned, 135 either side of an 858px-wide pane
       leaves the route two thirds of the room; either side of a 390px one it
       leaves a third, and a 34km ride draws as a 120px scribble in the middle.
       That, not the gutters, was the squashed map on a phone.

       So cap the label figure at a fifth of what the reader actually sees across.
       Desktop is unaffected — a fifth of 858 is 172, well over both constants —
       and on a phone the labels shrink at the same breakpoint (see `.v7dlabel`
       at the foot of this file), so half the longest is ~72px and still fits in
       the 78 the cap leaves. */
    const LABEL_PAD = turned ? 135 : 90
    const CROSS_PAD = PIN_H + 34
    const fitPad = () => {
      /* boxRef is the wrapper, not the turned container, so this is the width
         on screen whichever way the map inside it is facing. */
      const across = boxRef.current?.clientWidth || 0
      const label = across ? Math.min(LABEL_PAD, Math.round(across * 0.2)) : LABEL_PAD
      return turned ? [CROSS_PAD, label] : [label, CROSS_PAD]
    }

    /* ── The ride-along ───────────────────────────────────────────────────
       The route draws itself from the first stop to the last while a bike rides
       along at the head of the line, and then it is done. ONCE — no loop. A
       journey that happened once shouldn't replay forever in the corner of the
       page, and a permanently moving thing in a static map is a distraction
       rather than information.

       One `p` drives both the line and the bike, so the bike is always exactly at
       the end of the drawn trail. Two separate animations would drift apart: the
       line is measured in SVG path pixels and the bike in degrees, and no fixed
       pair of durations keeps those in step across zoom levels.

       It waits for the pane to actually be on screen before starting. Without
       that, a reader who arrives further down the page — or who takes a moment to
       scroll — finds the route already drawn and never sees the ride at all. The
       observer disconnects the first time it fires, which is what keeps this
       once-only rather than replaying on every scroll past. */
    const rideAlong = (L, map, poly, coords, waypoints) => {
      const el = poly.getElement()
      if (!el || !el.getTotalLength || coords.length < 2) return

      const pathLen = el.getTotalLength()
      /* Hide the line by pushing the whole dash off the end of itself; revealing
         it is a matter of walking that offset back down to 0. */
      el.style.strokeDasharray = String(pathLen)
      el.style.strokeDashoffset = String(pathLen)

      // running total of segment lengths, so a distance maps to a position
      const cum = [0]
      for (let i = 1; i < coords.length; i++) {
        cum[i] = cum[i - 1] + spanOf(coords[i - 1], coords[i])
      }
      const geoLen = cum[cum.length - 1]
      if (!geoLen) return

      /* ── Where the stops fall along the line ──────────────────────────
         The ride is run one leg at a time, so it needs to know how far along the
         geometry each stop sits. OSRM snaps every requested stop onto the road
         and hands the snapped positions back in `waypoints`, which is what to
         match against — the authored coordinate can be a field away from the
         tarmac, and matching that would put the pause in the wrong place.

         `from` only ever moves forward, so a route that doubles back past an
         earlier stop can't pick a vertex behind one it has already passed. */
      const marks = [0]
      let from = 0
      const mid = Array.isArray(waypoints) ? waypoints.slice(1, -1) : []
      mid.forEach(w => {
        if (!w?.location) return
        const target = [w.location[1], w.location[0]]   // OSRM gives [lng, lat]
        let best = from, bestD = Infinity
        for (let i = from; i < coords.length; i++) {
          const d = spanOf(coords[i], target)
          if (d < bestD) { bestD = d; best = i }
        }
        marks.push(best)
        from = best
      })
      marks.push(coords.length - 1)

      /* One leg per gap between consecutive stops. Zero-length gaps are dropped —
         two stops snapping to the same vertex would otherwise buy a leg that
         animates nothing and still costs its two-second wait. */
      const legs = []
      for (let k = 1; k < marks.length; k++) {
        const d0 = cum[marks[k - 1]], d1 = cum[marks[k]]
        if (d1 > d0) legs.push([d0, d1])
      }
      if (!legs.length) legs.push([0, geoLen])

      /* Which way a leg runs ACROSS THE SCREEN, which is what decides the frame.
         Not the same as which way it runs on the ground: under the quarter turn
         screen-right is map NORTH, upright it is map EAST. Worked out per leg, so
         a ride that heads out one way and comes back the other turns the bike
         round at the stop instead of reversing up the second half. */
      const legRunsRight = ([d0, d1]) => {
        const s = pointAt(coords, cum, d0), e = pointAt(coords, cum, d1)
        if (!s || !e) return true
        return turned ? e[0] > s[0] : e[1] > s[1]
      }

      const bike = L.marker(coords[0], {
        interactive: false,
        zIndexOffset: 1000,       // over the pins, never under one
        icon: L.divIcon({
          className: '',
          /* The frame is set below rather than here, so the very first paint is
             already pointing the way leg one travels. Counter-rotated under the
             turn like everything else, about its own centre since that is where
             the marker is anchored. */
          html: `<div style="width:${BIKE_W}px;height:${BIKE_H}px${turned ? ';transform:rotate(-90deg)' : ''}">
            <img alt="" width="${BIKE_W}" height="${BIKE_H}"
                 style="width:${BIKE_W}px;height:${BIKE_H}px;object-fit:contain;display:block;filter:drop-shadow(0 4px 7px rgba(0,0,0,0.65))">
          </div>`,
          iconSize: [BIKE_W, BIKE_H], iconAnchor: [BIKE_W / 2, BIKE_H / 2],
        }),
      }).addTo(map)

      const bikeEl = bike.getElement()
      const bikeImg = bikeEl?.querySelector('img')
      /* Only the frames actually needed get fetched — a one-way ride never asks
         for the other profile at all. */
      const face = leg => {
        if (bikeImg) bikeImg.src = legRunsRight(leg) ? BEAR_NOSE_RIGHT : BEAR_NOSE_LEFT
      }
      face(legs[0])

      if (bikeEl) {
        bikeEl.style.opacity = '0'
        /* Quick, so that vanishing at a stop reads as a beat rather than a slow
           dissolve eating into the pause. */
        bikeEl.style.transition = 'opacity 0.22s ease-out'
      }

      const wait = (fn, ms) => { timersRef.current.push(setTimeout(fn, ms)) }

      /* Arrived at the far end, and the Bear STAYS there — parked at the
         destination for as long as the page is open, still facing the way the
         last leg went. It only vanishes at the intermediate stops, which is what
         makes those read as pauses rather than as the end of the ride.

         The dash is cleared so the finished line is a plain stroke again rather
         than one long dash that a re-render could reset back to hidden. */
      const finish = () => {
        el.style.strokeDasharray = ''
        el.style.strokeDashoffset = ''
        if (bikeEl) bikeEl.style.opacity = '1'
      }

      /* One leg, then a pause at the stop, then the next — the bike pulls away,
         arrives, sits for PAUSE_MS, and sets off again.
         Each leg's duration is its SHARE of the route, not a fixed slice of the
         clock, so the bike travels at one steady speed throughout. Splitting the
         time evenly instead would send it crawling down a long leg and then
         darting across a short one. */
      const runLeg = idx => {
        if (!mounted) return
        const [d0, d1] = legs[idx]
        const legLen = d1 - d0
        const dur = Math.max(700, RIDE_MS * (legLen / geoLen))
        let t0 = null
        const tick = ts => {
          if (!mounted) return
          if (t0 === null) t0 = ts
          const raw = Math.min(1, (ts - t0) / dur)
          /* Eased per leg, not across the whole route — every leg gets its own
             pull-away and its own settle, which is what makes the stop at each
             waypoint read as arriving somewhere rather than stalling. */
          const d = d0 + easeInOut(raw) * legLen
          el.style.strokeDashoffset = String(pathLen * (1 - d / geoLen))
          const at = pointAt(coords, cum, d)
          if (at) bike.setLatLng(at)
          if (raw < 1) { rafRef.current = requestAnimationFrame(tick); return }
          rafRef.current = null
          if (idx + 1 >= legs.length) { finish(); return }

          /* Arrived at a stop. The bike drops out of sight, and comes back a beat
             later already pointing the way the next leg goes — turning it round
             while it's hidden means the reader never sees it pivot on the spot.
             Then it sets off; the eased pull-away means the fade-in has landed
             before there's any real movement to see. */
          if (bikeEl) bikeEl.style.opacity = '0'
          wait(() => {
            if (!mounted) return
            face(legs[idx + 1])
            if (bikeEl) bikeEl.style.opacity = '1'
            runLeg(idx + 1)
          }, PAUSE_MS)
        }
        rafRef.current = requestAnimationFrame(tick)
      }

      const start = () => {
        if (!mounted) return
        if (bikeEl) requestAnimationFrame(() => { bikeEl.style.opacity = '1' })
        runLeg(0)
      }

      const box = boxRef.current
      if (!box || typeof IntersectionObserver === 'undefined') { start(); return }
      ioRef.current = new IntersectionObserver(entries => {
        if (!entries[0]?.isIntersecting) return
        ioRef.current?.disconnect()
        ioRef.current = null
        start()
      }, { threshold: 0.25 })
      ioRef.current.observe(box)
    }

    /* The turned container is sized with the pane's axes SWAPPED: rotating an
       h×w box a quarter turn makes it occupy w×h, so this is what fills the pane
       exactly. Centred with translate(-50%,-50%) so the rotation has no offset
       to correct for. */
    const sizeToBox = () => {
      const box = boxRef.current, el = mapRef.current
      if (!box || !el) return
      const w = box.clientWidth, h = box.clientHeight
      if (!w || !h) return
      el.style.width  = (turned ? h : w) + 'px'
      el.style.height = (turned ? w : h) + 'px'
      /* Leaflet renders at the size it last measured, so this has to come before
         any fit or the bounds are computed against stale dimensions. */
      lMap.current?.invalidateSize()
      if (lMap.current && fitRef.current) {
        lMap.current.fitBounds(fitRef.current, { padding: fitPad(), animate: false })
      }
    }

    loadLeaflet().then(L => {
      if (!mounted || !mapRef.current || lMap.current) return
      ensureDetailMapStyles()
      sizeToBox()

      const center = ride.mapCenter || [11.5, 78.8]
      const map = L.map(mapRef.current, {
        center, zoom: ride.mapZoom || 8,
        zoomControl: false, attributionControl: false,
        dragging: false, scrollWheelZoom: false, doubleClickZoom: false,
        touchZoom: false, boxZoom: false, keyboard: false, tap: false,
        inertia: false, zoomSnap: 0,
      })
      lMap.current = map

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        { subdomains: 'abcd', maxZoom: 19 }).addTo(map)

      /* Route through every stop the ride names, so a mid-ride stop is on the
         line rather than skipped by a direct first→last query. `osrm` is the
         two-point fallback for rides authored before `stops` existed. */
      const chain = ride.stops?.length > 1
        ? ride.stops
        : ride.osrm
          ? [{ lat: ride.osrm.fromLat, lng: ride.osrm.fromLng, label: ride.fromCity || 'Start' },
             { lat: ride.osrm.toLat,   lng: ride.osrm.toLng,   label: ride.toCity   || 'End' }]
          : []

      if (chain.length > 1) {
        const pts = chain.map(c => `${c.lng},${c.lat}`).join(';')
        const url = `https://router.project-osrm.org/route/v1/driving/${pts}?overview=full&geometries=geojson`
        fetch(url).then(r => r.json()).then(data => {
          if (!mounted || !data.routes?.[0]) return
          /* The estimate, straight off the same response as the geometry. */
          onEstimate?.(data.routes[0].duration)
          const coords = data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng])
          // Glow layer
          L.polyline(coords, { color: ride.color || 'var(--accent)', weight: 10, opacity: 0.15, smoothFactor: 1, interactive: false }).addTo(map)
          // Main line — revealed leg by leg as the bike rides it
          const poly = L.polyline(coords, { color: ride.color || 'var(--accent)', weight: 4, opacity: 0.95, smoothFactor: 1, lineCap: 'round', interactive: false }).addTo(map)
          fitRef.current = poly.getBounds()
          map.fitBounds(fitRef.current, { padding: fitPad(), animate: false })
          /* `data.waypoints` sits beside `routes`, not inside it, and holds each
             requested stop snapped onto the road — which is what tells the ride
             where to pause. */
          rideAlong(L, map, poly, coords, data.waypoints)
        }).catch(() => {
          // Fallback straight line through the same stops
          if (!mounted) return
          const straight = chain.map(c => [c.lat, c.lng])
          const line = L.polyline(straight,
            { color: ride.color, weight: 3, opacity: 0.85, interactive: false }).addTo(map)
          fitRef.current = line.getBounds()
          map.fitBounds(fitRef.current, { padding: fitPad(), animate: false })
          /* No router, so the stops are already exactly on the line — they stand
             in for the snapped waypoints unchanged, and the ride still pauses at
             each one. */
          rideAlong(L, map, line, straight, chain.map(c => ({ location: [c.lng, c.lat] })))
        })
      }

      /* One floating marker per stop. A stop that says what KIND of place it is
         gets that symbol; the rest get a lettered pin, so a three-stop ride still
         reads in order instead of hiding its middle. `interactive: false`
         throughout, to match the map. */
      const LETTERS = 'ABCDEFGH'
      chain.forEach((stop, i) => {
        /* A stop can name its own colour; otherwise it takes the next one along.
           Green start → red end is the point: the palette still says which way the
           ride went once the Bear has stopped moving. */
        const color = stop.color || STOP_COLORS[i] || STOP_COLORS[STOP_COLORS.length - 1]
        const chip = `background:rgba(13,11,20,0.95);border:1px solid ${color}70;color:#f0eee8;font-family:system-ui,sans-serif;font-size:11px;font-weight:700;padding:4px 10px;border-radius:4px;white-space:nowrap`
        const glyph = placeGlyph(stop.icon)

        /* ── The marker ─────────────────────────────────────────────────
           Hovers over its own shadow rather than sitting flat on the map. The
           ANCHOR is the shadow on the ground, not the marker — it floats above the
           place and the shadow marks it, which is the whole reason the shape reads
           as three-dimensional.

           Two heads, ONE geometry. A place that says what it is gets a round badge
           carrying its symbol; anything else gets the lettered teardrop. Both are
           drawn in the same PIN_W × (PIN_H - 6) box and both come to a point at
           the same place, so the shadow, the bob, the counter-rotation, the label
           offsets and the fit padding are all shared and none of them care which
           head is in use.

           Under the quarter turn the head has to be spun back or it lies on its
           side, and that spin has to pivot on the anchor (`transform-origin:
           50% 100%`) — pivoting on the centre would swing the point off the spot
           it is marking. The spin is on a wrapper of its own so the bob keyframes
           underneath keep their own transform. */
        const head = glyph
          /* Badge plus a tail that ends exactly where the teardrop's tip does
             (y=40): the tail is a 16px CSS triangle starting at y=24, and the
             30px badge sits over its base and hides it. */
          ? `<div style="position:absolute;left:50%;top:24px;transform:translateX(-50%);width:0;height:0;border-left:7px solid transparent;border-right:7px solid transparent;border-top:16px solid ${color}"></div>
             <div style="position:absolute;left:0;top:0;width:${PIN_W}px;height:${PIN_W}px;border-radius:50%;background:${color};border:2.2px solid rgba(255,255,255,0.92);box-sizing:border-box;display:flex;align-items:center;justify-content:center;font-size:15px;line-height:1">${glyph}</div>`
          : `<svg width="${PIN_W}" height="${PIN_H - 6}" viewBox="0 0 30 40" xmlns="http://www.w3.org/2000/svg">
               <path d="M15 1.5c-7.5 0-13.5 6-13.5 13.5 0 9.9 13.5 23.5 13.5 23.5S28.5 24.9 28.5 15C28.5 7.5 22.5 1.5 15 1.5z"
                     fill="${color}" stroke="rgba(255,255,255,0.92)" stroke-width="2.2"/>
               <circle cx="15" cy="15" r="6.4" fill="rgba(255,255,255,0.96)"/>
               <text x="15" y="19.3" text-anchor="middle" font-family="system-ui,-apple-system,sans-serif"
                     font-size="9.5" font-weight="900" fill="${color}">${LETTERS[i] || i + 1}</text>
             </svg>`

        const pin = `
          <div class="v7dcast" style="position:absolute;left:50%;bottom:0;width:15px;height:5px;border-radius:50%;background:${color};filter:blur(2.5px)"></div>
          <div class="v7dpin" style="position:absolute;left:0;top:0;width:${PIN_W}px;height:${PIN_H - 6}px;filter:drop-shadow(0 5px 9px rgba(0,0,0,0.55)) drop-shadow(0 0 10px ${color}70)">
            ${head}
          </div>`

        /* ── The label ──────────────────────────────────────────────────
           On a turned map this is baked into the icon rather than bound as a
           Leaflet tooltip. A tooltip is positioned and sized by Leaflet as
           though it were horizontal; spinning only its contents upright left the
           text roughly half its own width away from the pin it belonged to — the
           wider the label, the further it drifted.

           Here the placement is ours. Local (x,y) inside the turned container
           renders at screen (-y, x), so local LEFT reads as screen UP and local
           RIGHT as screen DOWN — which is how `dir` picks a side. Going up has to
           clear the whole floating pin; going down only has to clear the shadow.
           The label is centred on that point and spun back -90°, so the two
           rotations cancel and it renders upright and horizontal.

           It sits OUTSIDE the pin's rotated wrapper — nesting it inside would
           rotate it twice and put it back on its side.

           `stops[].dir` is the lever for collisions: alternate it down the route
           and neighbouring labels sit on opposite sides of the line. */
        const dx = stop.dir === 'right' ? 20 : -(PIN_H + 14)
        const label = stop.label && turned
          ? `<div style="position:absolute;left:${PIN_W / 2 + dx}px;top:${PIN_H}px;transform:translate(-50%,-50%) rotate(-90deg);z-index:4">
               <span class="v7dlabel" style="${chip};display:inline-block">${stop.label}</span>
             </div>`
          : ''

        const icon = L.divIcon({
          className: '',
          html: `<div style="position:relative;width:${PIN_W}px;height:${PIN_H}px">
            <div style="position:absolute;inset:0${turned ? ';transform:rotate(-90deg);transform-origin:50% 100%' : ''}">
              ${pin}
            </div>
            ${label}
          </div>`,
          /* anchored on the shadow — bottom centre, where the pin points */
          iconSize: [PIN_W, PIN_H], iconAnchor: [PIN_W / 2, PIN_H],
        })

        const marker = L.marker([stop.lat, stop.lng], { icon, interactive: false }).addTo(map)
        /* Upright, Leaflet's own tooltip is correct and stays — none of the label
           gymnastics above applies when there's no rotation to undo. Above the
           pin head for `left`, below the anchor for `right`. */
        if (stop.label && !turned) {
          marker.bindTooltip(
            /* the class is the handle the phone breakpoint shrinks — see the
               <style> block at the foot of this file */
            `<div class="v7dlabel" style="${chip}">${stop.label}</div>`,
            {
              permanent: true,
              direction: stop.dir === 'right' ? 'bottom' : 'top',
              offset: stop.dir === 'right' ? [0, 4] : [0, -PIN_H + 4],
              className: 'v7dtip',
            }
          )
        }
      })
    })

    /* Re-fit when the pane changes size — a window resize, or the sidebar
       collapsing under the 900px breakpoint, both change which axis binds. */
    if (boxRef.current) {
      roRef.current = new ResizeObserver(() => sizeToBox())
      roRef.current.observe(boxRef.current)
    }

    return () => {
      mounted = false
      if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null }
      /* A pause can be mid-flight when the reader navigates away; without this the
         timer fires against a torn-down map. */
      timersRef.current.forEach(clearTimeout)
      timersRef.current = []
      if (ioRef.current) { ioRef.current.disconnect(); ioRef.current = null }
      if (roRef.current) { roRef.current.disconnect(); roRef.current = null }
      if (lMap.current) { lMap.current.remove(); lMap.current = null }
      fitRef.current = null
    }
  }, [ride?.id, turned])

  return (
    <div ref={boxRef} style={{ position: 'relative', height: '100%', minHeight: 420, overflow: 'hidden' }}>
      <div
        ref={mapRef}
        className={turned ? 'v7d-turn' : undefined}
        style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: `translate(-50%,-50%)${turned ? ' rotate(90deg)' : ''}`,
        }}
      />
    </div>
  )
}

// ─── All Rides list page ───────────────────────────────────────────────────────
export function GarageV7AllRides() {
  const navigate = useNavigate()
  const root = useGarageRoot()
  // One group per tier, empty ones dropped so the page never shows a bare heading
  const groups = RIDE_MODES
    .map(m => ({ ...m, rides: ridesByMode(m.key) }))
    .filter(g => g.rides.length > 0)

  const RideCard = ({ r }) => (
    <motion.div
      onClick={() => navigate(`${root.rides}/${r.id}`)}
      whileHover={{ y: -3 }}
      style={{ background: BG2, border: `1px solid ${BD}`, borderRadius: 14, overflow: 'hidden', cursor: 'pointer', borderTop: `3px solid ${r.color}` }}
    >
      {/* Photo */}
      <div style={{ position: 'relative', aspectRatio: '16/9', background: BG3, overflow: 'hidden' }}>
        {r.photos?.[0] ? (
          <img src={r.photos[0]} alt={r.name} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.75, transition: 'transform 0.5s' }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', opacity: 0.2 }}>🏍️</div>
        )}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top,rgba(13,11,20,0.85) 0%,transparent 55%)' }} />
        <div style={{ position: 'absolute', top: 10, left: 10 }}>
          <span style={{ fontSize: '0.62rem', fontWeight: 800, padding: '3px 9px', background: MODE_COLOR[r.mode] || r.color, color: '#fff', borderRadius: 4, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{r.mode}</span>
        </div>
        <div style={{ position: 'absolute', top: 10, right: 10 }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: OFF, background: 'rgba(0,0,0,0.7)', padding: '2px 8px', borderRadius: 4 }}>{r.distance}</span>
        </div>
      </div>
      <div style={{ padding: '16px 18px 18px' }}>
        <div style={{ fontSize: '0.62rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: D3, marginBottom: 4 }}>{r.fromCity} → {r.toCity}</div>
        <h3 style={{ margin: '0 0 4px', fontSize: '1rem', fontFamily: "'Playfair Display',serif", color: OFF, fontWeight: 700, lineHeight: 1.3 }}>{r.name}</h3>
        <p style={{ margin: '0 0 12px', fontSize: '0.78rem', color: D2, lineHeight: 1.5 }}>{r.description}</p>
        <div style={{ display: 'flex', gap: 16, fontSize: '0.7rem', color: D3, flexWrap: 'wrap' }}>
          <span>⏱ {r.time}</span>
          <span>📅 {r.date}</span>
          {r.rating && <span style={{ color: '#f59e0b' }}>★ {r.rating}</span>}
        </div>
      </div>
    </motion.div>
  )

  return (
    <div style={{ background: BG, minHeight: '100vh', paddingTop: 80 }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: 'clamp(20px,4vw,48px)' }}>
        {/* Breadcrumb */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: '0.78rem', color: D3, marginBottom: 32 }}>
          <Link to={root.garage} style={{ color: D3, textDecoration: 'none', transition: 'color 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.color = OFF}
            onMouseLeave={e => e.currentTarget.style.color = D3}>{root.label}</Link>
          <span>›</span>
          <span style={{ color: OFF }}>All Rides</span>
        </div>

        <motion.div {...up()}>
          <h1 style={{ fontSize: 'clamp(2rem,5vw,3.5rem)', fontFamily: "'Playfair Display',serif", fontWeight: 700, color: OFF, margin: '0 0 6px', lineHeight: 1.05, letterSpacing: '-0.03em' }}>
            Rides &amp; Journeys
          </h1>
          <p style={{ fontSize: '0.92rem', color: D2, margin: '0 0 40px', lineHeight: 1.7 }}>
            Every road has a story. {groups.map(g => `${g.rides.length} ${g.label.toLowerCase()}`).join(' · ')}.
          </p>
        </motion.div>

        {groups.map((g, gi) => (
          <div key={g.key} style={{ marginBottom: gi === groups.length - 1 ? 0 : 48 }}>
            <div style={{ fontSize: '0.62rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: g.color, fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: g.color, display: 'inline-block' }} />
              {g.plural}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 18 }}>
              {g.rides.map((r, i) => (
                <motion.div key={r.id} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07, duration: 0.5 }}>
                  <RideCard r={r} />
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Single Ride Detail Page ───────────────────────────────────────────────────
export default function GarageV7RideDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const root = useGarageRoot()
  const ride = routes.find(r => r.id === id)
  const [lbOpen, setLbOpen] = useState(false)
  const [lbIdx,  setLbIdx]  = useState(0)

  /* The router's estimate for this route, in seconds, once the map has it. The
     setter is a stable useState function, so handing it to DetailMap doesn't
     re-run the map's effect. */
  const [estSeconds, setEstSeconds] = useState(null)

  /* A stated `estimateTime` always wins; otherwise it's whatever the road network
     said for the stops as currently authored. Blank until the map's request lands,
     and blank forever if it fails — both display sites treat that as "no value"
     rather than printing a zero. */
  const estimate = ride?.estimateTime || labelFromSeconds(estSeconds)

  // Completed → upcoming → planned, so the sidebar isn't empty while the list
  // is still mostly plans
  const otherRides = ridesInOrder().filter(r => r.id !== id).slice(0, 4)
  const modeColor  = { ...MODE_COLOR, dream: 'var(--accent)' }

  if (!ride) {
    return (
      <div style={{ background: BG, minHeight: '100vh', paddingTop: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
        <div style={{ fontSize: '3rem' }}>🏍️</div>
        <h2 style={{ color: OFF, margin: 0 }}>Ride not found</h2>
        <Link to={root.rides} style={{ color: 'var(--accent)', textDecoration: 'none' }}>← All Rides</Link>
      </div>
    )
  }

  return (
    <div style={{ background: BG, minHeight: '100vh', paddingTop: 80 }}>
      {/* ── HERO ── */}
      <div style={{ position: 'relative', minHeight: 380, overflow: 'hidden' }}>
        {/* Background photo */}
        {ride.photos?.[0] && (
          <>
            <div style={{ position: 'absolute', inset: 0 }}>
              <img src={ride.photos[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.35 }} />
            </div>
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(13,11,20,0.98) 0%, rgba(13,11,20,0.7) 60%, rgba(13,11,20,0.3) 100%)' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(13,11,20,1) 0%, transparent 50%)' }} />
          </>
        )}

        <div style={{ position: 'relative', zIndex: 2, padding: 'clamp(28px,5vw,64px)' }}>
          {/* Breadcrumb */}
          <motion.div {...up()} style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: '0.75rem', color: D3, marginBottom: 24 }}>
            <Link to={root.garage} style={{ color: D3, textDecoration: 'none', transition: 'color 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.color = OFF}
              onMouseLeave={e => e.currentTarget.style.color = D3}>{root.label}</Link>
            <span>›</span>
            <Link to={root.rides} style={{ color: D3, textDecoration: 'none', transition: 'color 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.color = OFF}
              onMouseLeave={e => e.currentTarget.style.color = D3}>All Rides</Link>
            <span>›</span>
            <span style={{ color: ride.color }}>{ride.name}</span>
          </motion.div>

          <motion.div {...up(0.05)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <span style={{ fontSize: '0.62rem', fontWeight: 800, padding: '4px 12px', background: modeColor[ride.mode], color: '#fff', borderRadius: 4, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{ride.mode}</span>
              {ride.rating && <span style={{ fontSize: '0.82rem', color: '#f59e0b', fontWeight: 700 }}>★ {ride.rating} / 5</span>}
            </div>
            <h1 style={{ fontSize: 'clamp(2rem,6vw,4.5rem)', fontFamily: "'Playfair Display',serif", fontWeight: 700, color: OFF, margin: '0 0 6px', lineHeight: 1.0, letterSpacing: '-0.03em' }}>
              {ride.name}
            </h1>
            <p style={{ fontSize: '1rem', color: D1, margin: '0 0 28px', fontStyle: 'italic', fontFamily: "'Playfair Display',serif" }}>{ride.subtitle}</p>

            {/* Key stats strip */}
            <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
              {[
                ['📍', 'Distance', ride.distance],
                ['🧭', 'Est. Time', estimate],
                ['⏱️', 'Actual Time', ride.time],
                ['📅', 'Date', ride.date],
                ...(ride.fromCity && ride.toCity ? [['🛣️', 'Route', `${ride.fromCity} → ${ride.toCity}`]] : []),
                /* Drop anything not filled in yet rather than printing a heading
                   over a blank — a planned ride has no duration or rating, and an
                   empty "Duration" reads as a broken page instead of an unridden
                   one. */
              ].filter(([, , value]) => value).map(([icon, label, value]) => (
                <div key={label}>
                  <div style={{ fontSize: '0.6rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: D3, marginBottom: 3 }}>{icon} {label}</div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: OFF }}>{value}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: 'clamp(20px,4vw,48px)', display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24, alignItems: 'start' }} className="detail-main">

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* MAP — full real road route */}
          <motion.div {...up(0.1)} className="detail-map" style={{ borderRadius: 16, overflow: 'hidden', border: `1px solid ${BD}`, height: 460 }}>
            <div className="detail-map-head" style={{ padding: '16px 20px', background: BG2, borderBottom: `1px solid ${BD}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.6rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--accent)', fontWeight: 700, marginBottom: 2 }}>Route Map</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: OFF }}>{ride.fromCity} → {ride.toCity}</div>
                {ride.via && <div style={{ fontSize: '0.68rem', color: D3, marginTop: 2 }}>via {ride.via.join(' → ')}</div>}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {ride.osrm ? (
                  <span style={{ fontSize: '0.65rem', padding: '3px 10px', background: 'rgba(34,197,94,0.12)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 999 }}>Real Road Route</span>
                ) : (
                  <span style={{ fontSize: '0.65rem', padding: '3px 10px', background: 'rgba(245,158,11,0.12)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 999 }}>Planning Stage</span>
                )}
              </div>
            </div>
            <div className="detail-map-pane" style={{ height: 'calc(100% - 68px)', position: 'relative' }}>
              <DetailMap ride={ride} onEstimate={setEstSeconds} />
            </div>
          </motion.div>

          {/* STORY */}
          <motion.div {...up(0.12)} style={{ background: BG2, border: `1px solid ${BD}`, borderRadius: 16, padding: '28px 28px' }}>
            <div style={{ fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--accent)', fontWeight: 700, marginBottom: 12 }}>The Story</div>
            <p style={{ fontSize: '0.97rem', color: D1, lineHeight: 1.9, margin: 0, fontWeight: 300 }}>{ride.story}</p>
          </motion.div>

          {/* HIGHLIGHTS */}
          {ride.highlights && (
            <motion.div {...up(0.14)}>
              <div style={{ fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--accent)', fontWeight: 700, marginBottom: 14 }}>Ride Highlights</div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {ride.highlights.map((h, i) => (
                  <div key={i} style={{ padding: '10px 18px', background: BG2, border: `1px solid ${BD}`, borderRadius: 999, fontSize: '0.82rem', color: OFF, fontWeight: 500, borderLeft: `3px solid ${ride.color}` }}>
                    {h}
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* VIDEO */}
          {ride.videoId && (
            <motion.div {...up(0.16)} style={{ borderRadius: 16, overflow: 'hidden', border: `1px solid ${BD}` }}>
              <div style={{ padding: '14px 20px', background: BG2, borderBottom: `1px solid ${BD}` }}>
                <div style={{ fontSize: '0.6rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--accent)', fontWeight: 700, marginBottom: 2 }}>Ride Video</div>
                <div style={{ fontSize: '0.85rem', color: OFF, fontWeight: 600 }}>{ride.name} — Full Vlog</div>
              </div>
              <div style={{ aspectRatio: '16/9', background: BG3 }}>
                <iframe
                  width="100%" height="100%"
                  src={`https://www.youtube.com/embed/${ride.videoId}`}
                  title={ride.name}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  style={{ display: 'block' }}
                />
              </div>
            </motion.div>
          )}

          {/* PHOTOS GALLERY */}
          {ride.photos?.length > 0 && (
            <motion.div {...up(0.18)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div style={{ fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--accent)', fontWeight: 700 }}>Photos</div>
                <span style={{ fontSize: '0.68rem', color: D3 }}>{ride.photos.length} photos · click to expand</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 10 }}>
                {ride.photos.map((src, i) => (
                  <motion.div key={i} whileHover={{ scale: 1.02 }} onClick={() => { setLbIdx(i); setLbOpen(true) }}
                    style={{ aspectRatio: '4/3', borderRadius: 10, overflow: 'hidden', cursor: 'pointer', background: BG3, border: `1px solid ${BD}` }}>
                    <img src={src} alt={`${ride.name} ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85, transition: 'opacity 0.25s, transform 0.5s' }}
                      onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'scale(1.05)' }}
                      onMouseLeave={e => { e.currentTarget.style.opacity = '0.85'; e.currentTarget.style.transform = 'scale(1)' }}
                    />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* STATS TABLE */}
          {ride.stats && (
            <motion.div {...up(0.2)} style={{ background: BG2, border: `1px solid ${BD}`, borderRadius: 16, overflow: 'hidden' }}>
              <div style={{ padding: '16px 22px', borderBottom: `1px solid ${BD}`, fontSize: '0.6rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--accent)', fontWeight: 700 }}>Ride Stats</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 1, background: BD }}>
                {Object.entries(ride.stats).map(([k, v]) => (
                  <div key={k} style={{ padding: '16px 20px', background: BG2 }}>
                    <div style={{ fontSize: '0.6rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: D3, marginBottom: 5 }}>{k.replace(/([A-Z])/g, ' $1').trim()}</div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 800, color: OFF }}>{v}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* ── SIDEBAR ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'sticky', top: 96 }}>

          {/* Quick info card */}
          <div style={{ background: BG2, border: `1px solid ${BD}`, borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ height: 4, background: ride.color }} />
            <div style={{ padding: '18px 18px' }}>
              <div style={{ fontSize: '0.6rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: D3, marginBottom: 12, fontWeight: 700 }}>Ride Info</div>
              {[
                ['Distance', ride.distance],
                /* The sidebar is a fixed table, so a missing value dashes rather
                   than dropping the row — same as Start/End below. */
                ['Est. Time', estimate || '—'],
                ['Actual Time', ride.time || '—'],
                ['Date', ride.date],
                ['Start', ride.fromCity || '—'],
                ['End',   ride.toCity   || '—'],
                ['Mode',  ride.mode],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: `1px solid ${BD}` }}>
                  <span style={{ fontSize: '0.68rem', color: D3, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{k}</span>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: OFF, textTransform: 'capitalize' }}>{v}</span>
                </div>
              ))}
              {ride.via && (
                <div style={{ marginTop: 14 }}>
                  <div style={{ fontSize: '0.6rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: D3, marginBottom: 8 }}>Via</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {ride.via.map((w, i) => (
                      <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <div style={{ width: 5, height: 5, borderRadius: '50%', background: ride.color, flexShrink: 0 }} />
                        <span style={{ fontSize: '0.78rem', color: D2 }}>{w}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Other rides */}
          <div style={{ background: BG2, border: `1px solid ${BD}`, borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: `1px solid ${BD}`, fontSize: '0.6rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: D3, fontWeight: 700 }}>More Rides</div>
            {otherRides.map((r, i) => (
              <div key={r.id} onClick={() => navigate(`${root.rides}/${r.id}`)}
                style={{ display: 'flex', gap: 10, padding: '12px 18px', borderBottom: `1px solid ${BD}`, cursor: 'pointer', transition: 'background 0.18s', alignItems: 'flex-start' }}
                onMouseEnter={e => e.currentTarget.style.background = BG3}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: r.color, flexShrink: 0, marginTop: 5, boxShadow: `0 0 6px ${r.color}` }} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: OFF, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</div>
                  <div style={{ fontSize: '0.65rem', color: D3, marginTop: 2 }}>{r.distance} · {r.date}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Back button */}
          <button onClick={() => navigate(root.rides)}
            style={{ padding: '11px', background: 'transparent', border: `1px solid ${BD}`, color: D2, fontFamily: 'var(--sans)', fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer', borderRadius: 10, transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = BD2; e.currentTarget.style.color = OFF }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = BD;  e.currentTarget.style.color = D2 }}>
            ← All Rides
          </button>
        </div>
      </div>

      <Lightbox open={lbOpen} close={() => setLbOpen(false)}
        slides={(ride.photos || []).map(src => ({ src }))} index={lbIdx} />

      <style>{`
        @media(max-width:900px){
          .detail-main{grid-template-columns:1fr!important}
          .detail-main>*:last-child{position:static!important}
        }

        /* ── phones ──────────────────────────────────────────────────────
           A 34 km route on a 350 px map puts three permanent labels on top
           of each other, and the page's own gutters were taking 40 px of the
           390 px there is. So on a phone the map breaks out of those gutters
           to run edge to edge, gets noticeably taller, and its labels shrink
           to something that fits beside a pin rather than across the map. */
        @media(max-width:600px){
          .detail-map{
            /* cancel the container padding on both sides */
            margin-left:calc(-1 * clamp(20px,4vw,48px));
            margin-right:calc(-1 * clamp(20px,4vw,48px));
            border-radius:0!important;
            border-left:0!important;
            border-right:0!important;
            /* taller, so a short route is not squeezed into a letterbox */
            height:min(68vh,540px)!important;
            /* The header's two halves stack at this width, so it runs about
               91px rather than the 68px the pane's height subtracts — enough
               of the map to be clipped off the bottom. Measure it instead:
               header takes what it needs, pane takes the rest. */
            display:flex;
            flex-direction:column;
          }
          .detail-map-head{flex:none}
          .detail-map-pane{flex:1;height:auto!important;min-height:0}
          /* the pin labels: smaller and tighter, so three of them on a short
             route stop stacking on top of one another */
          .v7dlabel{
            font-size:9.5px!important;
            padding:2px 6px!important;
            max-width:42vw;
            overflow:hidden;
            text-overflow:ellipsis;
            white-space:nowrap;
          }
        }
      `}</style>
    </div>
  )
}
