import { useEffect, useRef, useState } from 'react'

export default function CustomCursor() {
  const canvasRef = useRef(null)
  const particles = useRef([])
  const mouse = useRef({ x: -100, y: -100, px: -100, py: -100 })
  const hovering = useRef(false)
  const clicking = useRef(false)
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    if ('ontouchstart' in window) { setHidden(true); return }

    const cvs = canvasRef.current
    if (!cvs) return
    const ctx = cvs.getContext('2d')

    function resize() {
      cvs.width = window.innerWidth
      cvs.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const move = (e) => {
      mouse.current.px = mouse.current.x
      mouse.current.py = mouse.current.y
      mouse.current.x = e.clientX
      mouse.current.y = e.clientY
    }

    const down = () => { clicking.current = true }
    const up = () => { clicking.current = false }

    const over = (e) => {
      const t = e.target
      if (
        t.closest('a') || t.closest('button') || t.closest('[role="button"]') ||
        t.closest('input') || t.closest('textarea') ||
        window.getComputedStyle(t).cursor === 'pointer'
      ) hovering.current = true
    }
    const out = () => { hovering.current = false }

    window.addEventListener('mousemove', move)
    window.addEventListener('mousedown', down)
    window.addEventListener('mouseup', up)
    document.addEventListener('mouseover', over)
    document.addEventListener('mouseout', out)

    let raf
    function loop() {
      const { x, y, px, py } = mouse.current
      const dx = x - px, dy = y - py
      const speed = Math.sqrt(dx * dx + dy * dy)

      // Spawn particles based on speed
      if (speed > 2) {
        const count = Math.min(4, Math.floor(speed / 4))
        for (let i = 0; i < count; i++) {
          particles.current.push({
            x: x + (Math.random() - 0.5) * 8,
            y: y + (Math.random() - 0.5) * 8,
            r: 1.5 + Math.random() * 2.5,
            life: 1,
            decay: 0.02 + Math.random() * 0.02,
            vx: (Math.random() - 0.5) * 0.6,
            vy: (Math.random() - 0.5) * 0.6,
          })
        }
      }

      // Click burst
      if (clicking.current && Math.random() > 0.7) {
        for (let i = 0; i < 3; i++) {
          const angle = Math.random() * Math.PI * 2
          particles.current.push({
            x, y,
            r: 2 + Math.random() * 2,
            life: 1,
            decay: 0.03 + Math.random() * 0.02,
            vx: Math.cos(angle) * (1 + Math.random()),
            vy: Math.sin(angle) * (1 + Math.random()),
          })
        }
      }

      mouse.current.px = x
      mouse.current.py = y

      // Draw
      ctx.clearRect(0, 0, cvs.width, cvs.height)

      // Particles
      const ps = particles.current
      for (let i = ps.length - 1; i >= 0; i--) {
        const p = ps[i]
        p.x += p.vx; p.y += p.vy
        p.life -= p.decay
        if (p.life <= 0) { ps.splice(i, 1); continue }

        // Glow
        ctx.save()
        ctx.globalAlpha = p.life * 0.4
        const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 3)
        grd.addColorStop(0, 'rgba(167,139,250,0.8)')
        grd.addColorStop(1, 'transparent')
        ctx.fillStyle = grd
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 3, 0, Math.PI * 2); ctx.fill()
        ctx.restore()

        // Core
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r * p.life, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(167,139,250,${p.life * 0.85})`
        ctx.fill()
      }

      // Main cursor dot
      const dotR = hovering.current ? 7 : clicking.current ? 3 : 5
      // Outer glow
      ctx.save()
      ctx.globalAlpha = 0.35
      const g = ctx.createRadialGradient(x, y, 0, x, y, dotR * 3)
      g.addColorStop(0, 'rgba(167,139,250,0.8)')
      g.addColorStop(1, 'transparent')
      ctx.fillStyle = g
      ctx.beginPath(); ctx.arc(x, y, dotR * 3, 0, Math.PI * 2); ctx.fill()
      ctx.restore()
      // Dot
      ctx.beginPath()
      ctx.arc(x, y, dotR, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(167,139,250,0.9)'
      ctx.fill()
      // White inner
      ctx.beginPath()
      ctx.arc(x, y, dotR * 0.35, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(255,255,255,0.7)'
      ctx.fill()

      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mousedown', down)
      window.removeEventListener('mouseup', up)
      document.removeEventListener('mouseover', over)
      document.removeEventListener('mouseout', out)
      window.removeEventListener('resize', resize)
    }
  }, [])

  if (hidden) return null

  return (
    <>
      <style>{`*, *::before, *::after { cursor: none !important; }`}</style>
      <canvas
        ref={canvasRef}
        style={{
          position: 'fixed', inset: 0,
          pointerEvents: 'none',
          zIndex: 99999,
        }}
      />
    </>
  )
}
