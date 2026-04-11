import { useEffect, useRef } from 'react'

export default function StarfieldCanvas({ active }) {
  const canvasRef = useRef(null)
  const rafRef    = useRef(null)
  const running   = useRef(false)
  const starsRef  = useRef([])

  useEffect(() => {
    if (!active) {
      running.current = false
      cancelAnimationFrame(rafRef.current)
      return
    }

    const cvs = canvasRef.current
    if (!cvs) return
    const ctx = cvs.getContext('2d')

    function resize() {
      cvs.width  = window.innerWidth
      cvs.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)
    running.current = true

    starsRef.current = Array.from({ length: 300 }, () => ({
      x: (Math.random() - 0.5) * 2,
      y: (Math.random() - 0.5) * 2,
      z: Math.random(), pz: 0,
    }))
    starsRef.current.forEach(s => s.pz = s.z)

    ctx.fillStyle = '#16141a'
    ctx.fillRect(0, 0, cvs.width, cvs.height)

    function loop() {
      if (!running.current) return
      const W = cvs.width, H = cvs.height
      const cx = W / 2, cy = H / 2

      ctx.fillStyle = 'rgba(22,20,26,0.25)'
      ctx.fillRect(0, 0, W, H)

      starsRef.current.forEach((st, i) => {
        st.pz = st.z
        st.z -= 0.006
        if (st.z <= 0) {
          st.x = (Math.random() - 0.5) * 2
          st.y = (Math.random() - 0.5) * 2
          st.z = 1; st.pz = 1; return
        }
        const sc = 1 / st.z
        const px = st.x * sc * cx + cx
        const py = st.y * sc * cy + cy
        if (px < 0 || px > W || py < 0 || py > H) return
        const ps = 1 / st.pz
        const ppx = st.x * ps * cx + cx
        const ppy = st.y * ps * cy + cy
        const sz = Math.max(0.2, (1 - st.z) * 3)
        const br = 1 - st.z

        ctx.beginPath()
        ctx.moveTo(ppx, ppy)
        ctx.lineTo(px, py)
        ctx.strokeStyle = i % 6 === 0
          ? `rgba(240,171,252,${br * 0.9})`
          : `rgba(220,220,255,${br * 0.7})`
        ctx.lineWidth = sz
        ctx.stroke()

        ctx.beginPath()
        ctx.arc(px, py, sz * 0.7, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255,255,255,${br})`
        ctx.fill()
      })

      rafRef.current = requestAnimationFrame(loop)
    }
    loop()

    return () => {
      running.current = false
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('resize', resize)
    }
  }, [active])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed', inset: 0, zIndex: 9998,
        pointerEvents: 'none',
        opacity: active ? 1 : 0,
        transition: 'opacity 0.6s ease',
      }}
    />
  )
}
