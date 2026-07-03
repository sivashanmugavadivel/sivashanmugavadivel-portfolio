import { useMemo, useRef } from 'react'
import { motion, useInView } from 'framer-motion'

/*
 * FragmentedImage — an image sliced into a grid of tiles that start scattered
 * in 3D (offset, rotated, pushed back, transparent) and assemble into the full
 * picture when it scrolls into view. Inspired by the Framer "Fragmented Image"
 * component, rebuilt as a plain React + framer-motion component.
 *
 * Each tile shows its slice via a full-size <img> with object-fit: cover (so the
 * photo is never distorted), clipped by the tile's overflow. A single in-view
 * trigger drives every tile, so none can be left behind.
 *
 * Fills its parent (position: absolute, inset: 0) — wrap it in a sized,
 * overflow-hidden, rounded frame.
 */
export default function FragmentedImage({ src, alt = '', rows = 6, cols = 5, style, className }) {
  const ref = useRef(null)
  // once: false → re-scatters when it leaves and re-assembles every time it
  // scrolls back into view.
  const inView = useInView(ref, { once: false, amount: 0.3 })

  // Randomised start transforms, computed once per mount so they don't reshuffle.
  const tiles = useMemo(() => {
    const rand = (min, max) => min + Math.random() * (max - min)
    const arr = []
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        arr.push({
          r, c,
          x: rand(-70, 70),
          y: rand(-70, 70),
          z: rand(-260, 160),
          rotX: rand(-60, 60),
          rotY: rand(-60, 60),
          rotZ: rand(-25, 25),
          delay: rand(0, 0.35),
        })
      }
    }
    return arr
  }, [rows, cols])

  return (
    <div ref={ref} className={className} style={{ position: 'absolute', inset: 0, perspective: 900, ...style }}>
      {tiles.map((t, i) => (
        <motion.div
          key={i}
          aria-hidden="true"
          initial={false}
          animate={inView
            ? { opacity: 1, x: 0, y: 0, z: 0, rotateX: 0, rotateY: 0, rotate: 0, scale: 1 }
            : { opacity: 0, x: t.x, y: t.y, z: t.z, rotateX: t.rotX, rotateY: t.rotY, rotate: t.rotZ, scale: 0.85 }}
          transition={{ duration: 0.9, delay: inView ? t.delay : 0, ease: [0.16, 1, 0.3, 1] }}
          style={{
            position: 'absolute',
            width: `${100 / cols}%`,
            height: `${100 / rows}%`,
            left: `${(t.c * 100) / cols}%`,
            top: `${(t.r * 100) / rows}%`,
            overflow: 'hidden',
            backfaceVisibility: 'hidden',
          }}
        >
          <img
            src={src}
            alt=""
            draggable={false}
            style={{
              position: 'absolute',
              width: `${cols * 100}%`,
              height: `${rows * 100}%`,
              left: `${-t.c * 100}%`,
              top: `${-t.r * 100}%`,
              objectFit: 'cover',
              display: 'block',
              pointerEvents: 'none',
            }}
          />
        </motion.div>
      ))}
      {/* Screen-reader description (tiles are decorative) */}
      <span style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>{alt}</span>
    </div>
  )
}
