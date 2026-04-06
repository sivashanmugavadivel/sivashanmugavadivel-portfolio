import { useRef, useState } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import cfg from '../data/config.json'

function extractVideoId(url) {
  try {
    const u = new URL(url)
    return u.searchParams.get('v')
  } catch { return null }
}

function EqBars({ playing }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 16 }}>
      {[0.6, 1, 0.75, 0.45, 0.85].map((h, i) => (
        <motion.div
          key={i}
          animate={playing ? { scaleY: [h, 1, h * 0.5, 1, h] } : { scaleY: 0.3 }}
          transition={{ duration: 1.2, repeat: playing ? Infinity : 0, delay: i * 0.15, ease: 'easeInOut' }}
          style={{ width: 3, borderRadius: 2, height: 14, background: 'var(--accent)', transformOrigin: 'bottom', opacity: 0.85 }}
        />
      ))}
    </div>
  )
}

function PlayIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M2 1.5l11 5.5-11 5.5V1.5z" fill="currentColor" />
    </svg>
  )
}

function PauseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <rect x="2" y="2" width="4" height="10" rx="1" fill="currentColor"/>
      <rect x="8" y="2" width="4" height="10" rx="1" fill="currentColor"/>
    </svg>
  )
}

function ArrowIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M2 6h8M6 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

const { nowPlaying, playlistLabel, playlistUrl } = cfg.music
const videoId = extractVideoId(nowPlaying.listenUrl)
const thumb = videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : null
const embedSrc = videoId ? `https://www.youtube.com/embed/${videoId}?enablejsapi=1` : null

/* ─────────────────────────────────────────────
   OPTION 1 — Hidden iframe, custom play button
   Card looks clean, click ▶ plays audio in bg
───────────────────────────────────────────── */
function OptionOne() {
  const [playing, setPlaying] = useState(false)
  const iframeRef = useRef(null)

  function toggle() {
    const iframe = iframeRef.current
    if (!iframe) return
    const msg = playing
      ? '{"event":"command","func":"pauseVideo","args":""}'
      : '{"event":"command","func":"playVideo","args":""}'
    iframe.contentWindow.postMessage(msg, '*')
    setPlaying(p => !p)
  }

  return (
    <div>
      {/* Hidden iframe */}
      {embedSrc && (
        <iframe
          ref={iframeRef}
          src={embedSrc}
          style={{ position: 'absolute', width: 0, height: 0, opacity: 0, pointerEvents: 'none' }}
          allow="autoplay"
          title="bg-player"
        />
      )}

      <div style={{
        background: 'var(--card-bg)', border: '1px solid var(--border)',
        borderRadius: 18, padding: '20px 24px',
        display: 'flex', alignItems: 'center', gap: 20,
        boxShadow: 'var(--shadow)', flexWrap: 'wrap',
        position: 'relative',
      }}>
        {/* Album art */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <img
            src={thumb} alt={nowPlaying.title}
            onError={e => { e.target.src = '/avatar.jpg' }}
            style={{ width: 84, height: 84, borderRadius: 12, objectFit: 'cover', border: '2px solid var(--border)', display: 'block' }}
          />
          <div style={{
            position: 'absolute', bottom: -6, right: -6,
            background: 'var(--card-bg)', border: '1px solid var(--border)',
            borderRadius: 999, padding: '3px 7px',
            display: 'flex', alignItems: 'center',
          }}>
            <EqBars playing={playing} />
          </div>
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: '0 0 4px', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--accent)', fontWeight: 600 }}>
            Currently listening to
          </p>
          <h3 style={{ margin: '0 0 2px', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-h)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {nowPlaying.title}
          </h3>
          <p style={{ margin: '0 0 2px', fontSize: '0.85rem', color: 'var(--text)', opacity: 0.8 }}>{nowPlaying.artist}</p>
          <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text)', opacity: 0.5, fontStyle: 'italic' }}>{nowPlaying.movie}</p>
        </div>

        {/* Play/Pause button */}
        <motion.button
          onClick={toggle}
          whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.95 }}
          style={{
            width: 48, height: 48, borderRadius: '50%',
            background: 'var(--accent)', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', flexShrink: 0,
            boxShadow: '0 2px 16px color-mix(in srgb, var(--accent) 40%, transparent)',
          }}
        >
          {playing ? <PauseIcon /> : <PlayIcon />}
        </motion.button>
      </div>

      <PlaylistRow />
    </div>
  )
}

