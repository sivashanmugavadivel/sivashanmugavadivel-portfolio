/**
 * MyGarageVlogDetail — /mygarage/vlogs/:id
 *
 * One vlog, as a hub rather than just a player: the film, the write-up, the
 * frame grabs, the ride route drawn from real coordinates, the Instagram reels
 * from the same trip, the rest of the channel, and the blog posts that cover
 * the same ground.
 *
 * This is the "Collage" design out of vlog-data-design-7-collage.html, which
 * borrows a section from each of the six detail-page studies:
 *
 *   Frame        Cinema Reel     — the hero docks into a corner player
 *   Write-up     Editorial Paper — cream inset, drop cap, pull quote
 *   Frame grabs  Cinema Reel     — the drifting sprocket-hole reel
 *   Route        the ride page   — Leaflet + OSRM, static
 *   Instagram    Editorial Paper — taped-in polaroids
 *   Up next      Cinema Reel     — the video cards
 *
 * Content comes from public/mygarage/vlog/config/<name>.json via ../data/vlogs.
 * Every section is skipped when its data is absent, so a vlog with nothing but
 * a YouTube link and a title still renders a coherent page.
 *
 * Deliberately dark whatever the site theme is, the same way the ride detail
 * page is — the design is built around a lit screen on a black surround. The
 * cream write-up panel and white polaroids are meant to read as objects laid
 * on top of it.
 */

import { useEffect, useRef, useState, Fragment } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
/* the same lightbox the rest of the site opens photos in */
import Lightbox from 'yet-another-react-lightbox'
import Captions from 'yet-another-react-lightbox/plugins/captions'
import Counter from 'yet-another-react-lightbox/plugins/counter'
import Zoom from 'yet-another-react-lightbox/plugins/zoom'
import 'yet-another-react-lightbox/styles.css'
import 'yet-another-react-lightbox/plugins/captions.css'
import 'yet-another-react-lightbox/plugins/counter.css'
import {
  vlogs, vlogById, relatedVlogs, attachPosts, vlogsChannel,
} from '../data/vlogs'
import cfg from '../data/config.json'

/* Type sizes are REM-SCALED by 16/18: the design was drawn against a 16px
   root and this site's :root is 18px, so each rem here is 8/9 of the value in
   vlog-data-design-7-collage.html and computes to the identical pixel size.
   Divide by 0.8889 to get back to the template's numbers. */

/* ── palette ─────────────────────────────────────────────────────────────── */
const BG = '#07070a'
const PANEL = '#0d0d12'
const CARD = '#13131b'
const OFF = '#f4f3f7'
const D1 = 'rgba(244,243,247,0.62)'
const D2 = 'rgba(244,243,247,0.38)'
const D3 = 'rgba(244,243,247,0.17)'
const BD = 'rgba(255,255,255,0.08)'
const ACC = '#e0bb3c'          // Wild Honey, off the tank
const ACC2 = '#ffd968'

/* the write-up panel */
const PAPER = '#f4f1ea'
const PAPER2 = '#eae5da'
const INK = '#171410'
const INK2 = '#3a352d'
const PRULE = 'rgba(23,20,16,0.16)'
const RED = '#b5322a'

/* the ride page's own tokens, so the map section matches /mygarage/rides/:id */
const RBG = '#0d0b14'
const RBG2 = '#13111c'
const RBD = 'rgba(255,255,255,0.07)'
const ROFF = '#f0eee8'
const RD1 = 'rgba(240,238,232,0.7)'
const RD2 = 'rgba(240,238,232,0.4)'
const RD3 = 'rgba(240,238,232,0.2)'

/* The three families the design was drawn in. Bebas Neue is already loaded
   site-wide; Manrope and Fraunces are not, so `useDesignFonts` below fetches
   them when this page mounts and only then — the rest of the site keeps its
   own Inter and pays nothing for these. */
const DISP = "'Bebas Neue', sans-serif"
const SERIF = "'Fraunces', 'Playfair Display', Georgia, serif"
const SANS = "'Manrope', 'Inter', system-ui, sans-serif"
const FONT_HREF =
  'https://fonts.googleapis.com/css2' +
  '?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;0,9..144,900;1,9..144,400' +
  '&family=Manrope:wght@300;400;500;600;700;800' +
  '&display=swap'

/** Adds the stylesheet once and leaves it — a second visit shouldn't refetch. */
function useDesignFonts() {
  useEffect(() => {
    if (document.getElementById('vd-fonts')) return
    const l = document.createElement('link')
    l.id = 'vd-fonts'
    l.rel = 'stylesheet'
    l.href = FONT_HREF
    document.head.appendChild(l)
  }, [])
}

const EASE = [0.16, 1, 0.3, 1]

const NAV_H = 64               // the fixed navbar, so the docked player clears it

const clamp01 = n => Math.min(1, Math.max(0, n))
const lerp = (a, b, t) => a + (b - a) * t
const easeIO = t => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2)

/* ── reveal-on-scroll, used by every section ─────────────────────────────── */
function Reveal({ children, delay = 0, y = 34, style }) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: 0.85, delay, ease: EASE }}
      style={style}
    >
      {children}
    </motion.div>
  )
}

function SectionHead({ title, note }) {
  return (
    <Reveal>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 28 }}>
        <h2 style={{
          fontFamily: DISP, fontSize: 'clamp(1.3333rem,3.6vw,2.5778rem)', lineHeight: 1,
          color: OFF, letterSpacing: '0.02em', margin: 0,
        }}>{title}</h2>
        <i style={{ flex: 1, height: 1, background: BD, minWidth: 16 }} />
        {note && (
          <span style={{
            fontSize: '0.4889rem', fontWeight: 800, letterSpacing: '0.22em',
            textTransform: 'uppercase', color: ACC, whiteSpace: 'nowrap',
          }}>{note}</span>
        )}
      </div>
    </Reveal>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   The route map, lifted from GarageV7RideDetail's DetailMap — dark Carto
   tiles, the real OSRM road geometry with a glow layer under it and a
   dash-draw reveal, and pulsing A/B pins.

   Static here: every way of moving it is switched off, so it behaves like an
   image and never swallows a page scroll. Built only once it scrolls into
   view, so opening the page doesn't pull Leaflet and a routing request you
   may never look at.
   ══════════════════════════════════════════════════════════════════════════ */
function loadLeaflet() {
  return new Promise((resolve, reject) => {
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
    s.onerror = reject
    document.head.appendChild(s)
  })
}

