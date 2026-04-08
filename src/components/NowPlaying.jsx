import { useRef, useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import cfg from '../data/config.json'
import { DESIGNS, STORAGE_KEY, getPositionStyle } from './ToastDesignPicker'

function extractVideoId(url) {
  try { return new URL(url).searchParams.get('v') } catch { return null }
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
  return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 1.5l11 5.5-11 5.5V1.5z" fill="currentColor" /></svg>
}
function PauseIcon() {
  return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="2" y="2" width="4" height="10" rx="1" fill="currentColor"/><rect x="8" y="2" width="4" height="10" rx="1" fill="currentColor"/></svg>
}
function ArrowIcon() {
  return <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6h8M6 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
}

function formatTime(sec) {
  if (!sec || isNaN(sec) || sec < 0) return '0:00'
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

// ── Animated waveform bars behind hero ──
function WaveformBars() {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 60, opacity: 0.2 }}>
      {Array.from({ length: 24 }).map((_, i) => (
        <motion.div
          key={i}
          animate={{ scaleY: [0.3 + Math.random() * 0.4, 0.8 + Math.random() * 0.2, 0.3 + Math.random() * 0.4] }}
          transition={{ duration: 1 + Math.random(), repeat: Infinity, delay: i * 0.08, ease: 'easeInOut' }}
          style={{ width: 4, height: 60, borderRadius: 3, background: 'var(--accent)', transformOrigin: 'bottom' }}
        />
      ))}
    </div>
  )
}

// ── Music hint toast ──
function MusicHintToast({ onDone }) {
  const designId = parseInt(localStorage.getItem(STORAGE_KEY) || '17')
  const design = DESIGNS.find(d => d.id === designId) || DESIGNS[16]
  const { Component, pos } = design
  const message = (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <motion.span animate={{ rotate: [0, -15, 15, -10, 0] }} transition={{ duration: 1.4, repeat: Infinity, repeatDelay: 1.5 }} style={{ display: 'inline-block' }}>🎵</motion.span>
      Hit play &amp; wait for the surprise
      <motion.span animate={{ scale: [1, 1.4, 1], rotate: [0, 20, 0] }} transition={{ duration: 1, repeat: Infinity, repeatDelay: 0.8 }} style={{ display: 'inline-block' }}>✨</motion.span>
      <motion.span animate={{ y: [0, -4, 0] }} transition={{ duration: 0.7, repeat: Infinity, repeatDelay: 0.4 }} style={{ display: 'inline-block' }}>🎧</motion.span>
    </span>
  )
  return <div style={getPositionStyle(pos)}><Component message={message} onDone={onDone} /></div>
}

// ── Floating hearts ──
const HEART_EMOJIS = ['❤️', '🩷', '💜', '🤍', '💖', '💗', '💓', '💝']
function spawnHeart(id) {
  return { id, left: 5 + Math.random() * 90, size: 18 + Math.random() * 22, dur: 3.2 + Math.random() * 1.6, sway: (Math.random() - 0.5) * 130, rot: (Math.random() - 0.5) * 40, emoji: HEART_EMOJIS[Math.floor(Math.random() * HEART_EMOJIS.length)] }
}
function FloatingHeart({ heart, onDone }) {
  const { left, size, dur, sway, rot, emoji } = heart
  return (
    <motion.div initial={{ opacity: 0, y: 0, x: 0, scale: 0.4, rotate: rot }} animate={{ opacity: [0, 1, 1, 0], y: -(window.innerHeight * 0.80), x: sway, scale: [0.4, 1.1, 0.95, 0.7] }} transition={{ duration: dur, ease: 'easeOut' }} onAnimationComplete={onDone}
      style={{ position: 'fixed', bottom: 30, left: `${left}%`, fontSize: size, pointerEvents: 'none', zIndex: 999998, lineHeight: 1, userSelect: 'none', willChange: 'transform, opacity' }}
    >{emoji}</motion.div>
  )
}
function HeartShower({ active }) {
  const [hearts, setHearts] = useState([])
  const intervalRef = useRef(null)
  const idRef = useRef(0)
  useEffect(() => {
    if (active) { intervalRef.current = setInterval(() => setHearts(prev => [...prev, spawnHeart(++idRef.current)]), 500) }
    else { clearInterval(intervalRef.current) }
    return () => clearInterval(intervalRef.current)
  }, [active])
  if (hearts.length === 0) return null
  return createPortal(<>{hearts.map(h => <FloatingHeart key={h.id} heart={h} onDone={() => setHearts(prev => prev.filter(x => x.id !== h.id))} />)}</>, document.body)
}

