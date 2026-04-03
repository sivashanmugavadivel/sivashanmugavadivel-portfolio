import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { motion } from 'framer-motion'
import { tagColor } from '../../data/tagMeta'

const BASE = import.meta.env.BASE_URL

function imgSrc(src) {
  if (!src) return ''
  if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('//')) return src
  return `${BASE}${src.replace(/^\//, '')}`
}

// ─── Callout variant colors ───────────────────────────────────────────────────
const CALLOUT_COLORS = {
  tip:     '#22c55e',
  warning: '#f59e0b',
  info:    '#3b82f6',
  note:    '#7c3aed',
}
const CALLOUT_ICONS = { tip: '💡', warning: '⚠️', info: 'ℹ️', note: '📌' }

// ─── Section renderers ────────────────────────────────────────────────────────
function SectionText({ section }) {
  return (
    <div className="magazine-prose jp-text">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{section.body}</ReactMarkdown>
    </div>
  )
}

function SectionImage({ section }) {
  const align = section.align || 'center' // 'left' | 'center' | 'right'
  const float = section.float // 'left' | 'right' — wraps text around image
  const size = section.size || 'full'
  const sizeMap = { small: '30%', medium: '50%', large: '75%', full: '100%' }
  const resolvedWidth = sizeMap[size] || size

  // Float mode — image sits inside text flow, text wraps around it
  if (float) {
    return (
      <motion.figure
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        style={{
          float,
          width: resolvedWidth,
          margin: float === 'right' ? '8px 0 16px 24px' : '8px 24px 16px 0',
          borderRadius: 12, overflow: 'hidden',
          boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
        }}
      >
        <img
          src={imgSrc(section.src)}
          alt={section.alt || ''}
          style={{ width: '100%', display: 'block', objectFit: 'cover', maxHeight: section.maxHeight || 300 }}
        />
        {section.caption && (
          <figcaption style={{
            textAlign: 'center', fontSize: '0.72rem', color: 'var(--text)',
            opacity: 0.6, padding: '6px 8px', fontStyle: 'italic',
            background: 'var(--card-bg)',
          }}>
            {section.caption}
          </figcaption>
        )}
      </motion.figure>
    )
  }

  // Normal block mode
  const alignStyles = {
    left:   { marginRight: 'auto', marginLeft: 0 },
    center: { marginRight: 'auto', marginLeft: 'auto' },
    right:  { marginRight: 0,      marginLeft: 'auto' },
  }

  return (
    <motion.figure
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      style={{ margin: '24px 0', width: resolvedWidth, ...alignStyles[align] }}
    >
      <img
        src={imgSrc(section.src)}
        alt={section.alt || ''}
        style={{
          width: '100%', borderRadius: 12, display: 'block',
          objectFit: 'cover', maxHeight: section.maxHeight || 420,
          boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
        }}
      />
      {section.caption && (
        <figcaption style={{
          textAlign: align === 'center' ? 'center' : align,
          fontSize: '0.78rem', color: 'var(--text)',
          opacity: 0.6, marginTop: 8, fontStyle: 'italic',
        }}>
          {section.caption}
        </figcaption>
      )}
    </motion.figure>
  )
}

