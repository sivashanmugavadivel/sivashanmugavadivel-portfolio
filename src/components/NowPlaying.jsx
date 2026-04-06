import { useRef, useState, useEffect, useCallback } from 'react'
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
const embedSrc = videoId ? `https://www.youtube.com/embed/${videoId}?enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}` : null

function formatTime(sec) {
  if (!sec || isNaN(sec)) return '0:00'
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
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

/* ─────────────────────────────────────────────
   Music app style player
   Static album art + EqBars wave, interactive
   progress bar with real seek via YouTube API
───────────────────────────────────────────── */
export default function NowPlaying() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: false, margin: '-80px' })
  const iframeRef = useRef(null)
  const progressRef = useRef(null)
  const pollRef = useRef(null)

  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [dragValue, setDragValue] = useState(0)
  const pendingSeek = useRef(null)

  // Post a command to the iframe
  const postCmd = useCallback((func, args = '') => {
    iframeRef.current?.contentWindow?.postMessage(
      JSON.stringify({ event: 'command', func, args }),
      '*'
    )
  }, [])

  // Ask iframe for current time + duration
  const pollProgress = useCallback(() => {
    postCmd('getCurrentTime')
    postCmd('getDuration')
  }, [postCmd])

  // Start/stop polling
  useEffect(() => {
    if (playing && !dragging) {
      pollRef.current = setInterval(pollProgress, 500)
    } else {
      clearInterval(pollRef.current)
    }
    return () => clearInterval(pollRef.current)
  }, [playing, dragging, pollProgress])

  // Listen for YouTube API responses
  useEffect(() => {
    function onMessage(e) {
      let data
      try { data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data } catch { return }

      // State change: 1 = playing, 2 = paused, 0 = ended
      if (data?.event === 'onStateChange') {
        if (data.info === 1) setPlaying(true)
        else if (data.info === 2 || data.info === 0) setPlaying(false)
      }

      // Time/duration responses
      if (typeof data?.info === 'number' && data?.event === 'infoDelivery') {
        if (data.info?.currentTime !== undefined) setCurrentTime(data.info.currentTime)
        if (data.info?.duration !== undefined && data.info.duration > 0) setDuration(data.info.duration)
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])

  function toggle() {
    if (playing) {
      postCmd('pauseVideo')
      setPlaying(false)
    } else {
      postCmd('playVideo')
      setPlaying(true)
    }
  }

  // Progress bar interactions
  function getProgressFromEvent(e) {
    const bar = progressRef.current
    if (!bar || !duration) return 0
    const rect = bar.getBoundingClientRect()
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    return ratio * duration
  }

  function onBarMouseDown(e) {
    e.preventDefault()
    setDragging(true)
    const t = getProgressFromEvent(e)
    setDragValue(t)
    setCurrentTime(t)
  }

  function onBarMouseMove(e) {
    if (!dragging) return
    const t = getProgressFromEvent(e)
    setDragValue(t)
    setCurrentTime(t)
  }

  function onBarMouseUp(e) {
    if (!dragging) return
    setDragging(false)
    const t = getProgressFromEvent(e)
    setCurrentTime(t)
    postCmd('seekTo', [t, true])
  }

  useEffect(() => {
    if (!dragging) return
    function onUp(e) { onBarMouseUp(e) }
    function onMove(e) { onBarMouseMove(e) }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    window.addEventListener('touchmove', onMove, { passive: false })
    window.addEventListener('touchend', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('touchend', onUp)
    }
  }, [dragging])

  const progress = duration > 0 ? (dragging ? dragValue : currentTime) / duration : 0

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
      transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
    >
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
        borderRadius: 20, overflow: 'hidden', boxShadow: 'var(--shadow)',
      }}>
        {/* Hero banner — blurred bg */}
        <div style={{ position: 'relative', height: 160, overflow: 'hidden' }}>
          <img
            src={thumb} alt={nowPlaying.title}
            onError={e => { e.target.src = '/avatar.jpg' }}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', filter: 'blur(2px) brightness(0.45)', transform: 'scale(1.08)' }}
          />

          {/* Album art + info row */}
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', padding: '0 24px', gap: 20 }}>
            {/* Static album art with EqBars badge */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <img
                src={thumb} alt={nowPlaying.title}
                onError={e => { e.target.src = '/avatar.jpg' }}
                style={{ width: 88, height: 88, borderRadius: 14, objectFit: 'cover', border: '2px solid rgba(255,255,255,0.25)', boxShadow: '0 4px 20px rgba(0,0,0,0.5)', display: 'block' }}
              />
              {/* EqBars badge on album art */}
              <div style={{
                position: 'absolute', bottom: -6, right: -6,
                background: 'var(--card-bg)', border: '1px solid var(--border)',
                borderRadius: 999, padding: '3px 7px',
                display: 'flex', alignItems: 'center',
              }}>
                <EqBars playing={playing} />
              </div>
            </div>

            {/* Track info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: '0 0 4px', fontSize: '0.63rem', color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Now Playing</p>
              <h3 style={{ margin: '0 0 3px', fontSize: '1.05rem', fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nowPlaying.title}</h3>
              <p style={{ margin: '0 0 2px', fontSize: '0.82rem', color: 'rgba(255,255,255,0.75)' }}>{nowPlaying.artist}</p>
              <p style={{ margin: 0, fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)', fontStyle: 'italic' }}>{nowPlaying.movie}</p>
            </div>
          </div>
        </div>

        {/* Controls row */}
        <div style={{ padding: '14px 20px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Progress bar + times */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text)', opacity: 0.5, minWidth: 32, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
              {formatTime(dragging ? dragValue : currentTime)}
            </span>

            {/* Interactive scrubber */}
            <div
              ref={progressRef}
              onMouseDown={onBarMouseDown}
              onTouchStart={onBarMouseDown}
              style={{
                flex: 1, height: 6, borderRadius: 6,
                background: 'var(--border)',
                cursor: 'pointer',
                position: 'relative',
                touchAction: 'none',
              }}
            >
              {/* Filled portion */}
              <div style={{
                height: '100%', borderRadius: 6,
                background: 'var(--accent)',
                width: `${progress * 100}%`,
                pointerEvents: 'none',
              }} />
              {/* Thumb dot */}
              <div style={{
                position: 'absolute',
                top: '50%',
                left: `${progress * 100}%`,
                transform: 'translate(-50%, -50%)',
                width: 14, height: 14,
                borderRadius: '50%',
                background: 'var(--accent)',
                border: '2px solid var(--card-bg)',
                boxShadow: '0 1px 6px rgba(0,0,0,0.3)',
                pointerEvents: 'none',
                transition: dragging ? 'none' : 'left 0.1s linear',
              }} />
            </div>

            <span style={{ fontSize: '0.7rem', color: 'var(--text)', opacity: 0.5, minWidth: 32, fontVariantNumeric: 'tabular-nums' }}>
              {formatTime(duration)}
            </span>
          </div>

          {/* Play/Pause centered */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <motion.button
              onClick={toggle}
              whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.93 }}
              style={{
                width: 48, height: 48, borderRadius: '50%',
                background: 'var(--accent)', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff',
                boxShadow: '0 2px 16px color-mix(in srgb, var(--accent) 40%, transparent)',
              }}
            >
              {playing ? <PauseIcon /> : <PlayIcon />}
            </motion.button>
          </div>
        </div>
      </div>

      <PlaylistRow />
    </motion.div>
  )
}
