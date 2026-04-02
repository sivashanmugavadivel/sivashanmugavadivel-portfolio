import { useState } from 'react'
import { motion } from 'framer-motion'

/* ── Scroll-reveal wrapper ── */
function Reveal({ children, delay = 0, y = 32, style }) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1], delay }}
      style={style}
    >
      {children}
    </motion.div>
  )
}

/* ── Animated form field ── */
function Field({ label, id, type = 'text', value, onChange, required, multiline }) {
  const [focused, setFocused] = useState(false)

  const baseStyle = {
    display: 'block',
    width: '100%',
    padding: '12px 16px',
    borderRadius: 'var(--radius)',
    fontFamily: 'var(--sans)',
    fontSize: '0.925rem',
    color: 'var(--text-h)',
    background: 'var(--bg)',
    outline: 'none',
    resize: multiline ? 'vertical' : undefined,
    minHeight: multiline ? 140 : undefined,
    boxSizing: 'border-box',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    border: focused
      ? '1.5px solid var(--accent)'
      : '1.5px solid var(--border)',
    boxShadow: focused
      ? '0 0 0 3px var(--accent-bg)'
      : 'none',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label
        htmlFor={id}
        style={{
          fontSize: '0.825rem',
          fontWeight: 600,
          color: focused ? 'var(--accent)' : 'var(--text-h)',
          transition: 'color 0.2s',
          letterSpacing: '0.02em',
        }}
      >
        {label}
        {required && <span style={{ color: 'var(--accent)', marginLeft: 2 }}>*</span>}
      </label>
      {multiline ? (
        <textarea
          id={id}
          value={value}
          onChange={onChange}
          required={required}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={baseStyle}
        />
      ) : (
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          required={required}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={baseStyle}
        />
      )}
    </div>
  )
}

/* ── Contact info items ── */
const contactInfo = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
        <polyline points="22,6 12,13 2,6"/>
      </svg>
    ),
    label: 'Email',
    value: 'hello@sivashanmuga.dev',
    href: 'mailto:hello@sivashanmuga.dev',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
        <circle cx="12" cy="10" r="3"/>
      </svg>
    ),
    label: 'Location',
    value: 'India',
    href: null,
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12 6 12 12 16 14"/>
      </svg>
    ),
    label: 'Response time',
    value: 'Within 24 hours',
    href: null,
  },
]

const socialLinks = [
  {
    label: 'GitHub',
    href: 'https://github.com/',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
      </svg>
    ),
  },
  {
    label: 'LinkedIn',
    href: 'https://linkedin.com/',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
      </svg>
    ),
  },
  {
    label: 'X / Twitter',
    href: 'https://x.com/',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.258 5.63 5.907-5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    ),
  },
]

