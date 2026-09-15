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

import { useState, useRef, useEffect, useMemo } from 'react'
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Lightbox from 'yet-another-react-lightbox'
import 'yet-another-react-lightbox/styles.css'
import { routes, ridesInOrder, RIDE_MODES } from '../data/garage'
import { labelFromSeconds, placeLabel, routeLabel } from '../data/rides'
import OrganizerMark from '../components/garage/OrganizerMark'
import {
  groupByScene, SCENE_ART, SCENE_DEFS, SCENE_CSS,
} from '../components/garage/complimentScenes'
import { addBasemap, BASEMAP_CREDIT } from '../utils/basemap'

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

/**
 * The rows the Ride Stats table should actually carry.
 *
 * `stats` holds an organised ride's logistics until the odometer figures
 * replace them, and one of those — the entry fee — already has a better home:
 * the compliments ticket prints it as what you paid for the list beside it,
 * which is the only context that makes it mean anything. Tabulating it a
 * second time as a lone "REGISTRATION" tile says it twice and says it worse.
 *
 * Only dropped when that ticket is on the page. A ride with a fee and no
 * compliments keeps it here, because then this is the only place it can go.
 */
const statRows = ride => Object.entries(ride.stats ?? {})
  .filter(([k]) => !(k === 'registration' && ride.compliments?.length))

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
  monastery: '☸️', stupa: '☸️', gompa: '☸️',
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

      /* No control: on a portrait route this container is turned 90° and a
         Leaflet control inside it turns with it. The credit is rendered on the
         wrapper below instead, outside the turn. */
      addBasemap(L, map, { attribution: false })

      /* Route through every stop the ride names, so a mid-ride stop is on the
         line rather than skipped by a direct first→last query. `osrm` is the
         two-point fallback for rides authored before `stops` existed. */
      const chain = ride.stops?.length > 1
        ? ride.stops
        : ride.osrm
          ? [{ lat: ride.osrm.fromLat, lng: ride.osrm.fromLng, label: ride.fromCity || 'Start' },
             { lat: ride.osrm.toLat,   lng: ride.osrm.toLng,   label: ride.endCity  || 'End' }]
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
      {/* The tile provider's credit, required by its terms. Out here on the
          wrapper rather than inside the map, because the container above is
          turned 90° for portrait routes and would stand this on its side. */}
      <div style={{
        position: 'absolute', right: 0, bottom: 0, zIndex: 500,
        padding: '1px 6px', background: 'rgba(13,11,20,0.7)',
        borderRadius: '4px 0 0 0', fontSize: 9, lineHeight: 1.5,
        color: 'rgba(240,238,232,0.45)', pointerEvents: 'none',
      }}>{BASEMAP_CREDIT}</div>
    </div>
  )
}

/* ═══ All Rides — "Horizon" ═══════════════════════════════════════════════════
   One ride per full screen, seen from the saddle.

   No ride carries a photo — every `photos` array is empty and will be for a
   while — so the view is BUILT rather than shown: a road running to a vanishing
   point, ridgelines and stars behind it, and a sky graded out of the ride's own
   colour. The whole page re-tints as each chapter takes the screen.

   The road is not decoration. Each stop stands at its true share of the ride's
   length, so the Coimbatore run crowds its stops into the near distance and the
   Chennai haul shows two, far apart. You can read the shape of a ride off the
   road itself.

   Every stop near enough to carry words gets a NAME BOARD — the place, and how
   far into the ride it is — with a header band on the two that matter, where
   the ride starts and where it ends. Stops too far up the road for a legible
   name drop to a bare verge marker rather than printing type nobody can read;
   the shape survives, the mush does not.

   One Ride 2026 has a single stop and no course, so its road simply runs into
   the haze with nothing marked on it — every road, which is the point.

   ── how this sits inside the site ──
   · Scroll snapping goes on the DOCUMENT, not on a nested scroller. The site's
     ScrollProgress, BackToTop and back-navigation restore all read window
     scroll, and a nested scroll container would silently break all three.
     The class is added on mount and removed on the way out so no other route
     inherits it, and it is `proximity` rather than `mandatory` because the
     site Footer follows this page and mandatory would fight anyone scrolling
     into it.
   · The chapter rail sits on the LEFT. The right edge is already taken by the
     feedback tab (fixed, top 42%) and the social / back-to-top buttons.
   · There is no fixed header of its own — the site navbar already owns that
     strip, so the chapter counter lives bottom-left instead.
════════════════════════════════════════════════════════════════════════════ */

// ─── Scene geometry ───────────────────────────────────────────────────────────
/* The scene is drawn in a fixed 1200 × 800 space and sliced to fill whatever
   the viewport is. HZ is the horizon; the vanishing point is dead centre. */
const VW = 1200, VH = 800, HZ = 430, VPX = VW / 2
const R_KM = 6371

/* ── the rider on the road ────────────────────────────────────────────────
   public/riding_back.png is the shot from behind, but it ships with a solid
   black background and no alpha, so dropped straight onto the scene it is a
   rectangle sitting on the tarmac. `riding_back_cut.png` beside it is the same
   photograph with the background flood-filled out from the edges — flood-
   filled rather than colour-keyed, because the tyres, jacket and shadow are
   black too and a global key punches holes through the bike.

   THE SPRITE'S ASPECT IS NOT ASSUMED. It is drawn into a SQUARE box that is
   `RIDER_H` on a side, with `xMidYMax meet`: the image fits inside, centred on
   the road and sitting ON it, whatever shape the file happens to be. An
   earlier version hard-coded 1:2 and a re-cut 2:3 file then fitted to width
   instead of height — which both shrank the bike by a quarter and floated it
   a few units above the tarmac. A box that cannot be wrong is worth the one
   extra attribute. */
const RIDER_SRC = 'riding_back_cut.png'
const RIDER_H = 430                       // height in scene units at the near end

/* THE BIKE STAYS WITH YOU, but it does pull ahead. It used to run all the way
   to the vanishing point across a chapter, so by the end of a ride it was a
   speck and then gone — you were watching it leave rather than following it.
   Now it draws away over the ride and stops while it is still plainly a
   motorcycle.
   NEAR and FAR are depths down the road, and FAR is the one to turn. At 0.675
   the bike ends a ride 59% smaller than it started, still large enough to read
   as a motorcycle rather than a dot. Raise it to push the bike further away. */
const RIDER_NEAR = 0.20
const RIDER_FAR = 0.675

/**
 * Where something sits on the road at depth `d`, and how big it is there.
 * d = 0 is at your own front wheel, d = 1 is the vanishing point.
 *
 * The scale is tied to the ROAD'S OWN half-width rather than to a chosen
 * curve, so the rider shrinks at exactly the rate the road narrows. Any other
 * falloff and it slides across the tarmac instead of travelling down it — the
 * one thing that gives the illusion away.
 */
const roadAt = d => ({
  y: VH - (VH - HZ - 8) * d,
  s: (620 * (1 - d) + 7 * d) / 620,
})

const riderAt = d => {
  const { y, s } = roadAt(d)
  return `translate(${VPX} ${y.toFixed(1)}) scale(${s.toFixed(4)})`
}

/** Great-circle distance between two stops, in km. */
function crowKm(a, b) {
  const rad = d => (d * Math.PI) / 180
  const dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng)
  const s = Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * R_KM * Math.asin(Math.sqrt(s))
}

/** Initial bearing a → b, degrees clockwise from true north. */
function bearingDeg(a, b) {
  const rad = d => (d * Math.PI) / 180
  const y = Math.sin(rad(b.lng - a.lng)) * Math.cos(rad(b.lat))
  const x = Math.cos(rad(a.lat)) * Math.sin(rad(b.lat)) -
    Math.sin(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.cos(rad(b.lng - a.lng))
  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360
}

const POINTS = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
  'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']
const compassOf = deg => POINTS[Math.round(deg / 22.5) % 16]

/** Running distance at each stop — what spaces the posts along the road. */
function marksOf(stops) {
  let run = 0
  return stops.map((s, i) => {
    if (i) run += crowKm(stops[i - 1], s)
    return { stop: s, at: run }
  })
}

/* ── the signboard palette ────────────────────────────────────────────────
   A Tamil Nadu Highways place-name board: green ground, a white keyline set in
   from the edge, the department line in yellow across the top, and two posts
   banded black and white.

   THESE COLOURS DO NOT FOLLOW THE RIDE'S ACCENT, which every other element in
   the scene does. Real signage does not restyle itself for the sunset, and a
   board that changed colour per chapter would read as interface rather than as
   something standing by the road. The accent appears on it once, as the
   roundel the department emblem occupies, so the chapter still claims it. */
const SIGN_BOARD = '#0c6b36'
const SIGN_EDGE = '#084d27'
const SIGN_RULE = '#f4f3ee'
const SIGN_TEXT = '#ffffff'
const SIGN_KICK = '#f6c714'
const SIGN_POST_D = '#16161c'
const SIGN_POST_L = '#eceae2'

/* ── where a board sits, at a given moment ────────────────────────────────
   The boards STREAM. Each one's depth is its own place along the ride offset
   by how far the chapter has scrolled, so signs rise out of the haze, sweep
   past and are gone — and over the length of a chapter you see every stop,
   two or three at a time.

   That is what buys the room. Laid out all at once they cannot fit: the
   usable depth band is about 167 scene units and a board face is 45 of them,
   so four is the ceiling however they are arranged. Dhondenling has eleven
   stops. Alternating verges would double it and still not be enough, and the
   left verge is not free anyway — the chapter's own copy is 1180px wide,
   which is past the centre line of the road.

   NEAR stops short of the viewer and FAR stops short of the vanishing point,
   for the same reasons the static version did: below 0.30 there is no verge
   left to stand on, and at the vanishing point there is no ground under the
   board to plant it in. */
const SIGN_NEAR = 0.30
const SIGN_FAR = 0.86
/* Two stops five kilometres apart on a four-hundred kilometre ride occupy the
   same patch of road; drawing both just prints one over the other.
   0.08 rather than something smaller because it has to beat the BOARD's own
   height: at this gap two signs are about 48 scene units apart down the road
   and a board face is 45 tall, so consecutive signs clear each other instead
   of overlapping by half a name. Measured, not guessed. */
const SIGN_MIN_GAP = 0.08

/**
 * How much of the ride is on screen at once.
 *
 * Scaled to the stop count so every ride shows a similar NUMBER of boards
 * rather than a similar length of road — otherwise a two-stop ride spends the
 * whole chapter with an empty verge while an eleven-stop one is still a wall.
 * Floored, so a long ride's window never closes to a slot.
 */
function signWindow(items) {
  const n = items.length
  if (n < 2) return 1.15
  /* AT LEAST AS WIDE AS THE BIGGEST GAP between two boards, or the road empties
     out. On the first-service ride the stops sit at 0, 13%, 39% and then
     nothing until the finish — a 61% stretch with no sign in it — so a window
     sized only by stop count left a quarter of that chapter with a bare verge,
     which reads as the boards having broken rather than as an empty road. */
  let maxGap = 0
  for (let i = 1; i < n; i++) maxGap = Math.max(maxGap, items[i].share - items[i - 1].share)
  return Math.max(0.34, 1.15 / (n - 1), maxGap * 1.06)
}

/**
 * Which stops get a board, as shares of the ride.
 *
 * Shared, because the chapter needs the COUNT to decide how tall it has to be
 * before the scene can decide what to draw — a ride with seven boards needs
 * more road to ride past than one with two.
 */
function signShares(stops) {
  const marks = marksOf(stops)
  const chain = marks.length ? marks[marks.length - 1].at : 0
  if (stops.length < 2 || chain <= 0) return []
  const out = []
  let lastShare = -1
  marks.forEach(({ stop, at }, k) => {
    const first = k === 0
    const last = k === marks.length - 1
    const share = at / chain
    /* Too close to the stop before it — or to the FINISH, which is always kept
       and so would be crowded by anything arriving just ahead of it. */
    if (!first && !last
      && (share - lastShare < SIGN_MIN_GAP || 1 - share < SIGN_MIN_GAP)) return
    lastShare = share
    out.push({ stop, k, at, share, first, last })
  })
  return out
}

/**
 * How many viewport-heights a ride chapter is worth.
 *
 * The chapter is pinned while you scroll through it, and THAT scroll is the
 * ride: 1 for the screen it occupies, plus the road you travel. Without the
 * extra height a chapter has no scroll of its own — it snaps into place, sits
 * at one fixed position however long you look at it, and the whole journey
 * has to happen in the instant between one chapter and the next. Which is
 * exactly what it was doing: boards flashed past and at rest none showed at
 * all.
 */
const chapterSpan = boards => 1 + Math.min(2.4, Math.max(1, boards * 0.3))

/**
 * How far the ride actually advances across a chapter's scroll.
 *
 * NOT all the way to 1. At 1 the finish board has swept right down to your own
 * front wheel, which meant the chapter kept demanding scroll long after the
 * ride had visibly ended — you had arrived, and were still winding the board
 * down past the bottom of the screen before the next ride would start.
 *
 * Stopping half a window short leaves the FINISH board sitting mid-road, at
 * the size and place where you read it, exactly as the chapter hands over.
 */
const journeyEnd = win => 1 - 0.5 * win

/**
 * And where it BEGINS — behind the start line, by half a window.
 *
 * Starting at 0 put the START board at the near end of the road the instant
 * you landed: bottom corner of the frame, already half swept past, as if you
 * had missed it. Backing up half a window sets it down mid-road instead — the
 * same place, and the same size, the FINISH board occupies when the chapter
 * hands over. You arrive at one board and leave on another, both centred.
 */
const journeyStart = win => -0.5 * win

/**
 * How far the centre line travels across one chapter, in path units.
 *
 * POSITIVE, so the marks run DOWN the road toward you — the same direction the
 * boards travel. The old CSS loop ran it negative, sending the marks away
 * toward the horizon, which is what a road does when you are reversing.
 *
 * The stripe path is 366 units long and its dash cycle is 104, so 900 is about
 * two and a half lengths of road, or nine marks, per chapter. Tuned to read at
 * roughly the rate the boards close on you; raise it and the road runs faster
 * than the signs, which is the one thing that looks wrong.
 */
const STRIPE_TRAVEL = 900

/* ── the sky turns over while you ride ────────────────────────────────────
   Everything else answered to scroll and the sky did not, which left the one
   element that should sell "hours in the saddle" sitting perfectly still.

   Chapters ALTERNATE: the first runs day into night, the next night into
   dawn, and so on down the page. A run of seven sunsets would read as one
   long evening, and rides genuinely do start at both ends of the day — the
   Dhondenling muster is 5:30 AM. */
const dawnRide = index => index % 2 === 1

