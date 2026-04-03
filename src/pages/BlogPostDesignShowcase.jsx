import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence, useScroll, useTransform, useSpring } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { loadPost } from '../hooks/usePosts'
import { tagColor, tagIcon } from '../data/tagMeta'
function formatDate(d) {
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}
function readTime(content = '') {
  return Math.max(2, Math.ceil(content.split(' ').length / 200)) + ' min read'
}

// ─── Floating particles bg ───────────────────────────────────────────────────
function Particles({ color }) {
  const particles = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 6 + 3,
    delay: Math.random() * 4,
    dur: Math.random() * 4 + 4,
  }))
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      {particles.map(p => (
        <motion.div key={p.id}
          animate={{ y: [0, -30, 0], opacity: [0.15, 0.5, 0.15] }}
          transition={{ duration: p.dur, delay: p.delay, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute', left: `${p.x}%`, top: `${p.y}%`,
            width: p.size, height: p.size, borderRadius: '50%',
            background: color,
          }}
        />
      ))}
    </div>
  )
}

// ─── Scroll progress bar ─────────────────────────────────────────────────────
function ScrollBar({ color, containerRef }) {
  const { scrollYProgress } = useScroll({ container: containerRef })
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 })
  return (
    <motion.div style={{
      position: 'sticky', top: 0, left: 0, right: 0, height: 3, zIndex: 10,
      background: color, transformOrigin: '0%', scaleX,
    }} />
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// DESIGN 1 — Cinematic Hero
// Full-width gradient hero, parallax title, animated section reveals
// ══════════════════════════════════════════════════════════════════════════════
function Design1({ post }) {
  const { frontmatter, content } = post
  const { title, date, tags = [], excerpt } = frontmatter
  const color = tagColor(tags[0])
  const icon = tagIcon(tags)
  const scrollRef = useRef(null)

  return (
    <div ref={scrollRef} style={{ height: 600, overflowY: 'auto', borderRadius: 16, position: 'relative' }}>
      <ScrollBar color={color} containerRef={scrollRef} />

      {/* Hero */}
      <div style={{
        position: 'relative', height: 280, overflow: 'hidden',
        background: `linear-gradient(135deg, ${color}ff 0%, ${color}99 40%, ${color}33 100%)`,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      }}>
        <Particles color="rgba(255,255,255,0.6)" />
        <motion.div
          initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
          style={{ fontSize: 72, marginBottom: 12, filter: `drop-shadow(0 8px 24px rgba(0,0,0,0.2))` }}
        >
          {icon}
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.5 }}
          style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', padding: '0 24px' }}
        >
          {tags.map(tag => (
            <span key={tag} style={{
              fontSize: '0.68rem', fontWeight: 700, padding: '3px 10px', borderRadius: 999,
              background: 'rgba(255,255,255,0.25)', color: '#fff', backdropFilter: 'blur(8px)',
            }}>{tag}</span>
          ))}
        </motion.div>
        {/* Wave bottom */}
        <svg viewBox="0 0 1440 60" style={{ position: 'absolute', bottom: -1, left: 0, right: 0, width: '100%' }} preserveAspectRatio="none">
          <path d="M0,30 C360,60 1080,0 1440,30 L1440,60 L0,60 Z" fill="var(--bg)" />
        </svg>
      </div>

      {/* Content */}
      <div style={{ padding: '0 32px 48px', background: 'var(--bg)' }}>
        <motion.h1
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          style={{ fontSize: 'clamp(1.4rem, 3vw, 2rem)', color: 'var(--text-h)', lineHeight: 1.3, margin: '24px 0 8px' }}
        >
          {title}
        </motion.h1>
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
          style={{ display: 'flex', gap: 16, fontSize: '0.8rem', color: 'var(--text)', opacity: 0.7, marginBottom: 24, flexWrap: 'wrap' }}
        >
          <span>📅 {formatDate(date)}</span>
          <span>⏱ {readTime(content)}</span>
        </motion.div>

        {/* Excerpt callout */}
        <motion.blockquote
          initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.45, duration: 0.5 }}
          style={{
            margin: '0 0 28px', padding: '16px 20px',
            borderLeft: `4px solid ${color}`,
            background: `${color}10`, borderRadius: '0 12px 12px 0',
            fontSize: '0.92rem', color: 'var(--text)', lineHeight: 1.7, fontStyle: 'italic',
          }}
        >
          {excerpt}
        </motion.blockquote>

        <div className="prose design1-prose" style={{ fontSize: '0.9rem' }}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
        </div>
      </div>

      <style>{`
        .design1-prose { line-height: 1.8; color: var(--text); }
        .design1-prose h1,.design1-prose h2,.design1-prose h3 { color: var(--text-h); margin-top: 1.8em; margin-bottom: 0.5em; }
        .design1-prose h2 { font-size: 1.25rem; border-bottom: 2px solid ${color}44; padding-bottom: 6px; }
        .design1-prose h3 { font-size: 1.05rem; color: ${color}; }
        .design1-prose p { margin-bottom: 1em; }
        .design1-prose ul,.design1-prose ol { padding-left: 1.4em; margin-bottom: 1em; }
        .design1-prose li { margin-bottom: 0.3em; }
        .design1-prose li::marker { color: ${color}; }
        .design1-prose strong { color: var(--text-h); }
        .design1-prose table { width:100%; border-collapse:collapse; margin-bottom:1em; font-size:0.85rem; }
        .design1-prose th { background:${color}22; color:${color}; padding:8px 12px; text-align:left; }
        .design1-prose td { padding:7px 12px; border-bottom:1px solid var(--border); }
        .design1-prose hr { border:none; border-top:1px solid var(--border); margin:1.5em 0; }
      `}</style>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// DESIGN 2 — Magazine Split
