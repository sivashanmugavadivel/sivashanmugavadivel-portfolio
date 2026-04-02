import { motion } from 'framer-motion'
import Button from '../components/ui/Button'

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
const skills = [
  { category: 'Frontend', items: ['React', 'TypeScript', 'CSS / Sass', 'Framer Motion', 'Next.js'] },
  { category: 'Backend', items: ['Node.js', 'Python', 'REST APIs', 'PostgreSQL', 'MongoDB'] },
  { category: 'Tools', items: ['Git', 'Vite', 'Figma', 'VS Code', 'Linux'] },
  { category: 'Other', items: ['Photography', 'Video Editing', 'Technical Writing', 'UI Design'] },
]

const timeline = [
  {
    year: '2024 – Present',
    role: 'Senior Frontend Developer',
    org: 'Freelance / Open Source',
    desc: 'Building modern web applications and contributing to open-source projects. Focused on React, animation systems, and performance.',
  },
  {
    year: '2022 – 2024',
    role: 'Frontend Developer',
    org: 'Tech Startup',
    desc: 'Led frontend architecture for a SaaS product. Built a design system from scratch, improved page performance by 40%.',
  },
  {
    year: '2020 – 2022',
    role: 'Junior Developer',
    org: 'Digital Agency',
    desc: 'Delivered responsive websites and interactive landing pages for clients across various industries.',
  },
  {
    year: '2016 – 2020',
    role: 'B.Sc. Computer Science',
    org: 'University',
    desc: 'Graduated with honours. Focused on algorithms, software engineering, and web technologies.',
  },
]

const socials = [
  { label: 'GitHub', href: 'https://github.com/', icon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
    </svg>
  )},
  { label: 'LinkedIn', href: 'https://linkedin.com/', icon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  )},
  { label: 'X / Twitter', href: 'https://x.com/', icon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.258 5.63 5.907-5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  )},
]

/* ── About Hero ── */
function AboutHero() {
  return (
    <section
      style={{
        paddingTop: 'clamp(100px, 14vw, 160px)',
        paddingBottom: 'clamp(60px, 8vw, 96px)',
        background: 'var(--bg)',
      }}
    >
      <div className="page-container">
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: 24,
        }}>

          {/* Avatar */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            style={{
              width: 140,
              height: 140,
              borderRadius: '50%',
              overflow: 'hidden',
              border: '3px solid var(--accent-border)',
              boxShadow: 'var(--glow)',
              flexShrink: 0,
            }}
          >
            <img
              src={`${import.meta.env.BASE_URL}avatar.jpg`}
              alt="Siva Shanmuga Vadivel"
              style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 20%' }}
            />
          </motion.div>

          {/* Name + tagline */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          >
            <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', marginBottom: 12 }}>
              Siva Shanmuga Vadivel
            </h1>
            <p style={{ color: 'var(--text)', fontSize: 'clamp(1rem, 2vw, 1.2rem)', maxWidth: 480, margin: '0 auto 24px' }}>
              Developer · Creator · Lifelong learner
            </p>

            {/* Social links */}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              {socials.map(({ label, href, icon }) => (
                <motion.a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ y: -3, boxShadow: 'var(--glow)' }}
                  whileTap={{ scale: 0.95 }}
                  title={label}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    background: 'var(--social-bg)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-h)',
                    transition: 'color var(--transition)',
                  }}
                >
                  {icon}
                </motion.a>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
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
            <Reveal delay={0}><span className="section-label">My Story</span></Reveal>
            <Reveal delay={0.1}>
              <h2 style={{ marginBottom: 20 }}>Turning ideas into<br />living interfaces</h2>
            </Reveal>
            <Reveal delay={0.2}>
              <p style={{ color: 'var(--text)', lineHeight: 1.8, marginBottom: 16 }}>
                I'm a frontend developer passionate about crafting web experiences that feel
                as good as they look. I started my journey in computer science and found
                myself drawn to the intersection of design and code — where logic meets creativity.
              </p>
            </Reveal>
            <Reveal delay={0.3}>
              <p style={{ color: 'var(--text)', lineHeight: 1.8, marginBottom: 16 }}>
                Over the years I've built everything from small marketing sites to complex
                SaaS applications. I love animation, typography, and the challenge of making
                something that's both beautiful and accessible.
              </p>
            </Reveal>
            <Reveal delay={0.4}>
              <p style={{ color: 'var(--text)', lineHeight: 1.8, marginBottom: 32 }}>
                Outside of work, I explore the world through a camera lens, write about what
                I'm learning, and share video content on YouTube.
              </p>
            </Reveal>
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
    <section className="section">
      <div className="page-container">
        <SectionHeading label="Journey" title="Experience & Education" />

        <div style={{ position: 'relative', maxWidth: 760, margin: '0 auto' }}>
          {/* Vertical line */}
          <motion.div
            initial={{ scaleY: 0 }}
            whileInView={{ scaleY: 1 }}
            viewport={{ once: true }}
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
              <Reveal
                key={i}
                delay={i * 0.1}
                x={isLeft ? -40 : 40}
                y={0}
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
              </Reveal>
            )
          })}
        </div>
      </div>

      {/* Mobile: stack timeline */}
      <style>{`
        @media (max-width: 640px) {
          .timeline-line { display: none; }
        }
      `}</style>
    </section>
  )
}

/* ── Skills Grid ── */
const badgeVariants = {
  hidden: { opacity: 0, scale: 0.7 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.3, ease: 'backOut' } },
}

const badgeGroupVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
}

function SkillsSection() {
  return (
    <section className="section" style={{ background: 'var(--bg-secondary)' }}>
      <div className="page-container">
        <SectionHeading label="Skills" title="What I Work With" />

        <div className="grid-2" style={{ gap: 32 }}>
          {skills.map(({ category, items }, ci) => (
            <Reveal key={category} delay={ci * 0.08}>
              <div style={{
                background: 'var(--card-bg)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                padding: '28px 28px 24px',
                boxShadow: 'var(--shadow)',
              }}>
                <h3 style={{ fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 16 }}>
                  {category}
                </h3>
                <motion.div
                  variants={badgeGroupVariants}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true }}
                  style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}
                >
                  {items.map(skill => (
                    <motion.span
                      key={skill}
                      variants={badgeVariants}
                      whileHover={{ scale: 1.06, background: 'var(--accent-bg)', borderColor: 'var(--accent)' }}
                      style={{
                        display: 'inline-block',
                        padding: '5px 14px',
                        borderRadius: 999,
                        fontSize: '0.825rem',
                        fontWeight: 500,
                        color: 'var(--text-h)',
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border)',
                        cursor: 'default',
                        transition: 'background var(--transition), border-color var(--transition)',
                      }}
                    >
                      {skill}
                    </motion.span>
                  ))}
                </motion.div>
              </div>
            </Reveal>
          ))}
        </div>
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
            <span className="section-label">Let's Connect</span>
            <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)', maxWidth: 480, margin: 0 }}>
              Interested in working together?
            </h2>
            <p style={{ color: 'var(--text)', maxWidth: 380, lineHeight: 1.7 }}>
              I'm always open to new opportunities and collaborations.
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
      <SkillsSection />
      <AboutCTA />
    </div>
  )
}
