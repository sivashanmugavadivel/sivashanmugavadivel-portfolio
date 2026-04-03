import { useState, useEffect, useRef } from 'react'
import { motion, useScroll, useTransform, useInView, useAnimation } from 'framer-motion'
import { loadAllPosts } from '../hooks/usePosts'
import videosData from '../data/videos.json'
import cfg from '../data/config.json'
import PostCard from '../components/blog/PostCard'
import VideoCard from '../components/video/VideoCard'
import Button from '../components/ui/Button'

/* ── Reusable scroll-reveal wrapper ── */
function Reveal({ children, delay = 0, y = 40, x = 0, style }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: false, margin: '-80px' })
  const controls = useAnimation()

  useEffect(() => {
    if (isInView) {
      controls.start({ opacity: 1, y: 0, x: 0, transition: { duration: 0.65, ease: [0.25, 0.1, 0.25, 1], delay } })
    } else {
      controls.start({ opacity: 0, y, x, transition: { duration: 0.45, ease: [0.25, 0.1, 0.25, 1] } })
    }
  }, [isInView, controls, delay, y, x])

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y, x }}
      animate={controls}
      style={style}
    >
      {children}
    </motion.div>
  )
}

/* ── Scroll-driven motion div (enter + exit) ── */
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

/* ── Animated section heading ── */
function SectionHeading({ label, title }) {
  return (
    <div className="section-header">
      <Reveal delay={0}>
        <span className="section-label">{label}</span>
      </Reveal>
      <Reveal delay={0.1}>
        <h2
          style={{
            fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)',
            position: 'relative',
            display: 'inline-block',
          }}
        >
          {title}
          <motion.span
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: false }}
            transition={{ duration: 0.5, delay: 0.4, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              bottom: -4,
              left: 0,
              right: 0,
              height: 3,
              background: 'var(--accent)',
              borderRadius: 2,
              transformOrigin: 'left',
            }}
          />
        </h2>
      </Reveal>
    </div>
  )
}

/* ── Typing name animation ── */
const FULL_NAME = 'SIVA SHANMUGA VADIVEL'

function TypingName() {
  const [displayed, setDisplayed] = useState('')
  const [showCursor, setShowCursor] = useState(true)

  useEffect(() => {
    let i = 0
    // Small delay before typing starts
    const start = setTimeout(() => {
      const interval = setInterval(() => {
        i++
        setDisplayed(FULL_NAME.slice(0, i))
        if (i >= FULL_NAME.length) {
          clearInterval(interval)
          // Blink cursor a few times then hide
          setTimeout(() => setShowCursor(false), 1800)
        }
      }, 65)
      return () => clearInterval(interval)
    }, 400)
    return () => clearTimeout(start)
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay: 0.3 }}
      style={{
        fontFamily: "'Lilita One', cursive",
        fontWeight: 400,
        fontSize: 'clamp(2rem, 5.5vw, 5.5rem)',
        lineHeight: 1,
        letterSpacing: '0.02em',
        color: '#ffffff',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
        userSelect: 'none',
        textAlign: 'center',
      }}
    >
      {displayed}
      {showCursor && (
        <motion.span
          animate={{ opacity: [1, 0, 1] }}
          transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }}
          style={{ display: 'inline-block', marginLeft: 3, color: 'var(--accent)' }}
        >
          |
        </motion.span>
      )}
    </motion.div>
  )
}

/* ── Hero Section — 3-layer Aperture style ──
   LAYER 1 (z:1) — Static background photo (avatar.jpg)
   LAYER 2 (z:2) — Giant name text
   LAYER 3 (z:3) — Cutout PNG (Avatar_nbc1.png) always on top
*/

