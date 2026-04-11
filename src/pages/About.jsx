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
import HometownSection from '../components/HometownSection'
import SkillRadar from '../components/SkillRadar'
import cfg from '../data/config.json'

/* ── Reusable scroll-reveal wrapper ── */
function Reveal({ children, delay = 0, y = 32, x = 0, style }) {
  return (
    <motion.div
      initial={{ opacity: 0, y, x }}
      whileInView={{ opacity: 1, y: 0, x: 0 }}
      viewport={{ once: false, margin: '-60px' }}
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
            viewport={{ once: false }}
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

function HandwritingGreeting({ greeting, isMobile }) {
  return (
    <div style={{
      position: 'absolute',
      top: isMobile ? '2%' : '5%',
      left: isMobile ? '-4%' : '-6%',
      transform: 'rotate(-15deg)',
      zIndex: 10,
      pointerEvents: 'none',
      display: 'flex',
      fontFamily: "'Kaushan Script', cursive",
      fontSize: isMobile ? 'clamp(1.6rem, 7vw, 2.2rem)' : 'clamp(2.2rem, 3vw, 3rem)',
      fontWeight: 400,
      color: 'var(--text-h)',
      textShadow: '0 2px 10px rgba(0,0,0,0.4)',
      whiteSpace: 'pre',
    }}>
      {greeting.split('').map((char, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.01, delay: 0.8 + i * 0.09 }}
          style={{ display: 'inline-block' }}
        >
          {char}
        </motion.span>
      ))}
    </div>
  )
}

