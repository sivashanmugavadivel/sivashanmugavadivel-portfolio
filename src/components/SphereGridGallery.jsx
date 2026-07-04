import { useRef, useState, useEffect, useMemo } from 'react'
import { useInView } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import InteractiveHint from './InteractiveHint'
import { useHint } from '../hooks/useOnboarding'

/*
 * SphereGridGallery — image tiles arranged in a latitude/longitude grid wrapped
 * onto a rotating 3D sphere (auto-spins, drag to rotate, back tiles hidden).
 * Inspired by the Framer "Sphere Grid Gallery" component, rebuilt with CSS 3D.
 *
 * Home-page showcase only: lightweight (a small set of unique images is cycled
 * across the tiles) and clicking a photo navigates to the Gallery page.
 */
const R = 300              // sphere radius (px, design space)
const TW = 118, TH = 90    // tile size
const BANDS = 9            // latitude rings, pole to pole
const BASE_COLS = 12       // tiles on the equator ring; fewer toward the poles
const MAX_TILT = 62        // vertical rotation limit (keeps tiles upright, no flip)
const DB = 2 * R + TW      // design box (scaled to fit the container)

export default function SphereGridGallery({ images, to = '/gallery' }) {
  const navigate = useNavigate()
  const outerRef = useRef(null)
  const sphereRef = useRef(null)
  // Only load the tiles (thumbnails) once the sphere is near the viewport.
  const inView = useInView(outerRef, { once: true, margin: '250px' })
  const anim = useRef({ rot: 0, tilt: -8, velX: 0, velY: 0, dragging: false, lastX: 0, lastY: 0, moved: 0, onTile: false })
  const [scale, setScale] = useState(1)
  const [hintOn, dismissSphereHint] = useHint('sphere')

  const tiles = useMemo(() => {
    const arr = []
    let k = 0
    for (let b = 0; b < BANDS; b++) {
      const lat = -90 + (180 / (BANDS - 1)) * b
      // Fewer tiles toward the poles → even coverage, no crowding or gaps.
      const cols = Math.max(1, Math.round(BASE_COLS * Math.cos(lat * Math.PI / 180)))
      for (let c = 0; c < cols; c++) {
        const lon = c * (360 / cols) + (b % 2) * (180 / cols) // stagger alternate rows
        arr.push({ lat, lon, idx: k % images.length })
        k++
      }
    }
    return arr
  }, [images])

  // Fit the fixed-size design sphere into the responsive container.
  useEffect(() => {
    const measure = () => {
      const el = outerRef.current
      if (el) setScale(Math.min(1, el.getBoundingClientRect().width / DB))
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  // Spin loop — auto-rotate + drag inertia; pauses on hover.
  useEffect(() => {
    const s = anim.current
    let raf
    const frame = () => {
      if (!s.dragging) {
        s.rot += 0.12 + s.velY; s.velY *= 0.94   // horizontal auto-spin + inertia
        s.tilt += s.velX; s.velX *= 0.94          // vertical inertia
      }
      s.tilt = Math.max(-MAX_TILT, Math.min(MAX_TILT, s.tilt)) // bound vertical — no pole flip
      if (sphereRef.current) {
        sphereRef.current.style.transform = `rotateX(${s.tilt.toFixed(2)}deg) rotateY(${s.rot.toFixed(2)}deg)`
      }
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [])

  const onDown = (e) => {
    const s = anim.current
    s.dragging = true; s.moved = 0; s.lastX = e.clientX; s.lastY = e.clientY
    s.onTile = !!e.target?.closest?.('[data-si]')
    e.currentTarget.setPointerCapture?.(e.pointerId)
  }
  const onMove = (e) => {
    const s = anim.current
    if (!s.dragging) return
    const dx = e.clientX - s.lastX, dy = e.clientY - s.lastY
    s.lastX = e.clientX; s.lastY = e.clientY; s.moved += Math.abs(dx) + Math.abs(dy)
    s.rot += dx * 0.3; s.tilt -= dy * 0.3
    s.velY = dx * 0.3; s.velX = -dy * 0.3
  }
  const onUp = (e) => {
    const s = anim.current
    dismissSphereHint() // any press counts — they've discovered it
    // A tap (not a drag) on a photo → go to the gallery.
    if (s.moved < 8 && s.onTile) navigate(to)
    s.dragging = false; s.onTile = false
    e.currentTarget.releasePointerCapture?.(e.pointerId)
  }

  return (
    <div
      ref={outerRef}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      role="button"
      aria-label="Open the gallery"
      style={{
        position: 'relative', width: '100%', height: 'clamp(340px, 54vw, 580px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        touchAction: 'none', cursor: 'grab', userSelect: 'none', WebkitUserSelect: 'none',
        overflow: 'hidden',
      }}
    >
      <InteractiveHint
        show={hintOn}
        label="✋ Drag to spin · tap a photo"
        style={{ top: 16, left: '50%', transform: 'translateX(-50%)' }}
      />
      <div style={{ width: DB, height: DB, transform: `scale(${scale})`, position: 'relative' }}>
        <div style={{ position: 'absolute', inset: 0, perspective: 1300 }}>
          <div ref={sphereRef} style={{ position: 'absolute', inset: 0, transformStyle: 'preserve-3d' }}>
            {inView && tiles.map((t, i) => (
              <div
                key={i}
                data-si={t.idx}
                style={{
                  position: 'absolute', left: '50%', top: '50%',
                  width: TW, height: TH, marginLeft: -TW / 2, marginTop: -TH / 2,
                  transform: `rotateY(${t.lon}deg) rotateX(${-t.lat}deg) translateZ(${R}px)`,
                  backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
                  overflow: 'hidden', borderRadius: 10, cursor: 'pointer',
                  boxShadow: '0 6px 20px rgba(0,0,0,0.4)',
                }}
              >
                <img
                  src={images[t.idx].src}
                  alt=""
                  draggable={false}
                  loading="lazy"
                  decoding="async"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', pointerEvents: 'none' }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
