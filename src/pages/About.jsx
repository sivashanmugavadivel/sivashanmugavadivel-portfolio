import { motion, useMotionValue, useTransform, useSpring, useInView, useAnimation } from 'framer-motion'
import { useRef, useState, useEffect } from 'react'

function ScrollMotion({ children, initial, visible, style, margin = '-60px', delay = 0 }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: false, margin })
  const controls = useAnimation()

  useEffect(() => {
    if (isInView) {
      controls.start({ ...visible, transition: { duration: 1.0, ease: [0.16, 1, 0.3, 1], delay } })
    } else {
      controls.start({ ...initial, transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] } })
    }
  }, [isInView, controls])

  return (
    <motion.div ref={ref} initial={initial} animate={controls} style={style}>
      {children}
    </motion.div>
  )
}
import Button from '../components/ui/Button'
import cfg from '../data/config.json'

/* ── Reusable scroll-reveal wrapper ── */
function Reveal({ children, delay = 0, y = 32, x = 0, style }) {
  return (
    <motion.div
      initial={{ opacity: 0, y, x }}
      whileInView={{ opacity: 1, y: 0, x: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1], delay }}
      style={style}
    >
      {children}
    </motion.div>
  )
}

/* ── Section label + heading ── */
function SectionHeading({ label, title, align = 'center' }) {
  return (
    <div className="section-header" style={{ textAlign: align }}>
      <Reveal delay={0}>
        <span className="section-label">{label}</span>
      </Reveal>
      <Reveal delay={0.1}>
        <h2 style={{ position: 'relative', display: 'inline-block' }}>
          {title}
          <motion.span
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4, ease: 'easeOut' }}
            style={{
              position: 'absolute', bottom: -4, left: 0, right: 0,
              height: 3, background: 'var(--accent)', borderRadius: 2,
              transformOrigin: 'left',
            }}
          />
        </h2>
      </Reveal>
    </div>
  )
}

/* ── Data ── */
const timeline = cfg.journey

const socials = [
  { label: 'GitHub', href: cfg.social.github.href, icon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
    </svg>
  )},
  { label: 'LinkedIn', href: cfg.social.linkedin.href, icon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  )},
  { label: 'X / Twitter', href: cfg.social.twitter.href, icon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.258 5.63 5.907-5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  )},
]

