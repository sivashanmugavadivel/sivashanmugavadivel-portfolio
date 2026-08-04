import { useRef, useState, useEffect, useMemo } from 'react'
import { useInView } from 'framer-motion'

/*
 * SphereGridGallery — image tiles arranged in a latitude/longitude grid wrapped
 * onto a 3D sphere that spins on its own (back tiles hidden).
 * Inspired by the Framer "Sphere Grid Gallery" component, rebuilt with CSS 3D.
 *
 * Home-page showcase only: lightweight (a small set of unique images is cycled
 * across the tiles).
 *
 * Non-interactive by design — it is a moving picture, not a control. It used to
 * take a drag to spin and a tap to open the gallery; both are gone, along with
 * the container's hit-testing, so a swipe that starts over the sphere scrolls
 * the page like anywhere else. The "View My Gallery" button under the section is
 * the way in.
 */
const R = 300              // sphere radius (px, design space)
const TW = 118, TH = 90    // tile size
const BANDS = 9            // latitude rings, pole to pole
const BASE_COLS = 12       // tiles on the equator ring; fewer toward the poles
const MAX_TILT = 62        // vertical rotation limit (keeps tiles upright, no flip)
const DB = 2 * R + TW      // design box (scaled to fit the container)

export default function SphereGridGallery({ images }) {
  const outerRef = useRef(null)
  const sphereRef = useRef(null)
  // Only load the tiles (thumbnails) once the sphere is near the viewport.
  const inView = useInView(outerRef, { once: true, margin: '250px' })
  // Rotation only — there is no drag to carry velocity or a tap to distinguish.
  const anim = useRef({ rot: 0, tilt: -8 })
  const [scale, setScale] = useState(1)

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

  // Spin loop — a steady auto-rotate, the only motion left.
  useEffect(() => {
    const s = anim.current
    let raf
    const frame = () => {
      s.rot += 0.12                                            // horizontal auto-spin
      s.tilt = Math.max(-MAX_TILT, Math.min(MAX_TILT, s.tilt)) // bound vertical — no pole flip
      if (sphereRef.current) {
        sphereRef.current.style.transform = `rotateX(${s.tilt.toFixed(2)}deg) rotateY(${s.rot.toFixed(2)}deg)`
      }
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [])

  /* `pointerEvents: 'none'` and `touchAction: 'auto'` are the whole point of the
     "non-interactive" note above: with no handlers left there is nothing for a
     pointer to do here, and leaving the sphere in hit-testing would only cost a
     grab cursor and a swallowed touch-scroll. `aria-hidden` follows — the tiles
     are decorative thumbnails with no alt text and nothing to activate. */
  return (
    <div
      ref={outerRef}
      aria-hidden="true"
      style={{
        position: 'relative', width: '100%', height: 'clamp(340px, 54vw, 580px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        pointerEvents: 'none', touchAction: 'auto', cursor: 'default',
        userSelect: 'none', WebkitUserSelect: 'none',
        overflow: 'hidden',
      }}
    >
      <div style={{ width: DB, height: DB, transform: `scale(${scale})`, position: 'relative' }}>
        <div style={{ position: 'absolute', inset: 0, perspective: 1300 }}>
          <div ref={sphereRef} style={{ position: 'absolute', inset: 0, transformStyle: 'preserve-3d' }}>
            {inView && tiles.map((t, i) => (
              <div
                key={i}
                style={{
                  position: 'absolute', left: '50%', top: '50%',
                  width: TW, height: TH, marginLeft: -TW / 2, marginTop: -TH / 2,
                  transform: `rotateY(${t.lon}deg) rotateX(${-t.lat}deg) translateZ(${R}px)`,
                  backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
                  overflow: 'hidden', borderRadius: 10,
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
