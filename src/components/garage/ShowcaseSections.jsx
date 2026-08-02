/**
 * Garage showcase sections, extracted from GarageV8 so other pages
 * (currently /mygarage) can reuse them instead of duplicating the markup.
 *
 *   RecommendedAccessories — horizontal product carousel with coupon codes
 *   LatestVlogs            — YouTube thumbnail grid
 *   RideGallery            — photos as polaroids on a scroll-driven ticker
 *   RidesAndRoutes         — stats + Leaflet map + ride list
 *   DreamBuildRoadmap      — build phase cards
 *   DreamGarageProgress    — progress ring + wishlist items
 *   DreamGarageJourney     — every vehicle owned so far, as a timeline
 *
 * Each takes an optional `title` (pass null to hide the heading) so a host
 * page can supply its own section heading.
 */

import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useInView } from 'framer-motion'
import Lightbox from 'yet-another-react-lightbox'
import Captions from 'yet-another-react-lightbox/plugins/captions'
import Counter from 'yet-another-react-lightbox/plugins/counter'
import Zoom from 'yet-another-react-lightbox/plugins/zoom'
import 'yet-another-react-lightbox/styles.css'
import 'yet-another-react-lightbox/plugins/captions.css'
import 'yet-another-react-lightbox/plugins/counter.css'
import { vlogs, rideSummary, ridesInOrder, RIDE_MODES, dreamGarage, wishlist, garageJourney } from '../../data/garage'
import { featuredAccessories, accessoriesNote, accessoryCount } from '../../data/accessories'
import { galleryPhotos, galleryTitle, galleryNote, galleryTicker, galleryCount } from '../../data/garageGallery'
import ShowcaseCard from './ShowcaseCard'
import ShowcaseMiniMap from './ShowcaseMiniMap'
import PolaroidTicker from './PolaroidTicker'
import { BG, CARD, CARD2, BD, BD2, OFF, D1, D2, D3, ACC, ACC2, ACCBG } from './showcaseTokens'

const heading = {
  fontSize: '1.2rem',
  fontFamily: "'Playfair Display', serif",
  color: OFF,
  margin: 0,
}

// ─── Donut progress ──────────────────────────────────────────────────────────
export function Donut({ percent, size = 130, color = ACC, label }) {
  const r = size / 2 - 10
  const circ = 2 * Math.PI * r
  const [anim, setAnim] = useState(0)
  const ref = useRef(null)
  const inView = useInView(ref, { once: false })
  useEffect(() => {
    if (!inView) { setAnim(0); return }   // reset out of view, re-fill when back in view
    let s = null, raf
    const step = ts => {
      if (!s) s = ts
      const p = Math.min((ts - s) / 1300, 1)
      setAnim(p * percent)
      if (p < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [inView, percent])
  return (
    <div ref={ref} style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="9" />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="9" strokeLinecap="round"
          strokeDasharray={`${(circ * anim) / 100} ${circ}`} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: '1.6rem', fontWeight: 800, color: OFF, lineHeight: 1 }}>{Math.round(anim)}%</div>
        {label && <div style={{ fontSize: '0.58rem', color: D2, letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 4 }}>{label}</div>}
      </div>
    </div>
  )
}

// ─── Recommended accessories ─────────────────────────────────────────────────
/**
 * A shop-the-gear card. Vendor buttons open in a new tab; the first link is
 * the primary one.
 */
export function AccessoryCard({ item, showCategory = false }) {
  const [cover] = item.images || []
  return (
    <div style={{ background: CARD2, border: `1px solid ${BD}`, borderRadius: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ position: 'relative', aspectRatio: '4/3', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {cover
          ? <img src={cover} alt={item.name} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          : <span style={{ fontSize: '1.8rem', opacity: 0.35 }}>{item.categoryIcon || '🔧'}</span>}
        {item.images?.length > 1 && (
          <span style={{ position: 'absolute', bottom: 6, right: 6, background: 'rgba(0,0,0,0.72)', color: '#fff', fontSize: '0.55rem', fontWeight: 700, padding: '1px 6px', borderRadius: 999 }}>
            {item.images.length} photos
          </span>
        )}
      </div>
      <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 7, flex: 1 }}>
        {showCategory && (
          <div style={{ fontSize: '0.55rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: D3, display: 'flex', alignItems: 'center', gap: 5 }}>
            <span>{item.categoryIcon}</span>{item.categoryLabel}
          </div>
        )}
        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: OFF, lineHeight: 1.35 }}>{item.name}</div>
        {item.desc && <div style={{ fontSize: '0.7rem', color: D2, lineHeight: 1.55 }}>{item.desc}</div>}
        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginTop: 'auto', paddingTop: 4 }}>
          {item.links?.length ? item.links.map((l, i) => (
            <a key={l.url + i} href={l.url} target="_blank" rel="noopener noreferrer"
              style={{
                flex: '1 1 auto', textAlign: 'center', padding: '7px 10px', borderRadius: 8,
                fontSize: '0.66rem', fontWeight: 700, textDecoration: 'none', fontFamily: 'var(--sans)',
                whiteSpace: 'nowrap',
                ...(i === 0
                  ? { background: ACC, color: '#fff', border: `1px solid ${ACC}` }
                  : { background: 'transparent', color: ACC2, border: `1px solid rgba(139,92,246,0.35)` }),
              }}>
              {l.vendor}
            </a>
          )) : (
            <span style={{ fontSize: '0.62rem', color: D3, fontStyle: 'italic' }}>Link coming soon</span>
          )}
        </div>
      </div>
    </div>
  )
}

