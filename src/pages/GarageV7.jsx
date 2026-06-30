/**
 * The Garage — V7
 * Dashboard overview page — each section is a compact card.
 * Ride Map section matches the reference screenshot layout.
 * Clicking any ride opens /garage/v7/rides/:id for full detail.
 */

import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import {
  bike, accessories, routes, rideStats,
  costTracker, maintenance, vlogs,
} from '../data/garage'
import cfg from '../data/config.json'

// ─── Design tokens ────────────────────────────────────────────────────────────
const BG   = '#0d0b14'
const BG2  = '#13111c'
const BG3  = '#1a1826'
const CARD = '#181625'
const BD   = 'rgba(255,255,255,0.07)'
const BD2  = 'rgba(255,255,255,0.12)'
const W    = '#ffffff'
const OFF  = '#f0eee8'
const D1   = 'rgba(240,238,232,0.7)'
const D2   = 'rgba(240,238,232,0.4)'
const D3   = 'rgba(240,238,232,0.2)'
const ACC  = 'var(--accent)'   // purple from theme
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-48px' },
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

// Inject shared leaflet styles once
function ensureMapStyles() {
  if (document.getElementById('v7-map-style')) return
  const s = document.createElement('style')
  s.id = 'v7-map-style'
  s.textContent = `
    @keyframes v7pulse { 0%{transform:scale(1);opacity:.7} 100%{transform:scale(2.4);opacity:0} }
    .v7tip { background:transparent!important;border:none!important;box-shadow:none!important;padding:0!important; }
    .v7tip::before { display:none!important; }
    .leaflet-container { background:#0d0b14!important; }
  `
  document.head.appendChild(s)
}

// City coords for the overview map (Tamil Nadu focus)
const OV_CITIES = {
  chennai:    { lat: 13.0827, lng: 80.2707, label: 'Chennai',    home: true  },
  yelagiri:   { lat: 12.5793, lng: 78.6393, label: 'Yelagiri'              },
  pondy:      { lat: 11.9416, lng: 79.8083, label: 'Pondicherry'           },
  coimbatore: { lat: 11.0168, lng: 76.9558, label: 'Coimbatore'            },
  kodai:      { lat: 10.2381, lng: 77.4892, label: 'Kodaikanal'            },
  rameswaram: { lat:  9.2876, lng: 79.3129, label: 'Rameswaram'            },
}

const OV_ROUTES = [
  { from: 'chennai',    to: 'yelagiri',   color: '#a78bfa', rid: 'r1' },
  { from: 'chennai',    to: 'pondy',       color: '#f97316', rid: 'r2' },
  { from: 'chennai',    to: 'rameswaram',  color: '#facc15', rid: 'r4' },
  { from: 'coimbatore', to: 'chennai',     color: '#22c55e', rid: 'r3' },
  { from: 'coimbatore', to: 'kodai',       color: '#38bdf8', rid: 'r5' },
]

