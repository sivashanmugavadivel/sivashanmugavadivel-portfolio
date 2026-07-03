import { useEffect, useRef, useState } from 'react'

export default function CustomCursor() {
  const wrapRef = useRef(null)
  const bodyRef = useRef(null)
  // target = live mouse, pos = eased butterfly position
  const target = useRef({ x: -100, y: -100 })
  const pos = useRef({ x: -100, y: -100 })
  const angle = useRef(0)
  const flap = useRef(0)      // 0..1 flap phase
  const flapSpeed = useRef(0.15)
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    if ('ontouchstart' in window) { setHidden(true); return }

    const move = (e) => {
      target.current.x = e.clientX
      target.current.y = e.clientY
    }
    window.addEventListener('mousemove', move)

    let raf
    function loop() {
      const t = target.current
      const p = pos.current

      // Ease toward the cursor (subtle trailing float)
      const dx = t.x - p.x
      const dy = t.y - p.y
      p.x += dx * 0.28
      p.y += dy * 0.28

      const speed = Math.sqrt(dx * dx + dy * dy)

      // Tilt toward direction of travel; ease back upright when still
      if (speed > 0.5) {
        // butterfly SVG points "up", so offset by 90deg
        const targetAngle = Math.atan2(dy, dx) * (180 / Math.PI) + 90
        let diff = targetAngle - angle.current
        while (diff > 180) diff -= 360
        while (diff < -180) diff += 360
        angle.current += diff * 0.12
      }

      // Flap faster when moving, gentle idle flutter when still
      flapSpeed.current = 0.12 + Math.min(speed, 40) * 0.012
      flap.current += flapSpeed.current
      // wing fold factor: 0.15 (nearly closed) .. 1 (open)
      const fold = 0.15 + (Math.sin(flap.current) * 0.5 + 0.5) * 0.85

      const wrap = wrapRef.current
      const body = bodyRef.current
      if (wrap) {
        wrap.style.transform =
          `translate(${p.x}px, ${p.y}px) translate(-50%, -50%) rotate(${angle.current}deg)`
      }
      if (body) {
        body.style.setProperty('--fold', fold.toFixed(3))
      }

      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('mousemove', move)
    }
  }, [])

  if (hidden) return null

  return (
    <>
      <style>{`*, *::before, *::after { cursor: none !important; }`}</style>
      <div
        ref={wrapRef}
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          width: 34,
          height: 34,
          pointerEvents: 'none',
          zIndex: 99999,
          willChange: 'transform',
        }}
      >
        <div
          ref={bodyRef}
          style={{
            width: '100%',
            height: '100%',
            filter: 'drop-shadow(0 0 6px rgba(56,189,248,0.55))',
          }}
        >
          <svg viewBox="0 0 100 100" width="34" height="34">
            <defs>
              <linearGradient id="bfWing" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#bae6fd" />
                <stop offset="100%" stopColor="#0284c7" />
              </linearGradient>
            </defs>
            {/* Left wing pair — scaled horizontally by --fold to flap */}
            <g style={{ transformOrigin: '50px 50px', transform: 'scaleX(var(--fold, 1))' }}>
              <path
                d="M50 50 C 20 20, 5 30, 12 48 C 5 55, 22 60, 50 52 Z"
                fill="url(#bfWing)"
                opacity="0.95"
              />
              <path
                d="M50 52 C 24 58, 12 70, 24 82 C 34 88, 46 72, 50 58 Z"
                fill="url(#bfWing)"
                opacity="0.8"
              />
            </g>
            {/* Right wing pair (mirror) */}
            <g style={{ transformOrigin: '50px 50px', transform: 'scaleX(calc(var(--fold, 1) * -1))' }}>
              <path
                d="M50 50 C 20 20, 5 30, 12 48 C 5 55, 22 60, 50 52 Z"
                fill="url(#bfWing)"
                opacity="0.95"
              />
              <path
                d="M50 52 C 24 58, 12 70, 24 82 C 34 88, 46 72, 50 58 Z"
                fill="url(#bfWing)"
                opacity="0.8"
              />
            </g>
            {/* Body */}
            <ellipse cx="50" cy="52" rx="2.6" ry="14" fill="#075985" />
            <circle cx="50" cy="38" r="3.2" fill="#075985" />
            {/* Antennae */}
            <path d="M50 36 C 46 28, 42 26, 40 24" stroke="#075985" strokeWidth="1.4" fill="none" strokeLinecap="round" />
            <path d="M50 36 C 54 28, 58 26, 60 24" stroke="#075985" strokeWidth="1.4" fill="none" strokeLinecap="round" />
          </svg>
        </div>
      </div>
    </>
  )
}