/* ── Contact Form ── */
function ContactForm() {
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [status, setStatus] = useState('idle') // idle | sending | success | error

  const handleChange = field => e => setForm(f => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async e => {
    e.preventDefault()
    setStatus('sending')
    try {
      // Replace YOUR_FORM_ID below with your Formspree form ID
      // Get a free form at https://formspree.io/
      const res = await fetch('https://formspree.io/f/YOUR_FORM_ID', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        setStatus('success')
        setForm({ name: '', email: '', message: '' })
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="grid-2" style={{ gap: 16 }}>
        <Field
          id="name"
          label="Name"
          value={form.name}
          onChange={handleChange('name')}
          required
        />
        <Field
          id="email"
          label="Email"
          type="email"
          value={form.email}
          onChange={handleChange('email')}
          required
        />
      </div>
      <Field
        id="message"
        label="Message"
        value={form.message}
        onChange={handleChange('message')}
        required
        multiline
      />

      <motion.button
        type="submit"
        disabled={status === 'sending' || status === 'success'}
        whileHover={status === 'idle' ? { scale: 1.02, boxShadow: 'var(--glow)' } : {}}
        whileTap={status === 'idle' ? { scale: 0.98 } : {}}
        style={{
          alignSelf: 'flex-start',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 10,
          padding: '11px 28px',
          borderRadius: 999,
          fontFamily: 'var(--sans)',
          fontSize: '0.9rem',
          fontWeight: 600,
          color: '#fff',
          background: status === 'success' ? 'var(--accent)' : 'var(--accent)',
          border: 'none',
          cursor: status === 'idle' ? 'pointer' : 'default',
          opacity: status === 'sending' ? 0.7 : 1,
          transition: 'background var(--transition), opacity var(--transition)',
        }}
      >
        {status === 'idle' && 'Send Message'}
        {status === 'sending' && (
          <>
            <motion.span
              animate={{ rotate: 360 }}
              transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
              style={{ display: 'inline-block', width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%' }}
            />
            Sending…
          </>
        )}
        {status === 'success' && (
          <>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            Message Sent!
          </>
        )}
        {status === 'error' && 'Try Again'}
      </motion.button>

      {status === 'error' && (
        <p style={{ color: '#ef4444', fontSize: '0.875rem', margin: 0 }}>
          Something went wrong. Please try emailing directly.
        </p>
      )}
      {status === 'success' && (
        <p style={{ color: 'var(--accent)', fontSize: '0.875rem', margin: 0 }}>
          Thanks! I'll get back to you soon.
        </p>
      )}

      <p style={{ fontSize: '0.78rem', color: 'var(--text)', marginTop: -8 }}>
        To enable this form, replace <code>YOUR_FORM_ID</code> in Contact.jsx with your{' '}
        <a href="https://formspree.io/" target="_blank" rel="noopener noreferrer">Formspree</a> form ID.
      </p>
    </form>
  )
}

/* ── Main Contact page ── */
export default function Contact() {
  return (
    <div>
      {/* Page header */}
      <section style={{
        paddingTop: 'clamp(100px, 14vw, 160px)',
        paddingBottom: 'clamp(48px, 6vw, 80px)',
        background: 'var(--bg)',
        textAlign: 'center',
      }}>
        <div className="page-container">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="section-label">Get in Touch</span>
            <h1 style={{ fontSize: 'clamp(2.2rem, 6vw, 4rem)', marginTop: 8, marginBottom: 16 }}>
              Let's work together
            </h1>
            <p style={{ color: 'var(--text)', maxWidth: 480, margin: '0 auto', lineHeight: 1.7, fontSize: '1.05rem' }}>
              Have a project in mind, a question, or just want to say hello?
              I'd love to hear from you.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Form + Info */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="page-container">
          <div className="grid-2" style={{ gap: 64, alignItems: 'flex-start' }}>

            {/* Left: Form */}
            <Reveal delay={0}>
              <div style={{
                background: 'var(--card-bg)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                padding: 'clamp(28px, 4vw, 48px)',
                boxShadow: 'var(--shadow)',
              }}>
                <h2 style={{ fontSize: '1.4rem', marginBottom: 28 }}>Send a message</h2>
                <ContactForm />
              </div>
            </Reveal>

            {/* Right: Info */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
              <Reveal delay={0.1}>
                <div>
                  <h2 style={{ fontSize: '1.4rem', marginBottom: 20 }}>Contact Info</h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {contactInfo.map(({ icon, label, value, href }) => (
                      <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{
                          width: 44, height: 44, flexShrink: 0,
                          borderRadius: '50%',
                          background: 'var(--accent-bg)',
                          border: '1px solid var(--accent-border)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: 'var(--accent)',
                        }}>
                          {icon}
                        </div>
                        <div>
                          <div style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text)', marginBottom: 2 }}>
                            {label}
                          </div>
                          {href ? (
                            <a href={href} style={{ color: 'var(--text-h)', fontWeight: 500, fontSize: '0.95rem' }}>
                              {value}
                            </a>
                          ) : (
                            <span style={{ color: 'var(--text-h)', fontWeight: 500, fontSize: '0.95rem' }}>{value}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Reveal>

              {/* Social links */}
              <Reveal delay={0.2}>
                <div>
                  <h3 style={{ fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text)', marginBottom: 16 }}>
                    Also find me on
                  </h3>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    {socialLinks.map(({ label, href, icon }) => (
                      <motion.a
                        key={label}
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        whileHover={{ y: -3, boxShadow: 'var(--glow)' }}
                        whileTap={{ scale: 0.95 }}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 8,
                          padding: '8px 16px',
                          borderRadius: 999,
                          border: '1px solid var(--border)',
                          background: 'var(--social-bg)',
                          color: 'var(--text-h)',
                          fontSize: '0.85rem',
                          fontWeight: 500,
                          textDecoration: 'none',
                          transition: 'border-color var(--transition)',
                        }}
                      >
                        {icon}
                        {label}
                      </motion.a>
                    ))}
                  </div>
                </div>
              </Reveal>

              {/* Decorative quote */}
              <Reveal delay={0.3}>
                <motion.blockquote
                  whileHover={{ borderColor: 'var(--accent)' }}
                  style={{
                    borderLeft: '3px solid var(--border)',
                    paddingLeft: 20,
                    margin: 0,
                    fontFamily: 'var(--heading)',
                    fontStyle: 'italic',
                    fontSize: '1.1rem',
                    color: 'var(--text)',
                    lineHeight: 1.6,
                    transition: 'border-color var(--transition)',
                  }}
                >
                  "The best projects start with a simple conversation."
                </motion.blockquote>
              </Reveal>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