// ─── Overview Map component ───────────────────────────────────────────────────
function OverviewMap({ onRouteClick }) {
  const mapRef   = useRef(null)
  const lMap     = useRef(null)
  const layers   = useRef([])

  useEffect(() => {
    let mounted = true
    loadLeaflet().then(L => {
      if (!mounted || !mapRef.current || lMap.current) return
      ensureMapStyles()

      const map = L.map(mapRef.current, {
        center: [11.5, 78.8], zoom: 7,
        zoomControl: false, attributionControl: false, scrollWheelZoom: false,
      })
      lMap.current = map

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        { subdomains: 'abcd', maxZoom: 19 }).addTo(map)

      // Draw each route via OSRM — full line at once + GPU CSS dash animation
      OV_ROUTES.forEach((r, i) => {
        const fc = OV_CITIES[r.from], tc = OV_CITIES[r.to]
        if (!fc || !tc) return
        const url = `https://router.project-osrm.org/route/v1/driving/${fc.lng},${fc.lat};${tc.lng},${tc.lat}?overview=full&geometries=geojson`
        fetch(url).then(res => res.json()).then(data => {
          if (!mounted || !data.routes?.[0]) return
          const coords = data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng])
          // Glow
          L.polyline(coords, { color: r.color, weight: 8, opacity: 0.12, smoothFactor: 1, interactive: false }).addTo(map)
          // Main line — drawn fully, animated via CSS
          const poly = L.polyline(coords, { color: r.color, weight: 3, opacity: 0.9, smoothFactor: 1, lineCap: 'round' }).addTo(map)
          poly.on('click', () => onRouteClick(r.rid))
          poly.on('mouseover', () => { poly.setStyle({ weight: 5, opacity: 1 }) })
          poly.on('mouseout',  () => { poly.setStyle({ weight: 3, opacity: 0.9 }) })
          layers.current.push(poly)
          const el = poly.getElement()
          if (el && el.getTotalLength) {
            const len = el.getTotalLength()
            el.style.strokeDasharray = len
            el.style.strokeDashoffset = len
            el.style.transition = `stroke-dashoffset 1.1s ${0.15 * i}s ease-out`
            requestAnimationFrame(() => { el.style.strokeDashoffset = '0' })
          }
        }).catch(() => {})
      })

      // City markers
      Object.entries(OV_CITIES).forEach(([key, city]) => {
        const c = city.home ? '#a78bfa' : '#c4b5fd'
        const sz = city.home ? 18 : 13
        const icon = L.divIcon({
          className: '',
          html: `<div style="position:relative;display:flex;align-items:center;justify-content:center;width:${sz+14}px;height:${sz+14}px">
            <div style="width:${sz}px;height:${sz}px;border-radius:50%;background:${c};border:2px solid rgba(255,255,255,0.85);box-shadow:0 0 10px ${c}88;position:relative;z-index:2"></div>
            <div style="position:absolute;width:${sz+14}px;height:${sz+14}px;border-radius:50%;background:${c}28;animation:v7pulse 2.2s ease-out infinite;z-index:1"></div>
          </div>`,
          iconSize: [sz + 14, sz + 14],
          iconAnchor: [(sz + 14) / 2, (sz + 14) / 2],
        })
        const dir = ['chennai','pondy','rameswaram'].includes(key) ? 'right' : 'left'
        const m = L.marker([city.lat, city.lng], { icon }).addTo(map)
        m.bindTooltip(
          `<div style="background:rgba(13,11,20,0.95);border:1px solid rgba(167,139,250,0.35);color:#f0eee8;font-family:system-ui,sans-serif;font-size:11px;font-weight:700;padding:3px 9px;border-radius:4px;white-space:nowrap;pointer-events:none">${city.home ? '🏍️ ' : ''}${city.label}</div>`,
          { permanent: true, direction: dir, offset: [dir === 'right' ? 10 : -10, 0], className: 'v7tip' }
        )
      })
    })
    return () => {
      mounted = false
      if (lMap.current) { lMap.current.remove(); lMap.current = null }
    }
  }, [])

  return <div ref={mapRef} style={{ position: 'absolute', inset: 0 }} />
}

// ─── Section wrapper card ─────────────────────────────────────────────────────
function SectionCard({ children, style: sx }) {
  return (
    <div style={{
      background: CARD, border: `1px solid ${BD}`,
      borderRadius: 16, overflow: 'hidden',
      ...sx,
    }}>
      {children}
    </div>
  )
}

