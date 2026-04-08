import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import cfg from '../data/config.json'

const { songs } = cfg.music

function extractVideoId(url) {
  try { return new URL(url).searchParams.get('v') } catch { return null }
}

function getThumb(song) {
  const vid = extractVideoId(song.listenUrl)
  return vid ? `https://i.ytimg.com/vi/${vid}/hqdefault.jpg` : '/avatar.jpg'
}

/* ── Shared tiny components ── */
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

function PlayBtn({ size = 14 }) {
  return <svg width={size} height={size} viewBox="0 0 14 14" fill="none"><path d="M2 1.5l11 5.5-11 5.5V1.5z" fill="currentColor" /></svg>
}
function PauseBtn({ size = 14 }) {
  return <svg width={size} height={size} viewBox="0 0 14 14" fill="none"><rect x="2" y="2" width="4" height="10" rx="1" fill="currentColor"/><rect x="8" y="2" width="4" height="10" rx="1" fill="currentColor"/></svg>
}

function FakeProgress({ progress = 0.35, highlights = [], duration = 200 }) {
  return (
    <div style={{ flex: 1, height: 6, borderRadius: 6, background: 'var(--border)', position: 'relative' }}>
      {highlights.map((h, i) => (
        <div key={i} style={{ position: 'absolute', left: `${(h.start / duration) * 100}%`, width: `${((h.end - h.start) / duration) * 100}%`, height: '100%', borderRadius: 6, background: 'color-mix(in srgb, var(--accent) 55%, #ff6b6b)', opacity: 0.55, pointerEvents: 'none' }} />
      ))}
      <div style={{ height: '100%', borderRadius: 6, background: 'var(--accent)', width: `${progress * 100}%` }} />
      <div style={{ position: 'absolute', top: '50%', left: `${progress * 100}%`, transform: 'translate(-50%, -50%)', width: 14, height: 14, borderRadius: '50%', background: 'var(--accent)', border: '2px solid var(--card-bg)', boxShadow: '0 1px 6px rgba(0,0,0,0.3)' }} />
    </div>
  )
}

