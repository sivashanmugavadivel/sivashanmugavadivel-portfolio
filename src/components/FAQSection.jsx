import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import cfg from '../data/config.json'

const faqs = cfg.faq || []

export default function FAQSection() {
  const [openIdx, setOpenIdx] = useState(null)
  const [showAll, setShowAll] = useState(false)
  const typingRef = useRef(null)
  const INITIAL_COUNT = 6
  const visibleFaqs = showAll ? faqs : faqs.slice(0, INITIAL_COUNT)

  if (!faqs.length) return null

  const handleClick = (idx) => {
    // Close if already open
    if (openIdx === idx) { setOpenIdx(null); return }

    setOpenIdx(idx)

    // Typewriter effect
    clearInterval(typingRef.current)
    setTimeout(() => {
      const el = document.getElementById(`faq-answer-${idx}`)
      if (!el) return
      const text = faqs[idx].a
      el.textContent = ''
      let ci = 0
      typingRef.current = setInterval(() => {
        if (ci < text.length) { el.textContent += text[ci]; ci++ }
        else clearInterval(typingRef.current)
      }, 40)
    }, 50)
  }

  return (
    <section className="section">
      <div className="page-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false }}
          transition={{ duration: 0.6 }}
          style={{ textAlign: 'center', marginBottom: 40 }}
        >
          <span style={{
            fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.12em',
            textTransform: 'uppercase', color: 'var(--accent)', fontFamily: 'var(--mono)',
          }}>Got Questions?</span>
          <h2 style={{
            fontFamily: 'var(--heading)', fontSize: 'clamp(1.5rem, 3.5vw, 2.4rem)',
            fontWeight: 700, color: 'var(--text-h)', marginTop: 10,
          }}>Frequently Asked Questions</h2>
        </motion.div>

        <div style={{ maxWidth: 680, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {visibleFaqs.map((f, i) => {
            const isOpen = openIdx === i
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
                onClick={() => handleClick(i)}
                style={{
                  background: 'var(--card-bg)',
                  border: `1px solid ${isOpen ? 'var(--accent-border)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius)',
                  cursor: 'pointer',
                  overflow: 'hidden',
                  transition: 'border-color 0.3s, box-shadow 0.3s',
                  boxShadow: isOpen ? '0 0 16px rgba(167,139,250,0.1)' : 'none',
                  padding: '16px 20px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{
                    color: 'var(--accent)', fontFamily: 'var(--mono)',
                    fontSize: '0.72rem', opacity: 0.6, flexShrink: 0,
                  }}>0{i + 1}</span>
                  <span style={{
                    fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-h)', flex: 1,
                  }}>{f.q}</span>
                  <motion.span
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                    style={{ color: 'var(--accent)', fontSize: '0.7rem', flexShrink: 0, opacity: 0.6 }}
                  >▼</motion.span>
                </div>

                <motion.div
                  initial={false}
                  animate={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }}
                  transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
                  style={{ overflow: 'hidden' }}
                >
                  <p
                    id={`faq-answer-${i}`}
                    style={{
                      paddingTop: 12, marginTop: 12,
                      borderTop: '1px dashed var(--border)',
                      fontSize: '0.83rem', lineHeight: 1.7,
                      color: 'var(--text)', margin: 0,
                      fontFamily: 'var(--mono)',
                      minHeight: 20,
                    }}
                  />
                </motion.div>
              </motion.div>
            )
          })}

          {/* Show more / Show less button */}
          {faqs.length > INITIAL_COUNT && (
            <motion.button
              onClick={() => setShowAll(prev => !prev)}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.97 }}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                margin: '20px auto 0', padding: '10px 24px',
                borderRadius: 999, border: '1px solid var(--accent-border)',
                background: 'var(--accent-bg)', color: 'var(--accent)',
                fontSize: '0.78rem', fontWeight: 600, fontFamily: 'var(--sans)',
                cursor: 'pointer', letterSpacing: '0.03em',
                transition: 'background 0.2s',
              }}
            >
              {showAll ? 'Show Less' : `Show More (${faqs.length - INITIAL_COUNT})`}
              <motion.span
                animate={{ rotate: showAll ? 180 : 0 }}
                transition={{ duration: 0.3 }}
                style={{ fontSize: '0.7rem' }}
              >▼</motion.span>
            </motion.button>
          )}
        </div>
      </div>
    </section>
  )
}
