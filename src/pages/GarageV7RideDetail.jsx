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
    @keyframes v7dpulse { 0%{transform:scale(1);opacity:.8} 100%{transform:scale(2.6);opacity:0} }
    .v7dtip{background:transparent!important;border:none!important;box-shadow:none!important;padding:0!important}
    .v7dtip::before{display:none!important}
    .leaflet-container{background:#0d0b14!important}
  `
  document.head.appendChild(s)
}

// ─── Detail Map ────────────────────────────────────────────────────────────────
function DetailMap({ ride }) {
  const mapRef = useRef(null)
  const lMap   = useRef(null)
  const [zoom, setZoom] = useState(ride.mapZoom || 8)

  useEffect(() => {
    if (!ride) return
    let mounted = true
    loadLeaflet().then(L => {
      if (!mounted || !mapRef.current || lMap.current) return
      ensureDetailMapStyles()

      const center = ride.mapCenter || [11.5, 78.8]
      const map = L.map(mapRef.current, {
        center, zoom: ride.mapZoom || 8,
        zoomControl: false, attributionControl: false, scrollWheelZoom: true,
      })
      lMap.current = map

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        { subdomains: 'abcd', maxZoom: 19 }).addTo(map)

      map.on('zoomend', () => setZoom(map.getZoom()))

      // Draw route via OSRM if available
      if (ride.osrm) {
        const { fromLng, fromLat, toLng, toLat } = ride.osrm
        const url = `https://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson`
        fetch(url).then(r => r.json()).then(data => {
          if (!mounted || !data.routes?.[0]) return
          const coords = data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng])
          // Glow layer
          L.polyline(coords, { color: ride.color || 'var(--accent)', weight: 10, opacity: 0.15, smoothFactor: 1, interactive: false }).addTo(map)
          // Main line — drawn fully at once, animated via GPU CSS dash
          const poly = L.polyline(coords, { color: ride.color || 'var(--accent)', weight: 4, opacity: 0.95, smoothFactor: 1, lineCap: 'round' }).addTo(map)
          map.fitBounds(poly.getBounds(), { padding: [40, 40] })
          const el = poly.getElement()
          if (el && el.getTotalLength) {
            const len = el.getTotalLength()
            el.style.strokeDasharray = len
            el.style.strokeDashoffset = len
            el.style.transition = 'stroke-dashoffset 1.4s ease-out'
            requestAnimationFrame(() => { el.style.strokeDashoffset = '0' })
          }
        }).catch(() => {
          // Fallback straight line
          if (!mounted) return
          const from = [fromLat, fromLng], to = [toLat, toLng]
          L.polyline([from, to], { color: ride.color, weight: 3, opacity: 0.85 }).addTo(map)
        })
      }

      // From marker
      const makePin = (lat, lng, label, isFrom, color) => {
        const sz = 16
        const icon = L.divIcon({
          className: '',
          html: `<div style="position:relative;display:flex;align-items:center;justify-content:center;width:30px;height:30px">
            <div style="width:${sz}px;height:${sz}px;border-radius:50%;background:${color};border:2.5px solid rgba(255,255,255,0.9);box-shadow:0 0 14px ${color}99;position:relative;z-index:2;display:flex;align-items:center;justify-content:center">
              <span style="font-size:8px;color:#fff;font-weight:900">${isFrom ? 'A' : 'B'}</span>
            </div>
            <div style="position:absolute;width:28px;height:28px;border-radius:50%;background:${color}25;animation:v7dpulse 2.4s ease-out infinite;z-index:1"></div>
          </div>`,
          iconSize: [30, 30], iconAnchor: [15, 15],
        })
        const m = L.marker([lat, lng], { icon }).addTo(map)
        m.bindTooltip(
          `<div style="background:rgba(13,11,20,0.95);border:1px solid ${color}60;color:#f0eee8;font-family:system-ui,sans-serif;font-size:11px;font-weight:700;padding:4px 10px;border-radius:4px;white-space:nowrap">${label}</div>`,
          { permanent: true, direction: 'right', offset: [12, 0], className: 'v7dtip' }
        )
      }

      if (ride.osrm) {
        makePin(ride.osrm.fromLat, ride.osrm.fromLng, ride.fromCity || 'Start', true,  ride.color || '#a78bfa')
        makePin(ride.osrm.toLat,   ride.osrm.toLng,   ride.toCity   || 'End',   false, ride.color || '#a78bfa')
      }
    })

    return () => {
      mounted = false
      if (lMap.current) { lMap.current.remove(); lMap.current = null }
    }
  }, [ride?.id])

  const zoomIn  = () => lMap.current?.zoomIn()
  const zoomOut = () => lMap.current?.zoomOut()

  return (
    <div style={{ position: 'relative', height: '100%', minHeight: 420 }}>
      <div ref={mapRef} style={{ position: 'absolute', inset: 0 }} />
      {/* Zoom controls */}
      <div style={{ position: 'absolute', left: 14, bottom: 48, display: 'flex', flexDirection: 'column', gap: 2, zIndex: 20 }}>
        {[{sym:'+',fn:zoomIn},{sym:'−',fn:zoomOut}].map(({sym,fn},i) => (
          <button key={i} onClick={fn}
            style={{ width: 30, height: 30, background: 'rgba(13,11,20,0.92)', border: `1px solid ${BD}`, color: D2, fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4, transition: 'border-color 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = BD2}
            onMouseLeave={e => e.currentTarget.style.borderColor = BD}>
            {sym}
          </button>
        ))}
      </div>
      {/* Zoom level badge */}
      <div style={{ position: 'absolute', bottom: 10, right: 10, zIndex: 20, background: 'rgba(13,11,20,0.8)', padding: '2px 8px', borderRadius: 4, fontSize: '0.6rem', color: D2 }}>
        Zoom {zoom}
      </div>
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
                ['⏱️', 'Duration', ride.time],
                ['📅', 'Date', ride.date],
                ...(ride.fromCity && ride.toCity ? [['🛣️', 'Route', `${ride.fromCity} → ${ride.toCity}`]] : []),
              ].map(([icon, label, value]) => (
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
          <motion.div {...up(0.1)} style={{ borderRadius: 16, overflow: 'hidden', border: `1px solid ${BD}`, height: 460 }}>
            <div style={{ padding: '16px 20px', background: BG2, borderBottom: `1px solid ${BD}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
            <div style={{ height: 'calc(100% - 68px)', position: 'relative' }}>
              <DetailMap ride={ride} />
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
                ['Duration', ride.time],
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

      <style>{`@media(max-width:900px){.detail-main{grid-template-columns:1fr!important}.detail-main>*:last-child{position:static!important}}`}</style>
    </div>
  )
}