/**
 * The lit part of the moon, as a path centred on its own origin.
 *
 * Two arcs: the outer limb, which is always a half-circle of radius r, and the
 * TERMINATOR, which is an ellipse whose semi-minor axis is how far from full
 * the moon is. At f = 1 that ellipse is a half-circle bulging the other way
 * and the two close into a full disc; at f = 0.5 it collapses to a straight
 * edge; below that it bows back the same way as the limb and leaves a
 * crescent. One expression covers every phase, which is why it is drawn
 * rather than masked.
 */
function moonPath(r, f) {
  const x = r * (1 - 2 * f)
  /* SWEEP: the limb is drawn down the right side, so the terminator has to
     come back up the LEFT to enclose anything — sweep 1, continuing the same
     way round. Only below half does it bow back through the lit side, and
     that is the one case that flips to 0. Getting this the wrong way round
     traces the limb back over itself: a full moon encloses no area at all and
     renders as an empty disc, which is exactly what it did. */
  return `M0 ${-r}A${r} ${r} 0 0 1 0 ${r}A${Math.abs(x).toFixed(2)} ${r} 0 0 ${x > 0 ? 0 : 1} 0 ${-r}Z`
}

/* A different moon over every ride, cycled rather than random so a chapter
   always has the same one. Full over the first, a thin crescent over the
   next — the sky is a way of telling the rides apart at a glance. */
const MOON_PHASES = [1, 0.3, 0.66, 0.45, 0.85, 0.18, 0.55]

/* Where the sun and moon sit, from broad day (0) to full night (1). They
   trade places across the horizon: one sinks behind the ridges as the other
   climbs out from behind them. */
const sunY = night => HZ - 195 + 265 * night
const moonY = night => HZ + 70 - 275 * night

/**
 * Where a stop's board is when the chapter is `p` of the way past.
 *
 * `u` is how far ahead of you the stop still is, as a fraction of the ride.
 * Behind you (negative) or beyond the window and it is not on screen at all.
 * Returns null in that case, which is the caller's cue to hide it.
 */
function signPlace(share, p, win, w, first) {
  const u = share - p
  if (u < -0.03 || u > win) return null
  const t = SIGN_NEAR + (SIGN_FAR - SIGN_NEAR) * (Math.max(0, u) / win)
  const y = VH - (VH - HZ - 8) * t
  const halfW = 620 * (1 - t) + 7 * t
  /* 0.52, not 0.56: at the near end the widest boards were being pushed left
     by the frame clamp until their inner edge crossed the road. Four units of
     scale buys the clearance back. */
  const sc = Math.min(0.52, Math.max(1 - t * 0.82, 0.34))
  const half = (w * sc) / 2
  const x = Math.min(VPX + halfW + half + 8, VW - 8 - half)
  /* fades up out of the haze and back down as it sweeps past the camera —
     without both ends a board pops into and out of existence */
  let op = Math.max(0, Math.min(1, (win - u) / 0.07, (u + 0.03) / 0.05))

  /* YOU LAND ON THE START BOARD AND NOTHING ELSE.
     A stop close behind the start — Kangayam is 7 km into an 80 km ride — is
     already inside the window the moment the chapter arrives, so it stood
     there beside the START board before a single pixel of scroll. The window
     cannot simply be narrowed to exclude it: it has to stay wide enough to
     span the ride's biggest gap or the road empties out later on.
     So boards that would otherwise be present at landing are held back and
     brought up over the first few percent of the ride instead. Only the START
     board is exempt, because it is the one you are meant to arrive on. */
  const j0 = journeyStart(win)
  if (!first && share - win < j0) {
    op *= Math.max(0, Math.min(1, (p - j0) / 0.06))
  }
  return { op, tr: `translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${sc.toFixed(3)})` }
}

/**
 * The pair of banded posts a place-name board stands on.
 *
 * Two, not one: a single stem reads as a shop sign, and the paired posts are
 * most of what makes the silhouette recognisable from a distance — which is
 * the only thing left of these once perspective has taken the type away.
 *
 * `cx` is the board's centre, `w` its width, `h` how far the posts drop to the
 * road. Bands are counted rather than sized so a short post and a tall one
 * carry the same number of stripes instead of one ending mid-band.
 */
function signPosts(cx, w, h) {
  const PW = Math.max(6, w * 0.046)
  const BANDS = 6
  const bh = h / BANDS
  return [-1, 1].map(sideSign => {
    const px = cx + sideSign * w * 0.27 - PW / 2
    return (
      <g key={sideSign}>
        {/* THE WHOLE POST FIRST, OUTLINED, then the pale bands over it. Drawn
            as alternating dark and light rects instead, the dark ones vanish
            into a near-black road and leave the light ones floating in the air
            like a column of loose tiles — which is exactly how it looked. A
            rim light is also what a real post has at dusk. */}
        <rect x={px} y={-h} width={PW} height={h} fill={SIGN_POST_D}
          stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
        {Array.from({ length: Math.ceil(BANDS / 2) }, (_, b) => (
          <rect key={b} x={px} y={-h + (b * 2 + 1) * bh} width={PW} height={bh}
            fill={SIGN_POST_L} />
        ))}
      </g>
    )
  })
}

/**
 * Trim a place name to what a roadside board can carry.
 *
 * Backs off to a WORD BOUNDARY rather than cutting at the character count:
 * "Royal Enfield Senthur Mot…" reads as a broken string, where "Royal Enfield
 * Senthur…" reads as a name that has been shortened. Only when the boundary is
 * so early that it would throw most of the name away does it cut hard.
 */
const clip = (s, n) => {
  const t = String(s || '').trim()
  if (t.length <= n) return t
  const cut = t.slice(0, n)
  const sp = cut.lastIndexOf(' ')
  return `${(sp > n * 0.55 ? cut.slice(0, sp) : cut).trimEnd()}…`
}

/**
 * A place name across at most two lines, balanced.
 *
 * Real boards are TALL — two lines of big type in a roughly 2:1 rectangle.
 * Setting every name on one line instead produced a 4.5:1 strip with small
 * type, which is the single thing that stopped these reading as signage.
 *
 * The break is chosen to leave the LONGEST line shortest, not at the middle
 * word: "Royal Enfield, Dharapuram" wants to break after "Enfield," (14/10),
 * where a naive midpoint gives 5/20 and a board still half the screen wide.
 *
 * `titleLines` above looks similar and is not interchangeable — it breaks on
 * word COUNT for ride titles and leaves any three-word name on one line, which
 * is every long stop name in the folder.
 */
function signLines(name, per) {
  const t = String(name || '').trim()
  if (t.length <= per) return [t]
  const words = t.split(/\s+/)
  if (words.length === 1) return [clip(t, per)]
  let best = 1
  let bestMax = Infinity
  for (let i = 1; i < words.length; i++) {
    const m = Math.max(words.slice(0, i).join(' ').length, words.slice(i).join(' ').length)
    if (m < bestMax) { bestMax = m; best = i }
  }
  return [
    clip(words.slice(0, best).join(' '), per + 6),
    clip(words.slice(best).join(' '), per + 6),
  ]
}

/** Deterministic pseudo-random from a string, so a chapter never reshuffles. */
function seeder(seed) {
  let h = 0
  for (const ch of String(seed)) h = (h * 31 + ch.charCodeAt(0)) % 99991
  return () => { h = (h * 1103515245 + 12345) % 2147483648; return (h >>> 9) / 4194304 }
}

/** Mix a hex toward black (t < 0) or white (t > 0). */
function shade(hex, t) {
  const n = parseInt(String(hex).slice(1), 16)
  if (Number.isNaN(n)) return hex
  const f = c => Math.max(0, Math.min(255, Math.round(t < 0 ? c * (1 + t) : c + (255 - c) * t)))
  return '#' + ((1 << 24) + (f((n >> 16) & 255) << 16) + (f((n >> 8) & 255) << 8) + f(n & 255))
    .toString(16).slice(1)
}

/* Everything the reel needs. Injected rather than written as style objects
   because it is nearly all pseudo-elements, keyframes, scroll-snap and media
   queries — none of which inline styles can express. Prefixed `hz-` so it
   cannot reach anything else on the site. */
/* The distress that makes a border read as rubber rather than as a box, shared
   by every stamp on this page — the COMPLETED mark on a chapter and the
   INCLUDED mark on a compliments ticket.
   The trailing pair is a THRESHOLD: alpha = -20 x noise + 13.5, so ink holds
   until the noise passes about 0.625. Tuned by rendering it. Defined up here
   because both stylesheets below need it, and a second copy is a second set of
   numbers to keep in step. */
const STAMP_MASK =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='s'%3E" +
  "%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E" +
  "%3CfeColorMatrix type='matrix' values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 -20 13.5'/%3E" +
  "%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23s)'/%3E%3C/svg%3E\")"

