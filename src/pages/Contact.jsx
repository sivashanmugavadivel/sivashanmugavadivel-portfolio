import { useState } from 'react'
import { motion } from 'framer-motion'
import cfg from '../data/config.json'

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
    border: focused ? '1.5px solid var(--accent)' : '1.5px solid var(--border)',
    boxShadow: focused ? '0 0 0 3px var(--accent-bg)' : 'none',
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

/* ── Contact Form ── */
function ContactForm() {
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [status, setStatus] = useState('idle')

  const handleChange = field => e => setForm(f => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async e => {
    e.preventDefault()
    setStatus('sending')
    try {
      const res = await fetch('https://formspree.io/f/xlgopnra', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        setStatus('success')
        setForm({ name: '', email: '', message: '' })
        setTimeout(() => setStatus('idle'), 10000)
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
        <Field id="name" label="Name" value={form.name} onChange={handleChange('name')} required />
        <Field id="email" label="Email" type="email" value={form.email} onChange={handleChange('email')} required />
      </div>
      <Field id="message" label="Message" value={form.message} onChange={handleChange('message')} required multiline />

      <motion.button
        type="submit"
        disabled={status === 'sending' || status === 'success'}
        whileHover={status === 'idle' ? { scale: 1.02, boxShadow: 'var(--glow)' } : {}}
        whileTap={status === 'idle' ? { scale: 0.98 } : {}}
        style={{
          alignSelf: 'flex-start',
          display: 'inline-flex', alignItems: 'center', gap: 10,
          padding: '11px 28px', borderRadius: 999,
          fontFamily: 'var(--sans)', fontSize: '0.9rem', fontWeight: 600,
          color: '#fff', background: 'var(--accent)', border: 'none',
          cursor: status === 'idle' ? 'pointer' : 'default',
          opacity: status === 'sending' ? 0.7 : 1,
          transition: 'opacity var(--transition)',
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
    </form>
  )
}

/* ── Main Contact page — Split Screen ── */
export default function Contact() {
  const socialLinks = [
    {
      label: 'GitHub',
      handle: cfg.social.github.handle,
      href: cfg.social.github.href,
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
        </svg>
      ),
    },
    {
      label: 'LinkedIn',
      handle: cfg.social.linkedin.handle,
      href: cfg.social.linkedin.href,
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
        </svg>
      ),
    },
    {
      label: 'Twitter',
      handle: cfg.social.twitter.handle,
      href: cfg.social.twitter.href,
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.258 5.63 5.907-5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      ),
    },
    {
      label: 'Instagram',
      handle: cfg.social.instagram.handle,
      href: cfg.social.instagram.href,
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
        </svg>
      ),
    },
  ]

  const infoRows = [
    { label: 'Location', value: cfg.personal.location },
    { label: 'Response', value: 'Within 24 hours' },
  ]

  return (
    <div style={{ display: 'flex', minHeight: '100vh', flexWrap: 'wrap' }}>

      {/* Left panel — dark */}
      <div style={{
        flex: '1 1 340px',
        background: '#0f0f14',
        padding: 'clamp(100px,10vw,140px) clamp(32px,5vw,80px) clamp(60px,8vw,100px)',
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        position: 'relative', minHeight: 500,
      }}>
        {/* Animated vertical divider */}
        <motion.div
          initial={{ scaleY: 0 }}
          whileInView={{ scaleY: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          style={{
            position: 'absolute', right: 0, top: '10%', bottom: '10%',
            width: 1, background: 'rgba(255,255,255,0.08)',
            transformOrigin: 'top',
          }}
        />

        <motion.div
          initial={{ opacity: 0, x: -60 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <h1 style={{
            fontSize: 'clamp(2.8rem, 7vw, 5rem)',
            fontWeight: 900, color: '#fff',
            lineHeight: 1.05, margin: '0 0 24px',
          }}>
            Let's<br />talk
          </h1>
          <p style={{ fontStyle: 'italic', color: 'rgba(255,255,255,0.55)', fontSize: '1.05rem', lineHeight: 1.7, margin: '0 0 40px', maxWidth: 340 }}>
            "Great things are built through great conversations."
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.2 }}
          style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
        >
          {socialLinks.map(({ label, handle, href, icon }) => (
            <motion.a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ x: 6, backgroundColor: 'rgba(255,255,255,0.1)' }}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 14,
                padding: '12px 20px', borderRadius: 14,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: '#fff', textDecoration: 'none',
                transition: 'background 0.2s',
                maxWidth: 280,
              }}
            >
              <span style={{ color: 'rgba(255,255,255,0.7)', flexShrink: 0 }}>{icon}</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{label}</div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)' }}>{handle}</div>
              </div>
            </motion.a>
          ))}
        </motion.div>

        {/* Bottom accent line */}
        <motion.div
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.5 }}
          style={{
            height: 2, background: 'linear-gradient(90deg, #7c3aed, transparent)',
            borderRadius: 999, marginTop: 48, transformOrigin: 'left',
          }}
        />
      </div>

      {/* Right panel — light/dark themed */}
      <div style={{
        flex: '1 1 340px',
        background: 'var(--bg)',
        padding: 'clamp(100px,10vw,140px) clamp(32px,5vw,80px) clamp(60px,8vw,100px)',
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        minHeight: 500,
      }}>
        <motion.div
          initial={{ opacity: 0, x: 60 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <h2 style={{ fontSize: '1.6rem', marginTop: 0, marginBottom: 28 }}>Send a message</h2>
          <ContactForm />

          <div style={{ marginTop: 40, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Email button */}
            <motion.a
              href={`mailto:${cfg.contact.email}`}
              whileHover={{ scale: 1.03, boxShadow: '0 0 24px rgba(124,58,237,0.3)' }}
              whileTap={{ scale: 0.97 }}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 10,
                padding: '11px 22px', borderRadius: 999,
                background: 'var(--accent)', color: '#fff',
                fontWeight: 600, fontSize: '0.9rem',
                textDecoration: 'none', alignSelf: 'flex-start',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
              Email Me
            </motion.a>

            {infoRows.map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', gap: 10, alignItems: 'baseline' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text)', minWidth: 80 }}>{label}</span>
                <span style={{ color: 'var(--text-h)', fontSize: '0.9rem', fontWeight: 500 }}>{value}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
