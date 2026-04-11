import { useRef, useEffect, createElement } from 'react'

export function useConfetti() {
  const canvasRef = useRef(null)
  const particles = useRef([])
  const rafRef = useRef(null)

  useEffect(() => {
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  const fire = () => {
    const cvs = canvasRef.current
    if (!cvs) return
    const ctx = cvs.getContext('2d')
    cvs.width = window.innerWidth
    cvs.height = window.innerHeight

    const colors = ['#a78bfa','#7c3aed','#c084fc','#f472b6','#fbbf24','#34d399','#38bdf8','#fb923c','#fff']

    for (let i = 0; i < 120; i++) {
      particles.current.push({
        x: cvs.width / 2 + (Math.random() - 0.5) * 200,
        y: cvs.height * 0.3 + (Math.random() - 0.5) * 100,
        vx: (Math.random() - 0.5) * 12,
        vy: -4 + Math.random() * -8,
        w: 4 + Math.random() * 6,
        h: 6 + Math.random() * 10,
        rot: Math.random() * 360,
        rotV: (Math.random() - 0.5) * 12,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 1,
        gravity: 0.15 + Math.random() * 0.1,
        decay: 0.004 + Math.random() * 0.004,
      })
    }

    const loop = () => {
      ctx.clearRect(0, 0, cvs.width, cvs.height)
      const ps = particles.current
      for (let i = ps.length - 1; i >= 0; i--) {
        const p = ps[i]
        p.x += p.vx; p.y += p.vy; p.vy += p.gravity
        p.vx *= 0.98; p.rot += p.rotV; p.life -= p.decay
        if (p.life <= 0 || p.y > cvs.height + 20) { ps.splice(i, 1); continue }
        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rot * Math.PI / 180)
        ctx.globalAlpha = p.life
        ctx.fillStyle = p.color
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h)
        ctx.restore()
      }
      if (ps.length > 0) rafRef.current = requestAnimationFrame(loop)
    }
    loop()
  }

  const canvas = createElement('canvas', {
    ref: canvasRef,
    style: { position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 99998 },
  })

  return { fire, canvas }
}