const EASE = 'cubic-bezier(.19,1,.22,1)'
const HORIZON_CSS = `
html.hz-snap { scroll-snap-type: y proximity; }

/* the bike and the boards are moved by a scroll handler on every tick —
   promote them once rather than letting the compositor rediscover it each
   frame. The signs also get a short opacity ease so a board that is only
   fading (rather than travelling) does not step. */
.hz-rider { will-change: transform, opacity; }
.hz-sign { will-change: transform, opacity; transition: opacity .18s linear; }
.hz-night, .hz-glow, .hz-stars, .hz-dark { will-change: opacity; }
.hz-sun, .hz-moon { will-change: transform, opacity; }

/* Stars blink on their own clock — this one IS ambient rather than travel, so
   it is the one thing in the scene that does not answer to scroll. Each star
   carries its own period and delay, or forty-six of them pulse as one sheet. */
.hz-star { animation: hz-twinkle var(--d, 3s) ease-in-out var(--dl, 0s) infinite; }
@keyframes hz-twinkle { 0%, 100% { opacity: .9 } 50% { opacity: .18 } }
/* the bright ones flare as well as fade — a star that only changes opacity
   reads as a dimmer, where a real one seems to catch and let go */
.hz-spark { transform-box: fill-box; transform-origin: 50% 50%;
  animation: hz-flare var(--d, 3s) ease-in-out var(--dl, 0s) infinite; }
@keyframes hz-flare {
  0%, 100% { opacity: .95; transform: scale(1) }
  50% { opacity: .3; transform: scale(.55) }
}

/* Defensive, not corrective: a page of full-bleed scenes should never scroll
   sideways, and the figures row carries values as long as "Hindusthan College
   of Arts and Sciences, Coimbatore". The min-width/overflow-wrap rules on
   .hz-figs let those shrink and break instead of setting a floor on the row. */
.hz-wrap { position: relative; overflow-x: clip; }
.hz-wash { position: fixed; inset: 0; z-index: 0; pointer-events: none; opacity: .16;
  transition: background 1.1s ${EASE}; }

.hz-ch { position: relative; z-index: 1; min-height: 100vh; min-height: 100svh;
  display: flex; flex-direction: column; justify-content: flex-end;
  overflow: hidden; isolation: isolate;
  scroll-snap-align: start; scroll-snap-stop: always; }

/* ── a ride chapter is a PINNED SCENE WITH SCROLL BEHIND IT ────────────────
   The section is --span screens tall and everything in it is stuck to the top
   for the whole of that, so scrolling the chapter does not move the scene off
   — it rides the road through it. The cover and the closing chapter keep the
   plain full-screen rule above.

   overflow:clip, NOT overflow:hidden — hidden makes the section a scroll
   container, and a sticky child inside one has nothing left to stick to, so
   the whole effect silently does nothing. Clip crops the same way without
   creating that container. */
.hz-ride { display: block; overflow: clip;
  min-height: calc(100vh * var(--span, 1)); min-height: calc(100svh * var(--span, 1)); }
.hz-ride .hz-stick { position: sticky; top: 0; overflow: hidden;
  height: 100vh; height: 100svh;
  display: flex; flex-direction: column; justify-content: flex-end; }
.hz-view { position: absolute; inset: 0; z-index: 0; }
.hz-view svg { width: 100%; height: 100%; display: block; }
.hz-haze { position: absolute; inset: 0; z-index: 1; pointer-events: none;
  background: linear-gradient(to bottom, transparent 34%, rgba(13,11,20,.16) 48%,
    rgba(13,11,20,.72) 78%, ${BG} 100%); }
.hz-body { position: relative; z-index: 3; width: 100%; max-width: 1180px; min-width: 0;
  padding: 0 clamp(18px,5vw,72px) calc(clamp(34px,6vw,78px) + env(safe-area-inset-bottom)); }

/* ── reveals ───────────────────────────────────────────────────────────────
   Every revealed element is VISIBLE by default and is hidden only under
   .hz-js — the class this page adds to itself once its script has run. So the
   failure mode of anything going wrong with the observer, the animation or the
   script is a page that is merely static, never a page that is blank. The
   first cut had these hidden in the base rule and revealed by an animation,
   and the title genuinely never appeared. */
/* Top-right, in the empty sky. Bottom-right is where the site's social button
   and its tooltip live, and the numeral sat behind them. */
.hz-no { position: absolute; right: clamp(18px,5vw,72px); top: 15%;
  z-index: 2; pointer-events: none; user-select: none;
  font-family: 'Playfair Display', serif; font-weight: 700;
  font-size: clamp(4rem,16vw,11rem); line-height: .78; color: transparent;
  -webkit-text-stroke: 1.4px rgba(240,238,232,.16);
  transition: opacity 1s ${EASE} .15s, transform 1s ${EASE} .15s; }

.hz-tier { display: inline-flex; align-items: center; gap: 9px; font-size: .6rem;
  font-weight: 700; letter-spacing: .24em; text-transform: uppercase; margin-bottom: 16px;
  transition: opacity .8s ${EASE} .1s, transform .8s ${EASE} .1s; }
.hz-tier i { width: 7px; height: 7px; border-radius: 50%; background: currentColor;
  box-shadow: 0 0 12px currentColor; }

/* ── the status, as the mark it is ─────────────────────────────────────────
   A ride's status is not a field to read, it is something that happened TO the
   ride — so a chapter is stamped rather than labelled: RIDDEN, SCHEDULED,
   PLANNED, CALLED OFF. Both the word and the colour come from the tier in
   garage.config.json, so adding a status stamps itself with no change here.

   It keeps .hz-tier alongside, so the reveal rules below still find it and ONE
   place still decides when the kicker arrives.

   IT LANDS ON THE HEADING, not above it. A stamp is applied TO a document; one
   sitting politely in the space above it is a label again. It sits at the
   heading's START — where the eye lands and where the title's first line
   reliably has text under it. The ragged right end does not: .hz-head hugs the
   longest line, which is often not the first one, and anchoring there left the
   mark floating in the gap beside a short opening line.

   Out of flow, which costs nothing here: the copy block is anchored to the
   BOTTOM of the scene, so everything's position is set by what sits below it,
   and the stamp sits above the title. The title does not move.

   THE LANDING IS THE TRANSITION, not a keyframe. The reveal already flips
   .is-live, so the stamp only has to declare a different hidden state — dropped
   in oversized and over-rotated — and an eased-back curve turns that into a
   thump. A keyframe here would be a second mechanism fighting for the same
   transform. It grows from its left edge rather than its centre so the
   oversized first frame expands INTO the heading instead of out past the
   gutter, where the scene would clip it.

   No ink-shock ring, deliberately: the distress mask is clipped to the border
   box, so a ring drawn outside the stamp would simply be erased. */
/* the box the mark is positioned against — it exists only so the stamp is
   anchored to the HEADING and travels with it, rather than to the copy column */
.hz-head { position: relative; }
.hz-stamp { --tilt: -3.5deg;
  position: absolute; top: -22px; left: -12px; z-index: 2;
  display: block; text-align: center;
  letter-spacing: 0; padding: 9px 16px 7px;
  border: 2.5px solid currentColor; border-radius: 4px;
  transform: rotate(var(--tilt)); transform-origin: left center;
  transition: opacity .45s ${EASE} .06s, transform .6s cubic-bezier(.2,1.55,.5,1) .06s;
  -webkit-mask-image: ${STAMP_MASK}; mask-image: ${STAMP_MASK}; }
/* The inner keyline every official stamp has. Inset 4, not the ticket stamp's
   2: this mark is half again as big, and at that size a keyline any tighter
   merges into the border and just reads as a thicker frame. */
.hz-stamp::before { content: ''; position: absolute; inset: 4px;
  border: 1px solid currentColor; border-radius: 2px; opacity: .55; }
.hz-stamp b { display: block; font-family: 'Bebas Neue', sans-serif; font-weight: 400;
  font-size: clamp(1.1rem,3vw,1.38rem); line-height: 1; letter-spacing: .1em;
  text-indent: .1em; }
/* The date, the way a date stamp carries one — under a hairline, so it reads as
   part of the mark rather than as a caption sitting beneath it. */
.hz-stamp u { display: block; text-decoration: none; margin-top: 4px; padding-top: 4px;
  border-top: 1px solid currentColor; font-size: .52rem; letter-spacing: .16em;
  opacity: .88; font-variant-numeric: tabular-nums; }

.hz-title, .hz-h1 { font-family: 'Playfair Display', serif; font-weight: 700; color: ${OFF};
  letter-spacing: -.03em; line-height: 1.02; margin: 0 0 14px; max-width: 16ch; }
.hz-title { font-size: clamp(1.9rem,6.4vw,4.6rem); }
.hz-h1 { font-size: clamp(2.4rem,9vw,6rem); margin-bottom: 22px; }
.hz-title .w, .hz-h1 .w { display: block; overflow: hidden; }
.hz-title .w i, .hz-h1 .w i { display: block; font-style: normal;
  transition: transform 1.05s ${EASE}; }
/* The cover carries is-live from the first render and simply IS there — no
   entrance. It sits above the fold, so there is nothing to reveal it to, and
   an animated reveal here is the one place a stalled animation could leave the
   page's own title invisible. The chapters below still animate on scroll. */

/* WHERE the ride went, under WHAT it was for.
   The title above is the ride's purpose — the marathon, the first service — so
   the road it took needs a line of its own rather than being folded back into
   the heading. Deliberately quiet: small, spaced caps in the same key as
   .hz-tier, so it reads as a label on the title and not as a second one. */
.hz-where { display: block; max-width: 48ch; margin: -4px 0 18px;
  font-size: clamp(.68rem,1.1vw,.78rem); font-weight: 600; letter-spacing: .14em;
  line-height: 1.75; text-transform: uppercase; color: ${D2};
  transition: opacity .9s ${EASE} .38s, transform .9s ${EASE} .38s; }

.hz-lede { font-size: clamp(.9rem,1.5vw,1.05rem); line-height: 1.8; max-width: 52ch;
  color: ${D1}; margin: 0 0 24px;
  transition: opacity .9s ${EASE} .45s, transform .9s ${EASE} .45s; }

.hz-org { display: inline-flex; align-items: center; gap: 12px; flex-wrap: wrap;
  margin: 0 0 22px; padding: 8px 16px 8px 12px; border-radius: 999px;
  border: 1px solid ${BD2}; background: rgba(255,255,255,.03);
  font-size: .78rem; font-weight: 600; color: ${OFF};
  transition: opacity .9s ${EASE} .52s, transform .9s ${EASE} .52s; }
.hz-org .k { font-size: .55rem; letter-spacing: .22em; text-transform: uppercase;
  color: ${D3}; font-weight: 500; }

.hz-figs { display: flex; flex-wrap: wrap; gap: 0; border-top: 1px solid ${BD2};
  transition: opacity .9s ${EASE} .58s, transform .9s ${EASE} .58s; }

/* the hidden state: only ever applied when the script is running */
.hz-js .hz-ch:not(.is-live) .hz-no,
.hz-js .hz-ch:not(.is-live) .hz-tier,
.hz-js .hz-ch:not(.is-live) .hz-where,
.hz-js .hz-ch:not(.is-live) .hz-lede,
.hz-js .hz-ch:not(.is-live) .hz-org,
.hz-js .hz-ch:not(.is-live) .hz-figs,
.hz-js .hz-ch:not(.is-live) .hz-row { opacity: 0; transform: translateY(18px); }
.hz-js .hz-ch:not(.is-live) .hz-no { transform: translateY(30px); }
.hz-js .hz-ch:not(.is-live) .hz-title .w i { transform: translateY(104%); }
/* The stamp's hidden state has to come AFTER the block above, which also
   matches it through .hz-tier — same specificity, so the later rule wins. It
   waits oversized and hard over-rotated, and lands on its resting tilt. */
.hz-js .hz-ch:not(.is-live) .hz-stamp { opacity: 0; transform: rotate(-22deg) scale(1.9); }
.hz-figs > div { padding: 14px 24px 0 0; margin-right: 24px; border-right: 1px solid ${BD};
  min-width: 0; flex: 0 1 auto; }
.hz-figs > div:last-child { border-right: 0; margin-right: 0; padding-right: 0; }
.hz-figs .k { display: block; font-size: .55rem; letter-spacing: .22em; text-transform: uppercase;
  color: ${D3}; margin-bottom: 6px; }
.hz-figs .v { display: block; font-family: 'Playfair Display', serif;
  font-size: clamp(1.2rem,2.6vw,1.9rem); color: ${OFF}; line-height: 1;
  font-variant-numeric: tabular-nums; }
.hz-figs .v.sm { font-size: clamp(.92rem,1.7vw,1.2rem); line-height: 1.25;
  overflow-wrap: anywhere; }

.hz-row { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin-top: 24px;
  transition: opacity .9s ${EASE} .7s, transform .9s ${EASE} .7s; }
.hz-go { display: inline-flex; align-items: center; gap: 10px; padding: 14px 26px;
  border-radius: 999px; background: ${OFF}; color: ${BG}; text-decoration: none;
  font-size: .74rem; font-weight: 700; letter-spacing: .1em; text-transform: uppercase;
  transition: .32s ${EASE}; }
.hz-go:hover { background: var(--c); color: ${OFF}; transform: translateY(-3px);
  box-shadow: 0 16px 34px -12px var(--c); }
.hz-tags { display: flex; gap: 6px; flex-wrap: wrap; }
.hz-tags u { text-decoration: none; font-size: .58rem; letter-spacing: .12em;
  text-transform: uppercase; padding: 6px 11px; border-radius: 999px;
  border: 1px solid ${BD2}; color: ${D1}; }

/* closing — the cover has a stylesheet of its own, see COVER_CSS */
.hz-end { justify-content: center; }
.hz-end .hz-title { max-width: 12ch; }

/* the road's centre line, running away from the rider */
/* The centre line is driven by SCROLL, not by a clock — see STRIPE_TRAVEL.
   Running it on its own loop meant the road kept flowing while the page stood
   still, which reads as the scene playing a video rather than as you riding
   it, and it disagreed with the rider and the boards the moment those started
   answering to scroll. */
.hz-stripe { will-change: stroke-dashoffset; }

/* chapter index — left edge; the right edge belongs to the feedback tab */
.hz-rail { position: fixed; left: clamp(10px,2vw,22px); top: 50%; transform: translateY(-50%);
  z-index: 40; display: flex; flex-direction: column; gap: 13px; align-items: flex-start; }
.hz-rail button { display: flex; align-items: center; gap: 9px; background: none; border: 0;
  cursor: pointer; padding: 2px 0; color: ${D3}; font-family: inherit; font-size: .6rem;
  letter-spacing: .1em; transition: .35s ${EASE}; }
.hz-rail button i { width: 22px; height: 2px; background: currentColor; flex-shrink: 0;
  transition: .35s ${EASE}; }
.hz-rail button span { opacity: 0; max-width: 0; overflow: hidden; white-space: nowrap;
  transition: .35s ${EASE}; text-align: left; }
.hz-rail button:hover { color: ${OFF}; }
/* The name shows on hover only. Expanding it for the ACTIVE chapter reads well
   until the rail and the chapter's own kicker land on the same line — which
   they do on any chapter whose copy sits high — and then two labels overlap. */
.hz-rail button:hover span { opacity: 1; max-width: 190px; }
.hz-rail button.on { color: ${OFF}; }
.hz-rail button.on i { width: 42px; background: var(--rc); }

/* Top-left, in the band under the navbar. The bottom-left corner looks empty
   but is not: the site's back-to-top button is fixed there, and the chapter's
   own call-to-action reaches down into it. This strip is clear on every
   chapter, and it is the only position indicator on phones, where the rail
   is hidden. */
.hz-count { position: fixed; left: 28px; top: 88px;
  z-index: 40; font-size: .66rem; letter-spacing: .18em; color: ${D2};
  font-variant-numeric: tabular-nums; pointer-events: none; }
.hz-count b { color: ${OFF}; font-weight: 700; }
.hz-count { transition: opacity .55s ${EASE}; }
.hz-count.is-off { opacity: 0; }

@media (max-width: 860px) {
  .hz-rail { display: none; }
  .hz-figs > div { padding-right: 14px; margin-right: 14px; }
  .hz-no { font-size: 5rem; }
  .hz-title, .hz-h1 { max-width: none; }
  /* The gutter is down to ~20px here, so the overhang has nowhere to go — pull
     the mark flush with the title, and sit it higher, because a stamp that
     covers half of a 1.9rem line covers most of the word under it. */
  .hz-stamp { top: -26px; left: 0; }
  /* clear the back-to-top and social buttons, which sit in the bottom corners */
  .hz-body { padding-bottom: calc(96px + env(safe-area-inset-bottom)); }
}
@media (prefers-reduced-motion: reduce) {
  html.hz-snap { scroll-snap-type: none; }
  .hz-ch { scroll-snap-align: none; }
  .hz-stripe { animation: none; }
  /* drop the whole hidden state, so nothing is waiting on a reveal to arrive */
  .hz-js .hz-ch:not(.is-live) .hz-no,
  .hz-js .hz-ch:not(.is-live) .hz-tier,
  .hz-js .hz-ch:not(.is-live) .hz-where,
  .hz-js .hz-ch:not(.is-live) .hz-lede,
  .hz-js .hz-ch:not(.is-live) .hz-org,
  .hz-js .hz-ch:not(.is-live) .hz-figs,
  .hz-js .hz-ch:not(.is-live) .hz-row,
  .hz-js .hz-ch:not(.is-live) .hz-title .w i {
    opacity: 1; transform: none; }
  /* the stamp keeps its tilt — transform:none above would stand it upright, and
     a mark that arrives square is not a mark, it is a box */
  .hz-js .hz-ch:not(.is-live) .hz-stamp { opacity: 1; transform: rotate(var(--tilt)); }
  .hz-wash { transition: none; }
}
`

/* ══════════════════════════════════════════════════════════════════════════
   THE COVER — a title card, and the one still frame on the page.

   Every chapter below it is a drawn scene that answers to scroll. This one
   deliberately does not: the reel has not started, so it holds a photograph
   and says three things instead — what this is, how much of it there is, and
   which ride is actually next.

   THE PHOTOGRAPH CARRIES THE COLOUR, so the cover takes a gold accent of its
   own rather than borrowing chapter one's. Everything tinted here — the rule
   under the eyebrow, the tally icons, the button — reads from --c, so the
   whole card re-keys from that one value.

   Legibility is two crossed gradients, not a flat wash: one running across
   the frame so the headline sits on darkness while the rider stays lit, one
   running down it so the navbar has a top to sit on and the bottom edge
   dissolves into the page's own ground instead of ending on a seam.

   The right column is the only part that is DATA. The tally counts the ride
   files by tier, and the card resolves to whichever upcoming ride carries the
   soonest date — both derived, so neither can disagree with the reel below.
   ══════════════════════════════════════════════════════════════════════════ */