// ── Fav GIF overlay ──
function FavGif({ show }) {
  return createPortal(
    <AnimatePresence>
      {show && (
        <motion.div initial={{ opacity: 0, scale: 0.7, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.7, y: 30 }} transition={{ type: 'spring', stiffness: 280, damping: 22 }}
          style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 99998, width: 150, height: 150, pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <motion.div animate={{ opacity: [0.5, 1, 0.5], scale: [1, 1.15, 1] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            style={{ position: 'absolute', width: '100%', height: '100%', borderRadius: '50%', background: 'radial-gradient(circle, rgba(167,139,250,0.55) 0%, rgba(124,58,237,0.25) 50%, transparent 75%)', filter: 'blur(14px)', pointerEvents: 'none' }} />
          <img src={`${import.meta.env.BASE_URL}now-play-gif.gif`} alt="now playing" style={{ position: 'relative', width: 130, height: 130, objectFit: 'contain', display: 'block' }} />
        </motion.div>
      )}
    </AnimatePresence>, document.body
  )
}

// ── Load YT script once ──
function loadYTScript() {
  if (window.YT && window.YT.Player) return Promise.resolve()
  return new Promise(resolve => {
    if (document.getElementById('yt-iframe-api')) {
      const check = setInterval(() => { if (window.YT && window.YT.Player) { clearInterval(check); resolve() } }, 100)
      return
    }
    window.onYouTubeIframeAPIReady = resolve
    const tag = document.createElement('script')
    tag.id = 'yt-iframe-api'
    tag.src = 'https://www.youtube.com/iframe_api'
    document.head.appendChild(tag)
  })
}

const { songs, playlistLabel, playlistUrl } = cfg.music

// ── Main export — Waveform Hero design ──
export default function NowPlaying() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: false, margin: '-80px' })
  const [activeIndex, setActiveIndex] = useState(0)
  const [showHint, setShowHint] = useState(false)
  const hintShownRef = useRef(false)

  // Per-song player refs
  const containerRefs = useRef(songs.map(() => null))
  const playerRefs = useRef(songs.map(() => null))
  const pollRef = useRef(null)
  const progressRef = useRef(null)
  const durationRef = useRef(0)

  const [ready, setReady] = useState(songs.map(() => false))
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [dragValue, setDragValue] = useState(0)

  const song = songs[activeIndex]
  const videoId = extractVideoId(song.listenUrl)
  const thumb = videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : null
  const highlights = song.highlights || []

  // Show hint toast only after SmartToast is done (loading 4s + welcome 6s + thought 10s = 20s)
  const pageLoadTime = useRef(Date.now())
  useEffect(() => {
    if (inView && !hintShownRef.current) {
      hintShownRef.current = true
      const elapsed = Date.now() - pageLoadTime.current
      const delay = Math.max(0, 21000 - elapsed)
      const t1 = setTimeout(() => {
        setShowHint(true)
        setTimeout(() => setShowHint(false), 6500)
      }, delay)
      return () => clearTimeout(t1)
    }
  }, [inView])

  // Init all YT players
  useEffect(() => {
    let destroyed = false
    loadYTScript().then(() => {
      if (destroyed) return
      songs.forEach((s, i) => {
        const vid = extractVideoId(s.listenUrl)
        if (!vid || !containerRefs.current[i]) return
        playerRefs.current[i] = new window.YT.Player(containerRefs.current[i], {
          videoId: vid,
          playerVars: { controls: 0, disablekb: 1, modestbranding: 1, rel: 0, iv_load_policy: 3 },
          events: {
            onReady: () => {
              if (!destroyed) setReady(prev => { const n = [...prev]; n[i] = true; return n })
            },
            onStateChange: (e) => {
              if (destroyed) return
              if (e.data === window.YT.PlayerState.PLAYING) setPlaying(true)
              else setPlaying(false)
            },
          },
        })
      })
    })
    return () => {
      destroyed = true
      clearInterval(pollRef.current)
      playerRefs.current.forEach(p => { try { p?.destroy() } catch {} })
      playerRefs.current = songs.map(() => null)
    }
  }, [])

  // Poll time
  useEffect(() => {
    clearInterval(pollRef.current)
    if (playing && !dragging) {
      pollRef.current = setInterval(() => {
        const p = playerRefs.current[activeIndex]
        if (!p || typeof p.getCurrentTime !== 'function') return
        setCurrentTime(p.getCurrentTime())
        const d = p.getDuration()
        if (d > 0) { setDuration(d); durationRef.current = d }
      }, 500)
    }
    return () => clearInterval(pollRef.current)
  }, [playing, dragging, activeIndex])

  function switchSong(i) {
    if (i === activeIndex) return
    // Pause current
    playerRefs.current[activeIndex]?.pauseVideo()
    setPlaying(false)
    setCurrentTime(0)
    setDuration(0)
    durationRef.current = 0
    setActiveIndex(i)
  }

  function toggle() {
    const p = playerRefs.current[activeIndex]
    if (!p) return
    if (playing) p.pauseVideo()
    else p.playVideo()
  }

  function getTimeFromEvent(e) {
    const bar = progressRef.current
    if (!bar) return 0
    const p = playerRefs.current[activeIndex]
    const dur = (p && typeof p.getDuration === 'function' ? p.getDuration() : 0) || durationRef.current
    if (!dur) return 0
    const rect = bar.getBoundingClientRect()
    const touch = (e.touches && e.touches[0]) || (e.changedTouches && e.changedTouches[0])
    const clientX = touch ? touch.clientX : e.clientX
    return Math.max(0, Math.min(dur, ((clientX - rect.left) / rect.width) * dur))
  }

  function onBarPointerDown(e) {
    e.preventDefault()
    const t = getTimeFromEvent(e)
    setDragging(true); setDragValue(t); setCurrentTime(t)
  }
  const onBarPointerMove = useCallback((e) => {
    if (!dragging) return
    const t = getTimeFromEvent(e)
    setDragValue(t); setCurrentTime(t)
  }, [dragging])
  const onBarPointerUp = useCallback((e) => {
    if (!dragging) return
    const t = getTimeFromEvent(e)
    setDragging(false); setCurrentTime(t)
    playerRefs.current[activeIndex]?.seekTo(t, true)
  }, [dragging, activeIndex])

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
  const activeHighlight = duration > 0 ? highlights.find(h => displayTime >= h.start && displayTime <= h.end) : null
  const isReady = ready[activeIndex]

  return (
    <>
      <AnimatePresence>
        {showHint && <MusicHintToast onDone={() => setShowHint(false)} />}
      </AnimatePresence>
      <HeartShower active={!!activeHighlight && playing} />
      <FavGif show={!!activeHighlight && playing} />

      {/* Hidden YT player divs — portalled to body to avoid React DOM conflicts */}
      {createPortal(
        <div style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden', pointerEvents: 'none', opacity: 0 }}>
          {songs.map((_, i) => (
            <div key={i} ref={el => containerRefs.current[i] = el} />
          ))}
        </div>,
        document.body
      )}

      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 24 }}
        animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
        transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
      >
        {/* ── Hero card ── */}
        <div style={{ borderRadius: 20, overflow: 'hidden', background: 'var(--card-bg)', border: '1px solid var(--accent-border)', boxShadow: 'var(--glow), var(--shadow)' }}>
          <div style={{ position: 'relative', height: 180, overflow: 'hidden' }}>
            <AnimatePresence mode="wait">
              <motion.img
                key={activeIndex}
                src={thumb}
                initial={{ opacity: 0, scale: 1.15 }}
                animate={{ opacity: 1, scale: 1.08 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                onError={e => { e.target.src = '/avatar.jpg' }}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(2px) brightness(0.35)', display: 'block' }}
              />
            </AnimatePresence>
            {/* Waveform overlay */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, display: 'flex', justifyContent: 'center', padding: '0 20px' }}>
              <WaveformBars />
            </div>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', padding: '0 28px', gap: 20 }}>
              <div style={{ position: 'relative' }}>
                <AnimatePresence mode="wait">
                  <motion.img
                    key={activeIndex}
                    src={thumb}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    onError={e => { e.target.src = '/avatar.jpg' }}
                    style={{ width: 100, height: 100, borderRadius: 16, objectFit: 'cover', border: '2px solid rgba(255,255,255,0.2)', boxShadow: '0 8px 30px rgba(0,0,0,0.5)' }}
                  />
                </AnimatePresence>
                <div style={{ position: 'absolute', bottom: -5, right: -5, background: 'var(--card-bg)', borderRadius: 999, padding: '2px 6px', border: '1px solid var(--border)' }}>
                  <EqBars playing={playing} />
                </div>
              </div>
              <AnimatePresence mode="wait">
                <motion.div key={activeIndex} initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -12, opacity: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <motion.div animate={{ scale: [1, 1.3, 1], opacity: [1, 0.5, 1] }} transition={{ duration: 1, repeat: Infinity }} style={{ width: 8, height: 8, borderRadius: '50%', background: playing ? '#e53935' : 'var(--text)', opacity: playing ? 1 : 0.3 }} />
                    <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700 }}>Now Playing</span>
                  </div>
                  <h3 style={{ margin: '0 0 4px', fontSize: '1.15rem', fontWeight: 700, color: '#fff' }}>{song.title}</h3>
                  <p style={{ margin: '0 0 2px', fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>{song.artist}</p>
                  <p style={{ margin: 0, fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', fontStyle: 'italic' }}>{song.movie}</p>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Controls section */}
          <div style={{ padding: '14px 20px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* Highlight label */}
            <AnimatePresence>
              {activeHighlight && (
                <motion.div key={activeHighlight.label} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.72rem', color: 'var(--accent)', fontWeight: 600, marginBottom: -4 }}>
                  <motion.span animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut' }}>❤️</motion.span>
                  {activeHighlight.label}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Progress bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text)', opacity: 0.5, minWidth: 32, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{formatTime(displayTime)}</span>
              <div ref={progressRef} onMouseDown={onBarPointerDown} onTouchStart={onBarPointerDown}
                style={{ flex: 1, height: 6, borderRadius: 6, background: 'var(--border)', cursor: isReady ? 'pointer' : 'default', position: 'relative', touchAction: 'none' }}>
                {duration > 0 && highlights.map((h, i) => (
                  <div key={i} title={h.label} style={{ position: 'absolute', left: `${(h.start / duration) * 100}%`, width: `${((h.end - h.start) / duration) * 100}%`, height: '100%', borderRadius: 6, background: 'color-mix(in srgb, var(--accent) 55%, #ff6b6b)', boxShadow: '0 0 6px color-mix(in srgb, var(--accent) 60%, transparent)', opacity: 0.55, pointerEvents: 'none' }} />
                ))}
                <div style={{ height: '100%', borderRadius: 6, background: 'var(--accent)', width: `${progress * 100}%`, pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', top: '50%', left: `${progress * 100}%`, transform: 'translate(-50%, -50%)', width: 14, height: 14, borderRadius: '50%', background: activeHighlight ? 'color-mix(in srgb, var(--accent) 55%, #ff6b6b)' : 'var(--accent)', border: '2px solid var(--card-bg)', boxShadow: activeHighlight ? '0 0 0 3px color-mix(in srgb, var(--accent) 30%, transparent)' : '0 1px 6px rgba(0,0,0,0.3)', pointerEvents: 'none', transition: dragging ? 'none' : 'left 0.1s linear' }} />
              </div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text)', opacity: 0.5, minWidth: 32, fontVariantNumeric: 'tabular-nums' }}>{formatTime(duration)}</span>
            </div>

            {/* Buttons — jump to fav + play/pause */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
              {highlights.length > 0 && (
                <motion.button
                  onClick={() => { const h = highlights[0]; playerRefs.current[activeIndex]?.seekTo(h.start, true); playerRefs.current[activeIndex]?.playVideo(); setCurrentTime(h.start) }}
                  disabled={!isReady}
                  whileHover={isReady ? { scale: 1.06 } : {}} whileTap={isReady ? { scale: 0.93 } : {}}
                  animate={activeHighlight ? { scale: [1, 1.06, 1] } : { scale: 1 }}
                  transition={activeHighlight ? { duration: 1.2, repeat: Infinity, ease: 'easeInOut' } : {}}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 999, background: activeHighlight ? 'color-mix(in srgb, var(--accent) 55%, #ff6b6b)' : 'var(--accent-bg)', border: '1px solid', borderColor: activeHighlight ? 'color-mix(in srgb, var(--accent) 55%, #ff6b6b)' : 'var(--accent-border)', cursor: isReady ? 'pointer' : 'default', color: activeHighlight ? '#fff' : 'var(--accent)', fontSize: '0.75rem', fontWeight: 600, opacity: isReady ? 1 : 0.4, whiteSpace: 'nowrap' }}
                >
                  <motion.span animate={activeHighlight ? { scale: [1, 1.3, 1] } : {}} transition={{ duration: 0.8, repeat: Infinity }} style={{ display: 'inline-block' }}>
                    {activeHighlight ? '❤️' : '🎵'}
                  </motion.span>
                  {activeHighlight ? 'Replay fav ↺' : 'Jump to fav'}
                </motion.button>
              )}
              <motion.button
                onClick={toggle} disabled={!isReady}
                whileHover={isReady ? { scale: 1.08 } : {}} whileTap={isReady ? { scale: 0.93 } : {}}
                style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--accent)', border: 'none', cursor: isReady ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', opacity: isReady ? 1 : 0.5, boxShadow: '0 2px 16px color-mix(in srgb, var(--accent) 40%, transparent)' }}
              >
                {playing ? <PauseIcon /> : <PlayIcon />}
              </motion.button>
            </div>
          </div>
        </div>

        {/* ── Mini song rows ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
          {songs.map((s, i) => {
            const t = extractVideoId(s.listenUrl)
            const sThumb = t ? `https://i.ytimg.com/vi/${t}/hqdefault.jpg` : '/avatar.jpg'
            const isAct = activeIndex === i
            return (
              <motion.div
                key={i}
                onClick={() => switchSong(i)}
                whileHover={{ scale: 1.02, x: 4 }}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 14, background: isAct ? 'var(--accent-bg)' : 'var(--card-bg)', border: `1px solid ${isAct ? 'var(--accent-border)' : 'var(--border)'}`, cursor: 'pointer', transition: 'all 0.3s' }}
              >
                <img src={sThumb} alt={s.title} onError={e => { e.target.src = '/avatar.jpg' }} style={{ width: 40, height: 40, borderRadius: 10, objectFit: 'cover' }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h4 style={{ margin: 0, fontSize: '0.82rem', fontWeight: 600, color: isAct ? 'var(--accent)' : 'var(--text-h)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.title}</h4>
                  <p style={{ margin: '2px 0 0', fontSize: '0.7rem', color: 'var(--text)', opacity: 0.6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.artist}</p>
                </div>
                {isAct && playing && <EqBars playing={true} />}
                {(!isAct || !playing) && <div style={{ width: 28, height: 28, borderRadius: '50%', background: isAct ? 'var(--accent)' : 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isAct ? '#fff' : 'var(--text)', flexShrink: 0 }}><PlayIcon /></div>}
              </motion.div>
            )
          })}
        </div>

        {/* Playlist row */}
        <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 20px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
          <span style={{ fontSize: '0.88rem', color: 'var(--text-h)', fontWeight: 600 }}>🎶 {playlistLabel}</span>
          <motion.a href={playlistUrl} target="_blank" rel="noopener noreferrer" whileHover={{ x: 3 }} style={{ fontSize: '0.82rem', color: 'var(--accent)', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
            Open Playlist <ArrowIcon />
          </motion.a>
        </div>
      </motion.div>
    </>
  )
}