/* ── Animated image frame ── */
function ImageFrame({ name }) {
  const ref = useRef(null)
  const [hovered, setHovered] = useState(false)
  const isMobile = window.innerWidth <= 768

  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  const rotateX = useTransform(mouseY, [-0.5, 0.5], [8, -8])
  const rotateY = useTransform(mouseX, [-0.5, 0.5], [-8, 8])
  const springX = useSpring(rotateX, { stiffness: 120, damping: 20 })
  const springY = useSpring(rotateY, { stiffness: 120, damping: 20 })

  const handleMouseMove = (e) => {
    const rect = ref.current.getBoundingClientRect()
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5)
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5)
  }
  const handleMouseLeave = () => {
    mouseX.set(0)
    mouseY.set(0)
    setHovered(false)
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={handleMouseLeave}
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
      style={{
        flex: '0 0 auto',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        perspective: 800,
        marginTop: 40,
      }}
    >
      {/* Outer rotating ring */}
      <motion.div
        className="about-image-ring-outer"
        animate={{ rotate: 360 }}
        transition={{ duration: 14, repeat: Infinity, ease: 'linear' }}
        style={{
          position: 'absolute',
          width: isMobile ? '260px' : 'clamp(340px, 40vw, 500px)',
          height: isMobile ? '260px' : 'clamp(340px, 40vw, 500px)',
          borderRadius: '62% 38% 46% 54% / 60% 44% 56% 40%',
          border: '2px solid var(--accent)',
          opacity: 0.4,
        }}
      />

      {/* Inner dashed counter-ring */}
      <motion.div
        className="about-image-ring-inner"
        animate={{ rotate: -360 }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        style={{
          position: 'absolute',
          width: isMobile ? '240px' : 'clamp(315px, 37vw, 470px)',
          height: isMobile ? '240px' : 'clamp(315px, 37vw, 470px)',
          borderRadius: '46% 54% 62% 38% / 44% 56% 44% 56%',
          border: '1.5px dashed var(--accent)',
          opacity: 0.2,
        }}
      />

      {/* Glow blob — static */}
      <div
        style={{
          position: 'absolute',
          width: 'clamp(200px, 24vw, 320px)',
          height: 'clamp(200px, 24vw, 320px)',
          borderRadius: '50%',
          background: 'var(--accent)',
          opacity: 0.1,
          filter: 'blur(52px)',
          pointerEvents: 'none',
        }}
      />

      {/* 3D-tilting image container */}
      <motion.div
        style={{
          rotateX: springX,
          rotateY: springY,
          transformStyle: 'preserve-3d',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Blob clip */}
        <motion.div
          className="about-image-blob"
          animate={{
            borderRadius: hovered
              ? ['58% 42% 50% 50% / 48% 48% 52% 52%', '48% 52% 42% 58% / 52% 40% 60% 48%']
              : '58% 42% 50% 50% / 48% 48% 52% 52%',
          }}
          transition={{ duration: 3, repeat: hovered ? Infinity : 0, repeatType: 'mirror', ease: 'easeInOut' }}
          style={{
            width: isMobile ? '220px' : 'clamp(310px, 38vw, 490px)',
            height: isMobile ? '280px' : 'clamp(400px, 50vw, 580px)',
            overflow: 'hidden',
            boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
          }}
        >
          {/* Image with subtle scale on hover */}
          <motion.img
            src={`${import.meta.env.BASE_URL}about.png`}
            alt={name}
            animate={{ scale: hovered ? 1.06 : 1 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 30%', display: 'block' }}
          />


        </motion.div>
      </motion.div>
    </motion.div>
  )
}

/* ── About Hero ── */
function AboutHero() {
  const isMobile = window.innerWidth <= 768
  return (
    <section className="about-hero-section" style={{
      paddingTop: isMobile ? 'clamp(100px, 16vw, 140px)' : 'clamp(20px, 3vw, 40px)',
      paddingBottom: 'clamp(40px, 6vw, 72px)',
      background: 'var(--bg)',
      overflow: 'hidden',
      contain: 'paint',
    }}>
      <div className="page-container">
        <div className="about-hero-inner" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'clamp(40px, 6vw, 80px)',
          flexWrap: 'wrap',
        }}>

          {/* ── Left — text ── */}
          <div style={{ flex: '1 1 420px', minWidth: 0 }}>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              style={{ fontSize: '1rem', color: 'var(--text)', marginBottom: 8 }}
            >
              {cfg.about.heroGreeting}
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              style={{ fontSize: 'clamp(1.5rem, 4.2vw, 3.8rem)', lineHeight: 1.1, marginBottom: 16, fontFamily: "'Lilita One', cursive" }}
            >
              {cfg.personal.name}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              style={{ fontSize: 'clamp(1rem, 2vw, 1.25rem)', marginBottom: 32, color: 'var(--text)' }}
            >
              And I'm a{' '}
              <span style={{ color: 'var(--accent)', fontWeight: 600 }}>
                {cfg.personal.tagline}
              </span>
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
              style={{ fontSize: '0.95rem', color: 'var(--text)', opacity: 0.75, marginBottom: 28, lineHeight: 1.7, maxWidth: 480 }}
            >
              {cfg.personal.bio}
            </motion.p>

            {/* Social icons */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 36 }}
            >
              {socials.map(({ label, href, icon }) => (
                <motion.a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ y: -3, scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  title={label}
                  style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    width: 42, height: 42, borderRadius: '50%',
                    background: 'var(--card-bg)',
                    border: '1.5px solid var(--accent)',
                    color: 'var(--accent)',
                    transition: 'background 0.2s, box-shadow 0.2s',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'var(--accent)'
                    e.currentTarget.style.color = '#fff'
                    e.currentTarget.style.boxShadow = '0 0 18px var(--accent)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'var(--card-bg)'
                    e.currentTarget.style.color = 'var(--accent)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  {icon}
                </motion.a>
              ))}
            </motion.div>
          </div>

          {/* ── Right — image frame ── */}
          <ImageFrame name={cfg.personal.name} />

        </div>
      </div>

      <style>{`
        @media (min-width: 769px) {
          .about-hero-section .page-container { max-width: 100% !important; padding-left: clamp(24px, 5vw, 80px) !important; padding-right: clamp(24px, 5vw, 80px) !important; }
        }
        @media (max-width: 768px) {
          .about-hero-section { padding-top: 90px !important; }
          .about-hero-inner { flex-direction: column-reverse !important; text-align: center; align-items: center !important; }
          .about-hero-inner .social-row { justify-content: center !important; }
          .about-image-ring-outer { width: 260px !important; height: 260px !important; }
          .about-image-ring-inner { width: 240px !important; height: 240px !important; }
          .about-image-blob { width: 220px !important; height: 280px !important; }
        }
      `}</style>
    </section>
  )
}