const COVER_CSS = `
.hz-cover { display: block; padding-top: 0; overflow: clip; }

.hz-shot { position: absolute; inset: 0; z-index: 0; }
/* The frame is 3:2 and the viewport rarely is, so the crop is held slightly
   above centre — that keeps the rider and the horizon in frame on a short
   laptop window, where centring would hand back sky and cut off the road. */
.hz-shot img { width: 100%; height: 100%; display: block;
  object-fit: cover; object-position: 50% 42%; }
.hz-shot::after { content: ''; position: absolute; inset: 0;
  background:
    linear-gradient(100deg, rgba(8,6,12,.94) 0%, rgba(8,6,12,.74) 26%,
      rgba(8,6,12,.16) 50%, rgba(8,6,12,.30) 76%, rgba(8,6,12,.62) 100%),
    linear-gradient(to bottom, rgba(8,6,12,.72) 0%, transparent 20%,
      transparent 54%, ${BG} 99%); }

.hz-cv { position: relative; z-index: 2; min-height: 100vh; min-height: 100svh;
  max-width: 1720px; margin: 0 auto; display: grid; align-items: center;
  grid-template-columns: minmax(0, 1.12fr) minmax(300px, 380px);
  column-gap: clamp(28px, 5vw, 80px);
  padding: clamp(104px,14vh,152px) clamp(18px,5vw,72px) clamp(104px,14vh,148px); }

/* ── left: the promise ─────────────────────────────────────────────────── */
.hz-eye { display: flex; align-items: center; gap: 18px; margin-bottom: 22px;
  font-size: .66rem; font-weight: 600; letter-spacing: .34em; text-transform: uppercase;
  color: ${D1}; }
.hz-eye i { height: 1px; width: clamp(34px,5vw,78px); flex-shrink: 0;
  background: linear-gradient(90deg, var(--c), transparent); }

/* Playfair's -.03em is drawn for mixed case; set in caps it closes the
   counters up, so the cover's headline opens the tracking back out. */
.hz-cover .hz-h1 { text-transform: uppercase; letter-spacing: .004em; line-height: .95;
  font-size: clamp(2.5rem,7.2vw,5.5rem); max-width: 13ch; margin-bottom: 0;
  text-shadow: 0 12px 44px rgba(0,0,0,.55); }

.hz-sub { position: relative; margin: clamp(20px,3vh,30px) 0 clamp(26px,4vh,42px);
  padding-left: 22px; max-width: 34ch;
  font-family: 'Playfair Display', serif; font-size: clamp(1rem,1.9vw,1.4rem);
  line-height: 1.5; color: ${D1}; }
.hz-sub::before { content: ''; position: absolute; left: 0; top: .16em; bottom: .16em;
  width: 2px; border-radius: 2px;
  background: linear-gradient(var(--c), transparent); }

/* ── left: how much of it there is ─────────────────────────────────────── */
.hz-tally { display: flex; flex-wrap: wrap; width: fit-content; max-width: 100%;
  border: 1px solid ${BD2}; border-radius: 15px; overflow: hidden;
  background: rgba(11,9,17,.46); backdrop-filter: blur(16px) saturate(1.15);
  -webkit-backdrop-filter: blur(16px) saturate(1.15); }
.hz-tally > div { display: flex; align-items: center; gap: 14px; min-width: 0;
  padding: 15px clamp(16px,2.3vw,30px); border-right: 1px solid ${BD}; }
.hz-tally > div:last-child { border-right: 0; }
.hz-tally svg { width: 21px; height: 21px; flex-shrink: 0; color: var(--c); }
.hz-tally b { display: block; font-family: 'Playfair Display', serif; font-weight: 700;
  font-size: clamp(1.25rem,2.3vw,1.7rem); line-height: 1; color: ${OFF};
  font-variant-numeric: tabular-nums; }
.hz-tally span { display: block; margin-top: 6px; font-size: .54rem; font-weight: 600;
  letter-spacing: .2em; text-transform: uppercase; color: ${D2}; white-space: nowrap; }

/* ── right: the handwriting, then the next ride ────────────────────────── */
.hz-rt { display: flex; flex-direction: column; align-items: stretch;
  gap: clamp(18px,3vh,32px); min-width: 0; }
/* The handwriting lands on the brightest part of the frame — the sun sits just
   behind it — so cream on cream needs a ground of its own. Two shadows: a tight
   one that darkens the sky right against the strokes, and a wide one that holds
   the whole phrase off the hillside. */
.hz-script { align-self: center; text-align: center; transform: rotate(-4.5deg);
  font-family: 'Kaushan Script', cursive; line-height: 1.24; color: ${OFF};
  font-size: clamp(1.1rem,2.3vw,1.95rem);
  text-shadow: 0 1px 3px rgba(6,4,10,.95), 0 10px 34px rgba(6,4,10,.8); }
.hz-script i { display: block; height: 1px; margin-top: 9px; font-style: normal;
  background: linear-gradient(90deg, transparent, var(--c), transparent); }

.hz-next { position: relative; border-radius: 20px; overflow: hidden; padding: 15px;
  border: 1px solid ${BD2};
  background: linear-gradient(168deg, rgba(23,19,32,.88), rgba(9,7,14,.94));
  backdrop-filter: blur(20px) saturate(1.25);
  -webkit-backdrop-filter: blur(20px) saturate(1.25);
  box-shadow: 0 36px 72px -32px rgba(0,0,0,.92), inset 0 1px 0 rgba(255,255,255,.07); }
.hz-next .nk { font-size: .56rem; font-weight: 700; letter-spacing: .28em;
  text-transform: uppercase; color: ${D2}; }
.hz-next .nh { display: flex; align-items: flex-start; gap: 11px; margin: 9px 0 12px; }
.hz-next .nh svg { width: 21px; height: 21px; flex-shrink: 0; color: var(--c);
  margin-top: 3px; }
.hz-next .nh b { display: block; font-family: 'Playfair Display', serif; font-weight: 700;
  font-size: clamp(1.4rem,2.6vw,1.85rem); line-height: 1.05; color: ${OFF};
  text-transform: uppercase; letter-spacing: .012em; overflow-wrap: anywhere; }
.hz-next .nh span { display: block; margin-top: 4px; font-size: .74rem; color: ${D1}; }

/* The window onto the ride. A photograph when the file has one; the ride's own
   route, drawn from its stops, when it does not — which is every ride today.
   A grey placeholder box would say the card is unfinished; the line says where
   it goes, and swaps itself out the moment a photo lands in the file. */
.hz-next .nw { position: relative; display: block; border-radius: 12px; overflow: hidden;
  aspect-ratio: 16 / 9; border: 1px solid ${BD};
  background: radial-gradient(90% 120% at 50% 6%, rgba(255,255,255,.05), transparent 70%),
    linear-gradient(160deg, #15121f, #0b0912); }
.hz-next .nw img { width: 100%; height: 100%; object-fit: cover; display: block; }
.hz-next .nw svg { position: absolute; inset: 0; width: 100%; height: 100%; }

.hz-nfig { display: flex; margin: 11px 0 12px; }
.hz-nfig > div { flex: 1 1 0; min-width: 0; text-align: center; padding: 0 6px;
  border-right: 1px solid ${BD}; }
.hz-nfig > div:last-child { border-right: 0; }
.hz-nfig svg { width: 18px; height: 18px; color: ${D1}; margin-bottom: 9px; }
/* A third of a 380px card is about 100px of room, and "20 Sep 2026" and
   "Royal Enfield" both want more than that. Rather than shrink the type until
   the longest organiser name anyone might run fits on one line, the value box
   is a fixed two lines tall and centres whatever it gets — so one-line and
   two-line figures sit on the same centre and the row stays level. */
.hz-nfig b { display: flex; align-items: center; justify-content: center;
  min-height: 2.2em; font-family: 'Playfair Display', serif; font-weight: 700;
  font-size: clamp(.8rem,1.45vw,1rem); line-height: 1.25; color: ${OFF};
  overflow-wrap: anywhere; }
.hz-nfig span { display: block; margin-top: 6px; font-size: .5rem; font-weight: 600;
  letter-spacing: .16em; text-transform: uppercase; color: ${D2}; }

.hz-ngo { display: flex; align-items: center; justify-content: center; gap: 10px;
  padding: 12px; border-radius: 11px; text-decoration: none;
  background: var(--c);
  background: linear-gradient(100deg, var(--c), color-mix(in srgb, var(--c) 72%, #fff));
  color: #1a1206; font-size: .72rem; font-weight: 800; letter-spacing: .14em;
  text-transform: uppercase; transition: transform .3s ${EASE}, box-shadow .3s ${EASE}; }
.hz-ngo:hover { transform: translateY(-2px); box-shadow: 0 16px 34px -14px var(--c); }

/* ── the two corners ───────────────────────────────────────────────────── */
/* THE CORNERS ARE NOT EMPTY. The site parks fixed furniture in both of them —
   back-to-top bottom-left, share button and its "tap to connect" label
   bottom-right — and the label's width changes with its text, so clearing it
   sideways is a guess. Both corners are lifted above that whole band instead,
   which also keeps them level with each other the way the design has them. */
.hz-begin { position: absolute; z-index: 3; left: clamp(18px,5vw,72px);
  bottom: clamp(92px,13vh,124px); display: flex; align-items: center; gap: 15px;
  font-size: .6rem; font-weight: 600; letter-spacing: .26em; text-transform: uppercase;
  color: ${D2}; }
.hz-begin i { position: relative; width: 19px; height: 30px; flex-shrink: 0;
  border: 1.5px solid ${D2}; border-radius: 10px; }
.hz-begin i::after { content: ''; position: absolute; left: 50%; top: 6px;
  width: 2px; height: 6px; border-radius: 2px; background: currentColor;
  animation: hz-wheel 2s ${EASE} infinite; }
@keyframes hz-wheel {
  0% { opacity: 0; transform: translate(-50%,-3px) }
  35% { opacity: 1 }
  100% { opacity: 0; transform: translate(-50%,9px) }
}
.hz-begin u { text-decoration: none; width: clamp(20px,3vw,38px); height: 1px;
  background: ${D3}; flex-shrink: 0; }

/* Low and pulled in from the edge: it has to clear the card above it AND the
   share button in the corner, and the corner is the fixed one of the two. */
.hz-motto { position: absolute; z-index: 3; right: clamp(80px,10vw,150px);
  bottom: clamp(40px,6vh,70px); display: flex; align-items: center; gap: 16px;
  font-size: .58rem; font-weight: 600; letter-spacing: .3em; text-transform: uppercase;
  color: ${D2}; text-align: right; line-height: 2; }
.hz-motto u { text-decoration: none; width: clamp(24px,4vw,58px); height: 1px;
  background: ${D3}; flex-shrink: 0; }

/* ── entrance ──────────────────────────────────────────────────────────── */
/* Keyframes, not the scroll reveal the chapters use: the cover is ABOVE the
   fold, so there is no scroll to trigger it and nothing to observe. Each piece
   starts hidden only for as long as its own delay, so the worst case is a page
   that arrives already assembled. */
.hz-cv > div > *, .hz-rt > *, .hz-begin, .hz-motto {
  animation: hz-cv-in .7s ${EASE} both; }
.hz-cv .hz-h1 { animation-delay: .06s }
.hz-cv .hz-sub { animation-delay: .12s }
.hz-cv .hz-tally { animation-delay: .18s }
.hz-rt .hz-script { animation-delay: .2s }
.hz-rt .hz-next { animation-delay: .26s }
.hz-begin, .hz-motto { animation-delay: .34s }
@keyframes hz-cv-in { from { opacity: 0; transform: translateY(24px) } }

/* ── narrow ────────────────────────────────────────────────────────────── */
/* One column below 1040: the card is 300px at its narrowest and the headline
   needs about 13 characters of Playfair beside it, which stops fitting well
   before the phone breakpoint the rest of the page uses. */
@media (max-width: 1040px) {
  /* Stacked, the cover is taller than the screen however it is set, so the
     padding stops defending a one-screen fit it cannot win and just gives the
     column a sensible rhythm instead. The bottom only has to clear the navbar
     and the fixed corner buttons. */
  /* min-height goes with the columns. Stacked, the corners below are in the
     flow rather than pinned, so a 100vh floor here would hold a full screen
     open above them and push the scroll cue off the bottom. The section keeps
     its own 100vh, so a short cover still fills the screen. */
  .hz-cv { grid-template-columns: minmax(0,1fr); row-gap: clamp(22px,3.4vh,40px);
    min-height: 0; align-items: start; align-content: center;
    padding-top: clamp(92px,12vh,124px); padding-bottom: clamp(24px,3vh,36px); }
  .hz-cover .hz-h1 { max-width: 15ch; }
  .hz-rt { align-items: flex-start; }
  .hz-script { align-self: flex-start; text-align: left; }
  .hz-next { width: min(100%, 400px); }
  /* The corners join the flow — pinned, they would land on top of the card.
     RELATIVE, NOT STATIC. Static drops them out of the positioned layer, and
     z-index only applies to positioned boxes — so the whole corner paints
     behind the photograph, except the mouse glyph, which carries a
     position:relative of its own and was the only thing left visible. Their
     offsets have to be cleared with it, or relative just shifts them by the
     values the pinned layout used. The gutter comes back as padding, since
     that is what the offsets were providing. */
  .hz-begin, .hz-motto { position: relative; z-index: 3;
    left: auto; right: auto; bottom: auto;
    margin-top: 10px; padding: 0 clamp(18px,5vw,72px); }
  .hz-motto { justify-content: flex-start; text-align: left; }
}
@media (max-width: 560px) {
  .hz-cover .hz-h1 { font-size: clamp(2.1rem,8.6vw,3rem); }
  .hz-sub { margin: 14px 0 0; font-size: 1rem; }
  .hz-tally > div { padding: 12px 14px; gap: 10px; }
  .hz-tally svg { width: 18px; height: 18px; }
  .hz-script { font-size: 1.15rem; }
  .hz-next { padding: 13px; }
  .hz-nfig b { font-size: .86rem; }
  .hz-motto u { display: none; }
}
@media (prefers-reduced-motion: reduce) {
  .hz-cv > div > *, .hz-rt > *, .hz-begin, .hz-motto { animation: none; }
  .hz-begin i::after { animation: none; opacity: .8; }
}
`

/* ══════════════════════════════════════════════════════════════════════════
   What the ride comes with, drawn as the ticket it is.

   Every other block on this page is a card: flat ground, hairline border,
   small uppercase kicker. This one deliberately is not, because the content
   isn't the page's own reporting — it is a promise the organiser printed, and
   an organised ride's perks ARE a ticket: you paid the registration, this is
   what it admits you to.

   The shapes are real, not suggested:
     PERFORATION  a dashed seam plus half-circle bites masked out of the card's
                  edges in the PAGE's colour, so the holes show what is behind
                  them rather than being painted dots.
     WINDOWS      each row's punched hole is a window onto that perk's own
                  animated scene, chosen from its text — see complimentScenes.
                  Emoji were fine at 26px; shaded illustration needs 62px, and
                  that one measurement is what every other size here follows.
     STAMP        an INCLUDED mark, always on. Its mask is a threshold:
                  alpha = -20 x noise + 13.5, tuned by rendering it rather than
                  by eye. More negative is a cleaner stamp, less is rougher.
     ROSETTE      the stub's "admit one", as the badge it means. The teeth are
                  generated (see ROSETTE_PATH) because a hand-placed zigzag
                  never has even points, and at 90px that reads as a wobble.

   THE STUB IS MIXED FROM THE RIDE'S OWN COLOUR, so it arrives warm on a yellow
   ride and deep red on One Ride without any of them being authored. Only about
   a fifth accent: the rosette and the vertical title sit on top of it at full
   strength, and the tint is there to say which ride this is, not to shout.

   Every color-mix has a plain declaration before it. A browser without support
   drops the later one and keeps a sensible grey rather than breaking.
   ══════════════════════════════════════════════════════════════════════════ */

/**
 * The rosette's sawtooth edge.
 *
 * Generated rather than written out: a hand-placed zigzag never has even teeth,
 * and the tooth count stays a number to tune instead of 44 coordinates to redo.
 * Starts at −90° so a tooth sits at top dead centre, which is what makes the
 * badge look upright rather than rotated by half a tooth.
 */
const ROSETTE_PATH = ((cx, cy, outer, inner, teeth) => {
  const pts = []
  for (let i = 0; i < teeth * 2; i++) {
    const a = (i * Math.PI) / teeth - Math.PI / 2
    const rad = i % 2 === 0 ? outer : inner
    pts.push(`${(cx + Math.cos(a) * rad).toFixed(2)} ${(cy + Math.sin(a) * rad).toFixed(2)}`)
  }
  return `M${pts.join('L')}Z`
})(50, 46, 36, 29, 22)