const ACC_CARD_W = 220     // keeps the strip's cards and its scroll step in step

/**
 * The gear strip on /mygarage: a single scrolling row of featured items with
 * arrows either side, and a "Show More" card riding at the end of the row
 * through to the full storefront. The list itself is `config.json` →
 * `garage.accessories`; see src/data/accessories.js for the shape.
 *
 * @param {number} limit     how many featured items to show
 * @param {string} storePath where "Show More" goes
 */
export function RecommendedAccessories({
  title = 'Recommended Accessories',
  limit = 6,
  storePath = '/mygarage/storefront',
}) {
  const scroll = useRef(null)
  const items = featuredAccessories(limit)
  if (!items.length) return null
  const hidden = accessoryCount - items.length
  const by = dir => scroll.current?.scrollBy({ left: dir * (ACC_CARD_W + 12), behavior: 'smooth' })
  const arrow = {
    position: 'absolute', top: '50%', transform: 'translateY(-50%)', zIndex: 5,
    width: 30, height: 30, borderRadius: '50%', background: CARD2,
    border: `1px solid ${BD}`, color: OFF, cursor: 'pointer',
  }

  return (
    <ShowcaseCard>
      {title && (
        <div style={{ textAlign: 'center', marginBottom: 18 }}>
          <h3 style={heading}>{title}</h3>
          {accessoriesNote && (
            <div style={{ fontSize: '0.74rem', color: D2, marginTop: 6, lineHeight: 1.6 }}>{accessoriesNote}</div>
          )}
        </div>
      )}
      <div style={{ position: 'relative' }}>
        <button onClick={() => by(-1)} aria-label="Scroll left" style={{ ...arrow, left: -12 }}>‹</button>
        <button onClick={() => by(1)} aria-label="Scroll right" style={{ ...arrow, right: -12 }}>›</button>
        <div ref={scroll} style={{ display: 'flex', gap: 12, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 4 }}>
          {items.map(item => (
            <div key={item.id} style={{ minWidth: ACC_CARD_W, maxWidth: ACC_CARD_W, flexShrink: 0 }}>
              <AccessoryCard item={item} showCategory />
            </div>
          ))}
          {/* Last card in the row, not a button under it */}
          <Link to={storePath} style={{
            minWidth: ACC_CARD_W, maxWidth: ACC_CARD_W, flexShrink: 0, textDecoration: 'none',
            border: `1px dashed ${BD2}`, borderRadius: 12, background: CARD2,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: 6, padding: 16, textAlign: 'center',
          }}>
            <span style={{ fontSize: '1.5rem', color: ACC2, lineHeight: 1 }}>→</span>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: OFF }}>Show More</span>
            {hidden > 0 && (
              <span style={{ fontSize: '0.66rem', color: D2 }}>{hidden} more in the storefront</span>
            )}
          </Link>
        </div>
      </div>
    </ShowcaseCard>
  )
}

// ─── Latest vlogs ────────────────────────────────────────────────────────────
/**
 * Falls back to a "coming soon" panel while `vlogs` is empty — no thumbnail
 * grid, and no "View All" pointing at a page with nothing on it. Add the first
 * real vlog to the data and the grid takes over on its own.
 */