/* ── Bio Section ── */
function BioSection() {
  return (
    <section className="section" style={{ background: 'var(--bg-secondary)' }}>
      <div className="page-container">
        <div className="grid-2" style={{ alignItems: 'center', gap: 64 }}>

          {/* Photo */}
          <Reveal delay={0} x={-30} y={0}>
            <div style={{
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              aspectRatio: '4/5',
              position: 'relative',
              boxShadow: 'var(--shadow)',
            }}>
              <img
                src={`${import.meta.env.BASE_URL}avatar1.jpg`}
                alt="Siva at work"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={e => { e.target.style.display = 'none' }}
              />
              <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(to top, rgba(0,0,0,0.3), transparent 50%)',
              }} />
            </div>
          </Reveal>

          {/* Text */}
          <div>
            <Reveal delay={0}><span className="section-label">{cfg.about.bioLabel}</span></Reveal>
            <Reveal delay={0.1}>
              <h2 style={{ marginBottom: 20 }}>{cfg.about.bioHeading}</h2>
            </Reveal>
            {(cfg.about.bioParagraphs || []).map((para, i) => (
              <Reveal key={i} delay={0.2 + i * 0.1}>
                <p style={{ color: 'var(--text)', lineHeight: 1.8, marginBottom: i < cfg.about.bioParagraphs.length - 1 ? 16 : 32 }}>
                  {para}
                </p>
              </Reveal>
            ))}
            <Reveal delay={0.5}>
              <Button to="/contact">Work Together →</Button>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ── Timeline Section ── */
function TimelineSection() {
  return (
    <section className="section" style={{ overflow: 'hidden' }}>
      <div className="page-container">
        <SectionHeading label="Journey" title="Experience & Education" />

        <div style={{ position: 'relative', maxWidth: 760, margin: '0 auto' }}>
          {/* Vertical line */}
          <motion.div
            initial={{ scaleY: 0 }}
            whileInView={{ scaleY: 1 }}
            viewport={{ once: false, margin: '-40px' }}
            transition={{ duration: 1.2, ease: 'easeInOut' }}
            style={{
              position: 'absolute',
              left: '50%',
              top: 0, bottom: 0,
              width: 1,
              background: 'var(--border)',
              transformOrigin: 'top',
            }}
          />

          {timeline.map((item, i) => {
            const isLeft = i % 2 === 0
            return (
              <ScrollMotion
                key={i}
                initial={{ opacity: 0, y: 30 }}
                visible={{ opacity: 1, y: 0 }}
                delay={i * 0.15}
                style={{ marginBottom: 48, position: 'relative' }}
              >
                {/* Dot on the line */}
                <div style={{
                  position: 'absolute',
                  left: '50%',
                  top: 24,
                  transform: 'translateX(-50%)',
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  background: 'var(--accent)',
                  border: '2px solid var(--bg)',
                  zIndex: 1,
                }} />

                {/* Card */}
                <div className="timeline-card" style={{
                  width: 'calc(50% - 32px)',
                  marginLeft: isLeft ? 0 : 'calc(50% + 32px)',
                }}>
                  <motion.div
                    whileHover={{ y: -4, boxShadow: 'var(--shadow-hover)' }}
                    transition={{ duration: 0.25 }}
                    style={{
                      background: 'var(--card-bg)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius)',
                      padding: '20px 24px',
                      boxShadow: 'var(--shadow)',
                    }}
                  >
                    <span style={{
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: 'var(--accent)',
                    }}>
                      {item.year}
                    </span>
                    <h3 style={{ margin: '6px 0 2px', fontSize: '1rem' }}>{item.role}</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--accent)', marginBottom: 8 }}>{item.org}</p>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text)', lineHeight: 1.65, margin: 0 }}>{item.desc}</p>
                  </motion.div>
                </div>
              </ScrollMotion>
            )
          })}
        </div>
      </div>

      <style>{`
        @media (max-width: 640px) {
          .timeline-line { display: none; }
          .timeline-card { width: 100% !important; margin-left: 0 !important; }
        }
      `}</style>
    </section>
  )
}

/* ── Life Sections (Now / Principles / Fun Side) ── */
const ACCENT_COLORS = ['#7c3aed', '#10b981', '#f59e0b']