function SectionGallery({ section }) {
  const images = section.images || []
  const [active, setActive] = useState(0)

  const prev = () => setActive(i => (i - 1 + images.length) % images.length)
  const next = () => setActive(i => (i + 1) % images.length)

  // Position config relative to active index
  function getPos(i) {
    const total = images.length
    let diff = i - active
    // Wrap around
    if (diff > total / 2) diff -= total
    if (diff < -total / 2) diff += total

    if (diff === 0)  return { x: '0%',    scale: 1,    zIndex: 10, rotateY: 0,   opacity: 1,    blur: 0 }
    if (diff === 1)  return { x: '52%',   scale: 0.78, zIndex: 7,  rotateY: -28, opacity: 0.85, blur: 0 }
    if (diff === -1) return { x: '-52%',  scale: 0.78, zIndex: 7,  rotateY: 28,  opacity: 0.85, blur: 0 }
    if (diff === 2)  return { x: '88%',   scale: 0.58, zIndex: 4,  rotateY: -42, opacity: 0.55, blur: 2 }
    if (diff === -2) return { x: '-88%',  scale: 0.58, zIndex: 4,  rotateY: 42,  opacity: 0.55, blur: 2 }
    return                  { x: '120%',  scale: 0.4,  zIndex: 1,  rotateY: -55, opacity: 0,    blur: 4 }
  }

  return (
    <div style={{ margin: '32px 0' }}>
      {section.heading && (
        <h3 style={{ margin: '0 0 20px', fontSize: '0.9rem', color: 'var(--text-h)', fontWeight: 700, textAlign: 'center' }}>
          {section.heading}
        </h3>
      )}

      {/* Carousel */}
      <div style={{ position: 'relative', height: 320, perspective: 1200, overflow: 'hidden' }}>
        {images.map((img, i) => {
          const pos = getPos(i)
          return (
            <motion.div
              key={i}
              onClick={() => setActive(i)}
              animate={{
                x: pos.x, scale: pos.scale, rotateY: pos.rotateY,
                opacity: pos.opacity, filter: `blur(${pos.blur}px)`,
                zIndex: pos.zIndex,
              }}
              transition={{ type: 'spring', stiffness: 260, damping: 28 }}
              style={{
                position: 'absolute',
                top: '50%', left: '50%',
                marginTop: -130, marginLeft: -140,
                width: 280, height: 260,
                borderRadius: 16, overflow: 'hidden',
                cursor: i === active ? 'default' : 'pointer',
                boxShadow: i === active
                  ? '0 20px 60px rgba(0,0,0,0.35)'
                  : '0 8px 24px rgba(0,0,0,0.2)',
                transformStyle: 'preserve-3d',
              }}
            >
              <img
                src={imgSrc(img.src)}
                alt={img.alt || ''}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
              {/* Caption overlay on active */}
              {i === active && img.caption && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0,
                    padding: '10px 14px',
                    background: 'linear-gradient(transparent, rgba(0,0,0,0.6))',
                    color: '#fff', fontSize: '0.75rem', fontStyle: 'italic',
                  }}
                >
                  {img.caption}
                </motion.div>
              )}
            </motion.div>
          )
        })}
      </div>

      {/* Navigation */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 20 }}>
        <motion.button
          onClick={prev} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
          style={{
            width: 40, height: 40, borderRadius: '50%', border: '1.5px solid var(--border)',
            background: 'var(--card-bg)', cursor: 'pointer', color: 'var(--text)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem',
          }}
        >←</motion.button>
        {/* Dots */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {images.map((_, i) => (
            <motion.div
              key={i}
              onClick={() => setActive(i)}
              animate={{ width: i === active ? 20 : 6, background: i === active ? 'var(--accent)' : 'var(--border)' }}
              style={{ height: 6, borderRadius: 999, cursor: 'pointer' }}
              transition={{ duration: 0.25 }}
            />
          ))}
        </div>
        <motion.button
          onClick={next} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
          style={{
            width: 40, height: 40, borderRadius: '50%', border: '1.5px solid var(--border)',
            background: 'var(--card-bg)', cursor: 'pointer', color: 'var(--text)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem',
          }}
        >→</motion.button>
      </div>
    </div>
  )
}

function SectionVideo({ section, color }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      style={{ margin: '24px 0' }}
    >
      <div style={{
        position: 'relative', paddingBottom: '56.25%', height: 0,
        borderRadius: 12, overflow: 'hidden',
        boxShadow: `0 4px 24px ${color}22`,
        border: `1px solid ${color}33`,
      }}>
        {section.youtubeId ? (
          <iframe
            src={`https://www.youtube.com/embed/${section.youtubeId}`}
            title={section.caption || 'Video'}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
          />
        ) : section.src ? (
          <video
            controls
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
          >
            <source src={imgSrc(section.src)} />
          </video>
        ) : null}
      </div>
      {section.caption && (
        <p style={{
          textAlign: 'center', fontSize: '0.78rem', color: 'var(--text)',
          opacity: 0.6, marginTop: 8, fontStyle: 'italic',
        }}>
          {section.caption}
        </p>
      )}
    </motion.div>
  )
}