/* ── Animated image frame ── */
function ImageFrame({ name, greeting }) {
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

      {/* Handwritten greeting — stroke-dashoffset writing animation with measured path length */}
      {greeting && <HandwritingGreeting greeting={greeting} isMobile={isMobile} />}

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
            boxShadow: '0 20px 60px rgba(0,0,0,0.08)',
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

          {/* ── Right — image frame + handwritten overlay ── */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ImageFrame name={cfg.personal.name} greeting={cfg.about.heroGreeting} />
          </div>

        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Kaushan+Script&display=block');
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
  const [expanded, setExpanded] = useState(null)

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
            const isOpen = expanded === i
            return (
              <ScrollMotion
                key={i}
                initial={{ opacity: 0, y: 30 }}
                visible={{ opacity: 1, y: 0 }}
                delay={i * 0.15}
                style={{ marginBottom: 48, position: 'relative' }}
              >
                {/* Dot on the line */}
                <motion.div
                  animate={{
                    scale: isOpen ? 1.5 : 1,
                    boxShadow: isOpen ? '0 0 12px var(--accent)' : 'none',
                  }}
                  transition={{ duration: 0.3 }}
                  style={{
                    position: 'absolute',
                    left: 'calc(50% - 6px)',
                    top: 24,
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    background: 'var(--accent)',
                    border: '2px solid var(--bg)',
                    zIndex: 1,
                  }}
                />

                {/* Card */}
                <div className="timeline-card" style={{
                  width: 'calc(50% - 32px)',
                  marginLeft: isLeft ? 0 : 'calc(50% + 32px)',
                }}>
                  <motion.div
                    onClick={() => setExpanded(isOpen ? null : i)}
                    whileHover={{ y: -4, boxShadow: 'var(--shadow-hover)' }}
                    animate={{
                      borderColor: isOpen ? 'var(--accent-border)' : 'var(--border)',
                    }}
                    transition={{ duration: 0.25 }}
                    style={{
                      background: 'var(--card-bg)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius)',
                      padding: '20px 24px',
                      boxShadow: 'var(--shadow)',
                      cursor: 'pointer',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    {/* Accent top bar when expanded */}
                    <motion.div
                      animate={{ scaleX: isOpen ? 1 : 0 }}
                      transition={{ duration: 0.3 }}
                      style={{
                        position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                        background: 'var(--accent)', transformOrigin: 'left',
                      }}
                    />

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span style={{
                        fontSize: '0.72rem', fontWeight: 600,
                        letterSpacing: '0.1em', textTransform: 'uppercase',
                        color: 'var(--accent)',
                      }}>{item.year}</span>
                      <motion.span
                        animate={{ rotate: isOpen ? 180 : 0 }}
                        transition={{ duration: 0.3 }}
                        style={{ fontSize: '0.7rem', color: 'var(--text)', opacity: 0.5 }}
                      >▼</motion.span>
                    </div>

                    <h3 style={{ margin: '6px 0 2px', fontSize: '1rem' }}>{item.role}</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--accent)', marginBottom: 8 }}>{item.org}</p>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text)', lineHeight: 1.65, margin: 0 }}>{item.desc}</p>

                    {/* Expandable detail section */}
                    <motion.div
                      initial={false}
                      animate={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }}
                      transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
                      style={{ overflow: 'hidden' }}
                    >
                      <div style={{ paddingTop: 14, borderTop: '1px dashed var(--border)', marginTop: 14 }}>
                        {/* Highlights / achievements */}
                        {item.highlights?.length > 0 && (
                          <div style={{ marginBottom: 10 }}>
                            {item.highlights.map((h, hi) => (
                              <motion.div
                                key={hi}
                                initial={{ opacity: 0, x: -10 }}
                                animate={isOpen ? { opacity: 1, x: 0 } : { opacity: 0, x: -10 }}
                                transition={{ delay: hi * 0.08, duration: 0.3 }}
                                style={{
                                  display: 'flex', alignItems: 'flex-start', gap: 8,
                                  marginBottom: 6, fontSize: '0.82rem', color: 'var(--text)', lineHeight: 1.55,
                                }}
                              >
                                <span style={{ color: 'var(--accent)', flexShrink: 0 }}>▸</span>
                                {h}
                              </motion.div>
                            ))}
                          </div>
                        )}
                        {/* Tags */}
                        {item.tags?.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {item.tags.map((t, ti) => (
                              <motion.span
                                key={ti}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={isOpen ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
                                transition={{ delay: ti * 0.05, duration: 0.2 }}
                                style={{
                                  fontSize: '0.68rem', padding: '3px 10px', borderRadius: 999,
                                  background: 'var(--accent-bg)', color: 'var(--accent)',
                                  border: '1px solid var(--accent-border)',
                                  fontWeight: 600, fontFamily: 'var(--mono)',
                                }}
                              >{t}</motion.span>
                            ))}
                          </div>
                        )}
                        {/* Tap hint if no extra data */}
                        {!item.highlights?.length && !item.tags?.length && (
                          <p style={{ fontSize: '0.78rem', color: 'var(--text)', opacity: 0.5, fontStyle: 'italic' }}>
                            More details coming soon...
                          </p>
                        )}
                      </div>
                    </motion.div>
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
          <motion.div initial={{ scaleY: 0 }} whileInView={{ scaleY: 1 }} viewport={{ once: false }}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
            style={{ position: 'absolute', left: 10, top: 6, bottom: 6, width: 2,
              background: `linear-gradient(to bottom, ${color}, transparent)`, borderRadius: 2, transformOrigin: 'top' }} />
          {items.map((item, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -24 }} whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: false }} transition={{ delay: i * 0.1, duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
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
              viewport={{ once: false }} transition={{ delay: i * 0.08, duration: 0.4 }}
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
          initial="hidden" whileInView="show" viewport={{ once: false }}
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

/* ── Status config ── */
const STATUS_CONFIG = {
  released:     { label: 'Released',              color: '#16a34a', bg: 'rgba(22,163,74,0.1)',   dot: '#16a34a' },
  play_store:   { label: 'Live on Play Store',     color: '#1d4ed8', bg: 'rgba(29,78,216,0.1)',   dot: '#3b82f6' },
  testing:      { label: 'Testing',                color: '#d97706', bg: 'rgba(217,119,6,0.1)',   dot: '#f59e0b' },
  development:  { label: 'In Development',         color: '#7c3aed', bg: 'rgba(124,58,237,0.1)', dot: '#7c3aed' },
  beta:         { label: 'Beta',                   color: '#0891b2', bg: 'rgba(8,145,178,0.1)',   dot: '#0891b2' },
  play_testing: { label: 'Testing on Play Store',  color: '#0891b2', bg: 'rgba(8,145,178,0.1)',   dot: '#0891b2' },
}

/* ── Shared dev helpers ── */
const isPulsing = s => s === 'development' || s === 'testing' || s === 'play_testing'

const DEV_STYLES = `
  @keyframes devPulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.35;transform:scale(1.6)} }
  @keyframes devFill  { from{width:0%} to{width:var(--fill-w)} }
  @keyframes devFloat { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-6px)} }
  @keyframes devShine { 0%{left:-60%} 100%{left:120%} }

  /* Mobile: show mobile row, hide desktop row + table header */
  @media (max-width: 639px) {
    .dev-table-header { display: none !important; }
    .dev-row-desktop  { display: none !important; }
    .dev-row-mobile   { display: flex !important; }
  }

  /* Desktop: show desktop row, hide mobile row */
  @media (min-width: 640px) {
    .dev-row-desktop { display: grid !important; }
    .dev-row-mobile  { display: none !important; }
  }
`

/* Phase progress bar — the core visual for each card */
function PhaseBar({ phases, currentPhase, color }) {
  const total = phases.length - 1
  const pct = Math.round((currentPhase / total) * 100)
  return (
    <div>
      {/* Dot track */}
      <div style={{ display:'flex', alignItems:'center', gap:0, position:'relative', marginBottom:8 }}>
        {phases.map((ph, i) => {
          const done = i <= currentPhase
          const active = i === currentPhase
          return (
            <div key={ph} style={{ display:'flex', alignItems:'center', flex: i < phases.length-1 ? 1 : 0 }}>
              {/* Dot */}
              <motion.div
                initial={{ scale:0 }}
                whileInView={{ scale:1 }}
                viewport={{ once:true }}
                transition={{ delay: i * 0.07, type:'spring', stiffness:300 }}
                style={{
                  width: active ? 12 : 8,
                  height: active ? 12 : 8,
                  borderRadius:'50%',
                  background: done ? color : 'var(--border)',
                  border: active ? `2px solid ${color}` : 'none',
                  boxShadow: active ? `0 0 10px ${color}` : 'none',
                  animation: active ? 'devPulse 2s ease-in-out infinite' : 'none',
                  flexShrink:0, zIndex:1, position:'relative',
                  transition:'background 0.3s',
                }}
              />
              {/* Connector line */}
              {i < phases.length - 1 && (
                <div style={{ flex:1, height:2, background:'var(--border)', position:'relative', overflow:'hidden' }}>
                  <motion.div
                    initial={{ scaleX:0 }}
                    whileInView={{ scaleX: i < currentPhase ? 1 : 0 }}
                    viewport={{ once:true }}
                    transition={{ delay: i * 0.07 + 0.1, duration:0.4 }}
                    style={{ position:'absolute', inset:0, background:color, transformOrigin:'left' }}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>
      {/* Phase labels */}
      <div style={{ display:'flex', justifyContent:'space-between' }}>
        {phases.map((ph, i) => (
          <span key={ph} style={{
            fontSize:'0.6rem', fontFamily:'var(--mono)',
            color: i <= currentPhase ? color : 'var(--text)',
            opacity: i <= currentPhase ? 1 : 0.4,
            fontWeight: i === currentPhase ? 700 : 400,
            flex: i < phases.length-1 ? 1 : 0,
            whiteSpace:'nowrap',
          }}>{ph}</span>
        ))}
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════
   DESIGN 7 — "Dashboard List"
   A full-width table-style list that looks like a
   project management dashboard. Each row has icon,
   title, platform, a mini inline phase progress bar,
   status pill, and an expand toggle that reveals
   the description and tags below.
   ════════════════════════════════════════════════════ */
function DevelopmentSection() {
  const { label, heading, subtext, phases, items } = cfg.development
  const [expanded, setExpanded] = useState(null)
  const [hoveredRow, setHoveredRow] = useState(null)

  const containerVariants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
  }
  const rowVariants = {
    hidden: { opacity: 0, x: -24 },
    show:   { opacity: 1, x: 0, transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] } },
  }

  return (
    <section className="section" style={{ background: 'var(--bg-secondary)', position: 'relative', overflow: 'hidden' }}>
      <style>{DEV_STYLES}{`
        @keyframes devRowShine {
          0%   { transform: translateX(-100%) skewX(-15deg); }
          100% { transform: translateX(300%)  skewX(-15deg); }
        }
      `}</style>

      {/* Ambient background glow */}
      <motion.div
        initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
        viewport={{ once: false }} transition={{ duration: 1.2 }}
        style={{ position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(124,58,237,0.06), transparent)' }}
      />

      <div className="page-container" style={{ position: 'relative' }}>
        <SectionHeading label={label} title={heading} />
        <Reveal delay={0.12}>
          <p style={{ textAlign: 'center', color: 'var(--text)', fontSize: '0.95rem',
            maxWidth: 520, margin: '-8px auto 52px', lineHeight: 1.7 }}>{subtext}</p>
        </Reveal>

        {/* Dashboard card — slides up on scroll */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, margin: '-60px' }}
          transition={{ duration: 0.65, ease: [0.25, 0.1, 0.25, 1] }}
          style={{ maxWidth: 900, margin: '0 auto',
            background: 'var(--card-bg)', border: '1px solid var(--border)',
            borderRadius: 20, overflow: 'hidden', boxShadow: 'var(--shadow)' }}
        >
          {/* Table header — fades in */}
          <motion.div
            className="dev-table-header"
            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
            viewport={{ once: false }} transition={{ duration: 0.4, delay: 0.3 }}
            style={{ display: 'grid', gridTemplateColumns: '44px 1fr 120px 200px 130px 36px',
              gap: 16, padding: '10px 24px',
              background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}
          >
            {['', 'Project', 'Platform', 'Phase', 'Status', ''].map((h, i) => (
              <span key={i} style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.08em',
                color: 'var(--text)', opacity: 0.45, fontFamily: 'var(--mono)',
                textTransform: 'uppercase' }}>{h}</span>
            ))}
          </motion.div>

          {/* Rows — stagger in */}
          <motion.div
            variants={containerVariants}
            initial="hidden" whileInView="show"
            viewport={{ once: false, margin: '-40px' }}
          >
            {items.map((p, i) => {
              const s = STATUS_CONFIG[p.status] || STATUS_CONFIG.development
              const isOpen = expanded === i
              const isHovered = hoveredRow === i
              const pct = Math.round((p.currentPhase / (phases.length - 1)) * 100)

              return (
                <motion.div
                  key={i}
                  variants={rowVariants}
                  style={{ borderBottom: i < items.length - 1 ? '1px solid var(--border)' : 'none' }}
                >
                  {/* ── DESKTOP row (grid layout, hidden on mobile) ── */}
                  <motion.div
                    className="dev-row-desktop"
                    onHoverStart={() => setHoveredRow(i)}
                    onHoverEnd={() => setHoveredRow(null)}
                    onClick={() => setExpanded(isOpen ? null : i)}
                    animate={{
                      backgroundColor: isHovered
                        ? 'var(--accent-bg)'
                        : isOpen ? `${p.iconBg}08` : 'transparent',
                    }}
                    transition={{ duration: 0.18 }}
                    style={{ display: 'grid', gridTemplateColumns: '44px 1fr 120px 200px 130px 36px',
                      gap: 16, padding: '14px 24px', cursor: 'pointer', alignItems: 'center',
                      position: 'relative', overflow: 'hidden' }}
                  >
                    {isHovered && (
                      <motion.div
                        initial={{ x: '-100%' }} animate={{ x: '300%' }}
                        transition={{ duration: 0.55, ease: 'easeInOut' }}
                        style={{ position: 'absolute', top: 0, bottom: 0, width: '30%',
                          background: `linear-gradient(90deg, transparent, ${p.iconBg}10, transparent)`,
                          pointerEvents: 'none', zIndex: 0 }}
                      />
                    )}
                    <motion.div
                      animate={{ scaleY: isHovered || isOpen ? 1 : 0, opacity: isHovered || isOpen ? 1 : 0 }}
                      transition={{ duration: 0.2 }}
                      style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
                        background: s.color, borderRadius: '0 2px 2px 0',
                        transformOrigin: 'center', zIndex: 1 }}
                    />
                    <motion.div whileHover={{ scale: 1.12, rotate: 5 }} transition={{ type: 'spring', stiffness: 300 }}
                      style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, zIndex: 1,
                        background: p.icon ? 'transparent' : `linear-gradient(135deg, ${p.iconBg}, ${p.iconBg}bb)`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem',
                        overflow: 'hidden', boxShadow: isHovered ? `0 4px 16px ${p.iconBg}55` : 'none',
                        transition: 'box-shadow 0.2s' }}>
                      {p.icon ? <img src={`/${p.icon}`} alt={p.title}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 10 }} />
                        : p.iconEmoji}
                    </motion.div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, zIndex: 1, minWidth: 0 }}>
                      <motion.span animate={{ color: isHovered ? 'var(--accent)' : 'var(--text-h)', x: isHovered ? 4 : 0 }}
                        transition={{ duration: 0.2 }}
                        style={{ fontSize: '0.9rem', fontWeight: 600, fontFamily: 'var(--heading)' }}
                      >{p.title}</motion.span>
                      {p.tagline && (
                        <motion.span animate={{ opacity: isHovered ? 0.8 : 0.45, x: isHovered ? 4 : 0 }}
                          transition={{ duration: 0.2 }}
                          style={{ fontSize: '0.7rem', color: 'var(--text)', fontFamily: 'var(--sans)',
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                        >{p.tagline}</motion.span>
                      )}
                    </div>
                    <span style={{ fontSize: '0.72rem', fontFamily: 'var(--mono)',
                      color: 'var(--text)', opacity: 0.55, zIndex: 1 }}>{p.platform}</span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, zIndex: 1 }}>
                      <div style={{ display: 'flex', gap: 2 }}>
                        {phases.map((ph, pi) => {
                          const done = pi <= p.currentPhase
                          const active = pi === p.currentPhase
                          return (
                            <motion.div key={ph}
                              initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: false }}
                              transition={{ delay: i * 0.08 + pi * 0.06, duration: 0.35, ease: 'easeOut' }}
                              style={{ flex: 1, height: 5, borderRadius: 3,
                                background: done ? s.color : 'var(--border)',
                                boxShadow: active ? `0 0 8px ${s.color}` : 'none',
                                animation: active ? 'devPulse 2s ease-in-out infinite' : 'none',
                                transformOrigin: 'left' }}
                            />
                          )
                        })}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <motion.span style={{ fontSize: '0.58rem', fontFamily: 'var(--mono)', color: s.color, fontWeight: 700 }}>
                          {phases[p.currentPhase]}
                        </motion.span>
                        <span style={{ fontSize: '0.58rem', fontFamily: 'var(--mono)', color: 'var(--text)', opacity: 0.4 }}>{pct}%</span>
                      </div>
                    </div>
                    <motion.span whileHover={{ scale: 1.05 }}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 5,
                        fontSize: '0.65rem', fontWeight: 600, padding: '4px 9px', borderRadius: 999,
                        background: s.bg, color: s.color, border: `1px solid ${s.color}33`,
                        fontFamily: 'var(--mono)', whiteSpace: 'nowrap', zIndex: 1 }}>
                      <span style={{ width: 5, height: 5, borderRadius: '50%', background: s.dot,
                        animation: isPulsing(p.status) ? 'devPulse 1.8s ease-in-out infinite' : 'none' }} />
                      {s.label}
                    </motion.span>
                    <motion.div animate={{ rotate: isOpen ? 180 : 0, color: isOpen ? s.color : 'var(--text)' }}
                      transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.6, zIndex: 1 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 12 15 18 9"/>
                      </svg>
                    </motion.div>
                  </motion.div>

                  {/* ── MOBILE row (flex column layout, hidden on desktop) ── */}
                  <motion.div
                    className="dev-row-mobile"
                    onClick={() => setExpanded(isOpen ? null : i)}
                    animate={{
                      backgroundColor: isOpen ? `${p.iconBg}08` : 'transparent',
                    }}
                    transition={{ duration: 0.18 }}
                    style={{ cursor: 'pointer', position: 'relative', overflow: 'hidden',
                      padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}
                  >
                    {/* Left accent bar */}
                    <motion.div
                      animate={{ scaleY: isOpen ? 1 : 0, opacity: isOpen ? 1 : 0 }}
                      transition={{ duration: 0.2 }}
                      style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
                        background: s.color, borderRadius: '0 2px 2px 0',
                        transformOrigin: 'center', zIndex: 1 }}
                    />

                    {/* Top row: icon + title/tagline + platform + chevron */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, zIndex: 1 }}>
                      {/* Icon */}
                      <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                        background: p.icon ? 'transparent' : `linear-gradient(135deg, ${p.iconBg}, ${p.iconBg}bb)`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem',
                        overflow: 'hidden' }}>
                        {p.icon ? <img src={`/${p.icon}`} alt={p.title}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 10 }} />
                          : p.iconEmoji}
                      </div>
                      {/* Title + tagline */}
                      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <span style={{ fontSize: '0.9rem', fontWeight: 600, fontFamily: 'var(--heading)',
                          color: 'var(--text-h)' }}>{p.title}</span>
                        {p.tagline && (
                          <span style={{ fontSize: '0.7rem', color: 'var(--text)', opacity: 0.55,
                            fontFamily: 'var(--sans)', whiteSpace: 'nowrap', overflow: 'hidden',
                            textOverflow: 'ellipsis' }}>{p.tagline}</span>
                        )}
                      </div>
                      {/* Platform */}
                      <span style={{ fontSize: '0.68rem', fontFamily: 'var(--mono)',
                        color: 'var(--text)', opacity: 0.55, whiteSpace: 'nowrap' }}>{p.platform}</span>
                      {/* Chevron */}
                      <motion.div animate={{ rotate: isOpen ? 180 : 0, color: isOpen ? s.color : 'var(--text)' }}
                        transition={{ duration: 0.3 }}
                        style={{ display: 'flex', alignItems: 'center', opacity: 0.6, flexShrink: 0 }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="6 9 12 15 18 9"/>
                        </svg>
                      </motion.div>
                    </div>

                    {/* Bottom row: phase bar + status + pct */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, zIndex: 1 }}>
                      {/* Phase bar segments */}
                      <div style={{ display: 'flex', gap: 2 }}>
                        {phases.map((ph, pi) => {
                          const done = pi <= p.currentPhase
                          const active = pi === p.currentPhase
                          return (
                            <motion.div key={ph}
                              initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: false }}
                              transition={{ delay: i * 0.08 + pi * 0.06, duration: 0.35, ease: 'easeOut' }}
                              style={{ flex: 1, height: 5, borderRadius: 3,
                                background: done ? s.color : 'var(--border)',
                                boxShadow: active ? `0 0 8px ${s.color}` : 'none',
                                animation: active ? 'devPulse 2s ease-in-out infinite' : 'none',
                                transformOrigin: 'left' }}
                            />
                          )
                        })}
                      </div>
                      {/* Meta: status pill + phase label + pct */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5,
                          fontSize: '0.62rem', fontWeight: 600, padding: '3px 8px', borderRadius: 999,
                          background: s.bg, color: s.color, border: `1px solid ${s.color}33`,
                          fontFamily: 'var(--mono)', whiteSpace: 'nowrap' }}>
                          <span style={{ width: 5, height: 5, borderRadius: '50%', background: s.dot,
                            animation: isPulsing(p.status) ? 'devPulse 1.8s ease-in-out infinite' : 'none' }} />
                          {s.label}
                        </span>
                        <span style={{ fontSize: '0.62rem', fontFamily: 'var(--mono)',
                          color: s.color, fontWeight: 700 }}>{phases[p.currentPhase]}</span>
                        <span style={{ fontSize: '0.62rem', fontFamily: 'var(--mono)',
                          color: 'var(--text)', opacity: 0.4, marginLeft: 'auto' }}>{pct}%</span>
                      </div>
                    </div>
                  </motion.div>

                  {/* Expandable detail panel */}
                  <motion.div
                    initial={false}
                    animate={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }}
                    transition={{ duration: 0.38, ease: [0.25, 0.1, 0.25, 1] }}
                    style={{ overflow: 'hidden' }}
                  >
                    <motion.div
                      initial={{ y: -8 }} animate={{ y: isOpen ? 0 : -8 }}
                      transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
                      style={{ padding: '12px 24px 20px', paddingLeft: 84,
                        borderTop: `1px dashed ${p.iconBg}44`,
                        background: `linear-gradient(to right, ${p.iconBg}06, transparent)`,
                        display: 'flex', flexDirection: 'column', gap: 12 }}
                    >
                      <p style={{ margin: 0, fontSize: '0.83rem', color: 'var(--text)', lineHeight: 1.75 }}>
                        {p.desc}
                      </p>

                      {/* Tech tags — stagger in when panel opens */}
                      <motion.div
                        initial="hidden" animate={isOpen ? 'show' : 'hidden'}
                        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05 } } }}
                        style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}
                      >
                        {p.tags?.map(t => (
                          <motion.span key={t}
                            variants={{ hidden: { opacity: 0, scale: 0.8 }, show: { opacity: 1, scale: 1 } }}
                            whileHover={{ scale: 1.08, background: p.iconBg, color: '#fff' }}
                            transition={{ duration: 0.15 }}
                            style={{ fontSize: '0.65rem', padding: '3px 10px', borderRadius: 999,
                              background: `${p.iconBg}14`, color: p.iconBg,
                              fontWeight: 600, fontFamily: 'var(--mono)',
                              border: `1px solid ${p.iconBg}22`,
                              cursor: 'default', transition: 'background 0.2s, color 0.2s' }}
                          >{t}</motion.span>
                        ))}
                      </motion.div>

                      {/* Full phase pill track — animates in */}
                      <motion.div
                        initial="hidden" animate={isOpen ? 'show' : 'hidden'}
                        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } } }}
                        style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}
                      >
                        {phases.map((ph, pi) => {
                          const done = pi <= p.currentPhase
                          const active = pi === p.currentPhase
                          return (
                            <motion.span key={ph}
                              variants={{ hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0 } }}
                              style={{ fontSize: '0.62rem', padding: '4px 10px', borderRadius: 6,
                                background: done ? (active ? s.color : `${s.color}18`) : 'transparent',
                                color: done ? (active ? '#fff' : s.color) : 'var(--text)',
                                opacity: done ? 1 : 0.28,
                                fontWeight: active ? 700 : 500,
                                fontFamily: 'var(--mono)',
                                border: `1px solid ${done ? s.color + '44' : 'var(--border)'}`,
                                boxShadow: active ? `0 0 10px ${s.color}55` : 'none' }}
                            >
                              {pi < p.currentPhase ? '✓ ' : active ? '▶ ' : ''}{ph}
                            </motion.span>
                          )
                        })}
                      </motion.div>

                      {/* Action buttons from config */}
                      {p.buttons?.filter(b => b.url).length > 0 && (
                        <motion.div
                          initial="hidden" animate={isOpen ? 'show' : 'hidden'}
                          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08, delayChildren: 0.28 } } }}
                          style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 4 }}
                        >
                          {p.buttons.filter(b => b.url).map((btn, bi) => (
                            <motion.div
                              key={bi}
                              variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
                              style={{ display: 'flex', flexDirection: 'column', gap: 6 }}
                            >
                              {/* Note text — only shown if set */}
                              {btn.note && (
                                <span style={{
                                  fontSize: '0.75rem', color: 'var(--text)', lineHeight: 1.5,
                                  opacity: 0.7, fontStyle: 'italic',
                                  paddingLeft: 2,
                                }}>
                                  {btn.note}
                                </span>
                              )}

                              {/* Button */}
                              <motion.a
                                href={btn.url} target="_blank" rel="noopener noreferrer"
                                whileHover={{
                                  y: -3,
                                  boxShadow: btn.variant === 'primary'
                                    ? `0 8px 24px ${p.iconBg}66`
                                    : `0 8px 24px ${s.color}44`,
                                  ...(btn.variant === 'primary'
                                    ? { background: `linear-gradient(135deg, ${p.iconBg}ee, ${p.iconBg})` }
                                    : { background: `${s.color}10`, borderColor: s.color }),
                                }}
                                whileTap={{ scale: 0.96 }}
                                transition={{ duration: 0.2 }}
                                style={{
                                  display: 'inline-flex', alignItems: 'center', gap: 8,
                                  textDecoration: 'none', borderRadius: 10,
                                  padding: '9px 20px', fontSize: '0.78rem', fontWeight: 700,
                                  fontFamily: 'var(--mono)', cursor: 'pointer',
                                  width: 'fit-content',
                                  ...(btn.variant === 'primary'
                                    ? {
                                        background: `linear-gradient(135deg, ${p.iconBg}, ${p.iconBg}cc)`,
                                        color: '#fff',
                                        border: 'none',
                                        boxShadow: `0 2px 12px ${p.iconBg}44`,
                                      }
                                    : {
                                        background: 'transparent',
                                        color: s.color,
                                        border: `1.5px solid ${s.color}55`,
                                      }),
                                }}
                              >
                                {btn.variant === 'primary' ? (
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M3.18 23.76C2.5 24.15 2 23.84 2 23.05V.95C2 .16 2.5-.15 3.18.24l19.2 11.05c.68.39.68 1.03 0 1.42L3.18 23.76z"/>
                                  </svg>
                                ) : (
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                                  </svg>
                                )}
                                {btn.label}
                              </motion.a>
                            </motion.div>
                          ))}
                        </motion.div>
                      )}
                    </motion.div>
                  </motion.div>
                </motion.div>
              )
            })}
          </motion.div>
        </motion.div>
      </div>
    </section>
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
      <DevelopmentSection />
      <HometownSection />
      <LifeSection />
      <SkillRadar />
      <AboutCTA />
    </div>
  )
}
