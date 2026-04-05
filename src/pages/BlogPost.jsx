import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { loadPost } from '../hooks/usePosts'
import cfg from '../data/config.json'
import ScrollProgress from '../components/ui/ScrollProgress'
import JsonPostRenderer from '../components/blog/JsonPostRenderer'
import { tagColor, tagIcon } from '../data/tagMeta'

function formatDate(d) {
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

function calcReadTime(post) {
  if (post._source === 'json') {
    const words = (post.sections || [])
      .filter(s => s.type === 'text')
      .map(s => s.body || '')
      .join(' ')
      .split(/\s+/).length
    return Math.max(2, Math.ceil(words / 200)) + ' min read'
  }
  return Math.max(2, Math.ceil((post.content || '').split(' ').length / 200)) + ' min read'
}

export default function BlogPost() {
  const { slug } = useParams()
  const [post, setPost] = useState(null)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    loadPost(slug).then(result => {
      if (!result) setNotFound(true)
      else setPost(result)
    })
  }, [slug])

  if (notFound) {
    return (
      <div className="container-narrow section" style={{ textAlign: 'center' }}>
        <h2>Post not found</h2>
        <Link to="/blog">← Back to Blog</Link>
      </div>
    )
  }

  if (!post) {
    return <div className="container-narrow section" style={{ textAlign: 'center' }}>Loading…</div>
  }

  const { frontmatter } = post
  const { title, date, tags = [], excerpt } = frontmatter
  const color = tagColor(tags[0])
  const icon = post.meta?.icon || tagIcon(tags)
  const readTime = calcReadTime(post)

  // Author: from JSON meta, or fallback
  const author = (post.meta?.author) || cfg.personal.name

  return (
    <>
      <ScrollProgress />

      {/* ── Desktop layout (≥768px): sidebar + content side by side ── */}
      <div className="bp-desktop-layout">

        {/* Left Sidebar */}
        <motion.aside
          initial={{ x: -40, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          style={{
            width: 220, flexShrink: 0,
            background: '#0f0f14',
            borderRadius: '0 0 20px 20px',
            padding: '40px 22px 40px',
            display: 'flex', flexDirection: 'column', gap: 24,
            position: 'sticky', top: 64, height: 'calc(100vh - 64px)',
            alignSelf: 'flex-start',
          }}
        >
          <Link to="/blog" style={{
            fontSize: '0.75rem', color: '#666680', textDecoration: 'none',
            display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600,
          }}>
            ← Blog
          </Link>

          <motion.div
            animate={{ rotate: [0, 8, -8, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            style={{ fontSize: 56, textAlign: 'center', filter: `drop-shadow(0 0 16px ${color}88)` }}
          >
            {icon}
          </motion.div>

          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.3, duration: 0.6, ease: 'easeOut' }}
            style={{
              height: 4, borderRadius: 2,
              background: `linear-gradient(90deg, ${color}, ${color}44)`,
              transformOrigin: 'left',
            }}
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {tags.map(tag => (
              <motion.span
                key={tag}
                whileHover={{ x: 4 }}
                style={{
                  fontSize: '0.72rem', fontWeight: 700, padding: '5px 12px',
                  borderRadius: 6, cursor: 'default',
                  background: `${tagColor(tag)}18`,
                  color: tagColor(tag),
                  border: `1px solid ${tagColor(tag)}44`,
                }}
              >
                {tag}
              </motion.span>
            ))}
          </div>

          <div style={{ borderTop: '1px solid #2a2a3a', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: '0.7rem', color: '#666680', fontFamily: 'monospace', lineHeight: 1.5 }}>
              📅<br />{formatDate(date)}
            </div>
            <div style={{ fontSize: '0.7rem', color: '#666680', fontFamily: 'monospace' }}>
              ⏱ {readTime}
            </div>
          </div>

          <div style={{
            writingMode: 'vertical-rl', textOrientation: 'mixed',
            fontSize: '0.6rem', color: '#2a2a3a',
            letterSpacing: '0.2em', textTransform: 'uppercase',
            fontWeight: 700, marginTop: 'auto', userSelect: 'none',
          }}>
            {cfg.personal.name.toUpperCase()}
          </div>
        </motion.aside>

        {/* Right Content */}
        <motion.main
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          style={{ flex: 1, padding: '48px 0 80px 40px', minWidth: 0 }}
        >
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.5 }}
            style={{
              fontSize: 'clamp(1.5rem, 3vw, 2.2rem)', color: 'var(--text-h)',
              lineHeight: 1.3, marginBottom: 20, marginTop: 0,
            }}
          >
            {title}
          </motion.h1>

          {excerpt && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35 }}
              style={{
                padding: '14px 18px', borderRadius: 10,
                background: `${color}12`, borderLeft: `3px solid ${color}`,
                fontSize: '0.92rem', color: 'var(--text)', lineHeight: 1.7,
                fontStyle: 'italic', margin: '0 0 32px',
              }}
            >
              {excerpt}
            </motion.p>
          )}

          {post._source === 'json' ? (
            <JsonPostRenderer sections={post.sections} meta={post.meta} color={color} />
          ) : (
            <div className="magazine-prose">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content}</ReactMarkdown>
            </div>
          )}

          <div style={{
            marginTop: 56, paddingTop: 24,
            borderTop: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
          }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text)', fontStyle: 'italic', opacity: 0.7 }}>
              — {author}
            </span>
            <Link to="/blog" style={{
              fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent)',
              textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6,
            }}>
              ← Back to Blog
            </Link>
          </div>
        </motion.main>
      </div>

      {/* ── Mobile layout (<768px): stacked ── */}
      <motion.div
        className="bp-mobile-layout"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Mobile top bar */}
        <div className="bp-mobile-topbar">
          <Link to="/blog" className="bp-mobile-back">← Blog</Link>
          <div className="bp-mobile-meta-row">
            <span className="bp-mobile-date">📅 {formatDate(date)}</span>
            <span className="bp-mobile-readtime">⏱ {readTime}</span>
          </div>
        </div>

        {/* Accent bar */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.2, duration: 0.5, ease: 'easeOut' }}
          style={{
            height: 3, background: `linear-gradient(90deg, ${color}, ${color}44)`,
            transformOrigin: 'left', borderRadius: 2, margin: '0 16px',
          }}
        />

        {/* Mobile header: icon + title */}
        <div className="bp-mobile-header">
          <motion.div
            animate={{ rotate: [0, 8, -8, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            style={{ fontSize: 40, filter: `drop-shadow(0 0 12px ${color}88)`, flexShrink: 0 }}
          >
            {icon}
          </motion.div>
          <h1 className="bp-mobile-title">{title}</h1>
        </div>

        {/* Tags row */}
        <div className="bp-mobile-tags">
          {tags.map(tag => (
            <span key={tag} style={{
              fontSize: '0.7rem', fontWeight: 700, padding: '4px 10px',
              borderRadius: 6,
              background: `${tagColor(tag)}18`,
              color: tagColor(tag),
              border: `1px solid ${tagColor(tag)}44`,
            }}>
              {tag}
            </span>
          ))}
        </div>

        {/* Excerpt */}
        {excerpt && (
          <p style={{
            padding: '12px 16px', borderRadius: 10, margin: '0 16px',
            background: `${color}12`, borderLeft: `3px solid ${color}`,
            fontSize: '0.88rem', color: 'var(--text)', lineHeight: 1.7,
            fontStyle: 'italic',
          }}>
            {excerpt}
          </p>
        )}

        {/* Content */}
        <div className="bp-mobile-content">
          {post._source === 'json' ? (
            <JsonPostRenderer sections={post.sections} meta={post.meta} color={color} />
          ) : (
            <div className="magazine-prose">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content}</ReactMarkdown>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bp-mobile-footer">
          <span style={{ fontSize: '0.82rem', color: 'var(--text)', fontStyle: 'italic', opacity: 0.7 }}>
            — {author}
          </span>
          <Link to="/blog" style={{
            fontSize: '0.82rem', fontWeight: 600, color: 'var(--accent)',
            textDecoration: 'none',
          }}>
            ← Back to Blog
          </Link>
        </div>
      </motion.div>

      <style>{`
        /* ── Desktop (≥768px): show sidebar layout, hide mobile ── */
        .bp-desktop-layout {
          display: flex; min-height: calc(100vh - 64px);
          max-width: 1100px; margin: 0 auto; padding: 0 24px;
        }
        .bp-mobile-layout { display: none; }

        /* ── Mobile (<768px): hide desktop, show mobile ── */
        @media (max-width: 767px) {
          .bp-desktop-layout { display: none; }
          .bp-mobile-layout {
            display: flex; flex-direction: column; gap: 16px;
            padding: 80px 0 60px; min-height: calc(100vh - 64px);
          }
          .bp-mobile-topbar {
            display: flex; align-items: center; justify-content: space-between;
            padding: 14px 16px 0; flex-wrap: wrap; gap: 8px;
          }
          .bp-mobile-back {
            font-size: 0.78rem; color: #666680; text-decoration: none;
            font-weight: 600;
          }
          .bp-mobile-meta-row {
            display: flex; gap: 14px; align-items: center;
          }
          .bp-mobile-date, .bp-mobile-readtime {
            font-size: 0.7rem; color: #666680; font-family: monospace;
          }
          .bp-mobile-header {
            display: flex; align-items: flex-start; gap: 14px;
            padding: 12px 16px 0;
          }
          .bp-mobile-title {
            font-size: 1.35rem; font-weight: 800; color: var(--text-h);
            line-height: 1.3; margin: 0;
          }
          .bp-mobile-tags {
            display: flex; flex-wrap: wrap; gap: 8px; padding: 0 16px;
          }
          .bp-mobile-content { padding: 0 16px; }
          .bp-mobile-footer {
            padding: 20px 16px 0;
            border-top: 1px solid var(--border);
            display: flex; align-items: center; justify-content: space-between; gap: 12px;
          }
          .magazine-prose { font-size: 0.9rem; }
        }

        /* ── Prose styles (shared) ── */
        .magazine-prose { line-height: 1.85; color: var(--text); font-size: 0.95rem; }
        .magazine-prose h1 { display: none; }
        .magazine-prose h2 {
          font-size: 1.15rem; font-weight: 800; letter-spacing: -0.01em;
          color: var(--text-h); margin-top: 2em; margin-bottom: 0.5em;
        }
        .magazine-prose h3 {
          font-size: 0.95rem; color: ${color};
          text-transform: uppercase; letter-spacing: 0.08em;
          font-weight: 700; margin-top: 1.5em; margin-bottom: 0.4em;
        }
        .magazine-prose p { margin-bottom: 1.2em; }
        .magazine-prose ul, .magazine-prose ol { padding-left: 1.5em; margin-bottom: 1.2em; }
        .magazine-prose li { margin-bottom: 0.35em; }
        .magazine-prose li::marker { color: ${color}; font-weight: 700; }
        .magazine-prose strong {
          color: var(--text-h); background: ${color}18;
          padding: 0 4px; border-radius: 3px;
        }
        .magazine-prose em { color: var(--text); opacity: 0.85; }
        .magazine-prose table { width: 100%; border-collapse: collapse; margin-bottom: 1.4em; font-size: 0.88rem; }
        .magazine-prose th {
          background: ${color}22; color: ${color}; padding: 9px 12px;
          text-align: left; font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.05em;
        }
        .magazine-prose td { padding: 8px 12px; border-bottom: 1px solid var(--border); }
        .magazine-prose tr:last-child td { border-bottom: none; }
        .magazine-prose hr {
          border: none; height: 1px;
          background: linear-gradient(90deg, ${color}, transparent);
          margin: 2em 0;
        }
        .magazine-prose code {
          font-family: var(--mono); font-size: 0.875em;
          padding: 2px 6px; background: var(--code-bg); border-radius: 4px;
        }
        .magazine-prose pre {
          background: var(--code-bg); padding: 20px; border-radius: var(--radius);
          overflow-x: auto; margin-bottom: 1.5em;
        }
        .magazine-prose pre code { background: none; padding: 0; }
        .magazine-prose blockquote {
          border-left: 3px solid ${color}; padding-left: 16px;
          margin: 0 0 1.2em; color: var(--text); font-style: italic;
        }
        .magazine-prose a { color: ${color}; }
      `}</style>
    </>
  )
}