function SectionIngredientGroup({ section, color }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      style={{ margin: '20px 0' }}
    >
      <h3 style={{
        margin: '0 0 10px', fontSize: '0.82rem', fontWeight: 800,
        textTransform: 'uppercase', letterSpacing: '0.08em', color,
      }}>
        {section.heading}
      </h3>
      <ul style={{ margin: 0, padding: '0 0 0 18px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {(section.items || []).map((item, i) => (
          <li key={i} style={{ fontSize: '0.88rem', color: 'var(--text)', lineHeight: 1.5 }}>
            {item}
          </li>
        ))}
      </ul>
    </motion.div>
  )
}

function SectionSteps({ section, color }) {
  return (
    <div style={{ margin: '20px 0' }}>
      {section.heading && (
        <h3 style={{
          margin: '0 0 14px', fontSize: '0.82rem', fontWeight: 800,
          textTransform: 'uppercase', letterSpacing: '0.08em', color,
        }}>
          {section.heading}
        </h3>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {(section.items || []).map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.06 }}
            style={{
              display: 'flex', gap: 14, alignItems: 'flex-start',
              padding: '14px 16px', borderRadius: 10,
              background: 'var(--card-bg)', border: '1px solid var(--border)',
            }}
          >
            <div style={{
              width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
              background: `${color}22`, border: `2px solid ${color}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.8rem', fontWeight: 800, color,
            }}>
              {item.step || i + 1}
            </div>
            <div style={{ flex: 1 }}>
              {item.title && (
                <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-h)', marginBottom: 4 }}>
                  {item.title}
                </div>
              )}
              <div style={{ fontSize: '0.85rem', color: 'var(--text)', lineHeight: 1.6 }}>
                {item.body}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

function SectionNutrition({ section, color }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      style={{ margin: '20px 0' }}
    >
      {section.heading && (
        <h3 style={{
          margin: '0 0 12px', fontSize: '0.82rem', fontWeight: 800,
          textTransform: 'uppercase', letterSpacing: '0.08em', color,
        }}>
          {section.heading}
        </h3>
      )}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
        <tbody>
          {(section.rows || []).map((row, i) => (
            <tr key={i}>
              <td style={{
                padding: '8px 12px', color: 'var(--text)',
                borderBottom: '1px solid var(--border)', fontWeight: 500,
              }}>
                {row.nutrient}
              </td>
              <td style={{
                padding: '8px 12px', color: 'var(--text-h)',
                borderBottom: '1px solid var(--border)', fontWeight: 700, textAlign: 'right',
              }}>
                {row.amount}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {section.notes && (
        <p style={{ margin: '10px 0 0', fontSize: '0.78rem', color: 'var(--text)', opacity: 0.7, lineHeight: 1.5 }}>
          {section.notes}
        </p>
      )}
      {section.score && (
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          marginTop: 10, padding: '5px 14px', borderRadius: 999,
          background: `${color}18`, border: `1px solid ${color}44`,
          fontSize: '0.82rem', fontWeight: 700, color,
        }}>
          ⭐ Nutrition score: {section.score}
        </div>
      )}
    </motion.div>
  )
}

function SectionCallout({ section }) {
  const variant = section.variant || 'note'
  const c = CALLOUT_COLORS[variant] || CALLOUT_COLORS.note
  const icon = CALLOUT_ICONS[variant] || '📌'
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      style={{
        margin: '20px 0', padding: '14px 16px',
        borderRadius: 10, borderLeft: `4px solid ${c}`,
        background: `${c}12`,
        display: 'flex', gap: 10, alignItems: 'flex-start',
      }}
    >
      <span style={{ fontSize: '1rem', flexShrink: 0, marginTop: 1 }}>{icon}</span>
      <div style={{ fontSize: '0.87rem', color: 'var(--text)', lineHeight: 1.65 }}>
        {section.body}
      </div>
    </motion.div>
  )
}

function SectionPlaces({ section, color }) {
  return (
    <div style={{ margin: '20px 0' }}>
      {section.heading && (
        <h3 style={{
          margin: '0 0 14px', fontSize: '0.82rem', fontWeight: 800,
          textTransform: 'uppercase', letterSpacing: '0.08em', color,
        }}>
          {section.heading}
        </h3>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {(section.items || []).map((place, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.06 }}
            style={{
              padding: '14px 16px', borderRadius: 10,
              background: 'var(--card-bg)', border: '1px solid var(--border)',
              borderLeft: `3px solid ${color}`,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: '0.9rem' }}>📍</span>
              <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-h)' }}>
                {place.name}
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--text)', lineHeight: 1.6 }}>
              {place.description}
            </p>
            {place.tip && (
              <div style={{
                marginTop: 8, fontSize: '0.78rem', color: CALLOUT_COLORS.tip,
                display: 'flex', gap: 6, alignItems: 'flex-start',
              }}>
                <span>💡</span> {place.tip}
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  )
}

function SectionDivider({ color }) {
  return (
    <hr style={{
      border: 'none', height: 1,
      background: `linear-gradient(90deg, ${color}, transparent)`,
      margin: '24px 0',
    }} />
  )
}

// ─── Meta pills row ───────────────────────────────────────────────────────────
function MetaPills({ meta, color }) {
  if (!meta) return null
  const pills = []
  if (meta.cookTime)   pills.push({ icon: '⏱', label: meta.cookTime })
  if (meta.difficulty) pills.push({ icon: '📊', label: meta.difficulty })
  if (meta.servings)   pills.push({ icon: '🍽️', label: `Serves ${meta.servings}` })
  if (meta.location)   pills.push({ icon: '📍', label: meta.location })
  if (meta.duration)   pills.push({ icon: '🗓️', label: meta.duration })
  if (pills.length === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}
    >
      {pills.map((p, i) => (
        <span key={i} style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          padding: '5px 12px', borderRadius: 999, fontSize: '0.78rem', fontWeight: 600,
          background: `${color}14`, color,
          border: `1px solid ${color}33`,
        }}>
          {p.icon} {p.label}
        </span>
      ))}
    </motion.div>
  )
}

// ─── Main renderer ────────────────────────────────────────────────────────────
export default function JsonPostRenderer({ sections = [], meta, color }) {
  const c = color || '#7c3aed'

  function renderSection(section, i) {
    switch (section.type) {
      case 'text':             return <SectionText key={i} section={section} />
      case 'image':            return <SectionImage key={i} section={section} />
      case 'gallery':          return <SectionGallery key={i} section={section} />
      case 'video':            return <SectionVideo key={i} section={section} color={c} />
      case 'ingredient-group': return <SectionIngredientGroup key={i} section={section} color={c} />
      case 'steps':            return <SectionSteps key={i} section={section} color={c} />
      case 'nutrition':        return <SectionNutrition key={i} section={section} color={c} />
      case 'callout':          return <SectionCallout key={i} section={section} />
      case 'places':           return <SectionPlaces key={i} section={section} color={c} />
      case 'divider':          return <SectionDivider key={i} color={c} />
      default:                 return null
    }
  }

  // Group: a float image followed immediately by a text section renders together
  // so the text wraps around the float. All other sections render normally.
  const rendered = []
  let i = 0
  while (i < sections.length) {
    const s = sections[i]
    const next = sections[i + 1]
    if (s.type === 'image' && s.float && next?.type === 'text') {
      rendered.push(
        <div key={i} style={{ overflow: 'hidden' }}>
          {renderSection(s, i)}
          {renderSection(next, i + 1)}
        </div>
      )
      i += 2
    } else {
      rendered.push(renderSection(s, i))
      i++
    }
  }

  return (
    <div>
      <MetaPills meta={meta} color={c} />
      {rendered}
    </div>
  )
}