// ─── Card header ──────────────────────────────────────────────────────────────
function CardHeader({ label, title, action, onAction }) {
  return (
    <div style={{ padding: '20px 24px 16px', borderBottom: `1px solid ${BD}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div>
        <div style={{ fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: ACC, fontWeight: 700, marginBottom: 3 }}>{label}</div>
        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: OFF, letterSpacing: '-0.01em' }}>{title}</h3>
      </div>
      {action && (
        <button onClick={onAction}
          style={{ fontSize: '0.72rem', color: D2, background: 'none', border: `1px solid ${BD}`, padding: '5px 14px', borderRadius: 999, cursor: 'pointer', fontFamily: 'var(--sans)', transition: 'all 0.2s' }}
          onMouseEnter={e => { e.currentTarget.style.color = OFF; e.currentTarget.style.borderColor = BD2 }}
          onMouseLeave={e => { e.currentTarget.style.color = D2;  e.currentTarget.style.borderColor = BD  }}>
          {action}
        </button>
      )}
    </div>
  )
}

// ─── Stat pill ────────────────────────────────────────────────────────────────
function StatRow({ label, value }) {
  return (
    <div style={{ padding: '10px 0', borderBottom: `1px solid ${BD}` }}>
      <div style={{ fontSize: '0.62rem', color: D3, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: '1.05rem', fontWeight: 800, color: OFF, letterSpacing: '-0.01em' }}>{value}</div>
    </div>
  )
}

// ─── 01 · HERO BANNER ────────────────────────────────────────────────────────
function HeroBanner() {
  return (
    <div style={{
      position: 'relative', borderRadius: 16, overflow: 'hidden', minHeight: 200,
      background: `linear-gradient(135deg, #1a0a2e 0%, #0d0b14 60%)`,
      border: `1px solid ${BD}`,
      display: 'flex', alignItems: 'center',
    }}>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 60% 80% at 80% 50%, rgba(124,58,237,0.18) 0%, transparent 70%)' }} />
      <div style={{ position: 'relative', zIndex: 2, padding: '32px 36px' }}>
        <motion.div {...fadeUp()}>
          <div style={{ fontSize: '0.65rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: ACC, marginBottom: 10, fontWeight: 600 }}>
            Royal Enfield Shotgun 650 · Graphite Black · Chennai
          </div>
          <h1 style={{ fontSize: 'clamp(2rem,5vw,3.5rem)', fontFamily: "'Playfair Display',serif", fontWeight: 700, color: W, margin: '0 0 12px', lineHeight: 1.05, letterSpacing: '-0.03em' }}>
            The Garage<span style={{ color: ACC }}>.</span>
          </h1>
          <p style={{ fontSize: '0.9rem', color: D1, maxWidth: 420, lineHeight: 1.75, margin: '0 0 24px', fontWeight: 300 }}>
            My motorcycle, my rides, my gear — all documented here.
          </p>
          <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
            {[['12,547', 'KM Ridden'], ['47', 'Rides'], ['15', 'Accessories'], ['1 Year', 'Ownership']].map(([v, l]) => (
              <div key={l}>
                <div style={{ fontSize: 'clamp(1.2rem,2.5vw,1.8rem)', fontWeight: 800, color: W, lineHeight: 1, letterSpacing: '-0.02em' }}>{v}</div>
                <div style={{ fontSize: '0.6rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: D3, marginTop: 4 }}>{l}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
      {/* Bike silhouette */}
      <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '45%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8rem', opacity: 0.06, userSelect: 'none', pointerEvents: 'none' }}>
        🏍️
      </div>
    </div>
  )
}

// ─── 02 · RIDE MAP OVERVIEW (matches reference screenshot) ───────────────────
function RideMapOverview({ navigate }) {
  const completedRoutes = routes.filter(r => r.mode === 'completed')

  return (
    <SectionCard>
      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr 220px', minHeight: 340 }} className="ridemap-v7">

        {/* LEFT — stats */}
        <div style={{ borderRight: `1px solid ${BD}`, padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 0 }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: OFF, marginBottom: 16 }}>Rides &amp; Routes</div>
          <StatRow label="Total Rides" value="24" />
          <StatRow label="Total Distance" value="12,500+ km" />
          <StatRow label="Longest Ride" value="570 km" />
          <StatRow label="States Explored" value="2" />
          <div style={{ marginTop: 'auto', paddingTop: 20 }}>
            <button onClick={() => navigate('/garage/v7/rides')}
              style={{ width: '100%', padding: '10px', background: 'transparent', border: `1px solid ${BD}`, color: D2, fontFamily: 'var(--sans)', fontWeight: 600, fontSize: '0.75rem', cursor: 'pointer', borderRadius: 8, transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = ACC; e.currentTarget.style.color = ACC }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = BD;  e.currentTarget.style.color = D2 }}>
              View All Rides →
            </button>
          </div>
        </div>

        {/* CENTER — map */}
        <div style={{ position: 'relative', background: BG }}>
          <OverviewMap onRouteClick={rid => navigate(`/garage/v7/rides/${rid}`)} />
          {/* Route count badge */}
          <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 10, background: 'rgba(13,11,20,0.85)', border: `1px solid ${BD}`, borderRadius: 8, padding: '6px 12px', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: ACC }} />
            <span style={{ fontSize: '0.7rem', color: D1, fontWeight: 600 }}>{completedRoutes.length} completed rides</span>
          </div>
          <div style={{ position: 'absolute', bottom: 10, right: 10, zIndex: 10, fontSize: '0.6rem', color: D3, background: 'rgba(13,11,20,0.7)', padding: '3px 8px', borderRadius: 4 }}>
            Click a route to explore
          </div>
        </div>

        {/* RIGHT — ride list */}
        <div style={{ borderLeft: `1px solid ${BD}`, display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '16px 16px 10px', borderBottom: `1px solid ${BD}`, fontSize: '0.6rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: D3, fontWeight: 700 }}>
            Recent Rides
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {completedRoutes.map((r, i) => (
              <motion.div key={r.id} {...fadeUp(i * 0.06)}
                onClick={() => navigate(`/garage/v7/rides/${r.id}`)}
                style={{ padding: '12px 16px', borderBottom: `1px solid ${BD}`, cursor: 'pointer', transition: 'background 0.18s', display: 'flex', alignItems: 'flex-start', gap: 10 }}
                onMouseEnter={e => e.currentTarget.style.background = BG2}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: r.color, flexShrink: 0, marginTop: 4, boxShadow: `0 0 6px ${r.color}` }} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600, color: OFF, fontSize: '0.82rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</div>
                  <div style={{ fontSize: '0.68rem', color: D3, marginTop: 2 }}>{r.distance} · {r.date}</div>
                  {r.rating && <div style={{ fontSize: '0.65rem', color: '#f59e0b', marginTop: 2 }}>{'★'.repeat(Math.round(r.rating))} {r.rating}</div>}
                </div>
                <div style={{ marginLeft: 'auto', fontSize: '0.7rem', color: D3, flexShrink: 0 }}>›</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
      <style>{`@media(max-width:900px){.ridemap-v7{grid-template-columns:1fr!important}.ridemap-v7>*:first-child,.ridemap-v7>*:last-child{display:none!important}}`}</style>
    </SectionCard>
  )
}

// ─── 03 · BIKE OVERVIEW ───────────────────────────────────────────────────────
function BikeOverview() {
  return (
    <SectionCard>
      <CardHeader label="My Machine" title={bike.name} action="Full Details →" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }} className="bike-ov-grid">
        <div style={{ padding: '20px 24px', borderRight: `1px solid ${BD}` }}>
          <img src="https://images.unsplash.com/photo-1609630875171-b1321377ee65?w=600&q=85" alt={bike.name}
            style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', borderRadius: 10, marginBottom: 16, opacity: 0.85 }} />
          <p style={{ fontSize: '0.83rem', color: D2, lineHeight: 1.75, margin: 0 }}>{bike.story.slice(0, 150)}…</p>
        </div>
        <div style={{ padding: '20px 24px' }}>
          {[['Color', bike.color], ['Purchased', bike.purchaseDate], ['Location', bike.location], ['Odometer', `${bike.odometer.toLocaleString('en-IN')} KM`], ['Investment', bike.totalInvestment], ['Engine', '648cc Parallel Twin']].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: `1px solid ${BD}`, gap: 12 }}>
              <span style={{ fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: D3 }}>{k}</span>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: OFF, textAlign: 'right' }}>{v}</span>
            </div>
          ))}
        </div>
      </div>
      <style>{`@media(max-width:640px){.bike-ov-grid{grid-template-columns:1fr!important}}`}</style>
    </SectionCard>
  )
}