/* ═══════════════════════════════════════════════════
   DESIGN 1 — Vinyl Stack (expandable cards)
═══════════════════════════════════════════════════ */
function Design1() {
  const [active, setActive] = useState(0)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {songs.map((song, i) => {
        const thumb = getThumb(song)
        const isActive = active === i
        return (
          <motion.div
            key={i}
            layout
            onClick={() => setActive(i)}
            style={{ background: 'var(--card-bg)', border: `1px solid ${isActive ? 'var(--accent-border)' : 'var(--border)'}`, borderRadius: 20, overflow: 'hidden', boxShadow: isActive ? 'var(--glow), var(--shadow)' : 'var(--shadow)', cursor: 'pointer' }}
          >
            <div style={{ position: 'relative', height: isActive ? 150 : 72, overflow: 'hidden', transition: 'height 0.4s ease' }}>
              <img src={thumb} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(2px) brightness(0.4)', transform: 'scale(1.1)' }} />
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', padding: '0 20px', gap: 14 }}>
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  {/* Spinning vinyl disc */}
                  <motion.div
                    animate={isActive ? { rotate: 360 } : { rotate: 0 }}
                    transition={{ duration: 3, repeat: isActive ? Infinity : 0, ease: 'linear' }}
                    style={{ width: isActive ? 80 : 44, height: isActive ? 80 : 44, borderRadius: '50%', background: `radial-gradient(circle at 50% 50%, transparent 18%, #111 19%, #111 36%, #333 37%, #111 38%, #111 55%, #333 56%, #111 57%, #111 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid rgba(255,255,255,0.15)', transition: 'width 0.3s, height 0.3s' }}
                  >
                    <img src={thumb} alt="" style={{ width: isActive ? 32 : 20, height: isActive ? 32 : 20, borderRadius: '50%', objectFit: 'cover', transition: 'width 0.3s, height 0.3s' }} />
                  </motion.div>
                  {isActive && <div style={{ position: 'absolute', bottom: -4, right: -4, background: 'var(--card-bg)', borderRadius: 999, padding: '2px 6px', border: '1px solid var(--border)' }}><EqBars playing={true} /></div>}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  {isActive && <p style={{ margin: '0 0 4px', fontSize: '0.6rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Now Playing</p>}
                  <h3 style={{ margin: 0, fontSize: isActive ? '1rem' : '0.85rem', fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{song.title}</h3>
                  <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'rgba(255,255,255,0.65)' }}>{song.artist}</p>
                  {isActive && <p style={{ margin: '2px 0 0', fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', fontStyle: 'italic' }}>{song.movie}</p>}
                </div>
                {!isActive && <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0 }}><PlayBtn size={12} /></div>}
              </div>
            </div>
            {/* Expanded controls */}
            <AnimatePresence>
              {isActive && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>
                  <div style={{ padding: '12px 20px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text)', opacity: 0.5, minWidth: 30 }}>1:10</span>
                      <FakeProgress progress={0.35} highlights={song.highlights} />
                      <span style={{ fontSize: '0.7rem', color: 'var(--text)', opacity: 0.5, minWidth: 30 }}>3:12</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                      {song.highlights?.length > 0 && (
                        <motion.div whileHover={{ scale: 1.05 }} style={{ padding: '7px 13px', borderRadius: 999, background: 'var(--accent-bg)', border: '1px solid var(--accent-border)', color: 'var(--accent)', fontSize: '0.73rem', fontWeight: 600, cursor: 'pointer' }}>🎵 Jump to fav</motion.div>
                      )}
                      <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer', boxShadow: '0 2px 16px color-mix(in srgb, var(--accent) 40%, transparent)' }}><PauseBtn /></div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )
      })}
    </div>
  )
}

/* ═══════════════════════════════════════════════════
   DESIGN 2 — Horizontal Album Grid (3D flip)
═══════════════════════════════════════════════════ */
function Design2() {
  const [active, setActive] = useState(null)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Album grid */}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', perspective: 800 }}>
        {songs.map((song, i) => {
          const thumb = getThumb(song)
          const isActive = active === i
          return (
            <motion.div
              key={i}
              onClick={() => setActive(isActive ? null : i)}
              animate={{ rotateY: isActive ? 180 : 0 }}
              transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
              style={{ width: 180, height: 220, borderRadius: 16, cursor: 'pointer', position: 'relative', transformStyle: 'preserve-3d' }}
            >
              {/* Front */}
              <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', borderRadius: 16, overflow: 'hidden', border: isActive ? '2px solid var(--accent)' : '1px solid var(--border)' }}>
                <img src={thumb} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 50%)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: 14 }}>
                  <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: '#fff' }}>{song.title}</h4>
                  <p style={{ margin: '2px 0 0', fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)' }}>{song.artist}</p>
                </div>
                {/* Hover play icon */}
                <motion.div
                  initial={{ opacity: 0 }} whileHover={{ opacity: 1 }}
                  style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}><PlayBtn /></div>
                </motion.div>
              </div>
              {/* Back — player */}
              <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', borderRadius: 16, overflow: 'hidden', background: 'var(--card-bg)', border: '2px solid var(--accent)', padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <img src={thumb} alt="" style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover' }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h4 style={{ margin: 0, fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-h)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{song.title}</h4>
                    <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text)' }}>{song.movie}</p>
                  </div>
                </div>
                <EqBars playing={true} />
                <FakeProgress progress={0.4} highlights={song.highlights} />
                <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginTop: 'auto' }}>
                  {song.highlights?.length > 0 && <div style={{ padding: '5px 10px', borderRadius: 999, background: 'var(--accent-bg)', color: 'var(--accent)', fontSize: '0.68rem', fontWeight: 600 }}>🎵 Fav</div>}
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}><PauseBtn size={12} /></div>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════
   DESIGN 3 — Glassmorphism Carousel
═══════════════════════════════════════════════════ */
function Design3() {
  const [active, setActive] = useState(0)
  const song = songs[active]
  const thumb = getThumb(song)
  return (
    <div style={{ position: 'relative', borderRadius: 24, overflow: 'hidden', minHeight: 300 }}>
      {/* Blurred background */}
      <AnimatePresence mode="wait">
        <motion.img
          key={active}
          src={thumb}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1.05 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          style={{ position: 'absolute', inset: -20, width: 'calc(100% + 40px)', height: 'calc(100% + 40px)', objectFit: 'cover', filter: 'blur(30px) brightness(0.3)' }}
        />
      </AnimatePresence>
      {/* Glass card */}
      <div style={{ position: 'relative', padding: 28, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
        {/* Album art */}
        <AnimatePresence mode="wait">
          <motion.img
            key={active}
            src={thumb}
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -20 }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            style={{ width: 120, height: 120, borderRadius: 18, objectFit: 'cover', boxShadow: '0 12px 40px rgba(0,0,0,0.5)', border: '2px solid rgba(255,255,255,0.15)' }}
          />
        </AnimatePresence>
        {/* Info */}
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ margin: '0 0 4px', fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>{song.title}</h3>
          <p style={{ margin: '0 0 2px', fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>{song.artist}</p>
          <p style={{ margin: 0, fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', fontStyle: 'italic' }}>{song.movie}</p>
        </div>
        {/* Progress */}
        <div style={{ width: '100%', maxWidth: 340, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)' }}>1:20</span>
          <FakeProgress progress={0.38} highlights={song.highlights} />
          <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)' }}>3:24</span>
        </div>
        {/* Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {song.highlights?.length > 0 && (
            <div style={{ padding: '8px 14px', borderRadius: 999, background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', fontSize: '0.73rem', fontWeight: 600, cursor: 'pointer' }}>🎵 Jump to fav</div>
          )}
          <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer', boxShadow: '0 4px 24px color-mix(in srgb, var(--accent) 50%, transparent)' }}><PauseBtn /></div>
        </div>
        {/* Song pills */}
        <div style={{ display: 'flex', gap: 8 }}>
          {songs.map((s, i) => {
            const t = getThumb(s)
            return (
              <motion.div
                key={i}
                onClick={() => setActive(i)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '6px 12px 6px 6px', borderRadius: 999,
                  background: i === active ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${i === active ? 'var(--accent)' : 'rgba(255,255,255,0.1)'}`,
                  cursor: 'pointer',
                }}
              >
                <img src={t} alt="" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} />
                <span style={{ fontSize: '0.72rem', color: '#fff', fontWeight: i === active ? 600 : 400, whiteSpace: 'nowrap' }}>{s.title}</span>
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════
   DESIGN 4 — Stacked Deck (peek cards)
═══════════════════════════════════════════════════ */
function Design4() {
  const [active, setActive] = useState(0)
  return (
    <div style={{ position: 'relative', height: 340, perspective: 800 }}>
      {songs.map((song, i) => {
        const thumb = getThumb(song)
        const isActive = active === i
        const offset = (i - active)
        return (
          <motion.div
            key={i}
            onClick={() => setActive(i)}
            animate={{
              y: offset * 12,
              scale: 1 - Math.abs(offset) * 0.06,
              zIndex: isActive ? 10 : 5 - Math.abs(offset),
              opacity: Math.abs(offset) > 2 ? 0 : 1,
              rotateX: offset * -2,
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            style={{ position: 'absolute', inset: 0, borderRadius: 20, overflow: 'hidden', background: 'var(--card-bg)', border: `1px solid ${isActive ? 'var(--accent-border)' : 'var(--border)'}`, boxShadow: isActive ? '0 20px 60px rgba(0,0,0,0.3)' : '0 4px 16px rgba(0,0,0,0.15)', cursor: 'pointer' }}
          >
            {/* Hero */}
            <div style={{ position: 'relative', height: 150, overflow: 'hidden' }}>
              <img src={thumb} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(1px) brightness(0.45)', transform: 'scale(1.08)' }} />
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', padding: '0 24px', gap: 18 }}>
                <div style={{ position: 'relative' }}>
                  <img src={thumb} alt="" style={{ width: 80, height: 80, borderRadius: 14, objectFit: 'cover', border: '2px solid rgba(255,255,255,0.2)', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }} />
                  {isActive && <div style={{ position: 'absolute', bottom: -5, right: -5, background: 'var(--card-bg)', borderRadius: 999, padding: '2px 6px', border: '1px solid var(--border)' }}><EqBars playing={true} /></div>}
                </div>
                <div style={{ flex: 1 }}>
                  {isActive && <p style={{ margin: '0 0 4px', fontSize: '0.6rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Now Playing</p>}
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#fff' }}>{song.title}</h3>
                  <p style={{ margin: '3px 0', fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>{song.artist}</p>
                  <p style={{ margin: 0, fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', fontStyle: 'italic' }}>{song.movie}</p>
                </div>
              </div>
            </div>
            {/* Controls */}
            {isActive && (
              <div style={{ padding: '14px 20px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text)', opacity: 0.5 }}>1:10</span>
                  <FakeProgress progress={0.35} highlights={song.highlights} />
                  <span style={{ fontSize: '0.7rem', color: 'var(--text)', opacity: 0.5 }}>3:12</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                  {song.highlights?.length > 0 && <div style={{ padding: '7px 13px', borderRadius: 999, background: 'var(--accent-bg)', border: '1px solid var(--accent-border)', color: 'var(--accent)', fontSize: '0.73rem', fontWeight: 600, cursor: 'pointer' }}>🎵 Jump to fav</div>}
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: '0 2px 16px color-mix(in srgb, var(--accent) 40%, transparent)' }}><PauseBtn /></div>
                </div>
              </div>
            )}
          </motion.div>
        )
      })}
    </div>
  )
}

/* ═══════════════════════════════════════════════════
   DESIGN 5 — Thumbnail Row + Expand
═══════════════════════════════════════════════════ */
function Design5() {
  const [active, setActive] = useState(null)
  const song = active !== null ? songs[active] : null
  const thumb = song ? getThumb(song) : null
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Expanded player */}
      <AnimatePresence>
        {song && (
          <motion.div
            key={active}
            initial={{ opacity: 0, height: 0, y: -20 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -20 }}
            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
            style={{ borderRadius: 20, overflow: 'hidden', background: 'var(--card-bg)', border: '1px solid var(--accent-border)', boxShadow: 'var(--glow), var(--shadow)' }}
          >
            <div style={{ position: 'relative', height: 150, overflow: 'hidden' }}>
              <img src={thumb} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(3px) brightness(0.4)', transform: 'scale(1.1)' }} />
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', padding: '0 24px', gap: 18 }}>
                <div style={{ position: 'relative' }}>
                  <img src={thumb} alt="" style={{ width: 88, height: 88, borderRadius: 14, objectFit: 'cover', border: '2px solid rgba(255,255,255,0.25)', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }} />
                  <div style={{ position: 'absolute', bottom: -5, right: -5, background: 'var(--card-bg)', borderRadius: 999, padding: '2px 6px', border: '1px solid var(--border)' }}><EqBars playing={true} /></div>
                </div>
                <div>
                  <p style={{ margin: '0 0 4px', fontSize: '0.6rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Now Playing</p>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#fff' }}>{song.title}</h3>
                  <p style={{ margin: '3px 0', fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>{song.artist}</p>
                  <p style={{ margin: 0, fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', fontStyle: 'italic' }}>{song.movie}</p>
                </div>
              </div>
            </div>
            <div style={{ padding: '14px 20px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text)', opacity: 0.5 }}>1:10</span>
                <FakeProgress progress={0.35} highlights={song.highlights} />
                <span style={{ fontSize: '0.7rem', color: 'var(--text)', opacity: 0.5 }}>3:12</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                {song.highlights?.length > 0 && <div style={{ padding: '7px 13px', borderRadius: 999, background: 'var(--accent-bg)', border: '1px solid var(--accent-border)', color: 'var(--accent)', fontSize: '0.73rem', fontWeight: 600, cursor: 'pointer' }}>🎵 Jump to fav</div>}
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: '0 2px 16px color-mix(in srgb, var(--accent) 40%, transparent)' }}><PauseBtn /></div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Thumbnail row */}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
        {songs.map((s, i) => {
          const t = getThumb(s)
          const isActive = active === i
          return (
            <motion.div
              key={i}
              onClick={() => setActive(isActive ? null : i)}
              whileHover={{ scale: 1.08, y: -4 }}
              whileTap={{ scale: 0.95 }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: 'pointer' }}
            >
              <div style={{ width: 56, height: 56, borderRadius: '50%', overflow: 'hidden', border: `2px solid ${isActive ? 'var(--accent)' : 'var(--border)'}`, boxShadow: isActive ? '0 0 12px var(--accent)' : 'none', transition: 'all 0.3s' }}>
                <img src={t} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <span style={{ fontSize: '0.68rem', color: isActive ? 'var(--accent)' : 'var(--text)', fontWeight: isActive ? 600 : 400, textAlign: 'center', maxWidth: 72, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.title}</span>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════
   DESIGN 6 — Waveform Hero
═══════════════════════════════════════════════════ */
function WaveformBars() {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 60, opacity: 0.25 }}>
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

function Design6() {
  const [active, setActive] = useState(0)
  const song = songs[active]
  const thumb = getThumb(song)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Hero card */}
      <div style={{ position: 'relative', borderRadius: 20, overflow: 'hidden', background: 'var(--card-bg)', border: '1px solid var(--accent-border)', boxShadow: 'var(--glow), var(--shadow)' }}>
        <div style={{ position: 'relative', height: 180, overflow: 'hidden' }}>
          <img src={thumb} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(2px) brightness(0.35)', transform: 'scale(1.1)' }} />
          {/* Waveform overlay */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, display: 'flex', justifyContent: 'center', padding: '0 20px' }}><WaveformBars /></div>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', padding: '0 28px', gap: 20 }}>
            <div style={{ position: 'relative' }}>
              <motion.img
                key={active}
                src={thumb}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.4 }}
                style={{ width: 100, height: 100, borderRadius: 16, objectFit: 'cover', border: '2px solid rgba(255,255,255,0.2)', boxShadow: '0 8px 30px rgba(0,0,0,0.5)' }}
              />
              <div style={{ position: 'absolute', bottom: -5, right: -5, background: 'var(--card-bg)', borderRadius: 999, padding: '2px 6px', border: '1px solid var(--border)' }}><EqBars playing={true} /></div>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <motion.div animate={{ scale: [1, 1.3, 1], opacity: [1, 0.5, 1] }} transition={{ duration: 1, repeat: Infinity }} style={{ width: 8, height: 8, borderRadius: '50%', background: '#e53935' }} />
                <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700 }}>Now Playing</span>
              </div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#fff' }}>{song.title}</h3>
              <p style={{ margin: '4px 0 2px', fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>{song.artist}</p>
              <p style={{ margin: 0, fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', fontStyle: 'italic' }}>{song.movie}</p>
            </div>
          </div>
        </div>
        <div style={{ padding: '14px 20px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text)', opacity: 0.5 }}>1:10</span>
            <FakeProgress progress={0.35} highlights={song.highlights} />
            <span style={{ fontSize: '0.7rem', color: 'var(--text)', opacity: 0.5 }}>3:12</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            {song.highlights?.length > 0 && <div style={{ padding: '7px 13px', borderRadius: 999, background: 'var(--accent-bg)', border: '1px solid var(--accent-border)', color: 'var(--accent)', fontSize: '0.73rem', fontWeight: 600, cursor: 'pointer' }}>🎵 Jump to fav</div>}
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: '0 2px 16px color-mix(in srgb, var(--accent) 40%, transparent)' }}><PauseBtn /></div>
          </div>
        </div>
      </div>
      {/* Mini song rows */}
      {songs.map((s, i) => {
        const t = getThumb(s)
        const isActive = active === i
        return (
          <motion.div
            key={i}
            onClick={() => setActive(i)}
            whileHover={{ scale: 1.02, x: 4 }}
            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 14, background: isActive ? 'var(--accent-bg)' : 'var(--card-bg)', border: `1px solid ${isActive ? 'var(--accent-border)' : 'var(--border)'}`, cursor: 'pointer', transition: 'all 0.3s' }}
          >
            <img src={t} alt="" style={{ width: 40, height: 40, borderRadius: 10, objectFit: 'cover' }} />
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: 0, fontSize: '0.82rem', fontWeight: 600, color: isActive ? 'var(--accent)' : 'var(--text-h)' }}>{s.title}</h4>
              <p style={{ margin: '2px 0 0', fontSize: '0.7rem', color: 'var(--text)', opacity: 0.6 }}>{s.artist}</p>
            </div>
            {isActive && <EqBars playing={true} />}
            {!isActive && <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text)' }}><PlayBtn size={10} /></div>}
          </motion.div>
        )
      })}
    </div>
  )
}

/* ═══════════════════════════════════════════════════
   DESIGN LIST + PICKER PAGE
═══════════════════════════════════════════════════ */
const DESIGNS = [
  { id: 1, name: 'Vinyl Stack', emoji: '💿', desc: 'Expandable stacked cards with spinning vinyl disc animation', Component: Design1 },
  { id: 2, name: 'Album Grid', emoji: '🎴', desc: 'Horizontal album covers with 3D card flip to reveal player', Component: Design2 },
  { id: 3, name: 'Glass Carousel', emoji: '✨', desc: 'Frosted glass card with crossfading blurred background, song pills', Component: Design3 },
  { id: 4, name: 'Card Deck', emoji: '🃏', desc: 'Stacked deck with peek offset, shuffle to switch songs', Component: Design4 },
  { id: 5, name: 'Thumb + Expand', emoji: '🎧', desc: 'Circular thumbnails row, click to expand cinematic player above', Component: Design5 },
  { id: 6, name: 'Waveform Hero', emoji: '🎵', desc: 'Full hero with animated waveform bars, mini song list below', Component: Design6 },
]

export default function NowPlayingDesignPicker() {
  const [selected, setSelected] = useState(null)
  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', padding: 'clamp(100px, 14vw, 140px) clamp(20px, 5vw, 60px) 60px' }}>
      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        <h1 style={{ fontFamily: 'var(--heading)', fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', color: 'var(--text-h)', textAlign: 'center', marginBottom: 8 }}>
          Now Playing Designs
        </h1>
        <p style={{ textAlign: 'center', color: 'var(--text)', fontSize: '0.9rem', marginBottom: 40, opacity: 0.6 }}>
          Click on song cards to interact. Pick the design you like.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 60 }}>
          {DESIGNS.map(({ id, name, emoji, desc, Component }) => (
            <div key={id}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-h)', fontWeight: 700 }}>
                    {emoji} Design {id} — {name}
                  </h2>
                  <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: 'var(--text)', opacity: 0.55 }}>{desc}</p>
                </div>
                <motion.button
                  onClick={() => setSelected(id)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  style={{
                    padding: '8px 18px', borderRadius: 10,
                    background: selected === id ? 'var(--accent)' : 'var(--accent-bg)',
                    color: selected === id ? '#fff' : 'var(--accent)',
                    border: `1px solid ${selected === id ? 'var(--accent)' : 'var(--accent-border)'}`,
                    fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  {selected === id ? 'Selected' : 'Select'}
                </motion.button>
              </div>
              {/* Preview */}
              <div style={{ background: 'var(--bg-secondary)', borderRadius: 20, padding: 20, border: `2px solid ${selected === id ? 'var(--accent)' : 'var(--border)'}`, transition: 'border-color 0.3s' }}>
                <Component />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
