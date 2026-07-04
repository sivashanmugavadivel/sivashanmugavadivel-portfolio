import { useRef, useEffect, useState } from 'react'
import { useInView } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import InteractiveHint from './InteractiveHint'
import { useHint } from '../hooks/useOnboarding'

/*
 * VideoArc — video cards ride a wide arc (Virelle-style): they enter from the
 * bottom-left, sweep up to the centre-top, and descend to the bottom-right,
 * getting clipped at the corners as they exit (no mid-air fade). Evenly spaced,
 * tilted outward toward the ends. Rotates left → right and loops. Each visible
 * card autoplays a short local preview clip (muted, looping); off-arc cards
 * pause. Click opens the full video; falls back to the YouTube thumbnail.
 */
function ytId(url) {
  try {
    const u = new URL(url)
    return u.hostname.includes('youtu.be') ? u.pathname.slice(1) : (u.searchParams.get('v') || '')
  } catch { return '' }
}

export default function VideoArc({ videos, to = '/videos' }) {
  const navigate = useNavigate()
  const stageRef = useRef(null)
  const cardRefs = useRef([])
  const anim = useRef({ rot: 0, cx: 0, halfW: 500, spacing: 220, topY: 150, arcR: 1000, dragging: false, vel: 0, lastX: 0, moved: 0, downIdx: -1 })
  const inView = useInView(stageRef, { margin: '150px' })
  const N = videos.length
  const [hintOn, dismissArcHint] = useHint('arc')

  // Mobile: no drag (so vertical page scroll works), wider spacing + smaller cards.
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)')
    const apply = () => setIsMobile(mq.matches)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])

  useEffect(() => {
    const measure = () => {
      const el = stageRef.current
      if (!el) return
      const r = el.getBoundingClientRect()
      const s = anim.current
      s.cx = r.width / 2
      s.halfW = r.width / 2
      // Desktop: spread across the full width (~5 cards). Mobile: fewer, wider
      // apart so they don't overlap on the narrow screen.
      s.spacing = isMobile ? r.width * 0.6 : Math.max(r.width * 0.2, 150)
      s.arcR = r.width * 1.05                      // circle radius → clean, shallow arch
      const cardH = cardRefs.current[0]?.offsetHeight || 250
      s.topY = cardH * 0.5 + 14                    // centre card just below the heading
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [isMobile])

  useEffect(() => {
    const s = anim.current
    const speed = isMobile ? 0.9 : 1.4   // gentler auto-spin on mobile
    let raf
    const frame = () => {
      if (!s.dragging) { s.rot += speed + s.vel; s.vel *= 0.95 }
      const span = N * s.spacing
      const R = s.arcR
      for (let i = 0; i < N; i++) {
        const el = cardRefs.current[i]
        if (!el) continue
        // Evenly-spaced horizontal position, wrapped into [-span/2, span/2].
        let u = (i * s.spacing + s.rot) % span
        if (u > span / 2) u -= span
        if (u < -span / 2) u += span
        const p = u / s.halfW                     // -1 = left edge, 0 = centre, 1 = right edge
        const x = s.cx + u
        // True circular arc — card sits on a big circle, tilted tangent to it.
        const y = s.topY + (R - Math.sqrt(Math.max(0, R * R - u * u)))
        const tilt = Math.asin(Math.max(-1, Math.min(1, u / R))) * (180 / Math.PI)
        const scale = 1 - 0.12 * Math.min(1, Math.abs(p))
        el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -50%) rotate(${tilt.toFixed(1)}deg) scale(${scale.toFixed(3)})`
        el.style.zIndex = String(Math.round((1 - Math.min(1, Math.abs(p))) * 100))
        el.style.pointerEvents = Math.abs(p) < 0.95 ? 'auto' : 'none'
        const v = el.querySelector('video')
        if (v) {
          const shouldPlay = inView && Math.abs(p) < 1.05
          if (shouldPlay && v.paused) v.play().catch(() => {})
          else if (!shouldPlay && !v.paused) v.pause()
        }
      }
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [N, inView, isMobile])

  const onDown = (e) => {
    const s = anim.current
    s.dragging = true; s.moved = 0; s.lastX = e.clientX
    const c = e.target?.closest?.('[data-vi]')
    s.downIdx = c ? Number(c.dataset.vi) : -1
    e.currentTarget.setPointerCapture?.(e.pointerId)
  }
  const onMove = (e) => {
    const s = anim.current
    if (!s.dragging) return
    const dx = e.clientX - s.lastX
    s.lastX = e.clientX; s.moved += Math.abs(dx)
    s.rot += dx; s.vel = dx
  }
  const onUp = (e) => {
    const s = anim.current
    dismissArcHint() // any press counts — they've discovered it
    // A tap (not a drag) on any card → go to the Videos page.
    if (s.moved < 8 && s.downIdx >= 0) navigate(to)
    s.dragging = false; s.downIdx = -1
    e.currentTarget.releasePointerCapture?.(e.pointerId)
  }

  if (N === 0) return null

  return (
    <div
      ref={stageRef}
      onPointerDown={isMobile ? undefined : onDown}
      onPointerMove={isMobile ? undefined : onMove}
      onPointerUp={isMobile ? undefined : onUp}
      onPointerCancel={isMobile ? undefined : onUp}
      style={{
        position: 'relative', width: '100%', height: 'clamp(400px, 46vw, 560px)',
        overflow: 'hidden',
        // Mobile: allow the page to scroll vertically through the arc (no drag).
        touchAction: isMobile ? 'pan-y' : 'none',
        cursor: isMobile ? 'default' : 'grab',
        userSelect: 'none', WebkitUserSelect: 'none',
      }}
    >
      <InteractiveHint
        show={hintOn}
        label={isMobile ? '👆 Tap a card to watch' : '✋ Drag the arc of videos'}
        style={{ bottom: 16, left: '50%', transform: 'translateX(-50%)' }}
      />
      {videos.map((vid, i) => {
        const thumb = `https://i.ytimg.com/vi/${ytId(vid.url)}/hqdefault.jpg`
        return (
          <div
            key={i}
            data-vi={i}
            ref={(el) => (cardRefs.current[i] = el)}
            onClick={isMobile ? () => { dismissArcHint(); navigate(to) } : undefined}
            style={{
              position: 'absolute', left: 0, top: 0,
              width: isMobile ? 'clamp(140px, 42vw, 180px)' : 'clamp(150px, 16vw, 210px)', aspectRatio: '3 / 4.4',
              borderRadius: 18, overflow: 'hidden', cursor: 'pointer',
              boxShadow: '0 24px 55px rgba(0,0,0,0.5)', willChange: 'transform',
              background: '#111',
            }}
          >
            {vid.preview ? (
              <video
                src={vid.preview}
                poster={thumb}
                muted loop playsInline preload="metadata"
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', pointerEvents: 'none' }}
              />
            ) : (
              <img
                src={thumb} alt={vid.title || ''} draggable={false} loading="lazy"
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', pointerEvents: 'none' }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