function RouteMap({ ride }) {
  const mount = useRef(null)
  const card = useRef(null)
  const map = useRef(null)
  const [state, setState] = useState('idle')   // idle | ready | routed | straight | failed

  useEffect(() => {
    if (!ride) return
    let alive = true
    const el = card.current
    if (!el) return

    /* wait until it's nearly on screen before doing any of this */
    const io = new IntersectionObserver(entries => {
      if (!entries.some(e => e.isIntersecting)) return
      io.disconnect()

      loadLeaflet().then(L => {
        if (!alive || !mount.current || map.current) return
        setState('ready')

        const m = L.map(mount.current, {
          center: ride.mapCenter || [11.5, 78.8],
          zoom: ride.mapZoom || 8,
          zoomControl: false, attributionControl: false,
          dragging: false, scrollWheelZoom: false, doubleClickZoom: false,
          touchZoom: false, boxZoom: false, keyboard: false,
          /* fractional zoom, so fitBounds frames the route exactly instead of
             snapping out to the nearest whole level — it matters more here
             because there is no way to correct it by hand */
          zoomSnap: 0,
        })
        map.current = m

        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
          { subdomains: 'abcd', maxZoom: 19 }).addTo(m)

        const colour = ride.color || ACC
        const o = ride.osrm
        if (!o) { setState('straight'); return }

        const url = 'https://router.project-osrm.org/route/v1/driving/' +
          `${o.fromLng},${o.fromLat};${o.toLng},${o.toLat}` +
          '?overview=full&geometries=geojson'

        fetch(url)
          .then(r => r.json())
          .then(data => {
            if (!alive || !data.routes?.[0]) throw new Error('no route')
            const coords = data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng])
            L.polyline(coords, {
              color: colour, weight: 10, opacity: 0.15, smoothFactor: 1, interactive: false,
            }).addTo(m)
            const poly = L.polyline(coords, {
              color: colour, weight: 4, opacity: 0.95, smoothFactor: 1, lineCap: 'round',
            }).addTo(m)
            m.fitBounds(poly.getBounds(), { padding: [40, 40] })
            /* draw it on, through the SVG path Leaflet just made */
            const path = poly.getElement()
            if (path?.getTotalLength) {
              const len = path.getTotalLength()
              path.style.strokeDasharray = len
              path.style.strokeDashoffset = len
              path.style.transition = 'stroke-dashoffset 1.4s ease-out'
              requestAnimationFrame(() => { path.style.strokeDashoffset = '0' })
            }
            setState('routed')
          })
          .catch(() => {
            if (!alive) return
            /* OSRM unreachable, or the ride isn't routable — straight line */
            L.polyline([[o.fromLat, o.fromLng], [o.toLat, o.toLng]], {
              color: colour, weight: 3, opacity: 0.85, dashArray: '6 8', interactive: false,
            }).addTo(m)
            setState('straight')
          })

        const pin = (lat, lng, label, isFrom) => {
          const icon = L.divIcon({
            className: '',
            html:
              `<div style="position:relative;display:flex;align-items:center;justify-content:center;width:30px;height:30px">
                 <div style="width:16px;height:16px;border-radius:50%;background:${colour};border:2.5px solid rgba(255,255,255,0.9);box-shadow:0 0 14px ${colour}99;position:relative;z-index:2;display:flex;align-items:center;justify-content:center">
                   <span style="font-size:8px;color:#fff;font-weight:900">${isFrom ? 'A' : 'B'}</span>
                 </div>
                 <div style="position:absolute;width:28px;height:28px;border-radius:50%;background:${colour}25;animation:vd-pulse 2.4s ease-out infinite;z-index:1"></div>
               </div>`,
            iconSize: [30, 30], iconAnchor: [15, 15],
          })
          L.marker([lat, lng], { icon, interactive: false, keyboard: false })
            .addTo(m)
            .bindTooltip(
              `<div style="background:rgba(13,11,20,0.95);border:1px solid ${colour}60;color:#f0eee8;font-family:system-ui,sans-serif;font-size:11px;font-weight:700;padding:4px 10px;border-radius:4px;white-space:nowrap">${label}</div>`,
              { permanent: true, direction: 'right', offset: [12, 0], className: 'vd-tip' }
            )
        }
        if (o) {
          pin(o.fromLat, o.fromLng, ride.fromCity || 'Start', true)
          pin(o.toLat, o.toLng, ride.toCity || 'End', false)
        }
      }).catch(() => alive && setState('failed'))
    }, { rootMargin: '200px' })

    io.observe(el)
    return () => {
      alive = false
      io.disconnect()
      if (map.current) { map.current.remove(); map.current = null }
    }
  }, [ride])

  if (!ride) return null
  const colour = ride.color || ACC
  const real = state === 'routed'

  return (
    <div className="vd-ridewrap">
      <Reveal style={{ minWidth: 0 }}>
        <div ref={card} style={{
          borderRadius: 16, overflow: 'hidden', border: `1px solid ${RBD}`,
          height: 460, background: RBG,
        }}>
          <div style={{
            padding: '16px 20px', background: RBG2, borderBottom: `1px solid ${RBD}`,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            gap: 12, flexWrap: 'wrap',
          }}>
            <div>
              <div style={{
                fontSize: '0.5333rem', letterSpacing: '0.18em', textTransform: 'uppercase',
                color: colour, fontWeight: 700, marginBottom: 2,
              }}>Route Map</div>
              <div style={{ fontSize: '0.7556rem', fontWeight: 600, color: ROFF }}>
                {ride.fromCity} → {ride.toCity}
              </div>
              {ride.via?.length > 0 && (
                <div style={{ fontSize: '0.6044rem', color: RD3, marginTop: 2 }}>
                  via {ride.via.join(' → ')}
                </div>
              )}
            </div>
            <span style={{
              fontSize: '0.5778rem', padding: '3px 10px', borderRadius: 999, whiteSpace: 'nowrap',
              background: real ? 'rgba(34,197,94,0.12)' : 'rgba(245,158,11,0.12)',
              color: real ? '#22c55e' : '#f59e0b',
              border: `1px solid ${real ? 'rgba(34,197,94,0.25)' : 'rgba(245,158,11,0.25)'}`,
            }}>
              {real ? 'Real Road Route' : 'Planning Stage'}
            </span>
          </div>
          <div style={{ height: 'calc(100% - 68px)', position: 'relative', minHeight: 300 }}>
            {/* pointer-events off: a static plate must not advertise itself as grabbable */}
            <div ref={mount} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />
            {state === 'idle' && (
              <div style={{
                position: 'absolute', inset: 0, display: 'grid', placeItems: 'center',
                fontSize: '0.5867rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: RD3,
              }}>Loading map…</div>
            )}
            {state === 'failed' && (
              <div style={{
                position: 'absolute', inset: 0, display: 'grid', placeItems: 'center',
                fontSize: '0.5867rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: RD3,
              }}>Map needs a connection</div>
            )}
          </div>
        </div>
      </Reveal>

      <Reveal delay={0.08}>
        <div style={{
          background: RBG2, border: `1px solid ${RBD}`, borderRadius: 14, overflow: 'hidden',
        }}>
          <div style={{ height: 4, background: colour }} />
          <div style={{ padding: 18 }}>
            <div style={{
              fontSize: '0.5333rem', letterSpacing: '0.18em', textTransform: 'uppercase',
              color: RD3, marginBottom: 12, fontWeight: 700,
            }}>Ride Info</div>
            {[
              ['Distance', ride.distance],
              ['Duration', ride.time || '—'],
              ['Date', ride.date],
              ['Start', ride.fromCity || '—'],
              ['End', ride.toCity || '—'],
              ['Mode', ride.mode],
            ].map(([k, v]) => (
              <div key={k} style={{
                display: 'flex', justifyContent: 'space-between', gap: 10,
                padding: '9px 0', borderBottom: `1px solid ${RBD}`,
              }}>
                <span style={{
                  fontSize: '0.6044rem', color: RD3, letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                }}>{k}</span>
                <span style={{
                  fontSize: '0.7289rem', fontWeight: 600, color: ROFF,
                  textTransform: 'capitalize', textAlign: 'right',
                }}>{v}</span>
              </div>
            ))}
            {ride.via?.length > 0 && (
              <div style={{ marginTop: 14 }}>
                <div style={{
                  fontSize: '0.5333rem', letterSpacing: '0.14em', textTransform: 'uppercase',
                  color: RD3, marginBottom: 8,
                }}>Via</div>
                {ride.via.map(w => (
                  <div key={w} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 5 }}>
                    <i style={{ width: 5, height: 5, borderRadius: '50%', background: colour, flexShrink: 0 }} />
                    <span style={{ fontSize: '0.6933rem', color: RD2 }}>{w}</span>
                  </div>
                ))}
              </div>
            )}
            <Link
              to={`/mygarage/rides/${ride.id}`}
              className="vd-fullride"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
                marginTop: 18, padding: '12px 14px', border: `1px solid ${RBD}`, borderRadius: 10,
                textDecoration: 'none', fontSize: '0.6756rem', fontWeight: 600, color: RD2,
              }}
            >
              Read the full ride <i style={{ fontStyle: 'normal', fontSize: '0.8444rem' }}>→</i>
            </Link>
          </div>
        </div>
      </Reveal>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   The page
   ══════════════════════════════════════════════════════════════════════════ */