function HeroSection() {
  const heroRef = useRef(null)
  const [mountKey, setMountKey] = useState(0)
  // No loading screen on refresh (sessionStorage already set) — skip delays
  const hasLoadingScreen = !sessionStorage.getItem('portfolio_loaded')
  const avatarDelay = hasLoadingScreen ? 3.0 : 0

  useEffect(() => { setMountKey(k => k + 1) }, [])

  // Track window scroll — scrollY goes from 0 to ~100vh as hero leaves view
  const { scrollY } = useScroll()
  const bgY = useTransform(scrollY, [0, window.innerHeight], ['0%', '20%'])
  // Name fades out in first 35% of hero height, gone by 40%
  const nameOpacity = useTransform(scrollY, [0, window.innerHeight * 0.35, window.innerHeight * 0.5], [1, 0, 0])

  return (
    <section
      ref={heroRef}
      style={{ position: 'relative', height: '100svh', overflow: 'clip', background: '#0a0a0a' }}
    >

      {/* ══ LAYER 1 — Background photo — slides up + slight rotate on load ══ */}
      <motion.div
        key={`bg-${mountKey}`}
        initial={{ opacity: 0, y: 80, rotate: -3 }}
        animate={{ opacity: 1, y: 0, rotate: 0 }}
        transition={{ duration: 2.1, delay: 0, ease: [0.56, 0.22, 0.05, 0.99] }}
        style={{ position: 'absolute', inset: '-15% 0', y: bgY, zIndex: 1 }}
      >
        <img
          src={`${import.meta.env.BASE_URL}avatar.jpg`}
          alt=""
          aria-hidden="true"
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            objectFit: 'cover', objectPosition: 'center 25%',
          }}
        />
        <div style={{
          position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none',
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, transparent 20%, transparent 70%, rgba(0,0,0,0.4) 100%)',
        }} />
      </motion.div>

      {/* ══ LAYER 2 — Fixed name ══ */}
      <motion.div
        key={`bigname-${mountKey}`}
        style={{
          position: 'fixed',
          top: '18%',
          left: 0, right: 0,
          zIndex: 2,
          display: 'flex',
          justifyContent: 'center',
          pointerEvents: 'none',
          padding: '0 24px',
          opacity: nameOpacity,
        }}
      >
        <TypingName key={mountKey} />
      </motion.div>

      {/* ══ LAYER 3 — Cutout PNG ══ */}
      <motion.div
        key={`fg-${mountKey}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.01 }}
        style={{
          position: 'absolute',
          top: 0, left: '50%',
          x: '-50%',
          y: '-5%',
          zIndex: 3,
          pointerEvents: 'none',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
        }}
      >
        <motion.img
          src={`${import.meta.env.BASE_URL}Avatar_nbc1.png`}
          alt="Siva Shanmuga Vadivel"
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, delay: avatarDelay, ease: [0.25, 0.1, 0.25, 1] }}
          style={{
            height: '130vh',
            width: 'auto',
            display: 'block',
            transformOrigin: 'bottom center',
            WebkitMaskImage: 'none',
            maskImage: 'none',
            filter: 'drop-shadow(0 20px 60px rgba(0,0,0,0.5))',
          }}
        />
      </motion.div>

      {/* Bottom gradient — blends into page content below */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: '45%',
        background: 'linear-gradient(to bottom, transparent, var(--bg))',
        zIndex: 4, pointerEvents: 'none',
      }} />

      {/* ── Corner brackets ── */}
      {['top-left','top-right','bottom-left','bottom-right'].map(pos => (
        <motion.div
          key={pos}
          initial={{ opacity: 0, scale: 0.4 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: hasLoadingScreen ? 2.2 : 0, type: 'spring', bounce: 0.3 }}
          style={{
            position: 'absolute', zIndex: 6, pointerEvents: 'none',
            top:    pos.includes('top')    ? 20 : undefined,
            bottom: pos.includes('bottom') ? 20 : undefined,
            left:   pos.includes('left')   ? 20 : undefined,
            right:  pos.includes('right')  ? 20 : undefined,
            width: 24, height: 24,
            borderTop:    pos.includes('top')    ? '2px solid rgba(255,255,255,0.45)' : 'none',
            borderBottom: pos.includes('bottom') ? '2px solid rgba(255,255,255,0.45)' : 'none',
            borderLeft:   pos.includes('left')   ? '2px solid rgba(255,255,255,0.45)' : 'none',
            borderRight:  pos.includes('right')  ? '2px solid rgba(255,255,255,0.45)' : 'none',
          }}
        />
      ))}

      {/* ── Slide dots ── */}

      {/* ── Bottom bar ── */}
      <motion.div
        key={`bottombar-${mountKey}`}
        initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 2.0, delay: avatarDelay, type: 'spring', bounce: 0.2 }}
        style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 7,
          padding: '0 28px 44px',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
        }}
      >
        <p style={{
          fontFamily: 'var(--sans)', fontSize: 'clamp(0.78rem, 1.4vw, 0.95rem)',
          color: 'rgba(255,255,255,0.65)', maxWidth: 340, lineHeight: 1.6, margin: 0,
        }}>
          Building modern &amp; interactive<br />web experiences.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: '0.6rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>
            Scroll
          </span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            style={{ width: 1.5, height: 28, background: 'rgba(255,255,255,0.35)', borderRadius: 1 }}
          />
        </div>
      </motion.div>

      <style>{`
        @media (max-width: 600px) {
          /* On small phones, shrink text so it doesn't overflow */
          .hero-name-text { font-size: clamp(3rem, 18vw, 6rem) !important; }
        }
      `}</style>
    </section>
  )
}


/* ── About accent card (cleaner version) ── */
const aboutItems = [
  { icon: '💻', label: 'Web Development', desc: 'Modern React & CSS' },
  { icon: '🎨', label: 'UI / UX Design', desc: 'Clean, thoughtful interfaces' },
  { icon: '✍️', label: 'Writing', desc: 'Sharing what I learn' },
]

function AboutAccentCard() {
  return (
    <Reveal delay={0.2} y={30}>
      <motion.div
        whileHover={{ y: -6 }}
        transition={{ duration: 0.3 }}
        style={{
          background: 'var(--card-bg)',
          border: '1px solid var(--accent-border)',
          borderRadius: 'var(--radius-lg)',
          padding: '40px 36px',
          boxShadow: 'var(--shadow)',
        }}
      >
        {aboutItems.map(({ icon, label, desc }, i) => (
          <div
            key={label}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              padding: '16px 0',
              borderBottom: i < aboutItems.length - 1 ? '1px solid var(--border)' : 'none',
            }}
          >
            <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>{icon}</span>
            <div>
              <div style={{ fontWeight: 600, color: 'var(--text-h)', fontSize: '0.95rem' }}>{label}</div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text)', marginTop: 2 }}>{desc}</div>
            </div>
          </div>
        ))}
      </motion.div>
    </Reveal>
  )
}

/* ── Featured Posts Section ── */
const cardContainerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09 } },
}

const cardVariants = {
  hidden: { opacity: 0, y: 36 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: 'easeOut' } },
}

function FeaturedPostsSection() {
  const [posts, setPosts] = useState([])

  useEffect(() => {
    loadAllPosts().then(all => setPosts(all.slice(0, 3)))
  }, [])

  if (posts.length === 0) return null

  return (
    <section className="section">
      <div className="page-container">
        <SectionHeading label="Writing" title="Latest Posts" />

        <motion.div
          className="grid-3"
          variants={cardContainerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: false, margin: '-60px' }}
        >
          {posts.map(({ slug, frontmatter }) => (
            <motion.div key={slug} variants={cardVariants}>
              <PostCard slug={slug} frontmatter={frontmatter} />
            </motion.div>
          ))}
        </motion.div>

        <Reveal delay={0.3}>
          <div style={{ textAlign: 'center', marginTop: 40 }}>
            <Button to="/blog" variant="outline">View All Posts →</Button>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

/* ── Featured Videos Section ── */
function FeaturedVideosSection() {
  const featured = videosData.filter(v => v.type === 'video').slice(0, 2)

  return (
    <section className="section" style={{ background: 'var(--bg-secondary)' }}>
      <div className="page-container">
        <SectionHeading label="Videos" title="Watch" />

        <motion.div
          className="grid-2"
          variants={cardContainerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: false, margin: '-60px' }}
        >
          {featured.map(video => (
            <motion.div key={video.id} variants={cardVariants}>
              <VideoCard video={video} />
            </motion.div>
          ))}
        </motion.div>

        <Reveal delay={0.3}>
          <div style={{ textAlign: 'center', marginTop: 40 }}>
            <Button to="/videos" variant="outline">All Videos →</Button>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

/* ── Journey / Timeline Section ── */
const timeline = cfg.journey

function JourneySection() {
  return (
    <section className="section" style={{ background: 'var(--bg)' }}>
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
                initial={{ opacity: 0, x: isLeft ? -40 : 40 }}
                visible={{ opacity: 1, x: 0 }}
                delay={i * 0.15}
                style={{ marginBottom: 48, position: 'relative' }}
              >
                {/* Dot on the line — same as About page */}
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

                {/* Card — same styles as About page */}
                <div style={{
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

        <style>{`@media (max-width: 640px) {
          .journey-line { display: none; }
        }`}</style>
      </div>
    </section>
  )
}

/* ── Social Section ── */
const socials = [
  {
    label: 'Instagram',
    handle: cfg.social.instagram.handle,
    href: cfg.social.instagram.href,
    color: '#E1306C',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
      </svg>
    ),
  },
  {
    label: 'Facebook',
    handle: cfg.social.facebook.handle,
    href: cfg.social.facebook.href,
    color: '#1877F2',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    ),
  },
  {
    label: 'YouTube',
    handle: cfg.social.youtube.handle,
    href: cfg.social.youtube.href,
    color: '#FF0000',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.56 3.5 12 3.5 12 3.5s-7.56 0-9.38.55A3.02 3.02 0 0 0 .5 6.19C0 8.01 0 12 0 12s0 3.99.5 5.81a3.02 3.02 0 0 0 2.12 2.14C4.44 20.5 12 20.5 12 20.5s7.56 0 9.38-.55a3.02 3.02 0 0 0 2.12-2.14C24 15.99 24 12 24 12s0-3.99-.5-5.81zM9.75 15.52V8.48L15.5 12l-5.75 3.52z"/>
      </svg>
    ),
  },
  {
    label: 'LinkedIn',
    handle: cfg.social.linkedin.handle,
    href: cfg.social.linkedin.href,
    color: '#0A66C2',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
      </svg>
    ),
  },
  {
    label: 'Facebook Page',
    handle: cfg.social.facebookPage.handle,
    href: cfg.social.facebookPage.href,
    color: '#1877F2',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    ),
  },
  {
    label: 'X / Twitter',
    handle: cfg.social.twitter.handle,
    href: cfg.social.twitter.href,
    color: '#000000',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.258 5.63 5.907-5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    ),
  },
]

function TickerRow({ items, direction = 'left', speed = 18, dim = false }) {
  const doubled = [...items, ...items]
  const anim = direction === 'left'
    ? { x: ['0%', '-50%'] }
    : { x: ['-50%', '0%'] }

  return (
    <div style={{ position: 'relative', overflow: 'hidden' }}>
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: 100, zIndex: 2,
        background: 'linear-gradient(to right, var(--bg), transparent)', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', right: 0, top: 0, bottom: 0, width: 100, zIndex: 2,
        background: 'linear-gradient(to left, var(--bg), transparent)', pointerEvents: 'none',
      }} />
      <motion.div
        animate={anim}
        transition={{ duration: speed, repeat: Infinity, ease: 'linear' }}
        style={{ display: 'flex', gap: 12, width: 'max-content', padding: '8px 0' }}
      >
        {doubled.map(({ label, handle, href, color, icon }, i) => (
          <motion.a
            key={i}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.07, boxShadow: `0 12px 32px ${color}35` }}
            whileTap={{ scale: 0.97 }}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 22px',
              borderRadius: 999,
              background: 'var(--card-bg)',
              border: '1.5px solid var(--border)',
              textDecoration: 'none',
              flexShrink: 0,
              opacity: dim ? 0.6 : 1,
              transition: 'border-color 0.2s, background 0.2s, opacity 0.2s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = color
              e.currentTarget.style.background = color + '14'
              e.currentTarget.style.opacity = '1'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--border)'
              e.currentTarget.style.background = 'var(--card-bg)'
              e.currentTarget.style.opacity = dim ? '0.6' : '1'
            }}
          >
            <div style={{
              width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
              background: color + '18',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color,
            }}>
              {icon}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-h)', whiteSpace: 'nowrap', lineHeight: 1.2 }}>
                {label}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text)', whiteSpace: 'nowrap', marginTop: 2 }}>
                {handle}
              </div>
            </div>
          </motion.a>
        ))}
      </motion.div>
    </div>
  )
}

function SocialSection() {
  return (
    <section style={{ background: 'var(--bg)', padding: 'clamp(64px,8vw,96px) 0', overflow: 'hidden' }}>
      <div className="page-container" style={{ marginBottom: 48, textAlign: 'center' }}>
        <Reveal delay={0}><span className="section-label">Follow Along</span></Reveal>
        <Reveal delay={0.1}><h2 style={{ marginTop: 8 }}>Find me on social</h2></Reveal>
        <Reveal delay={0.2}>
          <p style={{ color: 'var(--text)', marginTop: 12 }}>
            Stay connected — follow for updates, behind-the-scenes, and more.
          </p>
        </Reveal>
      </div>

      {/* Row 1 — left, full opacity */}
      <TickerRow items={socials} direction="left" speed={20} />

      {/* Row 2 — right, slightly dimmed */}
      <div style={{ marginTop: 12 }}>
        <TickerRow items={[...socials].reverse()} direction="right" speed={26} dim />
      </div>
    </section>
  )
}

/* ── CTA Banner ── */
function CTASection() {
  return (
    <section className="section">
      <div className="page-container">
        <Reveal y={24}>
          <div
            style={{
              background: 'linear-gradient(135deg, var(--accent-bg) 0%, var(--bg-secondary) 100%)',
              border: '1px solid var(--accent-border)',
              borderRadius: 'var(--radius-lg)',
              padding: 'clamp(40px, 6vw, 80px)',
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Background decoration */}
            <div
              style={{
                position: 'absolute',
                top: -60,
                right: -60,
                width: 240,
                height: 240,
                borderRadius: '50%',
                background: 'var(--accent-bg)',
                filter: 'blur(40px)',
                pointerEvents: 'none',
              }}
            />

            <Reveal delay={0.05}>
              <span className="section-label">Let's Connect</span>
            </Reveal>
            <Reveal delay={0.15}>
              <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)', marginBottom: 16, position: 'relative' }}>
                Have a project in mind?
              </h2>
            </Reveal>
            <Reveal delay={0.25}>
              <p style={{ color: 'var(--text)', maxWidth: 420, margin: '0 auto 36px', lineHeight: 1.7, position: 'relative' }}>
                I'd love to hear about what you're building. Let's have a conversation.
              </p>
            </Reveal>
            <Reveal delay={0.35}>
              <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap', position: 'relative' }}>
                <Button to="/contact">Get in Touch</Button>
                <Button to="/about" variant="outline">Learn More</Button>
              </div>
            </Reveal>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

/* ── Main Home page ── */
export default function Home() {
  return (
    <div>
      <HeroSection />
      {/* About section with cleaned-up card */}
      <section className="section" style={{ background: 'var(--bg-secondary)' }}>
        <div className="page-container">
          <div className="grid-2" style={{ alignItems: 'center', gap: 64 }}>
            <div style={{ textAlign: 'left' }}>
              <Reveal delay={0}><span className="section-label">About</span></Reveal>
              <Reveal delay={0.1}>
                <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.5rem)', marginBottom: 20 }}>
                  Nice to meet you
                </h2>
              </Reveal>
              <Reveal delay={0.2}>
                <p style={{ color: 'var(--text)', lineHeight: 1.8, marginBottom: 16 }}>
                  I'm a passionate developer who loves building beautiful, performant web experiences.
                  I care deeply about the details — from pixel-perfect layouts to smooth animations
                  that make interfaces feel alive.
                </p>
              </Reveal>
              <Reveal delay={0.3}>
                <p style={{ color: 'var(--text)', lineHeight: 1.8, marginBottom: 32 }}>
                  When I'm not coding, you'll find me taking photos, watching tutorials, or exploring
                  new places.
                </p>
              </Reveal>
              <Reveal delay={0.4}><Button to="/about" variant="outline">Read More →</Button></Reveal>
            </div>
            <AboutAccentCard />
          </div>
        </div>
      </section>
      <FeaturedPostsSection />
      <FeaturedVideosSection />
      <JourneySection />
      <SocialSection />
      <CTASection />
    </div>
  )
}