export function LatestVlogs({ title = 'Latest Vlogs' }) {
  const featured = vlogs.filter(v => v.category === 'Latest').slice(0, 4)

  if (!featured.length) {
    return (
      <ShowcaseCard>
        {title && (
          <div style={{ textAlign: 'center', marginBottom: 18 }}>
            <h3 style={heading}>{title}</h3>
          </div>
        )}
        <div style={{
          border: `1px dashed ${BD2}`, borderRadius: 12, background: CARD2,
          padding: 'clamp(30px,6vw,48px) 24px', textAlign: 'center',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
        }}>
          <div style={{ fontSize: '1.9rem', lineHeight: 1 }}>🎥</div>
          <div style={{ fontSize: '0.62rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: ACC2, fontWeight: 700 }}>
            Coming Soon
          </div>
          <div style={{ fontSize: '0.8rem', color: D2, maxWidth: 420, lineHeight: 1.6 }}>
            The camera's mounted and the first rides are planned. Ride videos land here once they're filmed.
          </div>
        </div>
      </ShowcaseCard>
    )
  }

  return (
    <ShowcaseCard>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        {title && <h3 style={heading}>{title}</h3>}
        <Link to="/videos" style={{ fontSize: '0.72rem', color: ACC2, textDecoration: 'none' }}>View All →</Link>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 12 }}>
        {featured.map((v, i) => (
          <div key={i} style={{ borderRadius: 10, overflow: 'hidden', background: CARD2, border: `1px solid ${BD}`, cursor: 'pointer' }}>
            <div style={{ position: 'relative', aspectRatio: '16/9' }}>
              <img src={`https://img.youtube.com/vi/${v.id}/mqdefault.jpg`} alt={v.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={e => { e.target.src = 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=320&q=70' }} />
              <span style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(0,0,0,0.8)', color: '#fff', fontSize: '0.6rem', padding: '1px 6px', borderRadius: 3 }}>{v.duration}</span>
            </div>
            <div style={{ padding: '10px 12px' }}>
              <div style={{ fontSize: '0.76rem', fontWeight: 700, color: OFF, lineHeight: 1.3, marginBottom: 3 }}>{v.title}</div>
              <div style={{ fontSize: '0.62rem', color: D2 }}>{v.subtitle}</div>
              <div style={{ fontSize: '0.6rem', color: D3, marginTop: 5 }}>{v.distance ? `${v.distance} · ` : ''}{v.date}</div>
            </div>
          </div>
        ))}
      </div>
    </ShowcaseCard>
  )
}

// ─── Ride gallery ────────────────────────────────────────────────────────────
/**
 * Slides for the expanded view, built once at module load — the photo list is a
 * module constant, so rebuilding them per render would only hand the lightbox a
 * new array to diff.
 *
 * `title` is the handwritten caption off the frame and `description` carries the
 * location and date, plus the photo's link where it has one.
 */
const GALLERY_SLIDES = galleryPhotos.map(p => {
  const meta = [p.location, p.date].filter(Boolean).join(' · ')
  return {
    src: p.src,
    alt: p.alt,
    title: p.caption,
    description: p.link
      ? (
        <>
          {meta}
          {meta && ' · '}
          <a href={p.link} target="_blank" rel="noopener noreferrer" style={{ color: ACC2 }}>
            View
          </a>
        </>
      )
      : meta || undefined,
  }
})

/**
 * The photo wall: every shot in `config.json` → `garage.gallery` hung as a
 * polaroid on a strip that drifts on its own and speeds up with page scroll.
 * See PolaroidTicker for the motion, and ../../data/garageGallery for the shape
 * of an entry.
 *
 * Hovering a frame pauses the strip and marks it as openable; clicking or
 * tapping it opens the expanded view — the same lightbox the rest of the site
 * uses for photos, so it arrives with arrow keys, swipe and pinch-zoom already
 * working. The strip is frozen while it's open, so closing the expanded view
 * doesn't hand back a photo that has drifted somewhere else.
 *
 * Empty config gets a "coming soon" panel rather than an empty strip, the same
 * way `LatestVlogs` handles having no videos yet.
 *
 * @param {string} title  overrides the config heading; pass null to hide it
 */
export function RideGallery({ title = galleryTitle }) {
  /* -1 is closed, matching how Gallery.jsx drives the same component */
  const [openAt, setOpenAt] = useState(-1)

  const head = title && (
    <div style={{ textAlign: 'center', padding: '24px 24px 0' }}>
      <h3 style={heading}>{title}</h3>
      {galleryNote && (
        <div style={{ fontSize: '0.74rem', color: D2, marginTop: 6, lineHeight: 1.6 }}>{galleryNote}</div>
      )}
    </div>
  )

  if (!galleryCount) {
    return (
      <ShowcaseCard>
        {title && (
          <div style={{ textAlign: 'center', marginBottom: 18 }}>
            <h3 style={heading}>{title}</h3>
          </div>
        )}
        <div style={{
          border: `1px dashed ${BD2}`, borderRadius: 12, background: CARD2,
          padding: 'clamp(30px,6vw,48px) 24px', textAlign: 'center',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
        }}>
          <div style={{ fontSize: '1.9rem', lineHeight: 1 }}>📸</div>
          <div style={{ fontSize: '0.62rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: ACC2, fontWeight: 700 }}>
            Coming Soon
          </div>
          <div style={{ fontSize: '0.8rem', color: D2, maxWidth: 420, lineHeight: 1.6 }}>
            Ride photos land here as they're shot.
          </div>
        </div>
      </ShowcaseCard>
    )
  }

  /* Unpadded so the strip can run edge to edge and its ends fade into the card
     rather than stopping short of it. */
  return (
    <ShowcaseCard pad={false}>
      {head}
      <PolaroidTicker
        photos={galleryPhotos}
        {...galleryTicker}
        onExpand={setOpenAt}
        paused={openAt >= 0}
      />
      <div style={{ borderTop: `1px solid ${BD}`, padding: '11px 24px', textAlign: 'center', fontFamily: 'var(--mono)', fontSize: '0.53rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: D3 }}>
        {galleryCount} frames · tap one to open it
      </div>

      <Lightbox
        open={openAt >= 0}
        close={() => setOpenAt(-1)}
        index={openAt}
        slides={GALLERY_SLIDES}
        plugins={[Captions, Counter, Zoom]}
        captions={{ descriptionTextAlign: 'center' }}
        /* the garage's own near-black rather than the plugin's flat #000, so the
           expanded view reads as part of this page */
        styles={{ container: { backgroundColor: 'rgba(8, 7, 14, 0.96)' } }}
      />
    </ShowcaseCard>
  )
}

// ─── Rides & routes ──────────────────────────────────────────────────────────
/**
 * Stats come from `rideSummary`, which is derived from the ride list itself —
 * nothing here is hand-typed, so the numbers can't fall out of step with the
 * rides beside them.
 *
 * @param {string} basePath  where a ride click lands. Defaults to My Garage.
 */
export function RidesAndRoutes({ title = 'Rides & Routes', basePath = '/mygarage/rides' }) {
  const navigate = useNavigate()
  // Completed → upcoming → planned, so the list reads as a timeline
  const listed = ridesInOrder().slice(0, 4)
  const modeOf = m => RIDE_MODES.find(x => x.key === m)
  return (
    <ShowcaseCard pad={false}>
      {/* Heading row — centred across the full card. The card is unpadded so
          the map can run edge to edge, so the padding here reproduces what the
          other sections get from `ShowcaseCard` (24) plus their heading's
          18px gap. No rule under it: this reads as the top of one continuous
          panel, not a block of its own. */}
      {title && (
        <div style={{ textAlign: 'center', padding: '24px 24px 18px' }}>
          <h3 style={heading}>{title}</h3>
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr 200px', minHeight: 280 }} className="ridemap-v8">
        {/* Stats */}
        <div style={{ padding: '20px 18px', borderRight: `1px solid ${BD}` }}>
          {rideSummary.stats.map(([k, v]) => (
            <div key={k} style={{ marginBottom: 14 }}>
              <div style={{ fontSize: '0.58rem', color: D3, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 2 }}>{k}</div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: OFF }}>{v}</div>
            </div>
          ))}
        </div>
        {/* Map */}
        <div style={{ position: 'relative', background: BG }}>
          <ShowcaseMiniMap basePath={basePath} />
        </div>
        {/* List */}
        <div style={{ borderLeft: `1px solid ${BD}`, display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {listed.map(r => {
              const m = modeOf(r.mode)
              return (
                <div key={r.id} onClick={() => navigate(`${basePath}/${r.id}`)}
                  style={{ padding: '11px 14px', borderBottom: `1px solid ${BD}`, cursor: 'pointer', transition: 'background 0.18s' }}
                  onMouseEnter={e => e.currentTarget.style.background = CARD2}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    <span style={{ fontSize: '0.74rem', fontWeight: 600, color: OFF }}>{r.fromCity} → {r.toCity}</span>
                    {m && m.key !== 'completed' && (
                      <span style={{ fontSize: '0.5rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: m.color, background: `${m.color}1f`, border: `1px solid ${m.color}4d`, borderRadius: 999, padding: '1px 6px', flexShrink: 0 }}>{m.label}</span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.6rem', color: D2 }}>{r.distance} · {r.date}</div>
                </div>
              )
            })}
          </div>
          <button onClick={() => navigate(basePath)} style={{ margin: 12, padding: '8px', background: ACCBG, color: ACC2, border: `1px solid rgba(139,92,246,0.3)`, borderRadius: 8, fontFamily: 'var(--sans)', fontWeight: 600, fontSize: '0.7rem', cursor: 'pointer' }}>View All Rides</button>
        </div>
      </div>
      <style>{`@media(max-width:760px){.ridemap-v8{grid-template-columns:1fr!important}.ridemap-v8>*:first-child,.ridemap-v8>*:last-child{display:none!important}.ridemap-v8>*:nth-child(2){min-height:280px}}`}</style>
    </ShowcaseCard>
  )
}

// ─── Dream garage progress ───────────────────────────────────────────────────
const WISHLIST_ICONS = ['🧳', '💡', '🏍️', '🏔️']

/** Progress ring + the next few wishlist buys. */
export function DreamGarageProgress({ title = 'Dream Garage Progress' }) {
  const items = wishlist.filter(w => w.status !== 'dreaming').slice(0, 4)
  return (
    <ShowcaseCard>
      <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 24, alignItems: 'center' }} className="wishlist-v8-grid">
        {/* Progress ring */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          {title && <div style={{ fontSize: '0.7rem', color: D2, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>{title}</div>}
          <Donut percent={65} color={ACC} size={130} />
          <div style={{ fontSize: '0.72rem', color: D1, marginTop: 12, fontStyle: 'italic' }}>Keep Riding.<br />Keep Dreaming.</div>
        </div>
        {/* Items */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: 10 }}>
          {items.map((w, i) => (
            <div key={w.id} style={{ background: CARD2, border: `1px solid ${BD}`, borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ height: 60, background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem' }}>{WISHLIST_ICONS[i % WISHLIST_ICONS.length]}</div>
              <div style={{ padding: '10px 12px' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: OFF, lineHeight: 1.3, marginBottom: 3 }}>{w.name}</div>
                <div style={{ fontSize: '0.78rem', fontWeight: 800, color: ACC2, marginBottom: 8 }}>{w.price >= 100000 ? `₹${(w.price/100000).toFixed(1)}L` : `₹${w.price.toLocaleString('en-IN')}`}</div>
                <button style={{ width: '100%', padding: '6px', background: 'transparent', color: ACC2, border: `1px solid rgba(139,92,246,0.3)`, borderRadius: 6, fontFamily: 'var(--sans)', fontWeight: 600, fontSize: '0.62rem', cursor: 'pointer' }}>Add to Wishlist</button>
              </div>
            </div>
          ))}
        </div>
      </div>
      <style>{`@media(max-width:640px){.wishlist-v8-grid{grid-template-columns:1fr!important}}`}</style>
    </ShowcaseCard>
  )
}

// ─── Dream garage journey ────────────────────────────────────────────────────
const PLAN  = '#60a5fa'   // the leg that isn't built yet
const HERE  = '#fbbf24'   // "you are here" / the train

const N_STN = garageJourney.length
const CUR   = Math.max(0, garageJourney.findIndex(v => v.status === 'current'))
/** Station centres, in % of the rail. 10…90 leaves room for the end labels. */
const stnX  = i => 10 + i * (80 / (N_STN - 1))

/**
 * The train's run, generated rather than hand-written so the timing survives
 * a sixth vehicle being added: lay the trip out in abstract units (dwell at a
 * station, travel to the next), then normalise those to keyframe percentages.
 * The current ride gets the longest dwell.
 */
const TRAIN_KEYFRAMES = (() => {
  const TRAVEL = 11
  const units = []
  garageJourney.forEach((v, i) => {
    units.push({ move: false, i, len: v.status === 'current' ? 15 : 8 })
    if (i < N_STN - 1) units.push({ move: true, i, len: TRAVEL })
  })
  const total = units.reduce((a, u) => a + u.len, 0)
  const pct = n => +((n / total) * 100).toFixed(2)

  let t = 0
  const stops = []
  units.forEach(u => {
    if (u.move) {
      t += u.len
      stops.push(`${pct(t)}%{left:${stnX(u.i + 1)}%}`)
    } else {
      stops.push(`${pct(t)}%{left:${stnX(u.i)}%}`)
      t += u.len
      stops.push(`${pct(t)}%{left:${stnX(u.i)}%}`)
    }
  })
  return stops.join('')
})()

/**
 * The ownership story as a transit diagram: bicycle → moped → scooter → Bear
 * 650, then a dashed "under construction" branch out to the undecided car.
 * Runs as a horizontal line on desktop and rotates vertical below 900px.
 *
 * Everything animates off `.dgl-go`, which is added once the section scrolls
 * into view — dropping the class on the way out is what lets the line redraw
 * when you come back to it.
 */
export function DreamGarageJourney({ eyebrow = 'Dream Garage', title = 'The Journey Line' }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: false, margin: '-80px' })
  const owned = garageJourney.filter(v => v.status !== 'upcoming').length

  return (
    <ShowcaseCard pad={false}>
      <div ref={ref} className={`dgl${inView ? ' dgl-go' : ''}`} style={{ padding: '22px 24px 18px' }}>
        {/* Header — roundel + route name */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 18, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div className="dgl-roundel">
              <i className="dgl-roundel-ring" />
              <b className="dgl-roundel-bar">GARAGE</b>
            </div>
            <div>
              {eyebrow && <div style={{ fontSize: '0.58rem', color: ACC2, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 5 }}>{eyebrow}</div>}
              {title && <h3 style={heading}>{title}</h3>}
              <div style={{ fontSize: '0.7rem', color: D2, marginTop: 4 }}>
                {N_STN} stations · {owned} in service · {N_STN - owned} under construction
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.45rem', color: OFF, lineHeight: 1 }}>
              {String(owned).padStart(2, '0')}<span style={{ color: D3 }}> / {String(N_STN).padStart(2, '0')}</span>
            </div>
            <div style={{ fontSize: '0.56rem', color: D3, letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: 4 }}>Stations reached</div>
          </div>
        </div>

        {/* The line. Padding sits on the outer box so the rail is inset from
            the card edges — absolutely positioned stations resolve their % against
            .dgl-rail, which is what keeps the end labels from clipping. */}
        <div className="dgl-map">
          <div className="dgl-rail">
            <div className="dgl-line dgl-line-run" style={{ left: '10%', width: `${stnX(CUR) - 10}%` }} />
            {CUR < N_STN - 1 && (
              <div className="dgl-line dgl-line-plan" style={{ left: `${stnX(CUR)}%`, width: `${stnX(N_STN - 1) - stnX(CUR)}%` }} />
            )}
            <div className="dgl-train" />

            {garageJourney.map((v, i) => {
              const isNow = v.status === 'current'
              const isNext = v.status === 'upcoming'
              return (
                <div
                  key={v.id}
                  className={`dgl-stn${isNow ? ' is-now' : ''}${isNext ? ' is-next' : ''}`}
                  style={{ left: `${stnX(i)}%` }}
                >
                  <div className="dgl-dot" style={{ animationDelay: `${0.5 + i * 0.14}s` }} />
                  <div className={`dgl-lbl ${i % 2 === 0 ? 'up' : 'down'}`} style={{ animationDelay: `${0.7 + i * 0.14}s` }}>
                    <div className="dgl-name">{v.name}</div>
                    <div className="dgl-meta">{v.chapter} · {v.type}</div>
                    <div className="dgl-cc">{v.ccLabel}{v.cc ? ' CC' : ''}</div>
                    <div className="dgl-note">{v.note}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Key */}
        <div className="dgl-key">
          <span><i style={{ background: ACC }} />In service</span>
          <span><i style={{ background: `repeating-linear-gradient(90deg, ${PLAN} 0 5px, transparent 5px 9px)` }} />Under construction</span>
          <span><i style={{ background: HERE, borderRadius: '50%', width: 9, height: 9 }} />You are here</span>
        </div>
      </div>

      <div style={{ borderTop: `1px solid ${BD}`, padding: '13px 24px', textAlign: 'center', fontSize: '0.72rem', color: D1, fontStyle: 'italic' }}>
        Keep Riding. Keep Dreaming.
      </div>

      <style>{`
        /* ── roundel ── */
        .dgl-roundel { position: relative; width: 52px; height: 52px; flex-shrink: 0; }
        .dgl-roundel-ring {
          position: absolute; inset: 0; border-radius: 50%; border: 6px solid ${ACC};
          transform: scale(1);
        }
        .dgl-roundel-bar {
          position: absolute; top: 50%; left: -6px; right: -6px; height: 13px; margin-top: -6.5px;
          background: ${ACC}; color: #fff; font-family: var(--sans); font-weight: 700;
          font-size: 0.5rem; letter-spacing: 0.14em; text-align: center; line-height: 13px;
        }
        .dgl:not(.dgl-go) .dgl-roundel-ring { transform: scale(0) rotate(-90deg); }
        .dgl:not(.dgl-go) .dgl-roundel-bar { transform: scaleX(0); }
        .dgl-go .dgl-roundel-ring { animation: dglRoundel .75s cubic-bezier(.34,1.5,.64,1) both; }
        .dgl-go .dgl-roundel-bar { animation: dglBar .45s ease .4s both; }
        @keyframes dglRoundel { from { transform: scale(0) rotate(-90deg); } to { transform: none; } }
        @keyframes dglBar { from { transform: scaleX(0); } to { transform: none; } }

        /* ── map ── */
        .dgl-map { height: 248px; margin-top: 16px; padding: 0 52px; }
        .dgl-rail { position: relative; height: 100%; }

        .dgl-line {
          position: absolute; top: calc(50% - 4.5px); height: 9px; border-radius: 5px;
          transform-origin: 0 50%; transform: scaleX(1);
        }
        .dgl-line-run { background: ${ACC}; box-shadow: 0 0 22px -2px rgba(139,92,246,0.5); }
        .dgl-line-plan { background: repeating-linear-gradient(90deg, ${PLAN} 0 11px, transparent 11px 20px); }
        .dgl:not(.dgl-go) .dgl-line { transform: scaleX(0); }
        .dgl-go .dgl-line-run { animation: dglDraw 1.3s cubic-bezier(.5,0,.3,1) .15s both; }
        .dgl-go .dgl-line-plan { animation: dglDraw 1s cubic-bezier(.5,0,.3,1) 1.35s both; }
        @keyframes dglDraw { from { transform: scaleX(0); } to { transform: scaleX(1); } }

        /* ── train ── */
        .dgl-train {
          position: absolute; top: calc(50% - 9px); width: 26px; height: 18px; margin-left: -13px;
          border-radius: 5px; z-index: 4; opacity: 0;
          background: linear-gradient(150deg, #fde68a, #f59e0b);
          box-shadow: 0 0 20px 3px rgba(245,158,11,0.55);
        }
        .dgl-train::after {
          content: ''; position: absolute; top: 5px; right: -9px; width: 9px; height: 8px; border-radius: 2px;
          background: radial-gradient(closest-side, rgba(253,230,138,0.9), transparent);
        }
        .dgl-go .dgl-train {
          opacity: 1;
          animation: dglTrain 7s cubic-bezier(.5,0,.5,1) 2.2s infinite;
          transition: opacity .4s 2.2s;
        }
        @keyframes dglTrain { ${TRAIN_KEYFRAMES} }

        /* ── stations ── */
        .dgl-stn { position: absolute; top: 50%; transform: translate(-50%, -50%); z-index: 3; }
        .dgl-dot {
          position: relative; width: 20px; height: 20px; border-radius: 50%;
          background: ${CARD}; border: 5px solid ${ACC}; transform: scale(1);
        }
        .dgl:not(.dgl-go) .dgl-dot { transform: scale(0); }
        .dgl-go .dgl-dot { animation: dglPop .5s cubic-bezier(.34,1.7,.64,1) both; }
        @keyframes dglPop { from { transform: scale(0); } to { transform: scale(1); } }

        .dgl-stn.is-now .dgl-dot {
          width: 28px; height: 28px; border-width: 6px; border-color: ${HERE};
          box-shadow: 0 0 0 4px rgba(251,191,36,0.16), 0 0 22px rgba(251,191,36,0.45);
        }
        .dgl-stn.is-now .dgl-dot::after {
          content: ''; position: absolute; inset: -6px; border-radius: 50%; border: 2px solid ${HERE};
        }
        .dgl-go .dgl-stn.is-now .dgl-dot::after { animation: dglPing 1.9s cubic-bezier(0,0,.2,1) infinite; }
        @keyframes dglPing {
          from { transform: scale(.85); opacity: .9; }
          to   { transform: scale(2.1); opacity: 0; }
        }
        .dgl-stn.is-next .dgl-dot { border-color: ${PLAN}; border-style: dashed; }

        /* ── labels ──
           The static transform carries the -50% centring; the keyframes carry it
           too, so the label stays centred on its dot at every point of the rise. */
        .dgl-lbl {
          position: absolute; left: 50%; width: 186px; text-align: center;
          transform: translate(-50%, 0); opacity: 1;
        }
        .dgl-lbl.up { bottom: 26px; }
        .dgl-lbl.down { top: 26px; }
        .dgl:not(.dgl-go) .dgl-lbl { opacity: 0; }
        .dgl-go .dgl-lbl { animation: dglRise .55s cubic-bezier(.22,1,.36,1) both; }
        @keyframes dglRise {
          from { opacity: 0; transform: translate(-50%, 22px); }
          to   { opacity: 1; transform: translate(-50%, 0); }
        }

        .dgl-name { font-size: 0.8rem; font-weight: 700; color: ${OFF}; line-height: 1.25; }
        .dgl-meta { font-family: var(--mono); font-size: 0.53rem; letter-spacing: 0.1em; text-transform: uppercase; color: ${D2}; margin-top: 4px; }
        .dgl-cc {
          display: inline-block; margin-top: 6px; font-family: var(--mono); font-weight: 700;
          font-size: 0.68rem; letter-spacing: 0.04em; color: ${ACC2};
          border: 1px solid rgba(139,92,246,0.35); background: ${ACCBG}; border-radius: 4px; padding: 2px 8px;
        }
        .dgl-stn.is-now .dgl-cc { color: ${HERE}; border-color: rgba(251,191,36,0.4); background: rgba(251,191,36,0.1); }
        .dgl-note { font-size: 0.6rem; color: ${D2}; line-height: 1.45; margin-top: 6px; }

        /* ── key ── */
        .dgl-key {
          display: flex; gap: 20px; flex-wrap: wrap; justify-content: center;
          border-top: 1px solid ${BD}; padding-top: 14px; margin-top: 4px;
          font-family: var(--mono); font-size: 0.53rem; letter-spacing: 0.11em;
          text-transform: uppercase; color: ${D2};
        }
        .dgl-key span { display: flex; align-items: center; gap: 7px; }
        .dgl-key i { width: 16px; height: 4px; border-radius: 2px; display: block; flex-shrink: 0; }

        /* ── below 900px five stations across stop fitting, so the line
              rotates: dots run down the left, labels sit beside them ── */
        @media (max-width: 900px) {
          .dgl-map { height: auto; padding: 0; margin-top: 18px; }
          .dgl-line, .dgl-train { display: none; }
          .dgl-stn {
            position: relative; top: auto; left: auto !important; transform: none;
            display: grid; grid-template-columns: 28px 1fr; gap: 14px; align-items: start;
            padding-bottom: 18px;
          }
          .dgl-stn::before {
            content: ''; position: absolute; left: 14px; top: 0; bottom: 0; width: 2px; margin-left: -1px;
            background: ${ACC};
          }
          .dgl-stn.is-next::before { background: repeating-linear-gradient(180deg, ${PLAN} 0 6px, transparent 6px 11px); }
          .dgl-stn:first-child::before { top: 14px; }
          .dgl-stn:last-child::before { bottom: calc(100% - 14px); }
          .dgl-stn:last-child { padding-bottom: 0; }
          .dgl-dot { z-index: 1; margin: 4px auto 0; }
          .dgl-stn.is-now .dgl-dot { margin-left: -4px; }
          .dgl-lbl {
            position: static; width: auto; text-align: left; transform: none;
          }
          .dgl-go .dgl-lbl { animation-name: dglRiseV; }
          @keyframes dglRiseV {
            from { opacity: 0; transform: translateY(14px); }
            to   { opacity: 1; transform: none; }
          }
          .dgl-key { justify-content: flex-start; gap: 12px 18px; }
        }

        /* Motion is decoration here — the diagram reads fine standing still. */
        @media (prefers-reduced-motion: reduce) {
          .dgl-go .dgl-line, .dgl-go .dgl-dot, .dgl-go .dgl-lbl,
          .dgl-go .dgl-roundel-ring, .dgl-go .dgl-roundel-bar,
          .dgl-go .dgl-stn.is-now .dgl-dot::after { animation: none !important; }
          .dgl .dgl-lbl { opacity: 1 !important; }
          .dgl .dgl-line { transform: scaleX(1) !important; }
          .dgl .dgl-dot { transform: scale(1) !important; }
          .dgl .dgl-roundel-ring, .dgl .dgl-roundel-bar { transform: none !important; }
          .dgl-train { display: none !important; }
        }
      `}</style>
    </ShowcaseCard>
  )
}

// ─── Dream build roadmap ─────────────────────────────────────────────────────
const PHASE_IMGS = [
  'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=400&q=80',
  'https://images.unsplash.com/photo-1609630875171-b1321377ee65?w=400&q=80',
  'https://images.unsplash.com/photo-1547549082-6bc09f2049ae?w=400&q=80',
  'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=400&q=80',
]

export function DreamBuildRoadmap({ title = 'Dream Build Roadmap' }) {
  const statusC = { completed: '#22c55e', active: ACC2, planned: '#60a5fa', future: D2 }
  return (
    <ShowcaseCard>
      {title && (
        <div style={{ textAlign: 'center', marginBottom: 18 }}>
          <h3 style={heading}>{title}</h3>
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12, position: 'relative' }}>
        {dreamGarage.phases.map((p, i) => {
          const c = statusC[p.status]
          return (
            <div key={p.id} style={{ background: CARD2, border: `1px solid ${p.status === 'active' ? 'rgba(139,92,246,0.4)' : BD}`, borderRadius: 12, overflow: 'hidden', position: 'relative' }}>
              <div style={{ position: 'relative', height: 80 }}>
                <img src={PHASE_IMGS[i % PHASE_IMGS.length]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.55 }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(20,18,32,1), transparent)' }} />
                <div style={{ position: 'absolute', bottom: 8, left: 10 }}>
                  <span style={{ fontSize: '0.55rem', fontWeight: 700, color: c, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{p.status}</span>
                </div>
              </div>
              <div style={{ padding: '10px 12px 14px' }}>
                <div style={{ fontSize: '0.6rem', color: ACC2, fontWeight: 700, letterSpacing: '0.06em' }}>{p.label}</div>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: OFF, marginBottom: 2 }}>{p.title}</div>
                <div style={{ fontSize: '0.58rem', color: D2 }}>{p.items.length} items</div>
              </div>
              {p.status === 'completed' && <div style={{ position: 'absolute', top: 8, right: 8, width: 20, height: 20, borderRadius: '50%', background: c, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', color: '#fff' }}>✓</div>}
            </div>
          )
        })}
      </div>
    </ShowcaseCard>
  )
}