const TICKET_CSS = `
.v7c-defs{position:absolute;width:0;height:0;overflow:hidden}
.v7c-ticket{position:relative;display:grid;grid-template-columns:132px 1fr;
  filter:drop-shadow(0 24px 44px rgba(0,0,0,.7))}

.v7c-stub{border-radius:14px 0 0 14px;padding:22px 12px;display:flex;
  flex-direction:column;align-items:center;justify-content:space-between;gap:16px;
  overflow:hidden;position:relative;
  background:linear-gradient(155deg,#211d2e,#131120);
  background:linear-gradient(155deg,
    color-mix(in srgb, var(--acc) 20%, #0f0d18),
    color-mix(in srgb, var(--acc) 7%, #08070e))}
.v7c-stub::before{content:'';position:absolute;inset:0;
  background:repeating-linear-gradient(135deg,transparent 0 9px,rgba(255,255,255,.02) 9px 18px);
  background:repeating-linear-gradient(135deg,transparent 0 9px,
    color-mix(in srgb, var(--acc) 12%, transparent) 9px 18px)}
/* light falling off towards the tear, so the halves read as one object */
.v7c-stub::after{content:'';position:absolute;inset:0;pointer-events:none;
  background:linear-gradient(270deg,rgba(0,0,0,.34),transparent 38%)}

/* A TINT of the accent, not the accent. Measured across the ride palette: raw
   accent on this stub is 6.9:1 for yellow but 3.4:1 for red, because a dark
   accent and a stub mixed from it share a hue. Lifting the text 30% toward
   white clears 5:1 for every accent; bright ones barely move. */
.v7c-vert{writing-mode:vertical-rl;transform:rotate(180deg);position:relative;
  font-family:'Bebas Neue',sans-serif;font-size:1.4rem;letter-spacing:.16em;white-space:nowrap;
  color:var(--acc);
  color:color-mix(in srgb, var(--acc) 70%, #fff)}
.v7c-barcode{display:flex;align-items:flex-end;gap:1.5px;height:36px;position:relative}
.v7c-barcode i{display:block;width:2px;background:${OFF};opacity:.82;
  animation:v7c-scan 2.6s ease-in-out infinite}
@keyframes v7c-scan{0%,100%{opacity:.28}18%{opacity:.95}}

.v7c-rose{width:clamp(72px,7.4vw,94px);height:auto;position:relative;
  filter:drop-shadow(0 6px 11px rgba(0,0,0,.65))}
.v7c-rose .v7c-swing{transform-origin:50% 10%;animation:v7c-swing 5.4s ease-in-out infinite}
@keyframes v7c-swing{0%,100%{transform:rotate(-2.6deg)}50%{transform:rotate(2.6deg)}}

/* the tear: a dashed seam and two bites, both in the PAGE's colour */
.v7c-seam{position:absolute;top:0;bottom:0;left:132px;width:2px;transform:translateX(-1px);
  z-index:3;background:repeating-linear-gradient(to bottom,${BG} 0 7px,transparent 7px 14px)}
.v7c-bite{position:absolute;left:132px;width:20px;height:20px;border-radius:50%;
  background:${BG};transform:translateX(-50%);z-index:4}
.v7c-bite.t{top:-10px}.v7c-bite.b{bottom:-10px}

.v7c-body{background:linear-gradient(150deg,${BG2},#121019);border-radius:0 14px 14px 0;
  padding:clamp(20px,3.4vw,30px)}
.v7c-head{display:flex;justify-content:space-between;align-items:flex-start;gap:14px;
  flex-wrap:wrap;padding-bottom:16px;border-bottom:1px dashed rgba(255,255,255,.14)}
.v7c-kicker{font-size:.62rem;letter-spacing:.16em;text-transform:uppercase;color:var(--acc);
  font-weight:700;margin-bottom:5px}
.v7c-title{font-family:'Bebas Neue',sans-serif;font-size:clamp(1.5rem,4vw,2.2rem);
  line-height:.95;color:${OFF};letter-spacing:.01em}
.v7c-when{font-size:.64rem;color:${D2};text-align:right;line-height:1.9}
.v7c-when b{display:block;color:${OFF};font-size:.76rem}

.v7c-list{list-style:none;margin:6px 0 0;padding:0}
.v7c-row{display:flex;align-items:center;gap:14px;padding:13px 0;position:relative;
  border-bottom:1px solid rgba(255,255,255,.06)}
.v7c-row:hover{background:rgba(255,255,255,.02)}
/* the punched window, with the scene inside and the ring snapping out round it */
.v7c-hole{position:relative;flex-shrink:0;width:62px;height:62px;border-radius:50%;
  background:${BG};display:grid;place-items:center;color:var(--acc);padding:7px;
  box-shadow:inset 0 2px 7px rgba(0,0,0,.9)}
.v7c-hole::after{content:'';position:absolute;inset:-5px;border-radius:50%;
  border:1px solid var(--acc);opacity:0;animation:v7c-ring .9s ease-out both;
  animation-delay:calc(.25s + var(--i) * .09s)}
@keyframes v7c-ring{from{opacity:.85;transform:scale(.6)}to{opacity:0;transform:scale(1.35)}}
.v7c-hole .sc{transition:transform .35s cubic-bezier(.16,1,.3,1)}
.v7c-row:hover .v7c-hole .sc{transform:scale(1.12)}

.v7c-txt{flex:1;min-width:0;font-size:clamp(.82rem,1.9vw,.92rem);color:${OFF};
  font-weight:500;line-height:1.5}
/* perks sharing one window: the hairline says the lines belong to the picture
   beside them rather than looking like one sentence that wrapped */
.v7c-txt b{display:block;font-weight:500}
.v7c-txt b + b{margin-top:6px;padding-top:6px;border-top:1px dashed rgba(255,255,255,.13)}

/* THE STAMP — always on. Hiding it until hover made it a tooltip; the point of
   a stamp is that it has already been applied. Red on purpose, outside the
   accent: against the ride's own colour the two would compete. */
.v7c-stamp{position:relative;flex-shrink:0;
  font-family:'Bebas Neue',sans-serif;font-size:clamp(.76rem,1.9vw,.95rem);
  letter-spacing:.11em;line-height:1;text-transform:uppercase;white-space:nowrap;
  color:#e3342a;border:2.5px solid #e3342a;border-radius:3px;
  padding:6px 12px 4px;transform:rotate(-8deg);
  -webkit-mask-image:${STAMP_MASK};mask-image:${STAMP_MASK}}
.v7c-stamp::before{content:'';position:absolute;inset:2px;border:1px solid currentColor;
  border-radius:2px;opacity:.75}

.v7c-foot{margin-top:18px;display:flex;justify-content:space-between;align-items:center;
  gap:12px;flex-wrap:wrap;font-size:.6rem;letter-spacing:.16em;text-transform:uppercase;
  color:${D2};font-weight:700}
.v7c-foot .v7c-org{display:flex;align-items:center;gap:9px;text-transform:none;letter-spacing:.04em}
.v7c-pay{color:var(--acc);border:1px solid var(--acc);padding:4px 10px;border-radius:5px;
  letter-spacing:.1em}

@media(max-width:640px){
  .v7c-ticket{grid-template-columns:1fr}
  .v7c-stub{border-radius:14px 14px 0 0;flex-direction:row;padding:12px 16px}
  .v7c-vert{writing-mode:horizontal-tb;transform:none;font-size:1.2rem}
  .v7c-barcode{height:24px}
  .v7c-rose{width:56px}
  .v7c-body{border-radius:0 0 14px 14px}
  .v7c-seam{left:0;right:0;top:auto;bottom:auto;width:auto;height:2px;
    background:repeating-linear-gradient(to right,${BG} 0 7px,transparent 7px 14px)}
  .v7c-bite{left:auto;top:auto;transform:translateY(-50%)}
  .v7c-bite.t{left:-10px}.v7c-bite.b{right:-10px;bottom:auto}
  /* let the stamp drop below the text rather than squeezing it to two words */
  .v7c-row{flex-wrap:wrap}
  .v7c-txt{flex:1 1 58%}
  .v7c-stamp{font-size:.72rem;padding:5px 10px 3px}
}
@media(prefers-reduced-motion:reduce){
  .v7c-barcode i,.v7c-hole::after,.v7c-rose .v7c-swing{animation:none}
  .v7c-hole::after{opacity:0}
}`

