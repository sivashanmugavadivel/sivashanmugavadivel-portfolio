import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import cfg from '../data/config.json'

const SECTIONS = [cfg.about.now, cfg.about.principles, cfg.about.funSide].filter(Boolean)
const COLORS = ['#7c3aed', '#10b981', '#f59e0b']

/* ══════════════════════════════════════════
   6 DESIGN VARIANTS
══════════════════════════════════════════ */

/* 1 — Glowing Cards Grid */
function Design1({ section, color }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
      {section.items.map((item, i) => (
        <motion.div key={i} whileHover={{ y: -5, boxShadow: `0 0 24px ${color}44` }}
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
          style={{
            background: 'var(--card-bg)', border: `1.5px solid ${color}44`,
            borderRadius: 14, padding: '16px 18px',
            boxShadow: `0 2px 12px rgba(0,0,0,0.1)`, transition: 'box-shadow 0.2s',
          }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: `${color}18`, border: `1.5px solid ${color}44`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10, fontSize: '1rem' }}>
            ✦
          </div>
          <p style={{ margin: 0, fontSize: '0.87rem', color: 'var(--text)', lineHeight: 1.6 }}>{item}</p>
        </motion.div>
      ))}
    </div>
  )
}

/* 2 — Horizontal Timeline */
function Design2({ section, color }) {
  return (
    <div style={{ position: 'relative', paddingLeft: 28 }}>
      <div style={{ position: 'absolute', left: 10, top: 8, bottom: 8, width: 2,
        background: `linear-gradient(to bottom, ${color}, transparent)`, borderRadius: 2 }} />
      {section.items.map((item, i) => (
        <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.08 }}
          style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 18, position: 'relative' }}>
          <motion.div whileHover={{ scale: 1.3 }} style={{
            position: 'absolute', left: -24, top: 6,
            width: 10, height: 10, borderRadius: '50%',
            background: color, border: '2px solid var(--bg)',
            boxShadow: `0 0 10px ${color}`,
          }} />
          <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)',
            borderRadius: 10, padding: '12px 16px', flex: 1,
            borderLeft: `3px solid ${color}` }}>
            <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text)', lineHeight: 1.6 }}>{item}</p>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

/* 3 — Pill Badges Row */
function Design3({ section, color }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
      {section.items.map((item, i) => (
        <motion.div key={i} whileHover={{ scale: 1.06, background: color, color: '#fff' }}
          initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.07, type: 'spring', stiffness: 300 }}
          style={{
            padding: '10px 20px', borderRadius: 999,
            background: 'var(--card-bg)', border: `1.5px solid ${color}`,
            color: 'var(--text-h)', fontSize: '0.88rem', fontWeight: 500,
            cursor: 'default', transition: 'background 0.2s, color 0.2s',
          }}>
          {item}
        </motion.div>
      ))}
    </div>
  )
}