export default function MyGarageVlogDetail() {
  const { id } = useParams()
  const reduce = useReducedMotion()

  /* No id (bare /mygarage/vlogs) opens the newest one. */
  const vlog = id ? vlogById(id) : vlogs[0]

  /* Blog posts resolve asynchronously (the blog lives in files, not config).
     The result is stamped with the vlog it belongs to, so moving between vlogs
     can never show the previous one's posts while the next lot load — and the
     effect never has to setState synchronously to clear them. */
  const [resolved, setResolved] = useState({ id: null, posts: [] })
  useEffect(() => {
    if (!vlog) return undefined
    let alive = true
    attachPosts(vlog)
      .then(p => { if (alive) setResolved({ id: vlog.id, posts: p }) })
      .catch(() => {})
    return () => { alive = false }
  }, [vlog])
  const posts = resolved.id === vlog?.id ? resolved.posts : []

  /* ── the docking frame ── */
  const runway = useRef(null)
  const frame = useRef(null)
  const plate = useRef(null)
  const heroType = useRef(null)
  const playBtn = useRef(null)
  const clipRef = useRef(null)
  const reelWrap = useRef(null)
  const reelTrack = useRef(null)
  const ambientRef = useRef(null)
  const [playing, setPlaying] = useState(false)
  const [docked, setDocked] = useState(false)
  /* which frame grab is open full size; -1 is closed */
  const [lightbox, setLightbox] = useState(-1)

  /* ── ambient motion behind the title ────────────────────────────────────
     A local silent mp4 (`clip`) is the cheap way to do this: ~0.3 MB and no
     third-party player. Where a vlog has no clip, fall back to its YouTube
     embed autoplaying muted — browsers permit that, and it beats a still.

     Held back for a moment so it isn't competing with the first paint, and
     skipped entirely for anyone who asked for reduced motion. `nocookie`
     because this one starts without the reader touching anything. */
  const wantsAmbient = vlog?.hasVideo && !vlog?.clip && !reduce
  const [ambientOn, setAmbientOn] = useState(false)
  useEffect(() => {
    if (!wantsAmbient) return undefined
    const t = setTimeout(() => setAmbientOn(true), 900)
    return () => clearTimeout(t)
  }, [wantsAmbient, vlog?.id])

  const ambientSrc = vlog?.hasVideo
    ? `https://www.youtube-nocookie.com/embed/${vlog.yt}?` + [
      'autoplay=1', 'mute=1', 'controls=0', 'loop=1', `playlist=${vlog.yt}`,
      'modestbranding=1', 'rel=0', 'playsinline=1', 'disablekb=1', 'fs=0',
      'iv_load_policy=3',
    ].join('&')
    : ''
  const showAmbient = wantsAmbient && ambientOn && !playing

  useEffect(() => {
    if (!vlog) return
    let raf = null

    const layout = () => {
      const rw = runway.current, fr = frame.current
      if (!rw || !fr) return
      const vw = window.innerWidth, vh = window.innerHeight
      const phone = vw < 1000
      const p = clamp01(window.scrollY / Math.max(1, rw.offsetHeight - vh))
      const t = easeIO(p)

      /* Docks to the TOP-right, under the navbar: bottom-left is the
         back-to-top button and bottom-right is the social FAB. */
      const dw = phone ? vw - 24 : Math.min(300, vw * 0.24)
      const dh = dw * 9 / 16
      const dx = phone ? 12 : vw - dw - 22
      const dy = NAV_H + 12

      fr.style.width = `${lerp(vw, dw, t)}px`
      fr.style.height = `${lerp(vh, dh, t)}px`
      fr.style.transform = `translate(${lerp(0, dx, t)}px,${lerp(0, dy, t)}px)`
      fr.style.borderRadius = `${lerp(0, 12, t)}px`
      setDocked(t > 0.72)

      /* the type leaves before the frame gets small enough to crop it */
      const gone = clamp01(p / 0.42)
      if (heroType.current) {
        heroType.current.style.opacity = String(1 - gone)
        heroType.current.style.transform = `translateY(${gone * -60}px)`
        heroType.current.style.pointerEvents = gone > 0.5 ? 'none' : 'auto'
      }
      if (playBtn.current && !playing) {
        playBtn.current.style.opacity = String(1 - gone)
        playBtn.current.style.pointerEvents = gone > 0.5 ? 'none' : 'auto'
      }
      /* parallax inside the frame itself */
      if (plate.current) {
        plate.current.style.transform =
          `scale(${lerp(1.14, 1, t)}) translateY(${lerp(0, -4, t)}%)`
        plate.current.style.filter = `brightness(${lerp(0.82, 1, t)})`
      }

      /* ── sizing the silent preview: fill the frame whatever shape it is ──
         An iframe can't do object-fit, and YouTube's player is always 16:9 —
         a vertical Short arrives pillarboxed inside it, with the picture only
         `playerHeight × 9/16` wide.

         So work backwards from the picture: make the player big enough that
         its picture covers the frame on both axes, and let the overflow —
         including the player's own black bars — be clipped by the frame's
         hidden edges. That is object-fit: cover, done by arithmetic.

         A landscape video fills its player, so the sums collapse to the
         obvious answer and nothing is wasted. */
      if (ambientRef.current) {
        const fw = lerp(vw, dw, t), fh = lerp(vh, dh, t)
        const A = vlog.isShort ? 9 / 16 : 16 / 9   // the picture's own ratio
        /* the picture is fitted inside a 16:9 player, so it is limited by
           whichever axis runs out first */
        const byHeight = A <= 16 / 9
        const playerH = byHeight
          ? Math.max(fh, fw / A)                   // picture height == player height
          : Math.max(fh * (16 / 9) / A, fw * 9 / 16)
        ambientRef.current.style.height = `${Math.ceil(playerH)}px`
        ambientRef.current.style.width = `${Math.ceil(playerH * 16 / 9)}px`
      }
    }

    const drift = () => {
      const wrap = reelWrap.current, track = reelTrack.current
      if (!wrap || !track) return
      const r = wrap.getBoundingClientRect()
      const p = clamp01((window.innerHeight - r.top) / (window.innerHeight + r.height))
      track.style.transform = `translateX(${-p * (track.scrollWidth / 2)}px)`
    }

    const onScroll = () => {
      if (raf) return
      raf = requestAnimationFrame(() => { layout(); drift(); raf = null })
    }
    const onResize = () => { layout(); drift() }

    layout(); drift()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
      if (raf) cancelAnimationFrame(raf)
    }
    /* showAmbient is in here so the preview iframe gets measured the moment it
       mounts, rather than staying unsized until the first scroll */
  }, [vlog, playing, showAmbient])

  /* the silent local clip, where the vlog has one */
  useEffect(() => {
    const v = clipRef.current
    if (!v || reduce) return
    v.play().then(() => { v.style.opacity = '1' }).catch(() => {})
  }, [vlog, reduce])

  const play = () => setPlaying(true)

  /* ── nothing filmed yet ── */
  if (!vlogs.length) {
    return (
      <Shell>
        <div style={{
          minHeight: '70vh', display: 'grid', placeItems: 'center',
          textAlign: 'center', padding: '120px 24px 60px',
        }}>
          <div style={{ maxWidth: 480 }}>
            <div style={{ fontSize: '2.6667rem', marginBottom: 18 }}>🎬</div>
            <div style={{
              fontSize: '0.5333rem', fontWeight: 800, letterSpacing: '0.3em',
              textTransform: 'uppercase', color: ACC, marginBottom: 16,
            }}>Coming soon</div>
            <h1 style={{
              fontFamily: DISP, fontSize: 'clamp(1.9556rem,7vw,3.9111rem)', color: OFF,
              lineHeight: 0.92, marginBottom: 14,
            }}>The reel is<br />still loading</h1>
            <p style={{ fontSize: '0.8rem', lineHeight: 1.8, color: D1 }}>
              The camera is mounted and the rides are planned. This page fills itself in the
              moment a ride video lands in the garage.
            </p>
            <Link to="/mygarage" style={backLink}>← Back to My Garage</Link>
          </div>
        </div>
      </Shell>
    )
  }

  /* ── an id that doesn't match anything ── */
  if (!vlog) {
    return (
      <Shell>
        <div style={{
          minHeight: '70vh', display: 'grid', placeItems: 'center',
          textAlign: 'center', padding: '120px 24px 60px',
        }}>
          <div style={{ maxWidth: 480 }}>
            <div style={{ fontSize: '2.6667rem', marginBottom: 18 }}>🔍</div>
            <h1 style={{
              fontFamily: DISP, fontSize: 'clamp(1.7778rem,6vw,3.2rem)', color: OFF,
              lineHeight: 0.95, marginBottom: 14,
            }}>No vlog by that name</h1>
            <p style={{ fontSize: '0.8rem', lineHeight: 1.8, color: D1, marginBottom: 8 }}>
              Nothing is filed under <code style={{ color: ACC }}>{id}</code>.
              {vlogs.length > 0 && ' Here is what there is:'}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
              {vlogs.map(v => (
                <Link key={v.id} to={`/mygarage/vlogs/${v.id}`} style={{
                  ...backLink, marginTop: 0, textAlign: 'left',
                }}>{v.title} →</Link>
              ))}
            </div>
            <Link to="/mygarage" style={backLink}>← Back to My Garage</Link>
          </div>
        </div>
      </Shell>
    )
  }

  const related = relatedVlogs(vlog, 6)
  const ride = vlog.ride
  const firstPara = vlog.description.findIndex(b => b.type === 'p')

  return (
    <Shell>
      {/* ══ 1 · the frame that docks ══ */}
      <div ref={runway} style={{ height: '210vh', position: 'relative' }}>
        <div
          ref={frame}
          style={{
            position: 'fixed', zIndex: 40, overflow: 'hidden', background: '#000',
            top: 0, left: 0, width: '100vw', height: '100vh',
            willChange: 'transform,width,height,border-radius',
            boxShadow: docked
              ? '0 26px 60px -14px rgba(0,0,0,0.92), 0 0 0 1px rgba(255,255,255,0.08)'
              : 'none',
          }}
        >
          {/* The plate is whatever picture the vlog has: its YouTube still, or
              one of its own frames, or — for a vlog with neither yet — nothing,
              in which case the honey wash below is the whole backdrop. */}
          {(vlog.posterBig || vlog.cover) ? (
            <img
              ref={plate}
              src={vlog.posterBig || vlog.cover}
              alt=""
              onError={e => {
                const img = e.currentTarget
                const next = vlog.cover && img.src !== vlog.cover ? vlog.cover : ''
                if (next) img.src = next
                else img.style.display = 'none'
              }}
              style={{
                position: 'absolute', inset: 0, width: '100%', height: '100%',
                objectFit: 'cover', willChange: 'transform,filter',
              }}
            />
          ) : (
            <div
              ref={plate}
              style={{
                position: 'absolute', inset: 0, willChange: 'transform,filter',
                background: 'linear-gradient(135deg,#241f33,#0d0d12 62%,#1f1a2d)',
              }}
            />
          )}
          {vlog.clip && !playing && (
            <video
              ref={clipRef}
              src={vlog.clip}
              muted loop playsInline preload="metadata"
              style={{
                position: 'absolute', inset: 0, width: '100%', height: '100%',
                objectFit: 'cover', opacity: 0, transition: 'opacity 1.4s ease 0.6s',
              }}
            />
          )}
          {/* Silent looping preview, for vlogs with no local clip. The iframe is
              sized by `layout()` to cover the frame, so a 16:9 embed fills a
              taller hero the way object-fit:cover would. */}
          {showAmbient && (
            <div className="vd-ambient">
              <iframe
                ref={ambientRef}
                src={ambientSrc}
                title=""
                aria-hidden="true"
                tabIndex={-1}
                allow="autoplay; encrypted-media"
                referrerPolicy="strict-origin-when-cross-origin"
              />
            </div>
          )}
          <div style={{
            position: 'absolute', inset: 0, opacity: docked ? 0.1 : 0.3,
            mixBlendMode: 'soft-light', transition: 'opacity 0.5s',
            background: `radial-gradient(60vw 60vw at 72% 18%, ${ACC}, transparent 68%)`,
          }} />
          <div style={{
            position: 'absolute', inset: 0, opacity: docked ? 0 : 1, transition: 'opacity 0.5s',
            background:
              'linear-gradient(to top, rgba(7,7,10,0.96) 2%, rgba(7,7,10,0.34) 42%, rgba(7,7,10,0.62))',
          }} />

          {playing && (
            <iframe
              title={vlog.title}
              src={`${vlog.embed}?autoplay=1&rel=0&modestbranding=1`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0, zIndex: 6 }}
            />
          )}
          {!playing && vlog.hasVideo && (
            <button
              ref={playBtn}
              onClick={play}
              aria-label={`Play ${vlog.title}`}
              className="vd-play"
              style={{
                position: 'absolute', top: '42%', left: '50%',
                transform: 'translate(-50%,-50%)', zIndex: 4,
                width: 'clamp(68px,9vw,102px)', aspectRatio: '1', borderRadius: '50%',
                border: `1px solid ${ACC}80`, background: `${ACC}1f`,
                backdropFilter: 'blur(7px)', color: ACC2, cursor: 'pointer',
                display: 'grid', placeItems: 'center', fontSize: '1.2889rem', paddingLeft: 5,
              }}
            >▶</button>
          )}
          {/* Nothing to play yet. Say so where the play button would be, rather
              than leaving a hero that looks like a broken player. */}
          {!vlog.hasVideo && (
            <div
              ref={playBtn}
              style={{
                position: 'absolute', top: '42%', left: '50%',
                transform: 'translate(-50%,-50%)', zIndex: 4, textAlign: 'center',
                padding: '14px 24px', borderRadius: 14,
                border: `1px solid ${ACC}59`, background: 'rgba(7,7,10,0.55)',
                backdropFilter: 'blur(7px)', pointerEvents: 'none',
              }}
            >
              <div style={{ fontSize: '1.4222rem', lineHeight: 1, marginBottom: 8 }}>🎬</div>
              <div style={{
                fontSize: '0.4978rem', fontWeight: 800, letterSpacing: '0.24em',
                textTransform: 'uppercase', color: ACC,
              }}>Not filmed yet</div>
            </div>
          )}

          <div ref={heroType} style={{
            position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 3,
            padding: '0 clamp(24px,6vw,90px) clamp(52px,9vh,92px)',
            willChange: 'opacity,transform',
          }}>
            <div style={{
              fontFamily: DISP, fontSize: 'clamp(3.2rem,15vw,11.5556rem)', lineHeight: 0.74,
              color: 'transparent', WebkitTextStroke: `1.5px ${ACC}73`, letterSpacing: '0.02em',
            }}>{String(vlog.n).padStart(2, '0')}</div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 13, marginBottom: 15, flexWrap: 'wrap',
            }}>
              {vlog.category && (
                <b style={{
                  fontSize: '0.5511rem', fontWeight: 800, letterSpacing: '0.3em',
                  textTransform: 'uppercase', color: ACC,
                }}>{vlog.category}</b>
              )}
              <i style={{ display: 'block', width: 46, height: 1, background: ACC, opacity: 0.5 }} />
              <span style={{
                fontSize: '0.5511rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: D2,
              }}>
                {[vlog.when.label, vlog.kind, vlog.duration].filter(Boolean).join(' · ')}
              </span>
            </div>
            <h1 style={{
              fontFamily: DISP, fontSize: 'clamp(2.0444rem,7.4vw,5.6889rem)', lineHeight: 0.88,
              letterSpacing: '0.01em', color: OFF, maxWidth: '20ch', margin: 0,
            }}>{vlog.title}</h1>
            {vlog.subtitle && (
              <p style={{
                marginTop: 16, maxWidth: '56ch', fontSize: 'clamp(0.7111rem,1.4vw,0.8711rem)',
                lineHeight: 1.7, color: D1,
              }}>{vlog.subtitle}</p>
            )}
            <div style={{
              display: 'flex', gap: 'clamp(18px,4vw,44px)', flexWrap: 'wrap', marginTop: 24,
            }}>
              {[
                [vlog.duration, 'Runtime'],
                [vlog.views, 'Views'],
                [ride?.distance, 'Route'],
                [vlog.instagram.length || null, 'Reels'],
                [vlog.when.year, 'Filmed'],
              ].filter(([v]) => v).map(([v, k]) => (
                <div key={k}>
                  <b style={{
                    display: 'block', fontFamily: DISP,
                    fontSize: 'clamp(1.2444rem,3vw,2.0444rem)', color: OFF, lineHeight: 1,
                  }}>{v}</b>
                  <span style={{
                    fontSize: '0.4889rem', fontWeight: 800, letterSpacing: '0.2em',
                    textTransform: 'uppercase', color: D2,
                  }}>{k}</span>
                </div>
              ))}
            </div>
          </div>

          {/* the docked strip: no chapters in this design, so a plain readout */}
          <div style={{
            position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 7,
            padding: '22px 11px 9px', opacity: docked && !playing ? 1 : 0,
            transition: 'opacity 0.4s', pointerEvents: 'none',
            background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)',
            display: 'flex', justifyContent: 'space-between', gap: 9, alignItems: 'baseline',
          }}>
            <b style={{
              fontSize: '0.4978rem', fontWeight: 800, letterSpacing: '0.14em',
              textTransform: 'uppercase', color: ACC, whiteSpace: 'nowrap',
              overflow: 'hidden', textOverflow: 'ellipsis',
            }}>{vlog.title}</b>
            {vlog.duration && (
              <span style={{ fontSize: '0.48rem', color: 'rgba(255,255,255,0.55)', flexShrink: 0 }}>
                {vlog.duration}
              </span>
            )}
          </div>
        </div>
      </div>

      <div style={{ position: 'relative', zIndex: 10, background: BG, paddingTop: 'clamp(46px,8vw,90px)' }}>
        {/* breadcrumb — the navbar owns the top-left corner, so it lives in the flow */}
        <div className="vd-wrap">
          <Reveal y={16}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
              marginBottom: 'clamp(24px,4vw,44px)', fontSize: '0.5867rem',
              letterSpacing: '0.14em', textTransform: 'uppercase', color: D3,
            }}>
              <Link to="/mygarage" className="vd-crumb">My Garage</Link>
              <span>/</span>
              <Link to="/mygarage#vlogs" className="vd-crumb">Vlogs</Link>
              <span>/</span>
              <span style={{ color: D1 }}>{vlog.title}</span>
            </div>
          </Reveal>
        </div>

        {/* ══ 2 · the write-up, on paper ══ */}
        {vlog.description.length > 0 && (
          <div className="vd-wrap">
            <SectionHead title="The Write-up" note={[vlog.kind, vlog.when.short].filter(Boolean).join(' · ')} />
            <Reveal>
              <article className="vd-paper">
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
                  marginBottom: 18, position: 'relative', zIndex: 2,
                }}>
                  {vlog.category && (
                    <b style={{
                      fontSize: '0.5333rem', fontWeight: 700, letterSpacing: '0.26em',
                      textTransform: 'uppercase', color: RED,
                    }}>{vlog.category}</b>
                  )}
                  <i style={{ width: 38, height: 1, background: RED, display: 'block' }} />
                  <span style={{
                    fontSize: '0.5333rem', letterSpacing: '0.16em', textTransform: 'uppercase',
                    color: 'rgba(23,20,16,0.5)',
                  }}>
                    {[vlog.when.label, vlog.duration, vlog.views && `${vlog.views} views`]
                      .filter(Boolean).join(' · ')}
                  </span>
                </div>
                <div className="vd-prose">
                  {vlog.description.map((b, i) => (
                    <Fragment key={i}>
                      {b.type === 'p' && (
                        <p className={i === firstPara ? 'vd-first' : undefined}>{b.text}</p>
                      )}
                      {b.type === 'heading' && <h3>{b.text}</h3>}
                      {b.type === 'quote' && (
                        <blockquote>
                          <p>{b.text}</p>
                          {b.cite && <cite>{b.cite}</cite>}
                        </blockquote>
                      )}
                    </Fragment>
                  ))}
                </div>
              </article>
            </Reveal>
          </div>
        )}

        {/* ══ 3 · frame grabs ══ */}
        {vlog.images.length > 0 && (
          <>
            <div className="vd-wrap">
              <SectionHead title="Frame Grabs" note={`${vlog.images.length} kept`} />
            </div>
            <div ref={reelWrap} className="vd-reelstrip">
              <div ref={reelTrack} className="vd-reeltrack">
                {/* the strip is the list twice over so it can drift forever —
                    so a tile's index has to wrap back to the real photo */}
                {[...vlog.images, ...vlog.images].map((p, i) => (
                  <figure
                    key={`${p.id}-${i}`}
                    className="vd-pl"
                    onClick={() => setLightbox(i % vlog.images.length)}
                    role="button"
                    tabIndex={0}
                    aria-label={`Open ${p.alt} full size`}
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault(); setLightbox(i % vlog.images.length)
                      }
                    }}
                  >
                    <img src={p.src} alt={p.alt} loading="lazy" />
                    <span className="vd-plzoom" aria-hidden>⤢</span>
                    {/* no caption and no timestamp → no band, rather than an
                        empty gradient over the bottom of every photo */}
                    {(p.caption || p.at) && (
                      <figcaption>
                        <span>{p.caption}</span>
                        {p.at && <em>{p.at}</em>}
                      </figcaption>
                    )}
                  </figure>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ══ 3b · more clips from this vlog ══ */}
        {vlog.videos.length > 0 && (
          <div className="vd-wrap">
            <SectionHead
              title="Videos"
              note={`${vlog.videos.length} clip${vlog.videos.length === 1 ? '' : 's'} · tap to play`}
            />
            <Reveal>
              <Rail width="245px" label="clips" deps={vlog.videos.length}>
                {vlog.videos.map(v => <ClipCard key={v.key} clip={v} />)}
              </Rail>
            </Reveal>
          </div>
        )}

        {/* ══ 4 · the route ══ */}
        {ride && (
          <div className="vd-wrap">
            <SectionHead title="The Route" note={`${ride.distance} · ${ride.mode}`} />
            <RouteMap ride={ride} />
          </div>
        )}

        {/* ══ 5 · instagram, as taped prints ══ */}
        {vlog.instagram.length > 0 && (
          <div className="vd-wrap">
            <SectionHead
              title="On Instagram"
              note={`${cfg.social?.instagram?.handle || ''} · tap a print`}
            />
            <Reveal>
              <InstaStrip
                reels={vlog.instagram}
                /* only seen for the moment before the embed paints */
                posterFor={i => vlog.instagram[i]?.thumbnail
                  || vlog.images[i % Math.max(1, vlog.images.length)]?.src}
              />
            </Reveal>
          </div>
        )}

        {/* ══ 6 · up next ══ */}
        {related.length > 0 && (
          <div className="vd-wrap">
            <SectionHead title="Up Next" note={`${vlogs.length} in all`} />
            <Reveal>
              <Rail width="245px" label="vlogs" deps={related.length}>
                {related.map(r => (
                  <Link key={r.id} to={`/mygarage/vlogs/${r.id}`} className="vd-nc">
                    <div className="vd-th">
                      <img
                        src={r.poster} alt="" loading="lazy"
                        onError={e => { e.currentTarget.src = r.cover }}
                      />
                      {r.clip && <video src={r.clip} muted loop playsInline preload="none" />}
                      {r.category && <div className="vd-badge">{r.category}</div>}
                      {r.duration && <div className="vd-dur">{r.duration}</div>}
                    </div>
                    <div className="vd-tx">
                      <b>{r.title}</b>
                      {r.excerpt && <span>{r.excerpt}</span>}
                      <u>{[r.when.short, r.views && `${r.views} views`].filter(Boolean).join(' · ')}</u>
                    </div>
                  </Link>
                ))}
              </Rail>
            </Reveal>
          </div>
        )}

        {/* ══ 7 · posts ══ */}
        {posts.length > 0 && (
          <div className="vd-wrap">
            <SectionHead title="Read More" note="From the blog" />
            <Reveal>
              <div className="vd-posts">
                {posts.map(p => (
                  <Link key={p.slug} to={p.href} className="vd-post">
                    <div className="vd-cv">
                      {p.cover
                        ? <img src={p.cover} alt="" loading="lazy" />
                        : <div className="vd-noimg" />}
                      {p.icon && <div className="vd-ic">{p.icon}</div>}
                    </div>
                    <div className="vd-ptx">
                      <u>{[p.category, p.when.short].filter(Boolean).join(' · ')}</u>
                      <b>{p.title}</b>
                      {p.excerpt && <span>{p.excerpt}</span>}
                    </div>
                    <div className="vd-go">→</div>
                  </Link>
                ))}
              </div>
            </Reveal>
          </div>
        )}

        {/* ══ footer ══ */}
        <div className="vd-wrap">
          <Reveal>
            <div className="vd-foot">
              <img
                className="vd-av"
                src={`${import.meta.env.BASE_URL}${cfg.personal.avatar}`}
                alt=""
              />
              <div>
                <b style={{ display: 'block', fontSize: '0.7556rem', fontWeight: 700, color: OFF }}>
                  {cfg.social?.youtube?.handle || cfg.personal.name}
                </b>
                <span style={{ fontSize: '0.5778rem', color: D2 }}>
                  {[
                    `${vlogs.length} vlog${vlogs.length === 1 ? '' : 's'}`,
                    vlog.instagram.length && `${vlog.instagram.length} reels here`,
                  ].filter(Boolean).join(' · ')}
                </span>
              </div>
              {/* nothing to watch yet → point at the channel instead of
                  offering a link that goes nowhere in particular */}
              <a
                className="vd-cta"
                href={vlog.url || vlogsChannel}
                target="_blank"
                rel="noopener noreferrer"
              >{vlog.hasVideo ? 'Watch on YouTube' : 'Visit the channel'}</a>
            </div>
          </Reveal>
        </div>
      </div>

      {/* full-size viewer for the frame grabs — arrow keys, swipe and
          pinch-zoom arrive with it, and it fades the photo up rather than
          snapping it open */}
      <Lightbox
        open={lightbox >= 0}
        index={lightbox < 0 ? 0 : lightbox}
        close={() => setLightbox(-1)}
        slides={vlog.images.map(p => ({
          src: p.src,
          alt: p.alt,
          title: p.caption || undefined,
          description: p.at ? `at ${p.at}` : undefined,
        }))}
        plugins={[Captions, Counter, Zoom]}
        animation={{ fade: 300, swipe: 400 }}
        controller={{ closeOnBackdropClick: true }}
        styles={{ container: { backgroundColor: 'rgba(7,7,10,0.94)' } }}
      />

      <PageStyles />
    </Shell>
  )
}

