import { useRef, useState, useEffect, useCallback } from 'react'
import { motion, useInView } from 'framer-motion'
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

function formatTime(sec) {
  if (!sec || isNaN(sec) || sec < 0) return '0:00'
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

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

// Load YouTube IFrame API script once
function loadYTScript() {
  if (window.YT && window.YT.Player) return Promise.resolve()
  return new Promise(resolve => {
    if (document.getElementById('yt-iframe-api')) {
      // Script already injected, wait for it
      const check = setInterval(() => {
        if (window.YT && window.YT.Player) { clearInterval(check); resolve() }
      }, 100)
      return
    }
    window.onYouTubeIframeAPIReady = resolve
    const tag = document.createElement('script')
    tag.id = 'yt-iframe-api'
    tag.src = 'https://www.youtube.com/iframe_api'
    document.head.appendChild(tag)
  })
}

export default function NowPlaying() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: false, margin: '-80px' })
  const containerRef = useRef(null)   // div where YT.Player mounts
  const playerRef = useRef(null)      // YT.Player instance
  const pollRef = useRef(null)
  const progressRef = useRef(null)

  const [ready, setReady] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [dragValue, setDragValue] = useState(0)

  // Init YT Player
  useEffect(() => {
    if (!videoId) return
    let destroyed = false

    loadYTScript().then(() => {
      if (destroyed) return
      playerRef.current = new window.YT.Player(containerRef.current, {
        videoId,
        playerVars: { controls: 0, disablekb: 1, modestbranding: 1, rel: 0, iv_load_policy: 3 },
        events: {
          onReady: () => { if (!destroyed) setReady(true) },
          onStateChange: (e) => {
            if (destroyed) return
            if (e.data === window.YT.PlayerState.PLAYING) setPlaying(true)
            else setPlaying(false)
          },
        },
      })
    })

    return () => {
      destroyed = true
      clearInterval(pollRef.current)
      try { playerRef.current?.destroy() } catch {}
      playerRef.current = null
    }
  }, [])

  // Poll current time while playing
  useEffect(() => {
    clearInterval(pollRef.current)
    if (playing && !dragging) {
      pollRef.current = setInterval(() => {
        const p = playerRef.current
        if (!p || typeof p.getCurrentTime !== 'function') return
        setCurrentTime(p.getCurrentTime())
        const d = p.getDuration()
        if (d > 0) setDuration(d)
      }, 500)
    }
    return () => clearInterval(pollRef.current)
  }, [playing, dragging])

  function toggle() {
    const p = playerRef.current
    if (!p) return
    if (playing) p.pauseVideo()
    else p.playVideo()
  }

  // Progress bar drag
  function getTimeFromEvent(e) {
    const bar = progressRef.current
    if (!bar || !duration) return 0
    const rect = bar.getBoundingClientRect()
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    return Math.max(0, Math.min(duration, ((clientX - rect.left) / rect.width) * duration))
  }

  function onBarPointerDown(e) {
    e.preventDefault()
    const t = getTimeFromEvent(e)
    setDragging(true)
    setDragValue(t)
    setCurrentTime(t)
  }

  const onBarPointerMove = useCallback((e) => {
    if (!dragging) return
    const t = getTimeFromEvent(e)
    setDragValue(t)
    setCurrentTime(t)
  }, [dragging, duration])

  const onBarPointerUp = useCallback((e) => {
    if (!dragging) return
    const t = getTimeFromEvent(e)
    setDragging(false)
    setCurrentTime(t)
    playerRef.current?.seekTo(t, true)
  }, [dragging, duration])

  useEffect(() => {
    if (!dragging) return
    window.addEventListener('mousemove', onBarPointerMove)
    window.addEventListener('mouseup', onBarPointerUp)
    window.addEventListener('touchmove', onBarPointerMove, { passive: false })
    window.addEventListener('touchend', onBarPointerUp)
    return () => {
      window.removeEventListener('mousemove', onBarPointerMove)
      window.removeEventListener('mouseup', onBarPointerUp)
      window.removeEventListener('touchmove', onBarPointerMove)
      window.removeEventListener('touchend', onBarPointerUp)
    }
  }, [dragging, onBarPointerMove, onBarPointerUp])

  const displayTime = dragging ? dragValue : currentTime
  const progress = duration > 0 ? displayTime / duration : 0

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
      transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
    >
      {/* Hidden YT player div — YT.Player mounts here */}
      <div
        ref={containerRef}
        style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden', pointerEvents: 'none', opacity: 0 }}
      />

      <div style={{
        background: 'var(--card-bg)', border: '1px solid var(--border)',
        borderRadius: 20, overflow: 'hidden', boxShadow: 'var(--shadow)',
      }}>
        {/* Hero banner */}
        <div style={{ position: 'relative', height: 160, overflow: 'hidden' }}>
          <img
            src={thumb} alt={nowPlaying.title}
            onError={e => { e.target.src = '/avatar.jpg' }}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', filter: 'blur(2px) brightness(0.45)', transform: 'scale(1.08)' }}
          />
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', padding: '0 24px', gap: 20 }}>
            {/* Static album art + EqBars badge */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <img
                src={thumb} alt={nowPlaying.title}
                onError={e => { e.target.src = '/avatar.jpg' }}
                style={{ width: 88, height: 88, borderRadius: 14, objectFit: 'cover', border: '2px solid rgba(255,255,255,0.25)', boxShadow: '0 4px 20px rgba(0,0,0,0.5)', display: 'block' }}
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
            {/* Track info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: '0 0 4px', fontSize: '0.63rem', color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Now Playing</p>
              <h3 style={{ margin: '0 0 3px', fontSize: '1.05rem', fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nowPlaying.title}</h3>
              <p style={{ margin: '0 0 2px', fontSize: '0.82rem', color: 'rgba(255,255,255,0.75)' }}>{nowPlaying.artist}</p>
              <p style={{ margin: 0, fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)', fontStyle: 'italic' }}>{nowPlaying.movie}</p>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div style={{ padding: '14px 20px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Progress bar + times */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text)', opacity: 0.5, minWidth: 32, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
              {formatTime(displayTime)}
            </span>

            <div
              ref={progressRef}
              onMouseDown={onBarPointerDown}
              onTouchStart={onBarPointerDown}
              style={{
                flex: 1, height: 6, borderRadius: 6,
                background: 'var(--border)',
                cursor: ready ? 'pointer' : 'default',
                position: 'relative',
                touchAction: 'none',
              }}
            >
              <div style={{
                height: '100%', borderRadius: 6,
                background: 'var(--accent)',
                width: `${progress * 100}%`,
                pointerEvents: 'none',
              }} />
              <div style={{
                position: 'absolute', top: '50%',
                left: `${progress * 100}%`,
                transform: 'translate(-50%, -50%)',
                width: 14, height: 14, borderRadius: '50%',
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

          {/* Play/Pause */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <motion.button
              onClick={toggle}
              disabled={!ready}
              whileHover={ready ? { scale: 1.08 } : {}}
              whileTap={ready ? { scale: 0.93 } : {}}
              style={{
                width: 48, height: 48, borderRadius: '50%',
                background: 'var(--accent)', border: 'none', cursor: ready ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', opacity: ready ? 1 : 0.5,
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