/* ─────────────────────────────────────────────
   OPTION 2 — Visible compact YouTube embed
   Shows actual YouTube player in the card
───────────────────────────────────────────── */
function OptionTwo() {
  return (
    <div>
      <div style={{
        background: 'var(--card-bg)', border: '1px solid var(--border)',
        borderRadius: 18, overflow: 'hidden', boxShadow: 'var(--shadow)',
      }}>
        {/* Top info row */}
        <div style={{ padding: '18px 20px 12px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <img
            src={thumb} alt={nowPlaying.title}
            onError={e => { e.target.src = '/avatar.jpg' }}
            style={{ width: 52, height: 52, borderRadius: 8, objectFit: 'cover', border: '1px solid var(--border)', flexShrink: 0 }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: '0 0 3px', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--accent)', fontWeight: 600 }}>
              Currently listening to
            </p>
            <h3 style={{ margin: '0 0 1px', fontSize: '1rem', fontWeight: 700, color: 'var(--text-h)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {nowPlaying.title}
            </h3>
            <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text)', opacity: 0.7 }}>
              {nowPlaying.artist} · <span style={{ fontStyle: 'italic' }}>{nowPlaying.movie}</span>
            </p>
          </div>
          <EqBars playing={true} />
        </div>

        {/* YouTube embed */}
        {embedSrc && (
          <div style={{ position: 'relative', paddingBottom: '56.25%', background: '#000' }}>
            <iframe
              src={embedSrc}
              title={nowPlaying.title}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        )}
      </div>

      <PlaylistRow />
    </div>
  )
}

/* ─────────────────────────────────────────────
   OPTION 3 — Custom player UI, hidden iframe
   Styled like a music app with album art,
   play/pause + fake progress bar animation
───────────────────────────────────────────── */
function OptionThree() {
  const [playing, setPlaying] = useState(false)
  const iframeRef = useRef(null)

  function toggle() {
    const iframe = iframeRef.current
    if (!iframe) return
    const msg = playing
      ? '{"event":"command","func":"pauseVideo","args":""}'
      : '{"event":"command","func":"playVideo","args":""}'
    iframe.contentWindow.postMessage(msg, '*')
    setPlaying(p => !p)
  }

  return (
    <div>
      {embedSrc && (
        <iframe ref={iframeRef} src={embedSrc}
          style={{ position: 'absolute', width: 0, height: 0, opacity: 0, pointerEvents: 'none' }}
          allow="autoplay" title="bg-player-3"
        />
      )}

      <div style={{
        background: 'var(--card-bg)', border: '1px solid var(--border)',
        borderRadius: 20, overflow: 'hidden', boxShadow: 'var(--shadow)',
      }}>
        {/* Hero album art banner */}
        <div style={{ position: 'relative', height: 180, overflow: 'hidden' }}>
          <img
            src={thumb} alt={nowPlaying.title}
            onError={e => { e.target.src = '/avatar.jpg' }}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', filter: 'blur(2px) brightness(0.55)', transform: 'scale(1.05)' }}
          />
          {/* Center album art overlay */}
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24 }}>
            <motion.img
              src={thumb} alt={nowPlaying.title}
              onError={e => { e.target.src = '/avatar.jpg' }}
              animate={playing ? { rotate: 360 } : { rotate: 0 }}
              transition={playing ? { duration: 8, repeat: Infinity, ease: 'linear' } : { duration: 0.3 }}
              style={{ width: 100, height: 100, borderRadius: '50%', objectFit: 'cover', border: '3px solid rgba(255,255,255,0.3)', boxShadow: '0 4px 24px rgba(0,0,0,0.5)' }}
            />
            <div>
              <p style={{ margin: '0 0 4px', fontSize: '0.65rem', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Now Playing</p>
              <h3 style={{ margin: '0 0 4px', fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>{nowPlaying.title}</h3>
              <p style={{ margin: '0 0 2px', fontSize: '0.82rem', color: 'rgba(255,255,255,0.75)' }}>{nowPlaying.artist}</p>
              <p style={{ margin: 0, fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', fontStyle: 'italic' }}>{nowPlaying.movie}</p>
            </div>
          </div>
        </div>

        {/* Controls row */}
        <div style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* Animated progress bar */}
          <div style={{ flex: 1, height: 4, borderRadius: 4, background: 'var(--border)', overflow: 'hidden' }}>
            <motion.div
              animate={playing ? { width: ['0%', '100%'] } : {}}
              transition={playing ? { duration: 240, ease: 'linear', repeat: Infinity } : {}}
              style={{ height: '100%', background: 'var(--accent)', borderRadius: 4, width: playing ? undefined : '30%' }}
            />
          </div>

          {/* Play/Pause */}
          <motion.button
            onClick={toggle}
            whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.93 }}
            style={{
              width: 44, height: 44, borderRadius: '50%',
              background: 'var(--accent)', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', flexShrink: 0,
              boxShadow: '0 2px 12px color-mix(in srgb, var(--accent) 40%, transparent)',
            }}
          >
            {playing ? <PauseIcon /> : <PlayIcon />}
          </motion.button>
        </div>
      </div>

      <PlaylistRow />
    </div>
  )
}

/* ── Shared playlist row ── */
function PlaylistRow() {
  return (
    <div style={{
      marginTop: 12,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '13px 20px', borderRadius: 12,
      border: '1px solid var(--border)', background: 'var(--bg-secondary)',
    }}>
      <span style={{ fontSize: '0.88rem', color: 'var(--text-h)', fontWeight: 600 }}>
        🎶 {playlistLabel}
      </span>
      <motion.a
        href={playlistUrl} target="_blank" rel="noopener noreferrer"
        whileHover={{ x: 3 }}
        style={{ fontSize: '0.82rem', color: 'var(--accent)', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}
      >
        Open Playlist <ArrowIcon />
      </motion.a>
    </div>
  )
}

/* ── Design label ── */
function Label({ number, title, desc }) {
  return (
    <div style={{ marginBottom: 16, marginTop: 48, display: 'flex', alignItems: 'center', gap: 14 }}>
      <span style={{
        width: 30, height: 30, borderRadius: '50%', background: 'var(--accent)', color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.82rem', fontWeight: 700, flexShrink: 0,
      }}>{number}</span>
      <div>
        <div style={{ fontWeight: 700, color: 'var(--text-h)', fontSize: '0.95rem' }}>{title}</div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text)', opacity: 0.55 }}>{desc}</div>
      </div>
    </div>
  )
}

/* ── Main export — shows all 3 for selection ── */
export default function NowPlaying() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: false, margin: '-80px' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
      transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
    >
      <p style={{ textAlign: 'center', color: 'var(--text)', opacity: 0.6, fontSize: '0.88rem', marginBottom: 8 }}>
        Pick your favourite player design — tell me which one you prefer.
      </p>

      <Label number="1" title="Hidden player — custom ▶ button" desc="Clean card, audio plays in background, no YouTube UI visible" />
      <OptionOne />

      <Label number="2" title="Visible YouTube embed" desc="Full YouTube player inside the card with controls" />
      <OptionTwo />

      <Label number="3" title="Music app style" desc="Spinning album art, progress bar, play/pause — like a real music player" />
      <OptionThree />
    </motion.div>
  )
}