function ComplimentsPoster({ ride }) {
  const items = ride.compliments
  const c = ride.color

  /* One window per PICTURE, not per perk: two inclusions that both draw a cup
     of tea share the window and stack their lines beside it. The foot still
     counts PERKS — four inclusions in three rows is four inclusions. */
  const groups = useMemo(() => groupByScene(items), [items])

  /* Bars hashed from the ride, so no two rides carry the same barcode and a
     reload never reshuffles one. */
  const bars = useMemo(() => {
    let h = 0
    for (const ch of String(ride.id) + String(ride.date)) h = (h * 31 + ch.charCodeAt(0)) >>> 0
    /* a plain loop rather than Array.from(…, cb): the callback would close over
       `h` and mutate it, which reads as state escaping the render */
    const out = []
    for (let i = 0; i < 24; i++) {
      h = (h * 1103515245 + 12345) >>> 0
      out.push(36 - (h % 3) * 9)
    }
    return out
  }, [ride.id, ride.date])

  if (!items?.length) return null
  const org = ride.organizer && ride.organizer !== 'Self' ? ride.organizer : null
  const reg = ride.stats?.registration

  return (
    <motion.div {...up(0.15)} style={{ '--acc': c }}>
      <style>{SCENE_CSS + TICKET_CSS}</style>
      {/* the shared gradients, once for the whole page */}
      <svg className="v7c-defs" aria-hidden="true"
        dangerouslySetInnerHTML={{ __html: `<defs>${SCENE_DEFS}</defs>` }} />

      <div className="v7c-ticket">
        <div className="v7c-stub">
          <span className="v7c-vert">Compliments</span>
          <div className="v7c-barcode" aria-hidden="true">
            {bars.map((h, i) => <i key={i} style={{ height: `${h}%`, animationDelay: `${i * 0.045}s` }} />)}
          </div>
          <svg className="v7c-rose" viewBox="0 0 100 150" aria-hidden="true">
            <g className="v7c-swing">
              {/* ribbons first: they hang from behind the badge */}
              <path d="M38 46L53 46L47 132L30 143Z" fill={c} />
              <path d="M62 46L47 46L53 132L70 143Z" fill={c} />
              <path d="M47 46L53 46L50 90Z" fill="#000" fillOpacity=".22" />
              <path d={ROSETTE_PATH} fill={c} />
              <circle cx="50" cy="46" r="27" fill={c} />
              <circle cx="50" cy="46" r="27" fill="#000" fillOpacity=".12" />
              <circle cx="50" cy="46" r="23" fill="none" stroke="#fff" strokeWidth="1.1" strokeOpacity=".45" />
              {/* Sized against the r=23 ring, not the badge: about 42px usable.
                  "ADMIT 1" at a readable weight runs over the ring in any
                  non-condensed fallback, so the numeral carries it alone. */}
              <text x="50" y="52" textAnchor="middle" fontFamily="'Bebas Neue',sans-serif"
                fontSize="30" fill="#0b0a12">1</text>
              <text x="50" y="63" textAnchor="middle" fontSize="6.8" fontWeight="800"
                letterSpacing="1.3" fill="#0b0a12">PER RIDER</text>
            </g>
          </svg>
        </div>

        <span className="v7c-seam" aria-hidden="true" />
        <span className="v7c-bite t" aria-hidden="true" />
        <span className="v7c-bite b" aria-hidden="true" />

        <div className="v7c-body">
          <div className="v7c-head">
            <div>
              <div className="v7c-kicker">What the ride comes with</div>
              <div className="v7c-title">{ride.name}</div>
            </div>
            <div className="v7c-when">
              <b>{ride.date}</b>
              {org || 'Self organised'}
            </div>
          </div>

          <ul className="v7c-list">
            {groups.map((g, i) => (
              <li className="v7c-row" key={g.kind} style={{ '--i': i }}>
                <span className="v7c-hole" aria-hidden="true">
                  <svg className="sc" viewBox="0 0 64 64"
                    dangerouslySetInnerHTML={{ __html: SCENE_ART[g.kind] || SCENE_ART.tick }} />
                </span>
                <span className="v7c-txt">
                  {g.texts.map(t => <b key={t}>{t}</b>)}
                </span>
                <span className="v7c-stamp">Included</span>
              </li>
            ))}
          </ul>

          <div className="v7c-foot">
            {org ? (
              <span className="v7c-org">
                <span style={{ textTransform: 'uppercase', letterSpacing: '0.16em', color: D2 }}>
                  Included with
                </span>
                <OrganizerMark name={ride.organizer} logo={ride.organizerLogo} size={16} logoOnly
                  style={{ color: OFF, letterSpacing: '0.04em' }} />
              </span>
            ) : (
              <span>{items.length} inclusion{items.length === 1 ? '' : 's'}</span>
            )}
            {reg
              ? <span className="v7c-pay">Entry {reg}</span>
              : org && <span>{items.length} inclusion{items.length === 1 ? '' : 's'}</span>}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

/** The view out of one chapter. Memoised on the ride — it never needs redrawing. */
function HorizonView({ ride, index, rider = true }) {
  return useMemo(() => {
    const c = ride.color
    const rnd = seeder(ride.id || String(index))

    /* Ridgelines, far to near. Drawn before the stars are pulled from `rnd`
       so the sequence — and therefore the scene — is stable. */
    const ridges = [
      { y: HZ - 4, amp: 54, op: 0.5, col: shade(c, -0.5) },
      { y: HZ + 6, amp: 34, op: 0.68, col: shade(c, -0.66) },
      { y: HZ + 22, amp: 20, op: 0.85, col: '#0b0b11' },
    ].map((g, k) => {
      let d = `M0 ${VH}L0 ${g.y}`
      for (let x = 0; x <= VW; x += 110) {
        d += ` Q${x + 55} ${(g.y - rnd() * g.amp).toFixed(1)} ${x + 110} ${(g.y - rnd() * g.amp * 0.55).toFixed(1)}`
      }
      return <path key={k} d={`${d}L${VW} ${VH}Z`} fill={g.col} opacity={g.op} />
    })

    /* Each star gets its own period and delay, so they blink independently
       instead of pulsing as one sheet. Seeded, so a chapter's sky is the same
       sky every time you come back to it.
       ONE IN SIX IS A SPARKLE rather than a dot — four points drawn with a
       pinched waist, which is how a bright star actually reads to the eye.
       A field of plain dots twinkling is a field of dots changing opacity. */
    const stars = Array.from({ length: 52 }, (_, k) => {
      const x = rnd() * VW
      const y = rnd() * (HZ - 90)
      const r = 0.6 + rnd() * 1.6
      const style = {
        '--d': `${(2.1 + rnd() * 3.6).toFixed(1)}s`,
        '--dl': `${(-rnd() * 5).toFixed(1)}s`,
      }
      if (k % 6 !== 0) {
        return <circle key={k} className="hz-star" cx={x.toFixed(0)} cy={y.toFixed(0)}
          r={r.toFixed(1)} fill="#fbfaf7" style={style} />
      }
      const R = (3.4 + rnd() * 3).toFixed(1)
      const w = (R * 0.16).toFixed(2)
      /* The translate lives on a wrapper and the flare on the path inside it.
         Putting both on one node means a `transform` attribute and a CSS
         transform on the same element, and which one survives is a question
         not worth having. */
      return (
        <g key={k} transform={`translate(${x.toFixed(0)} ${y.toFixed(0)})`}>
          <path className="hz-star hz-spark" fill="#fdfcf8" style={style}
            d={`M0 ${-R}Q${w} ${-w} ${R} 0Q${w} ${w} 0 ${R}Q${-w} ${w} ${-R} 0Q${-w} ${-w} 0 ${-R}Z`} />
        </g>
      )
    })

    const road = `M${VPX - 620} ${VH} L${VPX - 7} ${HZ + 4} L${VPX + 7} ${HZ + 4} L${VPX + 620} ${VH} Z`

    /* Milestone posts, at each stop's true share of the ride. Perspective
       compresses toward the horizon, so depth grows non-linearly. */
    const marks = marksOf(ride.stops)
    const chain = marks.length ? marks[marks.length - 1].at : 0
    /* ── roadside boards ────────────────────────────────────────────────
       A bare number told you a ride was 21 km long somewhere, but not where
       you were. These are name boards: the place, and how far into the ride
       it is. The two that matter — where the ride starts and where it ends —
       carry a header band saying so.

       Each board is authored at scale 1 inside a <g> that translates to its
       spot on the verge and scales for depth, so the numbers below read as
       the board's real proportions rather than as pre-multiplied soup.

       ALL OF THEM RIDE THE RIGHT VERGE, which is why the old numbered posts
       did too. The chapter's own copy — title, standfirst, the figures row and
       the button — owns the left of the screen, and a near board over there
       lands squarely behind it: the nearest board is the biggest and the
       furthest out, so it is the one guaranteed to collide. The stops' own
       `dir` is honoured on the maps, where both verges are free. */
    const NAME_F = 26
    const LH = 30

    /* Geometry for EVERY stop, worked out before anything is drawn — the
       overlap pass below has to know how tall each board is before it can
       decide which ones survive. */
    const signs = signShares(ride.stops).map(({ stop, k, at, share, first, last }) => {

      /* DEPTH IS COMPRESSED INTO [0.34, 0.80], and BOTH ends of that matter.
         Below 0.34 the road fills the frame edge to edge, leaving no verge to
         stand a sign on — a board there sat on the tarmac and hung off the
         canvas at once. Above 0.80 is the vanishing point, where the road is a
         fourteen-unit sliver: a board planted there is geometrically correct
         and reads as hanging in the sky, because there is no ground under it
         to plant it on. The finish board is the FARTHEST VISIBLE sign, not the
         one at infinity. */

      /* TWO LINES OF BIG TYPE IN A TALL RECTANGLE is what makes a place-name
         board read as one. One line of smaller type gave a 4.5:1 strip that
         looked like a UI chip whatever colour it was painted. */
      const lines = signLines(stop.label, 15)
      /* Nothing to count at the start — a board reading "0 KM" is noise. */
      const km = first ? '' : `${Math.round(at)} KM`
      /* The line a real board gives the Highways Department. Here it carries
         the only thing on the sign that is about the RIDE rather than the
         place, so the slot earns itself instead of quoting a government
         department this site has nothing to do with. */
      const kick = first ? 'START' : last ? 'FINISH' : (ride.states?.[0] || '').toUpperCase()

      const h = 38 + lines.length * LH + (km ? 22 : 0) + 9
      /* Width is ESTIMATED from the character count of the LONGEST line: SVG
         cannot measure text without laying it out first, so this is generous
         on purpose. It has to clear not just the board edge but the inset
         white rule and its own gutter. */
      const longest = lines.reduce((a, b) => (b.length > a.length ? b : a), '')
      const w = Math.max(190, longest.length * NAME_F * 0.62 + 64,
        kick.length * 11 * 0.72 + 76)
      /* Posts about as tall as the board, as on the real thing — carried up
         out of the verge rather than perched on two stubs. */
      return { stop, k, share, first, lines, km, kick, h, w, postH: Math.round(h * 0.95) }
    })

    const win = signWindow(signs)

    /* FARTHEST FIRST, and this one sort holds forever: relative depth never
       changes, because a stop further along the ride is always further away.
       So the nearer board occludes the farther at every scroll position and
       the DOM never has to be reordered. */
    const posts = (ride.stops.length > 1 && chain > 0)
      ? [...signs].sort((a, b) => b.share - a.share).map(s => {
        const { stop, k, share, first, lines, km, kick, h, w, postH } = s
        /* Where it rests on arrival — the START board standing beside you,
           before a single pixel of scroll. Also where it stays for anyone who
           has asked for reduced motion. The scroll handler takes it from
           here. */
        const at0 = signPlace(share, journeyStart(win), win, w, first)

        return (
          <g key={`${stop.id}-${k}`} className="hz-sign"
            data-share={share.toFixed(5)} data-w={w} data-win={win.toFixed(4)}
            data-first={first ? '1' : '0'}
            opacity={at0 ? at0.op.toFixed(2) : 0}
            transform={at0 ? at0.tr : `translate(${VPX} ${VH}) scale(0.001)`}>
            {signPosts(0, w, postH)}

            <g transform={`translate(${(-w / 2).toFixed(1)} ${-postH - h})`}>
            {/* the board's own shadow — what stops the sign reading as a flat
                sticker on the sky */}
            <rect x="4" y="5" width={w} height={h} rx="6" fill="#000" opacity="0.4" />

            {/* green ground, and the white keyline set in from the edge that
                every Indian place-name board carries */}
            <rect width={w} height={h} rx="6" fill={SIGN_BOARD}
              stroke={SIGN_EDGE} strokeWidth="3" />
            {/* a touch of sky along the upper lip: flat green over the whole
                face reads as a swatch rather than as painted metal */}
            <path d={`M9 9h${w - 18}v12H9z`} fill="#fff" opacity="0.07" />
            <rect x="9" y="9" width={w - 18} height={h - 18} rx="3"
              fill="none" stroke={SIGN_RULE} strokeWidth="3.4" />

            {/* the department line: type between two roundels. The left one is
                the ride's accent — the single place the chapter's colour
                touches the sign. */}
            <circle cx="24" cy="26" r="6" fill={c} />
            <circle cx={w - 24} cy="26" r="6" fill={SIGN_KICK} />
            <text x={w / 2} y="30" textAnchor="middle" fill={SIGN_KICK}
              fontFamily="'Inter',system-ui,sans-serif" fontWeight="800"
              fontSize="11" letterSpacing="2.2">{kick}</text>
            <path d={`M20 40h${w - 40}`} stroke={SIGN_RULE} strokeWidth="1"
              opacity="0.38" />

            {lines.map((ln, li) => (
              <text key={ln} x={w / 2} y={38 + LH * (li + 0.72)} textAnchor="middle"
                fill={SIGN_TEXT} fontFamily="'Inter',system-ui,sans-serif"
                fontWeight="700" fontSize={NAME_F}>{ln}</text>
            ))}
            {km && (
              <text x={w / 2} y={38 + lines.length * LH + 16} textAnchor="middle"
                fill={SIGN_TEXT} fontFamily="'Inter',system-ui,sans-serif"
                fontWeight="600" fontSize="14" letterSpacing="1.4"
                opacity="0.9">{km}</text>
            )}
            </g>
          </g>
        )
      })
      : null

    const g = `hz${index}`
    return (
      <svg viewBox={`0 0 ${VW} ${VH}`} preserveAspectRatio="xMidYMax slice" aria-hidden="true">
        <defs>
          {/* DAY: the ride's colour opened up toward white, brightest just
              above the horizon where the light actually comes from. */}
          <linearGradient id={`skyD-${g}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={shade(c, 0.12)} />
            <stop offset="0.44" stopColor={shade(c, 0.42)} />
            <stop offset="0.66" stopColor={shade(c, 0.72)} />
            <stop offset="0.8" stopColor={shade(c, 0.3)} />
          </linearGradient>
          {/* NIGHT: the same colour taken down instead of up, so the two skies
              are recognisably one ride at either end of a day. */}
          <linearGradient id={`skyN-${g}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={BG} />
            <stop offset="0.44" stopColor={shade(c, -0.74)} />
            <stop offset="0.66" stopColor={shade(c, -0.4)} />
            <stop offset="0.8" stopColor={shade(c, -0.7)} />
          </linearGradient>
          {/* ── the sun ──────────────────────────────────────────────────
              WARM, AND NOT THE RIDE'S COLOUR. It used to carry an accent wash
              at a third opacity, which on a teal ride produced a pale green
              disc — a circle, not a sun. Only the corona is allowed to pick up
              the chapter's tint, and faintly, because that IS the sky it is
              shining through. */}
          <radialGradient id={`sunCore-${g}`} cx="0.44" cy="0.38" r="0.72">
            <stop offset="0" stopColor="#fffdf3" />
            <stop offset="0.42" stopColor="#ffeaa4" />
            <stop offset="0.82" stopColor="#ffc25a" />
            <stop offset="1" stopColor="#ffa236" />
          </radialGradient>
          <radialGradient id={`corona-${g}`}>
            <stop offset="0" stopColor="#ffe6a8" stopOpacity="0.6" />
            <stop offset="0.3" stopColor="#ffbe5c" stopOpacity="0.26" />
            <stop offset="0.62" stopColor={shade(c, 0.45)} stopOpacity="0.12" />
            <stop offset="1" stopColor={c} stopOpacity="0" />
          </radialGradient>

          {/* ── the moon ─────────────────────────────────────────────────
              Lit from the upper right, cool rather than white, and darkening
              toward the limb so the disc reads as a SPHERE. A flat fill is
              what made the half moon look like a half circle. */}
          <radialGradient id={`moonSurf-${g}`} cx="0.64" cy="0.34" r="0.86">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="0.5" stopColor="#e6ecf5" />
            <stop offset="0.86" stopColor="#c6d0e0" />
            <stop offset="1" stopColor="#aab6c9" />
          </radialGradient>
          <radialGradient id={`moonHalo-${g}`}>
            <stop offset="0" stopColor="#e2ecff" stopOpacity="0.42" />
            <stop offset="0.34" stopColor="#bacdf2" stopOpacity="0.15" />
            <stop offset="1" stopColor="#8fa6d0" stopOpacity="0" />
          </radialGradient>
          {/* NIGHT FALLING ON THE LAND, as a gradient rather than a fill.
              This was a flat rect, and a flat rect has a top edge: as its
              opacity came up with the night it drew a dead-straight black line
              right across the hills, worst at full dark. Fading in from
              nothing above the highest ridge means there is no edge to see. */}
          <linearGradient id={`landDark-${g}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#04050a" stopOpacity="0" />
            <stop offset="0.22" stopColor="#04050a" stopOpacity="0.55" />
            <stop offset="0.45" stopColor="#04050a" stopOpacity="0.9" />
            <stop offset="1" stopColor="#04050a" stopOpacity="1" />
          </linearGradient>

          {/* the maria are drawn across the whole disc and cut to whatever is
              lit, so they hold still through the phase instead of sliding */}
          <clipPath id={`moonLit-${g}`}>
            <path d={moonPath(34, MOON_PHASES[index % MOON_PHASES.length])} />
          </clipPath>
          <radialGradient id={`sun-${g}`} cx="0.5" cy={(HZ / VH).toFixed(3)} r="0.42">
            <stop offset="0" stopColor={c} stopOpacity="0.92" />
            <stop offset="0.5" stopColor={c} stopOpacity="0.2" />
            <stop offset="1" stopColor={c} stopOpacity="0" />
          </radialGradient>
          <linearGradient id={`tar-${g}`} x1="0" y1="1" x2="0" y2="0">
            <stop offset="0" stopColor="#16161d" />
            <stop offset="1" stopColor={shade(c, -0.72)} />
          </linearGradient>
        </defs>

        {/* DAY UNDERNEATH, NIGHT CROSS-FADED OVER IT. Two flat rects rather
            than one gradient whose stops get rewritten every frame: an opacity
            is a compositor property and stop colours are not. */}
        <rect width={VW} height={VH} fill={`url(#skyD-${g})`} />
        <rect className="hz-night" width={VW} height={VH} fill={`url(#skyN-${g})`}
          opacity={dawnRide(index) ? 1 : 0} />

        {/* the sun's haze on the horizon, which belongs to the day */}
        <ellipse className="hz-glow" cx={VPX} cy={HZ} rx={VW * 0.44} ry={230}
          fill={`url(#sun-${g})`} opacity={dawnRide(index) ? 0 : 1} />

        <g className="hz-stars" opacity={dawnRide(index) ? 1 : 0}>{stars}</g>

        {/* Sun and moon trade places behind the ridges. Both are drawn before
            the ridgelines, so they rise and set BEHIND the hills rather than
            sliding over them. */}
        <g className="hz-sun" opacity={dawnRide(index) ? 0 : 1}
          transform={`translate(${(VW * 0.74).toFixed(0)} ${sunY(dawnRide(index) ? 1 : 0).toFixed(0)})`}>
          <circle r="165" fill={`url(#corona-${g})`} />
          <circle r="46" fill={`url(#sunCore-${g})`} />
          {/* the rim a low sun always has, a shade hotter than its middle */}
          <circle r="46" fill="none" stroke="#ffb247" strokeWidth="2" strokeOpacity="0.5" />
        </g>

        <g className="hz-moon" opacity={dawnRide(index) ? 1 : 0}
          transform={`translate(${(VW * 0.27).toFixed(0)} ${moonY(dawnRide(index) ? 1 : 0).toFixed(0)})`}>
          <circle r="108" fill={`url(#moonHalo-${g})`} />
          {/* NO EARTHSHINE. There was a faint full disc behind the lit part —
              the unlit hemisphere, which is a real thing you can see on a thin
              crescent and which sold the moon as a ball rather than a shape.
              It only works against a black sky. Over the lighter half of the
              cycle it read as a translucent second half stuck to the first,
              which is worse than losing the roundness. The surface gradient
              and the craters carry that on their own. */}
          <path d={moonPath(34, MOON_PHASES[index % MOON_PHASES.length])}
            fill={`url(#moonSurf-${g})`} />
          <g clipPath={`url(#moonLit-${g})`} fill="#93a1b8">
            <circle cx="9" cy="-13" r="8" fillOpacity="0.3" />
            <circle cx="-5" cy="3" r="10" fillOpacity="0.24" />
            <circle cx="15" cy="11" r="5.5" fillOpacity="0.28" />
            <circle cx="2" cy="17" r="6.5" fillOpacity="0.2" />
            <circle cx="19" cy="-3" r="3.4" fillOpacity="0.32" />
            <circle cx="-3" cy="-19" r="4.2" fillOpacity="0.22" />
            <circle cx="24" cy="4" r="2.6" fillOpacity="0.26" />
          </g>
        </g>

        {ridges}
        {/* The land loses its light too, or the hills stay noon-bright at
            midnight and give the whole thing away. Starts well ABOVE the
            tallest ridge — they peak around y=372 — so the gradient has room
            to come up from nothing before it reaches anything. */}
        <rect className="hz-dark" y={HZ - 150} width={VW} height={VH - HZ + 150}
          fill={`url(#landDark-${g})`} opacity={dawnRide(index) ? 0.55 : 0} />

        <path d={road} fill={`url(#tar-${g})`} />
        <path d={`M${VPX - 620} ${VH} L${VPX - 7} ${HZ + 4}`} fill="none"
          stroke="rgba(251,250,247,0.3)" strokeWidth="3" />
        <path d={`M${VPX + 620} ${VH} L${VPX + 7} ${HZ + 4}`} fill="none"
          stroke="rgba(251,250,247,0.3)" strokeWidth="3" />
        <path className="hz-stripe" d={`M${VPX} ${VH} L${VPX} ${HZ + 4}`} fill="none"
          stroke="rgba(251,250,247,0.72)" strokeWidth="7"
          strokeDasharray="58 46" strokeLinecap="round"
          strokeDashoffset="0" />
        {posts}

        {/* The rider, drawn INSIDE the scene rather than layered over it in
            CSS. The svg is `xMidYMax slice`, so a positioned <img> would have
            to re-derive that crop to stay on the road at every viewport; in
            here it shares the road's own coordinate space and cannot drift.
            The group's origin is the bike's contact patch, so scaling it grows
            the bike out of the tarmac rather than about its middle.

            The transform is set again from the scroll handler in
            GarageV7AllRides — this is only where it starts. */}
        {rider && (
          <g className="hz-rider" transform={riderAt(RIDER_NEAR)}>
            <image href={`${import.meta.env.BASE_URL}${RIDER_SRC}`}
              x={-RIDER_H / 2} y={-RIDER_H} width={RIDER_H} height={RIDER_H}
              preserveAspectRatio="xMidYMax meet" />
          </g>
        )}
      </svg>
    )
  }, [ride, index, rider])
}

/**
 * Break a ride name into at most two lines, so each can rise from its own mask.
 *
 * Splitting every three words is what a mock-up gets away with and real names
 * do not: a name like "Home to Dharapuram — First Service" lands the em dash at
 * the head of line two. So the break goes near the middle and then walks forward
 * off any word that doesn't start with a letter or a number.
 */
function titleLines(name) {
  const words = String(name || '').trim().split(/\s+/).filter(Boolean)
  if (words.length <= 3) return [words.join(' ')]
  let cut = Math.ceil(words.length / 2)
  while (cut < words.length - 1 && /^[^\p{L}\p{N}]/u.test(words[cut])) cut++
  return [words.slice(0, cut).join(' '), words.slice(cut).join(' ')]
}

/** One ride, one screen. */
function HorizonChapter({ ride: r, index, root, tier }) {
  const mapped = r.stops.length > 1
  const heading = mapped
    ? (() => {
        const d = bearingDeg(r.stops[0], r.stops[r.stops.length - 1])
        return `${compassOf(d)} ${Math.round(d)}°`
      })()
    : 'Open'

  const lines = titleLines(r.name)
  const timeLabel = r.time || r.estimateTime

  /* The chapter is TALLER THAN THE SCREEN and its contents are pinned inside
     it. That extra height is the ride: you arrive at the start board, and
     scrolling it is what rides the road past you. A ride with more boards
     gets more of it. */
  const span = chapterSpan(signShares(r.stops).length)

  return (
    <section className="hz-ch hz-ride" data-i={index + 1}
      data-win={signWindow(signShares(r.stops)).toFixed(4)}
      data-dawn={dawnRide(index) ? '1' : '0'}
      style={{ '--c': r.color, '--span': span }}>
      <div className="hz-stick">
        <div className="hz-view"><HorizonView ride={r} index={index} /></div>
        <div className="hz-haze" />
        <span className="hz-no" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>

        <div className="hz-body">
        {/* The stamp is stuck to the heading, so the two share a box — the mark
            is placed against the title, not against the copy column. */}
        <div className="hz-head">
          {/* The status, stamped. `stamp` is the tier's own word — RIDDEN rather
              than "Completed" — because the stamp says what became of the ride,
              where the label only names the bucket it is filed under. A tier
              without one falls back to its label, so nothing goes blank.
              The date rides inside the mark the way a date stamp carries one,
              and drops out on a planned ride, which has none yet. */}
          <span className="hz-tier hz-stamp" style={{ color: tier?.color || r.color }}>
            <b>{tier?.stamp || tier?.label || r.mode}</b>
            {r.date && <u>{r.date}</u>}
          </span>

          <h2 className="hz-title">
            {lines.map((l, k) => (
              <span className="w" key={k}>
                <i style={{ transitionDelay: `${(0.18 + k * 0.09).toFixed(2)}s` }}>{l}</i>
              </span>
            ))}
          </h2>
        </div>

        {/* The title says what the ride was FOR; this says where it went. Falls
            back to the compact city pair so a ride file that never wrote a
            subtitle still gets its road named. */}
        {(r.subtitle || routeLabel(r.fromCity, r.destCity, r.roundTrip)) && (
          <p className="hz-where">{r.subtitle || routeLabel(r.fromCity, r.destCity, r.roundTrip)}</p>
        )}

        {r.description && <p className="hz-lede">{r.description}</p>}

        {/* Whose ride it is. Sits between the lede and the figures because it is
            a credit, not a measurement — the figures row is numbers, and a logo
            in it would break that rhythm. Absent on your own rides. */}
        {r.organizer !== 'Self' && (
          <div className="hz-org">
            <span className="k">Organised by</span>
            <OrganizerMark name={r.organizer} logo={r.organizerLogo} size={22} logoOnly />
          </div>
        )}

        <div className="hz-figs">
          <div><span className="k">Distance</span><span className="v">{r.distance || '—'}</span></div>
          <div><span className="k">From</span><span className="v sm">{r.fromCity || '—'}</span></div>
          <div><span className="k">To</span><span className="v sm">{r.destCity || '—'}</span></div>
          <div><span className="k">Heading</span><span className="v">{heading}</span></div>
          <div>
            <span className="k">
              {r.time ? 'Saddle time' : r.estimateTime ? 'Estimated' : 'Waypoints'}
            </span>
            <span className="v sm">{timeLabel || r.stops.length}</span>
          </div>
        </div>

        <div className="hz-row">
          <Link className="hz-go" to={`${root.rides}/${r.id}`}>
            Open the ride <span aria-hidden="true">→</span>
          </Link>
          {r.highlights?.length > 0 && (
            <span className="hz-tags">
              {r.highlights.slice(0, 3).map(h => <u key={h}>{h}</u>)}
            </span>
          )}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ── the cover's furniture ─────────────────────────────────────────────────
   One stroke weight, one viewBox, currentColor throughout, so an icon takes
   its colour and size from whatever it is sitting in. Paths rather than
   components because most of these are one line of geometry. */
function Ico({ d }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {d.map((p, i) => <path key={i} d={p} />)}
    </svg>
  )
}

const CAL = ['M8 2v4M16 2v4M3 10h18',
  'M19 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z']
const ICON = {
  pin: ['M20 10c0 6.5-8 12-8 12s-8-5.5-8-12a8 8 0 0 1 16 0z', 'M12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z'],
  road: ['M5 21 8.5 3', 'M19 21 15.5 3', 'M12 5v3M12 10.5v3M12 16v3'],
  flag: ['M5 21V4', 'M5 5h13l-2.4 4L18 13H5z'],
  cal: CAL,
}
/* One per tier, keyed by mode. A tier without an entry still draws — the
   fallback is the planned map, which is the honest shape for "not yet". */
const MODE_ICON = {
  completed: ['M20 6 9 17l-5-5'],
  upcoming: CAL,
  planned: ['M9 4 3 6v15l6-2 6 2 6-2V4l-6 2-6-2z', 'M9 4v15M15 6v15'],
  cancelled: ['M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z', 'M5.6 5.6l12.8 12.8'],
}

/**
 * A ride's route, drawn from its own stops.
 *
 * The Next Ride card wants a window onto the ride, and no ride file carries a
 * photo yet. A grey placeholder would say the card is unfinished; the route
 * line says where it actually goes, in the ride's own colour, from data that
 * is already there. `photos[0]` wins the moment a file has one.
 *
 * Equirectangular, which is exact enough at this scale: a ride spans a degree
 * or two, so the only distortion worth correcting is longitude converging
 * with latitude, and cos(mean lat) does that. Then it is fitted to the box on
 * whichever axis is tighter, so a north-south ride and an east-west one both
 * fill it without being stretched.
 */
function RouteThumb({ stops, color }) {
  const pts = useMemo(() => {
    const ok = (stops || []).filter(s => Number.isFinite(s.lat) && Number.isFinite(s.lng))
    if (ok.length < 2) return null
    const k = Math.cos((ok.reduce((a, s) => a + s.lat, 0) / ok.length) * Math.PI / 180)
    const xs = ok.map(s => s.lng * k)
    const ys = ok.map(s => -s.lat)
    const x0 = Math.min(...xs), x1 = Math.max(...xs)
    const y0 = Math.min(...ys), y1 = Math.max(...ys)
    const W = 160, H = 90, P = 15
    /* A dead-straight ride has zero range on one axis — scaling by it would
       divide by nothing, so that axis simply doesn't constrain the fit. */
    const sc = Math.min(
      x1 - x0 > 1e-9 ? (W - P * 2) / (x1 - x0) : Infinity,
      y1 - y0 > 1e-9 ? (H - P * 2) / (y1 - y0) : Infinity)
    if (!Number.isFinite(sc)) return null   // every stop on one point
    const ox = (W - (x1 - x0) * sc) / 2 - x0 * sc
    const oy = (H - (y1 - y0) * sc) / 2 - y0 * sc
    return xs.map((x, i) => [+(x * sc + ox).toFixed(2), +(ys[i] * sc + oy).toFixed(2)])
  }, [stops])

  if (!pts) return null
  const d = roadPath(pts)
  const cap = { fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' }
  const last = pts.length - 1
  return (
    <svg viewBox="0 0 160 90" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      {/* NO GRID HERE, deliberately. A graticule was the first thing tried and
          it made the picture worse: an even grid behind a line is the single
          strongest cue for a chart, so it argued for exactly the reading this
          is trying to avoid. What sells it as a road instead is the casing and
          the curve — a map has neither axes nor square paper. */}
      {/* Casing under colour, the way a road is drawn on a real map: the dark
          outline is what separates it from the ground it crosses. */}
      <path d={d} {...cap} stroke={color} strokeWidth="9" opacity=".12" />
      <path d={d} {...cap} stroke={color} strokeWidth="7" opacity=".14" />
      <path d={d} {...cap} stroke="rgba(6,4,10,.85)" strokeWidth="4.4" />
      <path d={d} {...cap} stroke={color} strokeWidth="2" />
      {pts.map(([x, y], i) => {
        const end = i === 0 || i === last
        return end
          ? <g key={i}>
              <circle cx={x} cy={y} r="3.6" fill="rgba(6,4,10,.9)" />
              <circle cx={x} cy={y} r="3.6" fill="none" stroke={color} strokeWidth="1.6" />
              {i === last && <circle cx={x} cy={y} r="1.5" fill={color} />}
            </g>
          : <circle key={i} cx={x} cy={y} r="1.6"
              fill="rgba(255,255,255,.62)" stroke="rgba(6,4,10,.85)" strokeWidth=".8" />
      })}
    </svg>
  )
}

/**
 * The stops as a road rather than a line chart.
 *
 * Straight segments between pins read as plotted data however they are
 * coloured, because sharp vertices are what a data series has and a road does
 * not. Rounding them off is the difference. Quadratics anchored at each stop
 * and joined at the midpoints between them: the curve passes exactly through
 * every midpoint and bends around each stop, so the shape of the route is
 * preserved while the corners stop being corners.
 */
function roadPath(pts) {
  if (pts.length < 3) return 'M' + pts.map(p => p.join(' ')).join('L')
  const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]
  const at = p => `${p[0].toFixed(2)} ${p[1].toFixed(2)}`
  let d = `M${at(pts[0])}L${at(mid(pts[0], pts[1]))}`
  for (let i = 1; i < pts.length - 1; i++) d += `Q${at(pts[i])} ${at(mid(pts[i], pts[i + 1]))}`
  return `${d}L${at(pts[pts.length - 1])}`
}

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun',
  'jul', 'aug', 'sep', 'oct', 'nov', 'dec']

/**
 * "20 Sep 2026" → a Date, and anything else → null.
 *
 * Written out rather than handed to `new Date(str)`: that parses this shape
 * only because engines are lenient about it, and a planned ride's date reads
 * "Planned", which some of them will happily turn into a real date rather
 * than refusing. Null is the answer that keeps an undated ride out of the
 * running for "next".
 */
function rideDate(s) {
  const m = /^(\d{1,2})\s+([A-Za-z]{3,})\s+(\d{4})$/.exec(String(s ?? '').trim())
  if (!m) return null
  const mo = MONTHS.indexOf(m[2].slice(0, 3).toLowerCase())
  return mo < 0 ? null : new Date(+m[3], mo, +m[1])
}

/* The cover's accent. Fixed rather than borrowed from chapter one, because
   what it has to sit against is the photograph, and the photograph is a
   sunset. */
const COVER_ACC = '#e3b04a'

export function GarageV7AllRides() {
  const root = useGarageRoot()
  const rides = useMemo(() => ridesInOrder(), [])
  const tiers = useMemo(() => Object.fromEntries(RIDE_MODES.map(m => [m.key, m])), [])

  /* How many of each tier there are, counted off the ride files themselves —
     add a file and the cover's figures move on their own. Tiers with none are
     dropped rather than shown as a zero. */
  const counts = useMemo(() => RIDE_MODES
    .map(m => ({ ...m, n: rides.filter(r => r.mode === m.key).length }))
    .filter(x => x.n > 0), [rides])

  /* WHICH RIDE IS NEXT is a question about dates, not about list order: the
     reel is grouped by tier and then by `order`, so the first upcoming ride in
     it is simply the one with the lowest `order`. Sorting the dated upcoming
     rides answers it properly. Falls back to any upcoming ride, then to a
     planned one, so the card is only ever missing if there is nothing ahead. */
  const next = useMemo(() => {
    const dated = rides
      .filter(r => r.mode === 'upcoming')
      .map(r => ({ r, t: rideDate(r.date) }))
      .filter(x => x.t)
      .sort((a, b) => a.t - b.t)
    return dated[0]?.r
      ?? rides.find(r => r.mode === 'upcoming')
      ?? rides.find(r => r.mode === 'planned')
      ?? null
  }, [rides])

  const wrapRef = useRef(null)
  /* 0 = cover, 1..n = rides, n + 1 = the closing chapter */
  const [active, setActive] = useState(0)

  /* Snapping belongs to the document, and only while this page is on it. */
  useEffect(() => {
    const el = document.documentElement
    el.classList.add('hz-snap')
    return () => el.classList.remove('hz-snap')
  }, [])

  /* One observer for every chapter. The reveal class is written straight to the
     node rather than held in state — six chapters re-rendering on every scroll
     tick would be six scene trees reconciled for nothing. Only the active index
     is state, because the tint and the rail genuinely read from it. */
  useEffect(() => {
    const secs = Array.from(wrapRef.current?.querySelectorAll('.hz-ch') ?? [])
    if (!secs.length) return undefined
    /* A BAND ACROSS THE MIDDLE OF THE SCREEN, not a share of the section.
       Ride chapters are now several screens tall, so "more than half of it is
       visible" can never be true of one — the reveals would never fire and the
       rail would never light. Collapsing the root to the centre line asks the
       right question instead: which chapter is the reader actually looking at.
       It also guarantees exactly one at a time. */
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        e.target.classList.toggle('is-live', e.isIntersecting)
        if (e.isIntersecting) setActive(Number(e.target.dataset.i))
      })
    }, { rootMargin: '-50% 0px -50% 0px', threshold: 0 })
    secs.forEach(s => io.observe(s))
    return () => io.disconnect()
  }, [rides])

  /* ── the rider travels its chapter's road ──────────────────────────────
     Each chapter draws its own road, so each gets its own bike on it, and the
     bike's depth is that chapter's progress through the viewport.

     WHY PROGRESS IS MEASURED ACROSS THE WHOLE VIEWPORT rather than from the
     chapter's own top: these sections snap. A chapter holding the screen sits
     at top ≈ 0 for as long as you look at it, so anything keyed off its own
     offset would be frozen exactly when it is being read, then lurch as you
     scrolled away. Measured bottom-of-viewport to top, the bike is already
     mid-road when the chapter arrives and keeps riding the whole time.

     Written straight to the node, like the reveal classes above. This runs on
     every scroll tick, and six chapters re-rendering for it would reconcile
     six scene trees for nothing. */
  useEffect(() => {
    const still = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (still) return undefined

    const secs = Array.from(wrapRef.current?.querySelectorAll('.hz-ch') ?? [])
    if (!secs.length) return undefined
    /* queried once — this runs on every scroll tick and re-walking the tree
       each time would be the expensive part of it */
    const live = secs.map(sec => ({
      sec,
      rider: sec.querySelector('.hz-rider'),
      stripe: sec.querySelector('.hz-stripe'),
      signs: Array.from(sec.querySelectorAll('.hz-sign')),
      sky: {
        night: sec.querySelector('.hz-night'),
        glow: sec.querySelector('.hz-glow'),
        stars: sec.querySelector('.hz-stars'),
        sun: sec.querySelector('.hz-sun'),
        moon: sec.querySelector('.hz-moon'),
        dark: sec.querySelector('.hz-dark'),
        dawn: sec.dataset.dawn === '1',
      },
    })).filter(o => o.rider || o.stripe || o.signs.length || o.sky.night)

    let raf = null
    const paint = () => {
      raf = null
      const vh = window.innerHeight
      for (const { sec, rider, stripe, signs, sky } of live) {
        const r = sec.getBoundingClientRect()
        /* nowhere near the screen — leave everything where it is */
        if (r.bottom < -vh || r.top > vh * 2) continue

        /* HOW FAR THROUGH THE RIDE YOU ARE, measured against the chapter's own
           pinned scroll rather than against its pass across the viewport.
           p = 0 the moment the chapter locks to the top — so you arrive on the
           START board and it stays there while you read the title — and p = 1
           as its last screen clears, the FINISH board having just gone by.
           Measured the old way, p sat at 0.5 for as long as you looked at a
           chapter and ran the entire ride during the flick to the next one. */
        const travel = r.height - vh
        const p = travel > 8
          ? Math.min(1, Math.max(0, -r.top / travel))
          : Math.min(1, Math.max(0, (vh - r.top) / (vh + r.height)))

        /* Scroll turned into distance ridden. It stops short of the end of the
           ride so the chapter finishes with the FINISH board mid-road — see
           `journeyEnd`. */
        const win = Number(sec.dataset.win) || 0.34
        const j0 = journeyStart(win)
        const j = j0 + p * (journeyEnd(win) - j0)

        /* the centre line runs with the road, not on a clock of its own —
           measured from the start of the ride so it begins at zero */
        if (stripe) stripe.style.strokeDashoffset = ((j - j0) * STRIPE_TRAVEL).toFixed(1)

        /* THE SKY TURNS OVER. `night` runs 0 to 1 across the ride, or the
           other way on a dawn chapter, and everything above the ridgeline
           reads from it: the night sky fades up, the stars come out, the sun
           sinks behind the hills and the moon climbs out from behind them. */
        if (sky.night) {
          const night = sky.dawn ? 1 - p : p
          sky.night.setAttribute('opacity', night.toFixed(3))
          if (sky.glow) sky.glow.setAttribute('opacity', (1 - night).toFixed(3))
          if (sky.stars) sky.stars.setAttribute('opacity', night.toFixed(3))
          if (sky.dark) sky.dark.setAttribute('opacity', (night * 0.55).toFixed(3))
          if (sky.sun) {
            sky.sun.setAttribute('opacity', Math.max(0, 1 - night * 1.25).toFixed(3))
            sky.sun.setAttribute('transform',
              `translate(${(VW * 0.74).toFixed(0)} ${sunY(night).toFixed(1)})`)
          }
          if (sky.moon) {
            sky.moon.setAttribute('opacity', Math.max(0, night * 1.25 - 0.25).toFixed(3))
            sky.moon.setAttribute('transform',
              `translate(${(VW * 0.27).toFixed(0)} ${moonY(night).toFixed(1)})`)
          }
        }

        /* The bike drifts back a little across the ride and no further — it is
           what you are following, not something leaving. */
        if (rider) {
          rider.setAttribute('transform',
            riderAt(RIDER_NEAR + (RIDER_FAR - RIDER_NEAR) * p))
        }

        /* THE BOARDS STREAM. `p` is how far through the ride you are, so a
           stop's board sits at its own distance ahead of you and closes as you
           scroll — rising out of the haze, sweeping past, gone. Every stop
           gets seen; only two or three share the road at once. */
        for (const g of signs) {
          const at = signPlace(
            Number(g.dataset.share), j, Number(g.dataset.win), Number(g.dataset.w),
            g.dataset.first === '1')
          if (!at) { g.style.opacity = '0'; continue }
          g.setAttribute('transform', at.tr)
          g.style.opacity = at.op.toFixed(3)
        }
      }
    }
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(paint) }

    paint()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [rides])

  const activeRide = active >= 1 && active <= rides.length ? rides[active - 1] : null
  const tint = activeRide?.color || '#8b5cf6'

  return (
    /* `hz-js` is what arms every reveal. It is set here, in the render that
       also mounts the observer, so the hidden state can only ever exist while
       something is running that will undo it. */
    <div className="hz-wrap hz-js" ref={wrapRef} style={{ background: BG }}>
      <style>{HORIZON_CSS + COVER_CSS}</style>

      {/* the tint that follows whichever chapter holds the screen */}
      <div className="hz-wash" style={{ background:
        `radial-gradient(120vw 78vh at 50% 108%, ${tint}, transparent 62%)` }} />

      {/* chapter index — left, because the right edge is taken by the feedback tab */}
      <nav className="hz-rail" aria-label="Rides">
        {rides.map((r, i) => (
          <button
            key={r.id}
            className={active === i + 1 ? 'on' : ''}
            style={{ '--rc': r.color }}
            onClick={() => wrapRef.current
              ?.querySelector(`.hz-ch[data-i="${i + 1}"]`)
              ?.scrollIntoView({ behavior: 'smooth' })}
          >
            <i /><span>{r.name}</span>
          </button>
        ))}
      </nav>

      {/* Off on the cover, which is a title card and carries its own furniture;
          it fades in as the reel starts. It stays for the chapters because
          below 860px the rail is hidden and this is the only thing saying
          which of the rides you are on. */}
      <div className={`hz-count${active === 0 ? ' is-off' : ''}`} aria-hidden="true">
        <b>{String(Math.min(Math.max(active, 1), rides.length)).padStart(2, '0')}</b>
        <span> / {String(rides.length).padStart(2, '0')}</span>
      </div>

      {/* ── cover ── */}
      {/* A photograph, not a drawn scene: the chapters below are the reel, and
          the cover is the card in front of it. No rider either — one parked
          under the headline reads as a chapter that lost its name. */}
      <section className="hz-ch hz-cover is-live" data-i="0" style={{ '--c': COVER_ACC }}>
        <div className="hz-shot">
          <img src={`${import.meta.env.BASE_URL}riding_background.webp`} alt="" />
        </div>

        <div className="hz-cv">
          <div>
            <div className="hz-eye">Rides &amp; Journeys<i /></div>
            <h1 className="hz-h1">
              <span className="w"><i>The road</i></span>
              <span className="w"><i>becomes</i></span>
              <span className="w"><i>the story.</i></span>
            </h1>
            <p className="hz-sub">Every ride leaves something behind.</p>

            <div className="hz-tally">
              {counts.map(c => (
                <div key={c.key}>
                  <Ico d={MODE_ICON[c.key] ?? MODE_ICON.planned} />
                  <div>
                    <b>{String(c.n).padStart(2, '0')}</b>
                    <span>{c.label}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="hz-rt">
            <p className="hz-script">Good Roads<br />Better Days<i /></p>

            {next && (
              <article className="hz-next">
                <div className="nk">Next Ride</div>
                <div className="nh">
                  <Ico d={ICON.pin} />
                  <div>
                    <b>{next.destCity || next.destPlace || next.name}</b>
                    <span>{next.states?.[0] || next.destPlace || next.name}</span>
                  </div>
                </div>

                <div className="nw">
                  {next.photos?.[0]
                    ? <img src={next.photos[0]} alt="" />
                    : <RouteThumb stops={next.stops} color={next.color} />}
                </div>

                <div className="hz-nfig">
                  <div>
                    <Ico d={ICON.road} />
                    <b>{next.distance || '—'}</b><span>Distance</span>
                  </div>
                  <div>
                    <Ico d={ICON.cal} />
                    <b>{next.date || '—'}</b><span>Date</span>
                  </div>
                  <div>
                    <Ico d={ICON.flag} />
                    <b>{next.organizer}</b><span>Organizer</span>
                  </div>
                </div>

                <Link className="hz-ngo" to={`${root.rides}/${next.id}`}>
                  Explore Ride <span aria-hidden="true">→</span>
                </Link>
              </article>
            )}
          </div>
        </div>

        <div className="hz-begin"><i /><u />Scroll to begin</div>
        <div className="hz-motto">
          <u /><span>Same roads<br />A different you</span>
        </div>
      </section>

      {/* ── one chapter per ride ── */}
      {rides.map((r, i) => (
        <HorizonChapter key={r.id} ride={r} index={i} root={root} tier={tiers[r.mode]} />
      ))}

      {/* ── closing ── */}
      <section className="hz-ch hz-end" data-i={rides.length + 1} style={{ '--c': '#8b5cf6' }}>
        <div className="hz-haze" />
        <div className="hz-body">
          <h2 className="hz-title"><span className="w"><i>The road keeps going</i></span></h2>
          <p className="hz-lede">
            {/* Ahead means ahead: a ride that was called off is neither ridden
                nor coming, so counting everything that isn't completed would
                quietly put cancelled rides back on the calendar. */}
            {rides.filter(r => r.mode === 'upcoming' || r.mode === 'planned').length} of
            the {rides.length} are still ahead of the front wheel. The roads are picked;
            the dates are not.
          </p>
          <div className="hz-row">
            <Link className="hz-go" to={root.garage}>
              <span aria-hidden="true">←</span> Back to {root.label}
            </Link>
          </div>
        </div>
      </section>
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
                ...(ride.fromCity && ride.destCity ? [['🛣️', 'Route', routeLabel(ride.fromCity, ride.destCity, ride.roundTrip)]] : []),
                /* Only when someone else ran it. "Self" is the default and the
                   usual answer, so printing it here would put the same word on
                   almost every ride — the sidebar carries it unconditionally,
                   this strip is for what makes a ride different. */
                ...(ride.organizer !== 'Self'
                  ? [['👥', 'Organizer',
                      <OrganizerMark key="org" name={ride.organizer} logo={ride.organizerLogo} size={22} logoOnly />]]
                  : []),
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
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: OFF }}>{routeLabel(ride.fromCity, ride.destCity, ride.roundTrip)}</div>
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

          {/* COMPLIMENTS — renders nothing unless the ride has perks listed */}
          <ComplimentsPoster ride={ride} />

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
          {statRows(ride).length > 0 && (
            <motion.div {...up(0.2)} style={{ background: BG2, border: `1px solid ${BD}`, borderRadius: 16, overflow: 'hidden' }}>
              <div style={{ padding: '16px 22px', borderBottom: `1px solid ${BD}`, fontSize: '0.6rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--accent)', fontWeight: 700 }}>Ride Stats</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 1, background: BD }}>
                {statRows(ride).map(([k, v]) => (
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
                ['Organizer',
                  <OrganizerMark key="org" name={ride.organizer} logo={ride.organizerLogo} size={18} logoOnly
                    style={{ justifyContent: 'flex-end' }} />],
                /* Place AND city — "Kariya Kattu Valasu, Kangayam". This is the
                   one spot with room for the full answer; everywhere tighter
                   shows the city alone. */
                /* End, not destination — on a loop the ride finishes back at
                   the start, and `end*` is the pair that says so. */
                ['Start', placeLabel(ride.fromPlace, ride.fromCity)],
                ['End',   placeLabel(ride.endPlace,  ride.endCity)],
                ['Mode',  ride.mode],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '9px 0', borderBottom: `1px solid ${BD}` }}>
                  <span style={{ fontSize: '0.68rem', color: D3, letterSpacing: '0.1em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{k}</span>
                  {/* Right-aligned because a two-part place name wraps to a
                      second line, and a ragged left edge under the first line
                      reads as broken. */}
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: OFF, textTransform: 'capitalize', textAlign: 'right' }}>{v}</span>
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
            {otherRides.map(r => (
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