/* 4 — Split Left Accent Bar */
function Design4({ section, color }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
      {section.items.map((item, i) => (
        <motion.div key={i} whileHover={{ x: 4 }}
          initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}
          style={{
            display: 'flex', alignItems: 'stretch', gap: 0,
            background: 'var(--card-bg)', borderRadius: 10,
            overflow: 'hidden', border: '1px solid var(--border)',
          }}>
          <div style={{ width: 4, background: color, flexShrink: 0 }} />
          <div style={{ padding: '14px 18px', flex: 1 }}>
            <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text)', lineHeight: 1.6 }}>{item}</p>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

/* 5 — Numbered List Cards */
function Design5({ section, color }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {section.items.map((item, i) => (
        <motion.div key={i} whileHover={{ x: 6 }}
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
          style={{
            display: 'flex', alignItems: 'center', gap: 18,
            background: 'var(--card-bg)', border: '1px solid var(--border)',
            borderRadius: 12, padding: '14px 20px',
          }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
            background: `${color}18`, border: `2px solid ${color}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: '0.85rem', color, fontFamily: 'var(--mono)',
          }}>
            {String(i + 1).padStart(2, '0')}
          </div>
          <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text)', lineHeight: 1.6 }}>{item}</p>
        </motion.div>
      ))}
    </div>
  )
}

/* 6 — Glassmorphism Floating Cards */
function Design6({ section, color }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
      {section.items.map((item, i) => (
        <motion.div key={i}
          whileHover={{ y: -8, boxShadow: `0 20px 40px ${color}33` }}
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08, type: 'spring', stiffness: 200 }}
          style={{
            background: `linear-gradient(135deg, ${color}12, ${color}04)`,
            border: `1px solid ${color}33`,
            borderRadius: 16, padding: '20px 18px',
            backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
            boxShadow: `0 4px 20px ${color}18`, transition: 'box-shadow 0.25s',
          }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: color,
            boxShadow: `0 0 12px ${color}`, marginBottom: 12 }} />
          <p style={{ margin: 0, fontSize: '0.87rem', color: 'var(--text)', lineHeight: 1.65 }}>{item}</p>
        </motion.div>
      ))}
    </div>
  )
}

const DESIGNS = [
  { id: 1, name: 'Glowing Grid',       desc: 'Icon card grid with glow on hover',         Component: Design1 },
  { id: 2, name: 'Timeline',           desc: 'Vertical timeline with glow dots',           Component: Design2 },
  { id: 3, name: 'Pill Badges',        desc: 'Pill tags that fill accent on hover',        Component: Design3 },
  { id: 4, name: 'Accent Bar',         desc: 'Left color bar with card grid',              Component: Design4 },
  { id: 5, name: 'Numbered List',      desc: 'Numbered circles with clean list',           Component: Design5 },
  { id: 6, name: 'Glassmorphism',      desc: 'Frosted gradient cards with glow',           Component: Design6 },
]

const STORAGE_KEY = 'about_section_designs'

function loadSelections() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {} } catch { return {} }
}
function saveSelections(s) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
}

export default function AboutSectionPicker() {
  const [selections, setSelections] = useState(loadSelections)
  const [activeSection, setActiveSection] = useState(0)

  const section = SECTIONS[activeSection]
  const color = COLORS[activeSection]

  const select = (designId) => {
    const next = { ...selections, [activeSection]: designId }
    setSelections(next)
    saveSelections(next)
  }

  return (
    <div style={{ paddingTop: 100, paddingBottom: 80, minHeight: '100vh', background: 'var(--bg)' }}>
      <div className="page-container">

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <span className="section-label">Design Picker</span>
          <h1 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.8rem)', margin: '8px 0 12px' }}>About Section Styles</h1>
          <p style={{ color: 'var(--text)', opacity: 0.6, maxWidth: 480, margin: '0 auto' }}>
            Choose a design for each section. Your selections are saved automatically.
          </p>
        </div>

        {/* Section tabs */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 40, flexWrap: 'wrap' }}>
          {SECTIONS.map((s, i) => (
            <motion.button key={i} onClick={() => setActiveSection(i)}
              whileHover={{ y: -2 }} whileTap={{ scale: 0.96 }}
              style={{
                padding: '10px 24px', borderRadius: 999, cursor: 'pointer',
                fontFamily: 'var(--sans)', fontSize: '0.88rem', fontWeight: 600,
                border: `2px solid ${activeSection === i ? COLORS[i] : 'var(--border)'}`,
                background: activeSection === i ? `${COLORS[i]}18` : 'var(--card-bg)',
                color: activeSection === i ? COLORS[i] : 'var(--text)',
                transition: 'all 0.2s',
                boxShadow: activeSection === i ? `0 0 16px ${COLORS[i]}44` : 'none',
              }}>
              🔹 {s.label}
              {selections[i] && <span style={{ marginLeft: 6, fontSize: '0.75rem', opacity: 0.7 }}>✓ #{selections[i]}</span>}
            </motion.button>
          ))}
        </div>

        {/* Section info */}
        <AnimatePresence mode="wait">
          <motion.div key={activeSection}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            style={{ textAlign: 'center', marginBottom: 36 }}>
            <h2 style={{ color, margin: '0 0 4px' }}>{section.heading}</h2>
            <p style={{ color: 'var(--text)', opacity: 0.5, fontSize: '0.85rem', margin: 0 }}>
              {section.items.length} items — pick a layout below
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Design cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(480px, 1fr))', gap: 28 }}>
          {DESIGNS.map(({ id, name, desc, Component }) => {
            const isSelected = selections[activeSection] === id
            return (
              <motion.div key={id} whileHover={{ y: -4 }} transition={{ duration: 0.2 }}
                style={{
                  borderRadius: 16, overflow: 'hidden',
                  border: isSelected ? `2px solid ${color}` : '1.5px solid var(--border)',
                  background: 'var(--card-bg)',
                  boxShadow: isSelected ? `0 0 0 4px ${color}22, 0 8px 32px rgba(0,0,0,0.12)` : 'var(--shadow)',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                }}>
                {/* Design header */}
                <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-h)' }}>{name}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text)', opacity: 0.5, marginTop: 2 }}>{desc}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '3px 8px', borderRadius: 999,
                      background: 'var(--accent-bg)', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                      #{id}
                    </span>
                    <motion.button onClick={() => select(id)}
                      whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      style={{
                        padding: '7px 18px', borderRadius: 8, cursor: 'pointer', fontFamily: 'var(--sans)',
                        fontSize: '0.78rem', fontWeight: 700,
                        background: isSelected ? '#22c55e' : color,
                        border: 'none', color: '#fff', transition: 'background 0.2s',
                      }}>
                      {isSelected ? '✓ Selected' : 'Select'}
                    </motion.button>
                  </div>
                </div>

                {/* Live preview */}
                <div style={{ padding: '20px 20px 22px' }}>
                  <Component section={section} color={color} />
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Summary */}
        {Object.keys(selections).length > 0 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            style={{
              marginTop: 48, padding: '20px 28px', borderRadius: 14,
              background: 'var(--card-bg)', border: '1px solid var(--border)',
              display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between',
            }}>
            <div>
              <div style={{ fontWeight: 700, color: 'var(--text-h)', marginBottom: 6 }}>Your selections</div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {SECTIONS.map((s, i) => selections[i] && (
                  <span key={i} style={{ fontSize: '0.82rem', color: COLORS[i], fontWeight: 600 }}>
                    {s.label}: Design #{selections[i]}
                  </span>
                ))}
              </div>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text)', opacity: 0.5, margin: 0 }}>
              Tell me your choices and I'll apply them to the About page
            </p>
          </motion.div>
        )}

      </div>
    </div>
  )
}