/* — 6 design variants — */
/* Now → Timeline */
function NowSection() {
  const { label, heading, items } = cfg.about.now
  const color = ACCENT_COLORS[0]
  return (
    <section className="section" style={{ background: 'var(--bg-secondary)' }}>
      <div className="page-container">
        <SectionHeading label={label} title={heading} />
        <div style={{ position: 'relative', paddingLeft: 32, maxWidth: 680, margin: '0 auto' }}>
          <motion.div initial={{ scaleY: 0 }} whileInView={{ scaleY: 1 }} viewport={{ once: true }}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
            style={{ position: 'absolute', left: 10, top: 6, bottom: 6, width: 2,
              background: `linear-gradient(to bottom, ${color}, transparent)`, borderRadius: 2, transformOrigin: 'top' }} />
          {items.map((item, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -24 }} whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.1, duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
              style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 16, position: 'relative' }}>
              <motion.div whileHover={{ scale: 1.4 }} style={{ position: 'absolute', left: -26, top: 10,
                width: 10, height: 10, borderRadius: '50%', background: color,
                border: '2px solid var(--bg)', boxShadow: `0 0 10px ${color}`, flexShrink: 0 }} />
              <motion.div whileHover={{ x: 4, borderColor: color }} transition={{ duration: 0.2 }}
                style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 10,
                  padding: '13px 18px', flex: 1, borderLeft: `3px solid ${color}`, transition: 'border-color 0.2s' }}>
                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text)', lineHeight: 1.65 }}>{item}</p>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* Principles → Numbered List */
function PrinciplesSection() {
  const { label, heading, items } = cfg.about.principles
  const color = ACCENT_COLORS[1]
  return (
    <section className="section" style={{ background: 'var(--bg)' }}>
      <div className="page-container">
        <SectionHeading label={label} title={heading} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 680, margin: '0 auto' }}>
          {items.map((item, i) => (
            <motion.div key={i} whileHover={{ x: 6 }}
              initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.08, duration: 0.4 }}
              style={{ display: 'flex', alignItems: 'center', gap: 18, background: 'var(--card-bg)',
                border: '1px solid var(--border)', borderRadius: 12, padding: '14px 20px' }}>
              <motion.div whileHover={{ scale: 1.1, boxShadow: `0 0 18px ${color}` }}
                style={{ width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                  background: `${color}18`, border: `2px solid ${color}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: '0.85rem', color, fontFamily: 'var(--mono)',
                  transition: 'box-shadow 0.2s' }}>
                {String(i + 1).padStart(2, '0')}
              </motion.div>
              <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text)', lineHeight: 1.65 }}>{item}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* Fun Side → Pill Badges */
function FunSideSection() {
  const { label, heading, items } = cfg.about.funSide
  const color = ACCENT_COLORS[2]
  return (
    <section className="section" style={{ background: 'var(--bg-secondary)' }}>
      <div className="page-container">
        <SectionHeading label={label} title={heading} />
        <motion.div
          initial="hidden" whileInView="show" viewport={{ once: true }}
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
          style={{ display: 'flex', flexWrap: 'wrap', gap: 14, justifyContent: 'center', maxWidth: 720, margin: '0 auto' }}>
          {items.map((item, i) => (
            <motion.div key={i}
              variants={{ hidden: { opacity: 0, scale: 0.75 }, show: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 300 } } }}
              whileHover={{ scale: 1.08, background: color, color: '#fff', boxShadow: `0 0 20px ${color}66` }}
              style={{ padding: '12px 24px', borderRadius: 999, background: 'var(--card-bg)',
                border: `1.5px solid ${color}`, color: 'var(--text-h)', fontSize: '0.9rem',
                fontWeight: 500, cursor: 'default', transition: 'background 0.2s, color 0.2s, box-shadow 0.2s' }}>
              {item}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

function LifeSection() {
  return (
    <>
      <NowSection />
      <PrinciplesSection />
      <FunSideSection />
    </>
  )
}

/* ── CTA at bottom ── */
function AboutCTA() {
  return (
    <section className="section">
      <div className="page-container">
        <Reveal y={24}>
          <div style={{
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 20,
          }}>
            <span className="section-label">{cfg.about.ctaLabel}</span>
            <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)', maxWidth: 480, margin: 0 }}>
              {cfg.about.ctaHeading}
            </h2>
            <p style={{ color: 'var(--text)', maxWidth: 380, lineHeight: 1.7 }}>
              {cfg.about.ctaSubtext}
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
              <Button to="/contact">Get in Touch</Button>
              <Button to="/blog" variant="outline">Read the Blog →</Button>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

/* ── Main About page ── */
export default function About() {
  return (
    <div>
      <AboutHero />
      <BioSection />
      <TimelineSection />
      <LifeSection />
      <AboutCTA />
    </div>
  )
}
