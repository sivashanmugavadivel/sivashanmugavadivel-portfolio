import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import cfg from '../data/config.json'

const skills = cfg.skillLevels || [
  { name: 'PLC Programming', level: 90 },
  { name: 'Industrial Automation', level: 85 },
  { name: 'React / JavaScript', level: 80 },
  { name: 'Node.js', level: 75 },
  { name: 'OPC UA / Modbus', level: 88 },
  { name: 'Python', level: 70 },
  { name: 'UI/UX Design', level: 65 },
  { name: 'DevOps / CI-CD', level: 60 },
]

const SIZE = 400
const CX = SIZE / 2
const CY = SIZE / 2
const R = 150

export default function SkillRadar() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: false, margin: '-100px' })

  const n = skills.length
  const angles = skills.map((_, i) => (Math.PI * 2 / n) * i - Math.PI / 2)

  // Grid ring points
  const ringLevels = [0.2, 0.4, 0.6, 0.8, 1.0]

  // Data polygon points
  const dataPoints = skills.map((s, i) => {
    const pr = R * s.level / 100
    return { x: CX + Math.cos(angles[i]) * pr, y: CY + Math.sin(angles[i]) * pr }
  })
  const dataPath = dataPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ') + 'Z'

  // Calculate path length for stroke animation
  const dataPerimeter = dataPoints.reduce((sum, p, i) => {
    const next = dataPoints[(i + 1) % dataPoints.length]
    return sum + Math.hypot(next.x - p.x, next.y - p.y)
  }, 0)

  return (
    <section className="section" ref={ref}>
      <div className="page-container" style={{ textAlign: 'center' }}>
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false }}
          transition={{ duration: 0.6 }}
        >
          <span style={{
            fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.12em',
            textTransform: 'uppercase', color: 'var(--accent)', fontFamily: 'var(--mono)',
          }}>What I Work With</span>
          <h2 style={{
            fontFamily: 'var(--heading)', fontSize: 'clamp(1.5rem, 3.5vw, 2.4rem)',
            fontWeight: 700, color: 'var(--text-h)', marginTop: 10, marginBottom: 48,
          }}>Skills & Expertise</h2>
        </motion.div>

        <svg
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          style={{ width: '100%', maxWidth: 480, margin: '0 auto', display: 'block' }}
        >
          {/* Grid rings */}
          {ringLevels.map((rl, ri) => {
            const rr = R * rl
            const pts = angles.map(a => `${CX + Math.cos(a) * rr},${CY + Math.sin(a) * rr}`).join(' ')
            return (
              <motion.polygon
                key={`ring-${ri}`}
                points={pts}
                fill="none"
                stroke="var(--border)"
                strokeWidth="0.5"
                initial={{ opacity: 0 }}
                animate={inView ? { opacity: 0.4 } : { opacity: 0 }}
                transition={{ delay: ri * 0.1, duration: 0.5 }}
              />
            )
          })}

          {/* Axis lines */}
          {angles.map((a, i) => (
            <motion.line
              key={`axis-${i}`}
              x1={CX} y1={CY}
              x2={CX + Math.cos(a) * R} y2={CY + Math.sin(a) * R}
              stroke="var(--border)"
              strokeWidth="0.5"
              initial={{ opacity: 0, pathLength: 0 }}
              animate={inView ? { opacity: 0.3, pathLength: 1 } : { opacity: 0, pathLength: 0 }}
              transition={{ delay: 0.3 + i * 0.08, duration: 0.6 }}
            />
          ))}

          {/* Data fill — fades in */}
          <motion.polygon
            points={dataPoints.map(p => `${p.x},${p.y}`).join(' ')}
            fill="rgba(167,139,250,0.12)"
            stroke="none"
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ delay: 1.0, duration: 0.8 }}
          />

          {/* Data stroke — draws itself */}
          <motion.path
            d={dataPath}
            fill="none"
            stroke="var(--accent)"
            strokeWidth="2.5"
            strokeLinejoin="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={inView ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
            transition={{ delay: 0.6, duration: 1.5, ease: 'easeInOut' }}
            style={{ filter: 'drop-shadow(0 0 6px rgba(167,139,250,0.5))' }}
          />

          {/* Data dots — pop in one by one */}
          {dataPoints.map((p, i) => (
            <motion.circle
              key={`dot-${i}`}
              cx={p.x} cy={p.y}
              r="5"
              fill="var(--accent)"
              stroke="var(--bg)"
              strokeWidth="2"
              initial={{ scale: 0, opacity: 0 }}
              animate={inView ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
              transition={{ delay: 0.8 + i * 0.12, duration: 0.4, type: 'spring', stiffness: 300 }}
            />
          ))}

          {/* Labels + percentages — fade in */}
          {skills.map((s, i) => {
            const lx = CX + Math.cos(angles[i]) * (R + 28)
            const ly = CY + Math.sin(angles[i]) * (R + 28)
            return (
              <motion.g
                key={`label-${i}`}
                initial={{ opacity: 0 }}
                animate={inView ? { opacity: 1 } : { opacity: 0 }}
                transition={{ delay: 1.2 + i * 0.1, duration: 0.5 }}
              >
                <text
                  x={lx} y={ly - 5}
                  textAnchor="middle" dominantBaseline="middle"
                  style={{
                    fontSize: '10px', fill: 'var(--text-h)',
                    fontFamily: 'var(--sans)', fontWeight: 600,
                  }}
                >{s.name}</text>
                <text
                  x={lx} y={ly + 9}
                  textAnchor="middle"
                  style={{
                    fontSize: '9px', fill: 'var(--accent)',
                    fontFamily: 'var(--mono)', fontWeight: 700,
                  }}
                >{s.level}%</text>
              </motion.g>
            )
          })}
        </svg>
      </div>
    </section>
  )
}