// Left sidebar with sticky meta, right scrollable content, dark accent panel
// ══════════════════════════════════════════════════════════════════════════════
function Design2({ post }) {
  const { frontmatter, content } = post
  const { title, date, tags = [], excerpt } = frontmatter
  const color = tagColor(tags[0])
  const icon = tagIcon(tags)

  return (
    <div style={{ height: 600, overflowY: 'auto', borderRadius: 16, background: 'var(--bg)', display: 'flex' }}>
      {/* Left sidebar */}
      <motion.div
        initial={{ x: -40, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        style={{
          width: 200, flexShrink: 0, background: '#0f0f14',
          padding: '32px 20px', display: 'flex', flexDirection: 'column', gap: 20,
          position: 'sticky', top: 0, alignSelf: 'flex-start', height: '100%',
        }}
      >
        <motion.div
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          style={{ fontSize: 52, textAlign: 'center' }}
        >
          {icon}
        </motion.div>

        {/* Color strip */}
        <motion.div
          initial={{ scaleY: 0 }} animate={{ scaleY: 1 }}
          transition={{ delay: 0.3, duration: 0.6, ease: 'easeOut' }}
          style={{ height: 4, borderRadius: 2, background: `linear-gradient(90deg, ${color}, ${color}44)`, transformOrigin: 'left' }}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {tags.map(tag => (
            <motion.span key={tag}
              whileHover={{ x: 4 }}
              style={{
                fontSize: '0.7rem', fontWeight: 700, padding: '5px 10px', borderRadius: 6,
                background: `${tagColor(tag)}22`, color: tagColor(tag),
                border: `1px solid ${tagColor(tag)}44`, cursor: 'default',
              }}
            >
              {tag}
            </motion.span>
          ))}
        </div>

        <div style={{ borderTop: '1px solid #2a2a3a', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: '0.68rem', color: '#666680', fontFamily: 'monospace' }}>📅 {formatDate(date)}</div>
          <div style={{ fontSize: '0.68rem', color: '#666680', fontFamily: 'monospace' }}>⏱ {readTime(content)}</div>
        </div>

        {/* Vertical text */}
        <div style={{
          writingMode: 'vertical-rl', textOrientation: 'mixed',
          fontSize: '0.6rem', color: '#333350', letterSpacing: '0.2em',
          textTransform: 'uppercase', marginTop: 'auto', fontWeight: 700,
        }}>
          SIVA SHANMUGA VADIVEL
        </div>
      </motion.div>

      {/* Right content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '32px 28px 48px' }}>
        <motion.h1
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          style={{ fontSize: 'clamp(1.3rem, 2.5vw, 1.8rem)', color: 'var(--text-h)', lineHeight: 1.3, marginBottom: 16 }}
        >
          {title}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}
          style={{
            padding: '14px 18px', borderRadius: 10, marginBottom: 24,
            background: `${color}12`, borderLeft: `3px solid ${color}`,
            fontSize: '0.88rem', color: 'var(--text)', lineHeight: 1.65, fontStyle: 'italic',
          }}
        >
          {excerpt}
        </motion.p>

        <div className="design2-prose">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
        </div>
      </div>

      <style>{`
        .design2-prose { line-height: 1.8; color: var(--text); font-size: 0.88rem; }
        .design2-prose h1,.design2-prose h2,.design2-prose h3 { color: var(--text-h); margin-top: 1.8em; margin-bottom: 0.4em; }
        .design2-prose h2 { font-size: 1.1rem; font-weight: 800; letter-spacing: -0.01em; }
        .design2-prose h3 { font-size: 0.95rem; color: ${color}; text-transform: uppercase; letter-spacing: 0.08em; }
        .design2-prose p { margin-bottom: 1em; }
        .design2-prose ul,.design2-prose ol { padding-left: 1.4em; margin-bottom: 1em; }
        .design2-prose li { margin-bottom: 0.3em; }
        .design2-prose li::marker { color: ${color}; font-weight: 700; }
        .design2-prose strong { color: var(--text-h); background: ${color}18; padding: 0 3px; border-radius: 3px; }
        .design2-prose table { width:100%; border-collapse:collapse; margin-bottom:1em; font-size:0.82rem; }
        .design2-prose th { background:${color}22; color:${color}; padding:7px 10px; text-align:left; font-size:0.75rem; text-transform:uppercase; letter-spacing:0.05em; }
        .design2-prose td { padding:6px 10px; border-bottom:1px solid var(--border); }
        .design2-prose hr { border:none; height:1px; background:linear-gradient(90deg,${color},transparent); margin:1.5em 0; }
      `}</style>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// DESIGN 3 — Glassmorphism Dark
// Dark translucent panels, glowing accents, animated section entries
// ══════════════════════════════════════════════════════════════════════════════
function Design3({ post }) {
  const { frontmatter, content } = post
  const { title, date, tags = [], excerpt } = frontmatter
  const color = tagColor(tags[0])
  const icon = tagIcon(tags)
  const scrollRef = useRef(null)

  return (
    <div ref={scrollRef} style={{
      height: 600, overflowY: 'auto', borderRadius: 16,
      background: 'linear-gradient(135deg, #0a0a12 0%, #12101a 100%)',
      position: 'relative',
    }}>
      <ScrollBar color={color} containerRef={scrollRef} />
      <Particles color={color} />

      <div style={{ position: 'relative', zIndex: 1, padding: '40px 32px 60px' }}>
        {/* Header glass panel */}
        <motion.div
          initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: `1px solid ${color}44`,
            borderRadius: 20, padding: '28px 28px 24px', marginBottom: 28,
            backdropFilter: 'blur(20px)',
            boxShadow: `0 0 40px ${color}22, inset 0 1px 0 rgba(255,255,255,0.06)`,
          }}
        >
          {/* Glow */}
          <div style={{
            position: 'absolute', top: -60, right: -60,
            width: 200, height: 200, borderRadius: '50%',
            background: color, filter: 'blur(80px)', opacity: 0.15, pointerEvents: 'none',
          }} />

          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            <motion.div
              animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              style={{ fontSize: 52, flexShrink: 0, filter: `drop-shadow(0 0 20px ${color})` }}
            >
              {icon}
            </motion.div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                {tags.map(tag => (
                  <span key={tag} style={{
                    fontSize: '0.65rem', fontWeight: 700, padding: '2px 9px', borderRadius: 999,
                    border: `1px solid ${tagColor(tag)}66`, color: tagColor(tag),
                    background: `${tagColor(tag)}14`, fontFamily: 'monospace',
                  }}>#{tag}</span>
                ))}
              </div>
              <h1 style={{ margin: '0 0 10px', fontSize: 'clamp(1.1rem, 2.5vw, 1.6rem)', color: '#f0eeff', lineHeight: 1.3 }}>
                {title}
              </h1>
              <div style={{ display: 'flex', gap: 16, fontSize: '0.72rem', color: `${color}cc`, fontFamily: 'monospace' }}>
                <span>📅 {formatDate(date)}</span>
                <span>⏱ {readTime(content)}</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Excerpt */}
        <motion.div
          initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          style={{
            padding: '16px 20px', borderRadius: 12, marginBottom: 28,
            background: `${color}14`, border: `1px solid ${color}33`,
            fontSize: '0.88rem', color: '#b0a8c8', lineHeight: 1.7, fontStyle: 'italic',
          }}
        >
          ✦ {excerpt}
        </motion.div>

        {/* Content */}
        <div className="design3-prose">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
        </div>
      </div>

      <style>{`
        .design3-prose { line-height: 1.8; color: #9090b0; font-size: 0.88rem; }
        .design3-prose h1,.design3-prose h2,.design3-prose h3 { margin-top: 1.8em; margin-bottom: 0.4em; }
        .design3-prose h2 { font-size: 1.1rem; color: ${color}; padding: 10px 14px; background: ${color}12; border-radius: 8px; border-left: 3px solid ${color}; }
        .design3-prose h3 { font-size: 0.95rem; color: #e0d8ff; }
        .design3-prose p { margin-bottom: 1em; }
        .design3-prose ul,.design3-prose ol { padding-left: 1.4em; margin-bottom: 1em; }
        .design3-prose li { margin-bottom: 0.3em; }
        .design3-prose li::marker { color: ${color}; }
        .design3-prose strong { color: #fff; }
        .design3-prose table { width:100%; border-collapse:collapse; margin-bottom:1em; font-size:0.82rem; }
        .design3-prose th { background:${color}22; color:${color}; padding:8px 12px; text-align:left; border-bottom: 1px solid ${color}44; }
        .design3-prose td { padding:7px 12px; border-bottom:1px solid #1e1e2e; color:#b0a8c8; }
        .design3-prose hr { border:none; height:1px; background:linear-gradient(90deg,${color}88,transparent); margin:1.5em 0; }
      `}</style>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// DESIGN 4 — Editorial Cards
// Content broken into animated cards per section, step-by-step reveal
// ══════════════════════════════════════════════════════════════════════════════
function AnimatedSection({ children, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, delay, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}

function Design4({ post }) {
  const { frontmatter, content } = post
  const { title, date, tags = [], excerpt } = frontmatter
  const color = tagColor(tags[0])
  const icon = tagIcon(tags)
  const scrollRef = useRef(null)

  // Split content into sections by H2
  const sections = content.split(/(?=^## )/m).filter(Boolean)

  return (
    <div ref={scrollRef} style={{ height: 600, overflowY: 'auto', borderRadius: 16, background: 'var(--bg)' }}>
      <ScrollBar color={color} containerRef={scrollRef} />

      <div style={{ padding: '32px 28px 60px', maxWidth: 680, margin: '0 auto' }}>

        {/* Title banner */}
        <AnimatedSection>
          <div style={{
            borderRadius: 20, overflow: 'hidden', marginBottom: 28,
            background: `linear-gradient(120deg, ${color}22 0%, var(--card-bg) 100%)`,
            border: `1px solid ${color}33`, padding: '28px 24px',
            position: 'relative',
          }}>
            <motion.div
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 3, repeat: Infinity, repeatDelay: 5, ease: 'easeInOut' }}
              style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)',
                pointerEvents: 'none',
              }}
            />
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 14 }}>
              <motion.span
                animate={{ rotate: [0, 15, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
                style={{ fontSize: 48, filter: `drop-shadow(0 4px 12px ${color}88)` }}
              >
                {icon}
              </motion.span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {tags.map(tag => (
                    <span key={tag} style={{
                      fontSize: '0.66rem', fontWeight: 700, padding: '2px 9px', borderRadius: 999,
                      background: `${tagColor(tag)}22`, color: tagColor(tag),
                      border: `1px solid ${tagColor(tag)}44`,
                    }}>{tag}</span>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 12, fontSize: '0.72rem', color: 'var(--text)', opacity: 0.6 }}>
                  <span>📅 {formatDate(date)}</span>
                  <span>⏱ {readTime(content)}</span>
                </div>
              </div>
            </div>
            <h1 style={{ margin: 0, fontSize: 'clamp(1.2rem, 2.5vw, 1.7rem)', color: 'var(--text-h)', lineHeight: 1.3 }}>
              {title}
            </h1>
          </div>
        </AnimatedSection>

        {/* Excerpt */}
        <AnimatedSection delay={0.1}>
          <motion.div
            whileHover={{ scale: 1.01 }}
            style={{
              padding: '16px 20px', borderRadius: 14, marginBottom: 24,
              background: `${color}10`, border: `1.5px dashed ${color}55`,
              fontSize: '0.9rem', color: 'var(--text)', lineHeight: 1.7,
            }}
          >
            <span style={{ color, fontWeight: 700, marginRight: 8 }}>✦</span>
            {excerpt}
          </motion.div>
        </AnimatedSection>

        {/* Sections as cards */}
        {sections.map((section, i) => {
          const isH2 = section.startsWith('## ')
          const lines = section.split('\n')
          const heading = isH2 ? lines[0].replace('## ', '') : null
          const body = isH2 ? lines.slice(1).join('\n') : section

          return (
            <AnimatedSection key={i} delay={0.05}>
              <motion.div
                whileHover={{ y: -2, boxShadow: `0 8px 32px ${color}18` }}
                transition={{ duration: 0.2 }}
                style={{
                  borderRadius: 14, overflow: 'hidden', marginBottom: 16,
                  background: 'var(--card-bg)', border: '1px solid var(--border)',
                  transition: 'box-shadow 0.2s ease',
                }}
              >
                {heading && (
                  <div style={{
                    padding: '12px 20px',
                    background: `${color}14`,
                    borderBottom: `1px solid ${color}22`,
                    display: 'flex', alignItems: 'center', gap: 10,
                  }}>
                    <motion.div
                      animate={{ rotate: [0, 360] }}
                      transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                      style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }}
                    />
                    <h2 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {heading}
                    </h2>
                  </div>
                )}
                <div className="design4-prose" style={{ padding: '16px 20px' }}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{body}</ReactMarkdown>
                </div>
              </motion.div>
            </AnimatedSection>
          )
        })}
      </div>

      <style>{`
        .design4-prose { line-height: 1.75; color: var(--text); font-size: 0.87rem; }
        .design4-prose h1 { display: none; }
        .design4-prose h2 { display: none; }
        .design4-prose h3 { font-size: 0.9rem; color: ${color}; font-weight: 700; margin: 1em 0 0.4em; }
        .design4-prose p { margin-bottom: 0.9em; }
        .design4-prose ul,.design4-prose ol { padding-left: 1.3em; margin-bottom: 0.9em; }
        .design4-prose li { margin-bottom: 0.25em; }
        .design4-prose li::marker { color: ${color}; font-weight: 700; }
        .design4-prose strong { color: var(--text-h); font-weight: 700; }
        .design4-prose table { width:100%; border-collapse:collapse; margin-bottom:1em; font-size:0.82rem; }
        .design4-prose th { background:${color}18; color:${color}; padding:7px 10px; text-align:left; font-size:0.75rem; }
        .design4-prose td { padding:6px 10px; border-bottom:1px solid var(--border); }
        .design4-prose hr { display: none; }
        .design4-prose em { color: var(--text); opacity: 0.8; }
      `}</style>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// SHOWCASE PAGE
// ══════════════════════════════════════════════════════════════════════════════
const DESIGNS = [
  { id: 1, name: 'Cinematic Hero', emoji: '🎬', desc: 'Full gradient hero banner, wave SVG, parallax icon, animated excerpt callout, color-coded sections', Component: Design1 },
  { id: 2, name: 'Magazine Split', emoji: '📰', desc: 'Dark sticky sidebar with metadata, rotating icon, right-side scrollable content, gradient HR dividers', Component: Design2 },
  { id: 3, name: 'Glassmorphism Dark', emoji: '💎', desc: 'Dark background, frosted glass panels, glow blobs, floating particles, neon monospace tags', Component: Design3 },
  { id: 4, name: 'Editorial Cards', emoji: '🃏', desc: 'Content split into hover-lift cards per section, spinning dot headers, shimmer sweep, scroll-triggered reveals', Component: Design4 },
]

export default function BlogPostDesignShowcase() {
  const [post, setPost] = useState(null)
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    loadPost('spicy-mushroom-masala-omelet').then(setPost)
  }, [])

  if (!post) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text)' }}>
      Loading preview…
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', padding: '60px 24px 120px' }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          style={{ textAlign: 'center', marginBottom: 56 }}
        >
          <span style={{
            fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: '0.15em', color: 'var(--accent)', display: 'block', marginBottom: 10,
          }}>Design Picker</span>
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', margin: '0 0 12px', color: 'var(--text-h)' }}>
            Blog Post Designs
          </h1>
          <p style={{ color: 'var(--text)', maxWidth: 500, margin: '0 auto' }}>
            Each design is rendered with your real blog post. Scroll inside each preview. Click <strong>Select</strong> to pick one.
          </p>
        </motion.div>

        {/* Design sections */}
        {DESIGNS.map((design, di) => {
          const { Component, id, name, desc, emoji } = design
          const isSelected = selected === id

          return (
            <motion.section key={id}
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: di * 0.1 }}
              style={{ marginBottom: 72 }}
            >
              {/* Label row */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginBottom: 16, flexWrap: 'wrap', gap: 12,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 28 }}>{emoji}</span>
                  <div>
                    <h2 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--text-h)', fontWeight: 700 }}>
                      Design {id} — {name}
                    </h2>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text)', opacity: 0.7 }}>{desc}</p>
                  </div>
                </div>
                <motion.button
                  onClick={() => setSelected(isSelected ? null : id)}
                  whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                  style={{
                    padding: '10px 22px', borderRadius: 999, fontWeight: 700,
                    fontSize: '0.85rem', cursor: 'pointer',
                    background: isSelected ? 'var(--accent)' : 'var(--accent-bg)',
                    color: isSelected ? '#fff' : 'var(--accent)',
                    border: '1.5px solid var(--accent-border)',
                    boxShadow: isSelected ? '0 4px 20px rgba(124,58,237,0.35)' : 'none',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {isSelected ? '✓ Selected' : 'Select this design'}
                </motion.button>
              </div>

              {/* Accent line */}
              <div style={{
                height: 2, borderRadius: 2, marginBottom: 20,
                background: isSelected ? 'linear-gradient(90deg, var(--accent), transparent)' : 'var(--border)',
                transition: 'background 0.3s ease',
              }} />

              {/* Live preview */}
              <div style={{ border: `2px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`, borderRadius: 18, overflow: 'hidden', transition: 'border 0.3s ease' }}>
                <Component post={post} />
              </div>
            </motion.section>
          )
        })}
      </div>

      {/* Sticky confirm bar */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            style={{
              position: 'fixed', bottom: 24, left: '50%', marginLeft: -210, width: 420,
              background: 'var(--card-bg)', border: '1.5px solid var(--accent-border)',
              borderRadius: 16, boxShadow: '0 8px 40px rgba(124,58,237,0.25)',
              padding: '16px 24px', display: 'flex', alignItems: 'center',
              justifyContent: 'space-between', gap: 16, zIndex: 200,
            }}
          >
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--accent)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Selected</div>
              <div style={{ fontWeight: 700, color: 'var(--text-h)', fontSize: '0.95rem' }}>
                {DESIGNS.find(d => d.id === selected)?.emoji} Design {selected} — {DESIGNS.find(d => d.id === selected)?.name}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <motion.button
                onClick={() => setSelected(null)} whileTap={{ scale: 0.96 }}
                style={{
                  padding: '8px 16px', borderRadius: 999, cursor: 'pointer',
                  background: 'none', border: '1px solid var(--border)',
                  color: 'var(--text)', fontSize: '0.82rem', fontWeight: 600,
                }}
              >Cancel</motion.button>
              <motion.button
                whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                onClick={() => alert(`You picked Design ${selected} — ${DESIGNS.find(d=>d.id===selected)?.name}! Tell me this number and I'll apply it.`)}
                style={{
                  padding: '8px 20px', borderRadius: 999, cursor: 'pointer',
                  background: 'var(--accent)', border: 'none',
                  color: '#fff', fontSize: '0.82rem', fontWeight: 700,
                  boxShadow: '0 4px 16px rgba(124,58,237,0.4)',
                }}
              >
                Use this design ✓
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
