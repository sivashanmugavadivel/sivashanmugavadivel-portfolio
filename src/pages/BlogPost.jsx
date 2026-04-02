import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { loadPost } from '../hooks/usePosts'
import ScrollProgress from '../components/ui/ScrollProgress'

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
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

  const { frontmatter, content } = post

  return (
    <>
      <ScrollProgress />
      <article className="container-narrow">
        <motion.header
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ padding: '64px 0 40px', borderBottom: '1px solid var(--border)', marginBottom: 48 }}
        >
          <Link
            to="/blog"
            style={{ fontSize: '0.875rem', color: 'var(--text)', display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 24 }}
          >
            ← Blog
          </Link>

          {frontmatter.tags?.length > 0 && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
              {frontmatter.tags.map(tag => (
                <span
                  key={tag}
                  style={{
                    padding: '3px 10px', borderRadius: 999, fontSize: '0.75rem',
                    fontWeight: 500, background: 'var(--accent-bg)', color: 'var(--accent)',
                    border: '1px solid var(--accent-border)',
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)', marginBottom: 16 }}>
            {frontmatter.title}
          </h1>

          {frontmatter.date && (
            <time style={{ fontSize: '0.875rem', color: 'var(--text)', opacity: 0.8 }}>
              {formatDate(frontmatter.date)}
            </time>
          )}
        </motion.header>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          style={{ paddingBottom: 96 }}
          className="prose"
        >
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
        </motion.div>
      </article>

      <style>{`
        .prose { line-height: 1.8; color: var(--text); }
        .prose h1, .prose h2, .prose h3 { color: var(--text-h); margin-top: 2em; margin-bottom: 0.5em; }
        .prose h2 { font-size: 1.6rem; }
        .prose h3 { font-size: 1.2rem; }
        .prose p { margin-bottom: 1.2em; }
        .prose ul, .prose ol { padding-left: 1.5em; margin-bottom: 1.2em; }
        .prose li { margin-bottom: 0.4em; }
        .prose code { font-family: var(--mono); font-size: 0.875em; padding: 2px 6px; background: var(--code-bg); border-radius: 4px; }
        .prose pre { background: var(--code-bg); padding: 20px; border-radius: var(--radius); overflow-x: auto; margin-bottom: 1.5em; }
        .prose pre code { background: none; padding: 0; }
        .prose blockquote { border-left: 3px solid var(--accent); padding-left: 16px; margin: 0 0 1.2em; color: var(--text); font-style: italic; }
        .prose a { color: var(--accent); }
        .prose strong { color: var(--text-h); font-weight: 600; }
        .prose hr { border: none; border-top: 1px solid var(--border); margin: 2em 0; }
      `}</style>
    </>
  )
}
