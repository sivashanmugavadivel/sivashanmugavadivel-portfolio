import { motion } from 'framer-motion'
import cfg from '../data/config.json'

const LAST_UPDATED = 'April 3, 2026'

const sections = [
  {
    title: '1. Information We Collect',
    content: `This website does not require you to create an account or log in. The only personal information collected is what you voluntarily provide through the contact form: your name, email address, and message. No other personal data is collected automatically beyond standard server/analytics logs (IP address, browser type, pages visited) that may be retained by hosting providers.`,
  },
  {
    title: '2. How We Use Your Information',
    content: `Information submitted via the contact form is used solely to respond to your inquiry. Your name and email address will never be sold, rented, or shared with third parties for marketing purposes.`,
  },
  {
    title: '3. Contact Form & Third-Party Services',
    content: `The contact form on this website is powered by Formspree (formspree.io), a third-party form processing service. When you submit the form, your data is transmitted to and stored by Formspree in accordance with their own Privacy Policy. We encourage you to review Formspree's privacy policy at https://formspree.io/legal/privacy-policy.`,
  },
  {
    title: '4. Cookies',
    content: `This website does not use tracking cookies or advertising cookies. Your theme preference (light/dark mode) may be stored in your browser's localStorage to persist your preference across visits. This data stays on your device and is never transmitted to any server.`,
  },
  {
    title: '5. Embedded Content',
    content: `Pages on this site may include embedded YouTube videos. When you interact with these videos, YouTube may collect data about you in accordance with their own privacy policy. We recommend reviewing Google/YouTube's privacy policy for more information.`,
  },
  {
    title: '6. Analytics',
    content: `This website does not currently use any analytics or tracking tools (such as Google Analytics). If this changes in the future, this policy will be updated accordingly.`,
  },
  {
    title: '7. Data Retention',
    content: `Messages submitted via the contact form are retained by Formspree for as long as necessary to respond to your inquiry, after which they may be deleted. No personal data is stored on this website's own servers.`,
  },
  {
    title: '8. Your Rights',
    content: `You have the right to request access to, correction of, or deletion of any personal data you have submitted. To exercise these rights, please contact us directly via email.`,
  },
  {
    title: '9. External Links',
    content: `This website may contain links to external websites (GitHub, LinkedIn, YouTube, Instagram, etc.). We are not responsible for the privacy practices of those sites and encourage you to review their respective privacy policies.`,
  },
  {
    title: '10. Changes to This Policy',
    content: `This Privacy Policy may be updated from time to time. Any changes will be reflected on this page with an updated "Last Updated" date. Continued use of the website after changes are posted constitutes your acceptance of the updated policy.`,
  },
  {
    title: '11. Contact',
    content: `If you have any questions or concerns about this Privacy Policy, please reach out via the contact form or directly by email.`,
  },
]

export default function PrivacyPolicy() {
  return (
    <div>
      {/* Header */}
      <section style={{
        paddingTop: 'clamp(100px, 14vw, 160px)',
        paddingBottom: 'clamp(40px, 5vw, 64px)',
        background: 'var(--bg)',
        textAlign: 'center',
      }}>
        <div className="page-container">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="section-label">Legal</span>
            <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', marginTop: 8, marginBottom: 12 }}>
              Privacy Policy
            </h1>
            <p style={{ color: 'var(--text)', fontSize: '0.85rem', margin: 0 }}>
              Last updated: {LAST_UPDATED}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <section style={{ paddingBottom: 'clamp(64px, 8vw, 100px)', background: 'var(--bg)' }}>
        <div className="page-container" style={{ maxWidth: 760 }}>

          {/* Intro */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            style={{
              color: 'var(--text)',
              lineHeight: 1.8,
              fontSize: '0.975rem',
              marginBottom: 48,
              padding: '20px 24px',
              borderLeft: '3px solid var(--accent)',
              background: 'var(--accent-bg)',
              borderRadius: '0 var(--radius) var(--radius) 0',
            }}
          >
            This Privacy Policy describes how <strong style={{ color: 'var(--text-h)' }}>Siva Shanmuga Vadivel</strong> ({cfg.seo.siteUrl}) collects, uses, and protects any information you provide when using this website. Your privacy matters and this site is built with minimal data collection in mind.
          </motion.p>

          {/* Sections */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
            {sections.map((section, i) => (
              <motion.div
                key={section.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.55, delay: i * 0.04, ease: [0.16, 1, 0.3, 1] }}
              >
                <h2 style={{
                  fontSize: '1.05rem',
                  fontWeight: 700,
                  color: 'var(--text-h)',
                  marginBottom: 10,
                  paddingBottom: 8,
                  borderBottom: '1px solid var(--border)',
                }}>
                  {section.title}
                </h2>
                <p style={{
                  color: 'var(--text)',
                  lineHeight: 1.8,
                  fontSize: '0.925rem',
                  margin: 0,
                }}>
                  {section.content}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Email CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            style={{
              marginTop: 64,
              padding: '28px 32px',
              borderRadius: 'var(--radius-lg)',
              background: 'var(--card-bg)',
              border: '1px solid var(--border)',
              textAlign: 'center',
            }}
          >
            <p style={{ color: 'var(--text)', margin: '0 0 16px', fontSize: '0.95rem' }}>
              Have questions about this policy?
            </p>
            <a
              href={`mailto:${cfg.contact.email}`}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '10px 22px', borderRadius: 999,
                background: 'var(--accent)', color: '#fff',
                fontWeight: 600, fontSize: '0.875rem',
                textDecoration: 'none',
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
              Contact via Email
            </a>
          </motion.div>

        </div>
      </section>
    </div>
  )
}