/* ── one of the vlog's extra clips ────────────────────────────────────────
   Same card as Up Next, so the two read as one family, but it plays in place
   rather than navigating: nothing is built until it's tapped, so a vlog with
   eight clips still costs eight thumbnails and no players. */
function ClipCard({ clip }) {
  const [open, setOpen] = useState(false)
  const label = clip.title || 'Clip'
  return (
    <div
      className="vd-nc vd-clip"
      onClick={() => setOpen(true)}
      role="button"
      tabIndex={open ? -1 : 0}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen(true) }
      }}
      aria-label={open ? undefined : `Play ${label}`}
    >
      <div className="vd-th">
        {open ? (
          clip.isFile ? (
            <video src={clip.src} poster={clip.poster || undefined}
              controls autoPlay playsInline className="vd-clipplay" />
          ) : (
            <iframe
              className="vd-clipplay"
              src={`${clip.embed}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
              title={label}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          )
        ) : (
          <>
            {clip.poster
              ? <img src={clip.poster} alt="" loading="lazy" />
              : <div className="vd-noimg" />}
            <div className="vd-clipplaybtn" aria-hidden>▶</div>
            {clip.duration && <div className="vd-dur">{clip.duration}</div>}
            {clip.isFile && <div className="vd-badge">Clip</div>}
          </>
        )}
      </div>
      {(clip.title || clip.caption) && (
        <div className="vd-tx">
          {clip.title && <b>{clip.title}</b>}
          {clip.caption && <span>{clip.caption}</span>}
        </div>
      )}
    </div>
  )
}

/* Instagram's embed puts a profile header above the picture. It's a fixed
   height whatever the width, so the iframe is pushed up by exactly that much
   and the polaroid's own frame crops it away — leaving the picture where the
   print should be. */
const IG_HEADER = 54

/* ── one Instagram print ───────────────────────────────────────────────────
   There is no public way to fetch an Instagram thumbnail without an API token,
   so the embed itself is the preview — it renders the poster and its own play
   button. It mounts as soon as the strip is in view rather than on a tap, so
   the prints are never blank. `poster` is only what shows in the moment before
   the embed paints.
   ──────────────────────────────────────────────────────────────────────── */
function Polaroid({ reel, poster, live }) {
  const frameRef = useRef(null)
  /* a poster of your own beats the embed: no Instagram chrome, and it can't be
     thrown off by whatever shape the post's video happens to be */
  const own = reel.thumbnail || ''
  const showEmbed = live && !own

  /* The picture is as tall as 16/9 of the width for a reel. Sizing it here
     rather than in CSS because it is the iframe's own box that has to grow,
     and percentage heights can't see through to the parent's aspect-ratio. */
  useEffect(() => {
    if (!showEmbed) return undefined
    const fit = () => {
      const f = frameRef.current
      if (!f?.parentElement) return
      const w = f.parentElement.getBoundingClientRect().width
      if (!w) return
      f.style.height = `${Math.ceil(IG_HEADER + w * 16 / 9)}px`
    }
    fit()
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [showEmbed])

  /* nothing to caption → no band, rather than a strip of blank white */
  const labelled = !!(reel.caption || reel.hashtags.length)

  return (
    <figure className={labelled ? 'vd-pola' : 'vd-pola vd-bare'}>
      <div className="vd-im">
        {showEmbed ? (
          <iframe
            ref={frameRef}
            src={reel.embed}
            title={reel.caption || `Instagram ${reel.kind}`}
            loading="lazy"
            allowFullScreen
            scrolling="no"
            style={{ top: `-${IG_HEADER}px` }}
          />
        ) : (own || poster) ? (
          <a href={reel.url} target="_blank" rel="noopener noreferrer" className="vd-igopen">
            <img src={own || poster} alt="" loading="lazy" />
            <span className="vd-igplay" aria-hidden>▶</span>
          </a>
        ) : (
          <div className="vd-igph" />
        )}
        {!showEmbed && <div className="vd-lg">◙</div>}
      </div>
      {labelled && (
        <figcaption className="vd-pcap">
          {reel.caption && <b>{reel.caption}</b>}
          {reel.hashtags.length > 0 && <s>{reel.hashtags.slice(0, 3).join(' ')}</s>}
        </figcaption>
      )}
    </figure>
  )
}

/* ── a rail ────────────────────────────────────────────────────────────────
   One row that scrolls sideways rather than wrapping, so a section with a
   dozen things in it stays one band instead of a wall. Arrows appear only when
   there is somewhere to go, and the rail is a real scroller underneath, so a
   trackpad swipe or a touch drag works without them.

   `width` is how wide one item sits — the sections don't agree on that, and
   the point of the rail is that items keep their size however many there are.
   `onNear` fires once when the rail approaches the viewport, which is how the
   Instagram strip knows to start loading its embeds.
   ──────────────────────────────────────────────────────────────────────── */
function Rail({ children, width, label, deps, onNear }) {
  const rail = useRef(null)
  const [at, setAt] = useState({ start: true, end: true })

  useEffect(() => {
    if (!onNear) return undefined
    const el = rail.current
    if (!el) return undefined
    const io = new IntersectionObserver(es => {
      if (es.some(e => e.isIntersecting)) { onNear(); io.disconnect() }
    }, { rootMargin: '300px' })
    io.observe(el)
    return () => io.disconnect()
    /* onNear is only ever the once, so it deliberately isn't a dependency */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* which arrows are worth showing */
  useEffect(() => {
    const el = rail.current
    if (!el) return undefined
    const read = () => {
      const max = el.scrollWidth - el.clientWidth
      setAt({ start: el.scrollLeft <= 2, end: el.scrollLeft >= max - 2 })
    }
    read()
    el.addEventListener('scroll', read, { passive: true })
    window.addEventListener('resize', read)
    return () => {
      el.removeEventListener('scroll', read)
      window.removeEventListener('resize', read)
    }
  }, [deps])

  /* one item plus its gap, so an arrow steps rather than leaps */
  const step = dir => {
    const el = rail.current
    if (!el) return
    const item = el.firstElementChild
    const by = item ? item.getBoundingClientRect().width + 28 : el.clientWidth * 0.8
    el.scrollBy({ left: dir * by, behavior: 'smooth' })
  }

  const fits = at.start && at.end            // nothing to scroll to

  return (
    <div className="vd-railwrap">
      <div className="vd-rail" ref={rail} style={{ '--item': width }}>
        {children}
      </div>
      {!fits && (
        <>
          <button className="vd-arrow l" onClick={() => step(-1)}
            disabled={at.start} aria-label={`Previous ${label}`}>‹</button>
          <button className="vd-arrow r" onClick={() => step(1)}
            disabled={at.end} aria-label={`More ${label}`}>›</button>
        </>
      )}
    </div>
  )
}

/* the prints, on a rail — with their embeds held until it comes into view */
function InstaStrip({ reels, posterFor }) {
  const [live, setLive] = useState(false)
  return (
    <Rail width="230px" label="reels" deps={`${reels.length}:${live}`}
      onNear={() => setLive(true)}>
      {reels.map((r, i) => (
        <Polaroid key={r.code} reel={r} poster={posterFor(i)} live={live} />
      ))}
    </Rail>
  )
}

/* ── the dark surround the whole page sits on ──────────────────────────────
   Two declarations here restore the baseline the design was drawn against,
   because this site's :root is `18px/1.6` and the template's was `16px/normal`:

     fontSize   everything that inherits rather than setting its own size —
                the cards, and the `ch` measure on the prose column, which
                would otherwise run 12.5% wider than approved.
     lineHeight anything whose line-height isn't pinned by a rule below. At
                1.6 the polaroid captions grew past their frames.

   Rules that set either property themselves still win over this, and the rem
   values are pre-scaled (see the note at the top), so the two work together
   rather than fighting. */
function Shell({ children }) {
  useDesignFonts()
  return (
    <div style={{
      background: BG, color: D1, minHeight: '100vh', overflowX: 'hidden',
      fontFamily: SANS, fontSize: 16, lineHeight: 'normal',
    }}>
      {children}
    </div>
  )
}

const backLink = {
  display: 'inline-block', marginTop: 22, padding: '11px 22px', borderRadius: 999,
  border: `1px solid ${BD}`, color: D1, textDecoration: 'none',
  fontSize: '0.64rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase',
}

/* ══════════════════════════════════════════════════════════════════════════
   Styles that need selectors — hover states, pseudo-elements, media queries
   and the prose rules the write-up depends on.
   ══════════════════════════════════════════════════════════════════════════ */
function PageStyles() {
  return (
    <style>{`
      /* 90% of the viewport, matching .mygarage-sections on /mygarage. The
         right inset keeps text clear of the docked corner player. */
      .vd-wrap { width: 90%; margin: 0 auto; }
      @media (max-width: 760px) { .vd-wrap { width: 92%; } }
      @media (min-width: 1000px) { .vd-wrap { padding-right: 270px; } }

      .vd-crumb { color: ${D3}; text-decoration: none; transition: color .25s; }
      .vd-crumb:hover { color: ${ACC}; }

      /* the silent looping preview — centred and cropped by the frame's edges,
         and never a click target: the play button underneath it must stay
         reachable, and the whole thing is decorative */
      /* fills the frame; the player is oversized by layout() and centred, so
         the excess — bars included — is clipped here */
      .vd-ambient {
        position: absolute; inset: 0; overflow: hidden; pointer-events: none;
        opacity: 0; animation: vd-fadein 1.6s ease .3s forwards;
      }
      .vd-ambient iframe {
        position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%);
        border: 0; pointer-events: none;
      }
      @keyframes vd-fadein { to { opacity: 1 } }

      .vd-play { transition: all .4s cubic-bezier(.16,1,.3,1); }
      .vd-play::after {
        content: ''; position: absolute; inset: -1px; border-radius: 50%;
        border: 1px solid ${ACC}; animation: vd-ping 2.6s cubic-bezier(.16,1,.3,1) infinite;
      }
      .vd-play:hover { background: ${ACC}; color: #000; transform: translate(-50%,-50%) scale(1.09); }
      @keyframes vd-ping { 0% { transform: scale(1); opacity: .7 } 100% { transform: scale(1.65); opacity: 0 } }
      @keyframes vd-pulse { 0% { transform: scale(1); opacity: .8 } 100% { transform: scale(2.6); opacity: 0 } }

      /* the map is a static plate — it must not look grabbable */
      .leaflet-container { background: ${RBG} !important; cursor: default !important; }
      .vd-tip { background: transparent !important; border: none !important;
        box-shadow: none !important; padding: 0 !important; }
      .vd-tip::before { display: none !important; }

      .vd-fullride { transition: border-color .25s, color .25s, background .25s; }
      .vd-fullride:hover { color: ${ROFF} !important; background: rgba(255,255,255,.03); }
      .vd-fullride:hover i { transform: translateX(4px); }
      .vd-fullride i { transition: transform .3s cubic-bezier(.16,1,.3,1); }

      .vd-ridewrap { display: grid; grid-template-columns: 1fr 300px; gap: 24px;
        align-items: start; margin-bottom: clamp(46px,8vw,90px); }
      @media (max-width: 900px) { .vd-ridewrap { grid-template-columns: 1fr; } }

      /* ── the write-up panel ── */
      .vd-paper {
        background: ${PAPER}; color: rgba(23,20,16,.72); border-radius: 4px;
        padding: clamp(26px,5vw,64px) clamp(20px,4vw,56px);
        box-shadow: 0 40px 80px -30px rgba(0,0,0,.9), 0 0 0 1px rgba(255,255,255,.05);
        position: relative; overflow: hidden; margin-bottom: clamp(46px,8vw,90px);
      }
      /* paper tooth, scoped to the panel */
      .vd-paper::after {
        content: ''; position: absolute; inset: 0; pointer-events: none; opacity: .35;
        mix-blend-mode: multiply;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4'/%3E%3C/filter%3E%3Crect width='150' height='150' filter='url(%23n)' opacity='0.45'/%3E%3C/svg%3E");
      }
      .vd-prose { position: relative; z-index: 2; max-width: 68ch; }
      .vd-prose p { font-size: 0.8889rem; line-height: 1.86; margin: 0 0 1.35em; color: ${INK2}; }
      .vd-prose p.vd-first::first-letter {
        font-family: ${SERIF}; font-weight: 900; float: left; font-size: 4.3em;
        line-height: .78; margin: 6px 12px 0 0; color: ${RED};
      }
      .vd-prose h3 {
        font-family: ${SERIF}; font-weight: 900; font-size: clamp(1.1556rem,2.7vw,1.6889rem);
        color: ${INK}; letter-spacing: -.015em; margin: 1.7em 0 .55em; line-height: 1.15;
      }
      .vd-prose blockquote { margin: 1.9em 0; padding-left: clamp(16px,3vw,28px);
        border-left: 3px solid ${RED}; }
      .vd-prose blockquote p {
        font-family: ${SERIF}; font-style: italic; font-weight: 400;
        font-size: clamp(0.9778rem,2.3vw,1.3333rem); line-height: 1.5; color: ${INK}; margin: 0;
      }
      .vd-prose blockquote cite {
        display: block; margin-top: 9px; font-style: normal; font-size: 0.5333rem;
        font-weight: 700; letter-spacing: .16em; text-transform: uppercase;
        color: rgba(23,20,16,.26);
      }

      /* ── the drifting frame-grab reel ── */
      .vd-reelstrip { width: 90%; margin: 0 auto clamp(46px,8vw,90px);
        overflow: hidden; padding: 22px 0; position: relative; }
      @media (max-width: 760px) { .vd-reelstrip { width: 92%; } }
      .vd-reelstrip::before, .vd-reelstrip::after {
        content: ''; position: absolute; left: 0; right: 0; height: 14px; z-index: 2;
        background-image: radial-gradient(circle, #000 42%, transparent 44%);
        background-size: 26px 14px; opacity: .85;
      }
      .vd-reelstrip::before { top: 0 } .vd-reelstrip::after { bottom: 0 }
      .vd-reeltrack { display: flex; gap: 14px; will-change: transform; }
      .vd-pl {
        flex: 0 0 auto; width: clamp(176px,22vw,258px); border-radius: 4px; overflow: hidden;
        position: relative; border: 1px solid ${BD}; background: #000; margin: 0;
        cursor: zoom-in; transition: .5s cubic-bezier(.16,1,.3,1);
      }
      .vd-pl:focus-visible { outline: none; border-color: ${ACC};
        box-shadow: 0 0 0 3px ${ACC}47; }
      /* the expand hint, only once you're over the tile */
      .vd-plzoom {
        position: absolute; top: 8px; right: 8px; z-index: 2;
        width: 26px; height: 26px; border-radius: 50%; display: grid; place-items: center;
        font-size: 0.6222rem; color: #000; background: ${ACC};
        opacity: 0; transform: scale(.7);
        transition: opacity .3s, transform .3s cubic-bezier(.16,1,.3,1);
      }
      .vd-pl:hover .vd-plzoom, .vd-pl:focus-visible .vd-plzoom { opacity: 1; transform: none; }
      .vd-pl img { width: 100%; aspect-ratio: 3/2; object-fit: cover; display: block;
        filter: saturate(.85) contrast(1.05); transition: .6s cubic-bezier(.16,1,.3,1); }
      .vd-pl:hover { transform: translateY(-8px) scale(1.03); z-index: 3;
        box-shadow: 0 22px 44px -12px rgba(0,0,0,.9); }
      .vd-pl:hover img { filter: none; }
      .vd-pl figcaption {
        position: absolute; left: 0; right: 0; bottom: 0; padding: 22px 11px 9px;
        background: linear-gradient(to top, rgba(0,0,0,.92), transparent);
        font-size: 0.5422rem; color: rgba(255,255,255,.82);
        display: flex; justify-content: space-between; gap: 8px;
      }
      .vd-pl figcaption em { font-style: normal; color: ${ACC}; font-weight: 800; font-size: 0.4889rem; }

      /* ── the rail ──
         One band that scrolls sideways instead of wrapping, shared by the
         Instagram prints, the clips and Up Next. Items keep the width the
         design was drawn at (--item), so adding more lengthens the rail rather
         than shrinking the cards. */
      .vd-railwrap { position: relative; margin-bottom: clamp(46px,8vw,90px); }
      .vd-rail {
        display: flex; gap: clamp(16px,2.4vw,28px);
        overflow-x: auto; overscroll-behavior-x: contain;
        scroll-snap-type: x proximity; scrollbar-width: none;
        /* room for the polaroid tape above and every card's hover lift below */
        padding: 16px 2px 22px;
        scroll-padding-left: 2px;
      }
      .vd-rail::-webkit-scrollbar { display: none; }
      .vd-rail > * { flex: 0 0 var(--item, 245px); scroll-snap-align: start; }
      @media (max-width: 560px) { .vd-rail > * { flex-basis: 78%; } }

      /* the arrows sit over the ends of the rail */
      .vd-arrow {
        position: absolute; top: 50%; transform: translateY(-50%); z-index: 6;
        width: 40px; height: 40px; border-radius: 50%; cursor: pointer;
        display: grid; place-items: center; font-size: 1.2444rem; line-height: 1;
        color: ${ACC}; background: rgba(7,7,10,.82);
        border: 1px solid ${ACC}59; backdrop-filter: blur(6px);
        transition: background .3s, color .3s, opacity .3s, transform .3s cubic-bezier(.16,1,.3,1);
      }
      .vd-arrow.l { left: -8px; }
      .vd-arrow.r { right: -8px; }
      .vd-arrow:hover:not(:disabled) { background: ${ACC}; color: #000; }
      .vd-arrow.l:hover:not(:disabled) { transform: translateY(-50%) translateX(-3px); }
      .vd-arrow.r:hover:not(:disabled) { transform: translateY(-50%) translateX(3px); }
      .vd-arrow:disabled { opacity: 0; pointer-events: none; }
      @media (max-width: 560px) {
        /* a thumb can just swipe the rail */
        .vd-arrow { display: none; }
      }
      .vd-pola { position: relative; margin: 0; background: #fff; padding: 9px 9px 34px;
        box-shadow: 0 14px 32px -12px rgba(0,0,0,.85); transition: .5s cubic-bezier(.16,1,.3,1); }
      .vd-pola:nth-child(4n+1) { transform: rotate(-2.2deg) }
      .vd-pola:nth-child(4n+2) { transform: rotate(1.6deg) }
      .vd-pola:nth-child(4n+3) { transform: rotate(-1.1deg) }
      .vd-pola:nth-child(4n+4) { transform: rotate(2.4deg) }
      .vd-pola:hover {
        transform: rotate(0) translateY(-9px) scale(1.03); z-index: 5;
        box-shadow: 0 30px 56px -16px rgba(0,0,0,.95);
      }
      .vd-pola::before {
        content: ''; position: absolute; top: -11px; left: 50%;
        transform: translateX(-50%) rotate(-3deg); width: 64px; height: 22px;
        background: rgba(214,197,160,.55); box-shadow: inset 0 0 0 1px rgba(0,0,0,.06);
      }
      /* 3:4. Instagram sizes the media in its embed to whatever the post's own
         video is, and that can be anything from 9:16 to landscape — so no
         window aspect hides the embed's action bar for every post. This is the
         compromise: it crops cleanly for the vertical posts that make up most
         reels. Give an entry its own poster for a print with no chrome at all
         — see the instagram notes in data/vlogs.js. */
      .vd-im { position: relative; aspect-ratio: 9/12; overflow: hidden; background: #111; }
      /* an unlabelled print needs no room for a caption, just the frame margin */
      .vd-pola.vd-bare { padding-bottom: 12px; }
      .vd-im img { width: 100%; height: 100%; object-fit: cover;
        filter: contrast(1.06) saturate(.95); transition: .6s cubic-bezier(.16,1,.3,1); }
      .vd-pola:hover .vd-im img { transform: scale(1.06); }
      /* pushed up by IG_HEADER (set inline) and taller than the window, so
         Instagram's profile bar and caption fall outside the print */
      .vd-im iframe { position: absolute; left: 0; width: 100%; border: 0;
        z-index: 5; background: #000; }
      .vd-igph { position: absolute; inset: 0;
        background: linear-gradient(135deg,#2a2436,#171420 60%,#241c2e); }
      /* a print with its own poster opens Instagram rather than embedding it */
      .vd-igopen { position: absolute; inset: 0; display: block; }
      .vd-igopen img { width: 100%; height: 100%; object-fit: cover; }
      .vd-igplay { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%);
        z-index: 3; width: 40px; height: 40px; border-radius: 50%; display: grid;
        place-items: center; font-size: 0.6222rem; padding-left: 2px; color: #fff;
        background: rgba(0,0,0,.42); border: 1px solid rgba(255,255,255,.4);
        transition: .4s cubic-bezier(.16,1,.3,1); }
      .vd-pola:hover .vd-igplay { background: ${RED}; border-color: ${RED};
        transform: translate(-50%,-50%) scale(1.14); }
      .vd-lg { position: absolute; top: 7px; right: 7px; z-index: 3; font-size: 0.5333rem;
        color: #fff; width: 22px; height: 22px; border-radius: 6px; display: grid;
        place-items: center; background: linear-gradient(135deg,#f9ce34,#ee2a7b 55%,#6228d7); }
      .vd-pcap { position: absolute; left: 9px; right: 9px; bottom: 8px; }
      .vd-pcap b { display: block; font-family: ${SERIF}; font-weight: 600; font-size: 0.64rem;
        color: ${INK}; line-height: 1.3; overflow: hidden; text-overflow: ellipsis;
        white-space: nowrap; }
      .vd-pcap s { text-decoration: none; display: block; font-size: 0.4622rem;
        color: rgba(23,20,16,.26); margin-top: 2px; letter-spacing: .06em;
        overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

      /* ── up next ── the cards live on a rail (see .vd-rail above) ── */
      .vd-nc { border-radius: 14px; overflow: hidden; border: 1px solid ${BD};
        background: ${CARD}; text-decoration: none; display: block;
        transition: transform .5s cubic-bezier(.16,1,.3,1), border-color .4s; }
      .vd-nc:hover { border-color: ${ACC}73; transform: translateY(-6px); }
      .vd-th { position: relative; aspect-ratio: 16/9; overflow: hidden; background: #000; }
      .vd-th img { width: 100%; height: 100%; object-fit: cover; filter: brightness(.72);
        transition: .6s cubic-bezier(.16,1,.3,1); }
      .vd-nc:hover .vd-th img { filter: brightness(.95); transform: scale(1.07); }
      .vd-th video { position: absolute; inset: 0; width: 100%; height: 100%;
        object-fit: cover; opacity: 0; transition: opacity .5s; }
      .vd-nc:hover .vd-th video { opacity: 1; }
      .vd-badge { position: absolute; top: 9px; left: 10px; font-size: 0.4444rem; font-weight: 800;
        letter-spacing: .16em; text-transform: uppercase; padding: 3px 8px; border-radius: 99px;
        background: rgba(0,0,0,.72); color: ${ACC}; border: 1px solid ${ACC}59; z-index: 2; }
      .vd-dur { position: absolute; bottom: 9px; right: 9px; background: rgba(0,0,0,.82);
        color: #fff; font-size: 0.5067rem; font-weight: 700; padding: 2px 7px; border-radius: 4px;
        letter-spacing: .04em; z-index: 2; }
      .vd-tx { padding: 13px 14px 16px; }
      .vd-tx b { display: block; font-size: 0.7556rem; font-weight: 700; color: ${OFF};
        line-height: 1.35; }
      .vd-tx span { display: block; font-size: 0.5956rem; color: ${D2}; margin-top: 4px;
        line-height: 1.5; }
      .vd-tx u { text-decoration: none; display: inline-block; margin-top: 9px;
        font-size: 0.4622rem; font-weight: 800; letter-spacing: .16em; text-transform: uppercase;
        color: ${ACC}; }

      /* ── one of the vlog's own clips: the Up Next card, playing in place ── */
      .vd-clip { cursor: pointer; }
      .vd-clip:focus-visible { outline: none; border-color: ${ACC};
        box-shadow: 0 0 0 3px ${ACC}47; }
      .vd-clipplay { position: absolute; inset: 0; width: 100%; height: 100%;
        border: 0; z-index: 4; background: #000; object-fit: cover; }
      .vd-clipplaybtn {
        position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%);
        z-index: 3; width: 42px; height: 42px; border-radius: 50%; display: grid;
        place-items: center; font-size: 0.7111rem; padding-left: 3px; color: #000;
        background: ${ACC}; box-shadow: 0 6px 18px rgba(0,0,0,.5);
        transition: transform .4s cubic-bezier(.16,1,.3,1), background .3s;
      }
      .vd-clip:hover .vd-clipplaybtn { background: ${ACC2}; transform: translate(-50%,-50%) scale(1.12); }

      /* ── posts ── */
      .vd-posts { display: flex; flex-direction: column; gap: 12px;
        margin-bottom: clamp(46px,8vw,90px); }
      .vd-post { display: grid; grid-template-columns: 132px 1fr auto;
        gap: clamp(14px,2.5vw,24px); align-items: center; background: ${CARD};
        border: 1px solid ${BD}; border-radius: 14px; overflow: hidden; text-decoration: none;
        padding-right: clamp(14px,2.5vw,24px); transition: .5s cubic-bezier(.16,1,.3,1); }
      .vd-post:hover { border-color: ${ACC}6b; transform: translateX(7px); }
      .vd-cv { width: 132px; aspect-ratio: 4/3; overflow: hidden; background: #000;
        position: relative; }
      .vd-cv img { width: 100%; height: 100%; object-fit: cover; filter: brightness(.75);
        transition: .6s cubic-bezier(.16,1,.3,1); }
      .vd-post:hover .vd-cv img { filter: brightness(1); transform: scale(1.09); }
      .vd-noimg { position: absolute; inset: 0; background: ${PANEL}; }
      .vd-ic { position: absolute; bottom: 6px; left: 7px; font-size: 0.8889rem;
        filter: drop-shadow(0 2px 6px #000); }
      .vd-ptx { padding: 13px 0; min-width: 0; }
      .vd-ptx u { text-decoration: none; font-size: 0.4622rem; font-weight: 800;
        letter-spacing: .18em; text-transform: uppercase; color: ${ACC}; }
      .vd-ptx b { display: block; font-size: 0.8rem; font-weight: 700; color: ${OFF};
        line-height: 1.35; margin: 5px 0; }
      .vd-ptx span { display: block; font-size: 0.64rem; line-height: 1.6; color: ${D1}; }
      .vd-go { font-size: 0.9778rem; color: ${D3}; flex-shrink: 0;
        transition: .4s cubic-bezier(.16,1,.3,1); }
      .vd-post:hover .vd-go { color: ${ACC}; transform: translateX(5px); }
      @media (max-width: 700px) {
        .vd-post { grid-template-columns: 96px 1fr; padding-right: 14px; }
        .vd-cv { width: 96px; }
        .vd-go { display: none; }
      }

      /* ── footer ── */
      .vd-foot { border-top: 1px solid ${BD}; padding: clamp(32px,6vw,58px) 0 clamp(46px,8vw,80px);
        display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
      .vd-av { width: 46px; height: 46px; border-radius: 50%; object-fit: cover;
        border: 1px solid ${BD}; }
      .vd-cta { margin-left: auto; text-decoration: none; background: ${ACC}; color: #000;
        padding: 11px 22px; border-radius: 99px; font-size: 0.5689rem; font-weight: 800;
        letter-spacing: .16em; text-transform: uppercase;
        transition: .35s cubic-bezier(.16,1,.3,1); }
      .vd-cta:hover { background: ${ACC2}; transform: translateY(-2px); }
      @media (max-width: 520px) { .vd-cta { margin-left: 0; width: 100%; text-align: center; } }

      @media (prefers-reduced-motion: reduce) {
        .vd-reeltrack { transform: none !important; }
        .vd-play::after { animation: none; }
      }
    `}</style>
  )
}