// ─── 04 · ACCESSORIES OVERVIEW ────────────────────────────────────────────────
function AccessoriesOverview() {
  return (
    <SectionCard>
      <CardHeader label="Setup" title="What's On My Bike" action="All 15 Accessories →" />
      <div style={{ padding: '16px 24px 20px', display: 'flex', gap: 10, overflowX: 'auto', scrollbarWidth: 'none' }}>
        {accessories.slice(0, 6).map((a, i) => {
          const catColors = { Navigation: ACC, Camera: '#ec4899', Safety: '#22c55e', Protection: '#f59e0b', Touring: '#3b82f6', Communication: '#a855f7' }
          const c = catColors[a.category] || ACC
          return (
            <div key={a.id} style={{ minWidth: 130, background: BG2, border: `1px solid ${BD}`, borderRadius: 10, padding: '14px 14px', flexShrink: 0, borderTop: `2px solid ${c}` }}>
              <div style={{ fontSize: '0.55rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: c, fontWeight: 700, marginBottom: 6 }}>{a.category}</div>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: OFF, lineHeight: 1.3, marginBottom: 4 }}>{a.name}</div>
              <div style={{ fontSize: '0.68rem', color: D3 }}>₹{a.price.toLocaleString('en-IN')}</div>
            </div>
          )
        })}
        <div style={{ minWidth: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', color: D3, fontSize: '0.75rem', flexShrink: 0 }}>+9 more</div>
      </div>
    </SectionCard>
  )
}

// ─── 05 · STATS OVERVIEW ─────────────────────────────────────────────────────
function StatsOverview() {
  const max = Math.max(...rideStats.monthlyData.map(d => d.km))
  const chartRef = useRef(null)
  const inView   = useInView(chartRef, { once: true })

  return (
    <SectionCard>
      <CardHeader label="Analytics" title="Ride Statistics" action="Full Stats →" />
      <div style={{ padding: '16px 24px 20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }} className="stats-ov-grid">
        <div>
          {[
            ['Total Rides', rideStats.summary.totalRides],
            ['Distance',    `${rideStats.summary.totalDistance.toLocaleString('en-IN')} km`],
            ['Hours',       `${rideStats.summary.rideHours}h`],
            ['Top Speed',   `${rideStats.summary.topSpeed} km/h`],
          ].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: `1px solid ${BD}` }}>
              <span style={{ fontSize: '0.7rem', color: D3 }}>{k}</span>
              <span style={{ fontSize: '0.88rem', fontWeight: 700, color: OFF }}>{v}</span>
            </div>
          ))}
        </div>
        <div ref={chartRef}>
          <div style={{ fontSize: '0.6rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: D3, marginBottom: 10 }}>Monthly KM</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 80 }}>
            {rideStats.monthlyData.map((d, i) => {
              const h = Math.round((d.km / max) * 72)
              return (
                <div key={i} title={`${d.month}: ${d.km}`} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                  <motion.div initial={{ height: 0 }} animate={inView ? { height: h } : {}} transition={{ duration: 0.5, delay: i * 0.04 }}
                    style={{ width: '100%', background: i === rideStats.monthlyData.length - 1 ? ACC : BD2, borderRadius: '2px 2px 0 0', minHeight: 2 }} />
                  <span style={{ fontSize: '0.45rem', color: D3 }}>{d.month.slice(0, 1)}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
      <style>{`@media(max-width:480px){.stats-ov-grid{grid-template-columns:1fr!important}}`}</style>
    </SectionCard>
  )
}

// ─── 06 · VLOGS OVERVIEW ─────────────────────────────────────────────────────
function VlogsOverview() {
  const [playing, setPlaying] = useState(null)
  const featured = vlogs.filter(v => v.category === 'Latest').slice(0, 4)
  return (
    <SectionCard>
      <CardHeader label="On the Road" title="Latest Vlogs" action={<a href={cfg.social?.youtube?.href || '#'} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>YouTube →</a>} />
      <div style={{ padding: '16px 24px 20px', display: 'flex', gap: 12, overflowX: 'auto', scrollbarWidth: 'none' }}>
        {featured.map((v, i) => (
          <div key={i} onClick={() => setPlaying(v)}
            style={{ minWidth: 180, flexShrink: 0, borderRadius: 10, overflow: 'hidden', background: BG2, border: `1px solid ${BD}`, cursor: 'pointer', transition: 'transform 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
            <div style={{ position: 'relative', aspectRatio: '16/9' }}>
              <img src={`https://img.youtube.com/vi/${v.id}/mqdefault.jpg`} alt={v.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={e => { e.target.src = 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=320&q=70' }}
              />
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,77,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="#fff"><path d="M8 5v14l11-7z"/></svg>
                </div>
              </div>
              <span style={{ position: 'absolute', bottom: 5, right: 6, background: 'rgba(0,0,0,0.8)', color: '#fff', fontSize: '0.6rem', padding: '1px 5px', borderRadius: 3 }}>{v.duration}</span>
            </div>
            <div style={{ padding: '10px 12px' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 600, color: OFF, lineHeight: 1.3 }}>{v.title}</div>
              <div style={{ fontSize: '0.62rem', color: D3, marginTop: 3 }}>{(v.views / 1000).toFixed(1)}K · {v.date}</div>
            </div>
          </div>
        ))}
      </div>
      <AnimatePresence>
        {playing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setPlaying(null)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <motion.div initial={{ scale: 0.92 }} animate={{ scale: 1 }} exit={{ scale: 0.92 }}
              onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 900, background: '#000', borderRadius: 10, overflow: 'hidden', position: 'relative' }}>
              <button onClick={() => setPlaying(null)} style={{ position: 'absolute', top: -36, right: 0, background: 'none', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '4px 12px', cursor: 'pointer', fontFamily: 'var(--sans)', fontSize: '0.68rem', borderRadius: 4 }}>CLOSE ✕</button>
              <div style={{ aspectRatio: '16/9' }}>
                <iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${playing.id}?autoplay=1`} title={playing.title} frameBorder="0" allow="autoplay; fullscreen" allowFullScreen style={{ display: 'block' }} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </SectionCard>
  )
}

// ─── 07 · COST + MAINTENANCE OVERVIEW ────────────────────────────────────────
function CostMaintenanceOverview() {
  const total = costTracker.categories.reduce((s, c) => s + c.amount, 0)
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }} className="cost-maint-grid">
      {/* Cost */}
      <SectionCard>
        <CardHeader label="Investment" title="Cost Tracker" />
        <div style={{ padding: '16px 20px 20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 16 }}>
            {[['₹3.1L', 'Total'], ['₹8.2K', 'Monthly'], ['₹24.9', 'Per KM']].map(([v, l]) => (
              <div key={l} style={{ textAlign: 'center', padding: '10px 8px', background: BG2, borderRadius: 8 }}>
                <div style={{ fontWeight: 800, fontSize: '0.95rem', color: OFF }}>{v}</div>
                <div style={{ fontSize: '0.6rem', color: D3, marginTop: 3, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{l}</div>
              </div>
            ))}
          </div>
          {costTracker.categories.slice(0, 4).map((c, i) => {
            const pct = (c.amount / total) * 100
            return (
              <div key={i} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: 4 }}>
                  <span style={{ color: D2 }}>{c.icon} {c.name}</span>
                  <span style={{ color: OFF, fontWeight: 600 }}>₹{c.amount.toLocaleString('en-IN')}</span>
                </div>
                <div style={{ height: 3, background: BG3, borderRadius: 999 }}>
                  <motion.div initial={{ width: 0 }} whileInView={{ width: `${pct}%` }} viewport={{ once: true }}
                    transition={{ duration: 0.7, delay: i * 0.08 }}
                    style={{ height: '100%', background: c.color, borderRadius: 999 }} />
                </div>
              </div>
            )
          })}
        </div>
      </SectionCard>
      {/* Maintenance */}
      <SectionCard>
        <CardHeader label="Service" title="Maintenance" />
        <div style={{ padding: '12px 20px 16px' }}>
          {maintenance.upcoming.map((item, i) => {
            const pc = { high: '#ef4444', medium: '#f59e0b', low: '#22c55e' }[item.priority]
            const pct = item.dueKm ? Math.min((item.currentKm / item.dueKm) * 100, 100) : null
            return (
              <div key={i} style={{ padding: '10px 0', borderBottom: `1px solid ${BD}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: pct ? 6 : 0 }}>
                  <span style={{ fontSize: '0.82rem', color: OFF, fontWeight: 500 }}>{item.icon} {item.type}</span>
                  <span style={{ fontSize: '0.6rem', color: pc, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{item.priority}</span>
                </div>
                {pct !== null && (
                  <>
                    <div style={{ height: 3, background: BG3, borderRadius: 999 }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: pct > 85 ? '#ef4444' : pc, borderRadius: 999, transition: 'width 0.6s' }} />
                    </div>
                    <div style={{ fontSize: '0.62rem', color: D3, marginTop: 3 }}>{(item.dueKm - item.currentKm).toLocaleString('en-IN')} KM remaining</div>
                  </>
                )}
                {item.dueDate && <div style={{ fontSize: '0.68rem', color: D3 }}>Due: {item.dueDate}</div>}
              </div>
            )
          })}
        </div>
      </SectionCard>
      <style>{`@media(max-width:640px){.cost-maint-grid{grid-template-columns:1fr!important}}`}</style>
    </div>
  )
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function GarageV7() {
  const navigate = useNavigate()

  return (
    <div style={{ background: BG, minHeight: '100vh', paddingTop: 80 }}>
      {/* Version switcher */}
      <div style={{ position: 'fixed', top: 72, left: '50%', transform: 'translateX(-50%)', zIndex: 60, display: 'flex', background: 'rgba(13,11,20,0.9)', backdropFilter: 'blur(20px)', border: `1px solid ${BD}`, overflow: 'hidden', borderRadius: 999 }} className="sw7">
        {[['Std','/garage'],['V6','/garage/v6'],['V7 ✦',null]].map(([l,to]) => (
          to ? <Link key={l} to={to} style={{ padding:'7px 14px', fontSize:'0.62rem', letterSpacing:'0.1em', textTransform:'uppercase', fontWeight:600, fontFamily:'var(--sans)', color:D3, textDecoration:'none', whiteSpace:'nowrap' }}>{l}</Link>
             : <div key={l} style={{ padding:'7px 14px', fontSize:'0.62rem', letterSpacing:'0.1em', textTransform:'uppercase', fontWeight:700, fontFamily:'var(--sans)', background:'var(--accent)', color:'#fff', whiteSpace:'nowrap' }}>{l}</div>
        ))}
        <style>{`@media(max-width:480px){.sw7{display:none!important}}`}</style>
      </div>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: 'clamp(20px,4vw,48px)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <motion.div {...fadeUp()}><HeroBanner /></motion.div>

          {/* Ride Map — full width */}
          <motion.div {...fadeUp(0.05)}>
            <div style={{ marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: ACC, fontWeight: 700 }}>Ride Map &amp; Journeys</span>
              </div>
              <Link to="/garage/v7/rides" style={{ fontSize: '0.72rem', color: D3, textDecoration: 'none', border: `1px solid ${BD}`, padding: '5px 14px', borderRadius: 999, transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.color = OFF; e.currentTarget.style.borderColor = BD2 }}
                onMouseLeave={e => { e.currentTarget.style.color = D3;  e.currentTarget.style.borderColor = BD  }}>
                View All Rides →
              </Link>
            </div>
            <RideMapOverview navigate={navigate} />
          </motion.div>

          {/* Bike + Accessories */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 20 }} className="bike-acc-grid">
            <motion.div {...fadeUp(0.08)}><BikeOverview /></motion.div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <motion.div {...fadeUp(0.10)}><AccessoriesOverview /></motion.div>
              <motion.div {...fadeUp(0.12)}><StatsOverview /></motion.div>
            </div>
          </div>

          {/* Vlogs */}
          <motion.div {...fadeUp(0.14)}><VlogsOverview /></motion.div>

          {/* Cost + Maintenance */}
          <motion.div {...fadeUp(0.16)}><CostMaintenanceOverview /></motion.div>
        </div>
      </div>
      <style>{`@media(max-width:860px){.bike-acc-grid{grid-template-columns:1fr!important}}`}</style>
    </div>
  )
}
