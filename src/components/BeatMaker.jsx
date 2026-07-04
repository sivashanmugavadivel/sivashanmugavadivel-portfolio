import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import InteractiveHint from './InteractiveHint'
import { useHint } from '../hooks/useOnboarding'

/*
 * BeatMaker — a Web Audio step sequencer with 5 instrument categories
 * (Drums / Bass / Synth / Strings / Impact), 3 sounds each × 16 steps, BPM,
 * volume, loop count, a Demo pattern and WAV download (rendered offline).
 * All sounds are synthesised — no audio files. Inspired by the Framer "Beat
 * Maker" component. Default export is a launcher that opens it fullscreen
 * (landscape on mobile).
 */
const STEPS = 16

// ── Synth helpers ──
const noiseCache = new WeakMap()
function noise(ctx) {
  let b = noiseCache.get(ctx)
  if (!b) {
    b = ctx.createBuffer(1, ctx.sampleRate * 0.4, ctx.sampleRate)
    const d = b.getChannelData(0)
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
    noiseCache.set(ctx, b)
  }
  return b
}
function tone(ctx, t, dest, { freq, type = 'sine', dur = 0.25, attack = 0.005, peak = 0.5, glideTo }) {
  const o = ctx.createOscillator(), g = ctx.createGain()
  o.type = type
  o.frequency.setValueAtTime(freq, t)
  if (glideTo) o.frequency.exponentialRampToValueAtTime(glideTo, t + dur)
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(peak, t + attack)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  o.connect(g).connect(dest)
  o.start(t); o.stop(t + dur + 0.02)
}
function noiseHit(ctx, t, dest, { hp = 0, lp = 20000, dur = 0.15, peak = 0.5 }) {
  const n = ctx.createBufferSource(); n.buffer = noise(ctx)
  let node = n
  if (hp) { const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = hp; node.connect(f); node = f }
  if (lp < 20000) { const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = lp; node.connect(f); node = f }
  const g = ctx.createGain(); g.gain.setValueAtTime(peak, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  node.connect(g).connect(dest)
  n.start(t); n.stop(t + dur + 0.02)
}

const kick = (c, t, d) => { tone(c, t, d, { freq: 150, glideTo: 50, type: 'sine', dur: 0.15, peak: 1 }) }
const snare = (c, t, d) => { noiseHit(c, t, d, { hp: 1200, dur: 0.15, peak: 0.7 }); tone(c, t, d, { freq: 180, type: 'triangle', dur: 0.1, peak: 0.5 }) }
const hat = (c, t, d) => noiseHit(c, t, d, { hp: 7000, dur: 0.05, peak: 0.35 })

// Each category: color + 3 rows { label, play(ctx, time, dest) }
const KITS = {
  drums: {
    name: 'Drums', color: '#FF6B9D',
    rows: [
      { label: 'Hi-Hat', play: hat },
      { label: 'Snare', play: snare },
      { label: 'Kick', play: kick },
    ],
  },
  bass: {
    name: 'Bass', color: '#4ECDC4',
    rows: [
      { label: 'High', play: (c, t, d) => tone(c, t, d, { freq: 110, type: 'sawtooth', dur: 0.26, peak: 0.55 }) },
      { label: 'Mid', play: (c, t, d) => tone(c, t, d, { freq: 82, type: 'sawtooth', dur: 0.28, peak: 0.6 }) },
      { label: 'Sub', play: (c, t, d) => tone(c, t, d, { freq: 55, type: 'sine', dur: 0.3, peak: 0.8 }) },
    ],
  },
  synth: {
    name: 'Synth', color: '#45B7D1',
    rows: [
      { label: 'Lead', play: (c, t, d) => tone(c, t, d, { freq: 659, type: 'square', dur: 0.18, peak: 0.3 }) },
      { label: 'Stab', play: (c, t, d) => tone(c, t, d, { freq: 523, type: 'sawtooth', dur: 0.16, peak: 0.32 }) },
      { label: 'Pluck', play: (c, t, d) => tone(c, t, d, { freq: 392, type: 'triangle', dur: 0.2, peak: 0.35 }) },
    ],
  },
  strings: {
    name: 'Strings', color: '#96CEB4',
    rows: [
      { label: 'High', play: (c, t, d) => tone(c, t, d, { freq: 330, type: 'triangle', dur: 0.6, attack: 0.09, peak: 0.28 }) },
      { label: 'Mid', play: (c, t, d) => tone(c, t, d, { freq: 262, type: 'triangle', dur: 0.6, attack: 0.09, peak: 0.3 }) },
      { label: 'Low', play: (c, t, d) => tone(c, t, d, { freq: 196, type: 'sine', dur: 0.7, attack: 0.1, peak: 0.32 }) },
    ],
  },
  impact: {
    name: 'Impact', color: '#FFEAA7',
    rows: [
      { label: 'Riser', play: (c, t, d) => tone(c, t, d, { freq: 200, glideTo: 900, type: 'sawtooth', dur: 0.4, peak: 0.28 }) },
      { label: 'Hit', play: (c, t, d) => noiseHit(c, t, d, { dur: 0.22, peak: 0.6 }) },
      { label: 'Boom', play: (c, t, d) => tone(c, t, d, { freq: 90, glideTo: 30, type: 'sine', dur: 0.5, peak: 0.9 }) },
    ],
  },
}
const CATS = Object.keys(KITS)

const emptyGrid = () => KITS_rows_map(() => Array(STEPS).fill(false))
function KITS_rows_map(fn) {
  const o = {}
  for (const cat of CATS) o[cat] = KITS[cat].rows.map(fn)
  return o
}
function demoGrid() {
  const g = emptyGrid()
  // drums rows are [hihat, snare, kick]
  g.drums[2] = [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0].map(Boolean) // kick
  g.drums[1] = [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0].map(Boolean) // snare
  g.drums[0] = [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0].map(Boolean) // hihat
  g.bass[2] = [1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0].map(Boolean)  // sub
  g.synth[2] = [0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0].map(Boolean) // pluck
  return g
}

// ── WAV encoder for OfflineAudioContext render ──
function encodeWAV(buffer) {
  const numCh = buffer.numberOfChannels, sr = buffer.sampleRate
  const total = buffer.length * numCh * 2 + 44
  const ab = new ArrayBuffer(total), view = new DataView(ab)
  const str = (o, s) => { for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i)) }
  str(0, 'RIFF'); view.setUint32(4, total - 8, true); str(8, 'WAVE'); str(12, 'fmt ')
  view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, numCh, true)
  view.setUint32(24, sr, true); view.setUint32(28, sr * numCh * 2, true); view.setUint16(32, numCh * 2, true)
  view.setUint16(34, 16, true); str(36, 'data'); view.setUint32(40, total - 44, true)
  let o = 44
  const chans = []
  for (let c = 0; c < numCh; c++) chans.push(buffer.getChannelData(c))
  for (let i = 0; i < buffer.length; i++) {
    for (let c = 0; c < numCh; c++) {
      const s = Math.max(-1, Math.min(1, chans[c][i]))
      view.setInt16(o, s < 0 ? s * 0x8000 : s * 0x7fff, true); o += 2
    }
  }
  return ab
}

const toInt16 = (f) => {
  const o = new Int16Array(f.length)
  for (let i = 0; i < f.length; i++) { const s = Math.max(-1, Math.min(1, f[i])); o[i] = s < 0 ? s * 0x8000 : s * 0x7fff }
  return o
}
function encodeMP3(buffer, sampleRate, kbps, Mp3Encoder) {
  const ch = Math.min(2, buffer.numberOfChannels)
  const enc = new Mp3Encoder(ch, sampleRate, kbps)
  const L = toInt16(buffer.getChannelData(0))
  const R = ch > 1 ? toInt16(buffer.getChannelData(1)) : L
  const block = 1152, out = []
  for (let i = 0; i < L.length; i += block) {
    const l = L.subarray(i, i + block), r = R.subarray(i, i + block)
    const chunk = ch > 1 ? enc.encodeBuffer(l, r) : enc.encodeBuffer(l)
    if (chunk.length) out.push(new Uint8Array(chunk))
  }
  const end = enc.flush()
  if (end.length) out.push(new Uint8Array(end))
  return new Blob(out, { type: 'audio/mpeg' })
}
const WAV_RATES = [22050, 32000, 44100, 48000, 96000]
const MP3_RATES = [22050, 32000, 44100, 48000]         // MP3 tops out at 48 kHz
const khzLabel = (r) => `${(r / 1000).toFixed(r % 1000 ? 2 : 0)} kHz`

function Sequencer() {
  const [grid, setGrid] = useState(demoGrid)
  const [cat, setCat] = useState('drums')
  const [playing, setPlaying] = useState(false)
  const [bpm, setBpm] = useState(120)
  const [vol, setVol] = useState(0.8)
  const [loops, setLoops] = useState(2)
  const [curStep, setCurStep] = useState(-1)
  const [rendering, setRendering] = useState(false)
  const [fmt, setFmt] = useState('wav')      // wav | mp3
  const [rate, setRate] = useState(44100)    // sample rate
  const [kbps, setKbps] = useState(192)      // mp3 bitrate
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef(null)

  const ctxRef = useRef(null), masterRef = useRef(null), analyserRef = useRef(null)
  const canvasRef = useRef(null)
  const sched = useRef({ step: 0, nextTime: 0, timer: null })
  const gridRef = useRef(grid); useEffect(() => { gridRef.current = grid }, [grid])
  const bpmRef = useRef(bpm); useEffect(() => { bpmRef.current = bpm }, [bpm])

  const ensureCtx = () => {
    if (!ctxRef.current) {
      const AC = window.AudioContext || window.webkitAudioContext
      const ctx = new AC()
      const m = ctx.createGain(); m.gain.value = vol; m.connect(ctx.destination)
      const an = ctx.createAnalyser(); an.fftSize = 128; an.smoothingTimeConstant = 0.8
      m.connect(an)
      ctxRef.current = ctx; masterRef.current = m; analyserRef.current = an
    }
    return ctxRef.current
  }
  useEffect(() => { if (masterRef.current) masterRef.current.gain.value = vol }, [vol])

  const stop = useCallback(() => {
    clearInterval(sched.current.timer); sched.current.timer = null
    setPlaying(false); setCurStep(-1)
  }, [])

  const start = useCallback(() => {
    const ctx = ensureCtx(); ctx.resume?.()
    const s = sched.current
    s.step = 0; s.nextTime = ctx.currentTime + 0.06
    s.timer = setInterval(() => {
      const c = ctxRef.current
      while (s.nextTime < c.currentTime + 0.12) {
        const step = s.step, g = gridRef.current
        for (const ct of CATS) KITS[ct].rows.forEach((r, ri) => { if (g[ct][ri][step]) r.play(c, s.nextTime, masterRef.current) })
        setTimeout(() => setCurStep(step), Math.max(0, (s.nextTime - c.currentTime) * 1000))
        s.nextTime += 60 / bpmRef.current / 4
        s.step = (s.step + 1) % STEPS
      }
    }, 25)
    setPlaying(true)
  }, [])

  useEffect(() => () => { clearInterval(sched.current.timer); ctxRef.current?.close?.() }, [])

  // Music-reactive visualiser backdrop (fills the space, pulses with the beat).
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const g = canvas.getContext('2d')
    let raf
    const draw = () => {
      const w = canvas.clientWidth, h = canvas.clientHeight
      if (canvas.width !== w) canvas.width = w
      if (canvas.height !== h) canvas.height = h
      g.clearRect(0, 0, w, h)
      const an = analyserRef.current
      let data = null
      if (an) { data = new Uint8Array(an.frequencyBinCount); an.getByteFrequencyData(data) }
      const bars = 56, bw = w / bars, mid = h / 2, col = KITS[cat].color
      const now = performance.now() / 600
      for (let i = 0; i < bars; i++) {
        const v = data
          ? data[Math.floor((i / bars) * data.length)] / 255
          : 0.04 + 0.03 * (Math.sin(now + i * 0.4) * 0.5 + 0.5) // idle shimmer
        const bh = Math.max(3, v * h * 0.72)
        g.fillStyle = col + '2e'
        g.fillRect(i * bw + bw * 0.25, mid - bh / 2, bw * 0.5, bh)
      }
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [cat])

  const toggle = (ri, i) => setGrid(g => {
    const rows = g[cat].map(r => r.slice()); rows[ri][i] = !rows[ri][i]
    return { ...g, [cat]: rows }
  })

  const download = async () => {
    setRendering(true)
    try {
      const sr = fmt === 'mp3' ? Math.min(rate, 48000) : rate
      const secPerStep = 60 / bpm / 4
      const dur = STEPS * loops * secPerStep + 0.6
      const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext
      const off = new OAC(2, Math.ceil(dur * sr), sr)
      const m = off.createGain(); m.gain.value = vol; m.connect(off.destination)
      for (let L = 0; L < loops; L++) for (let step = 0; step < STEPS; step++) {
        const t = (L * STEPS + step) * secPerStep
        for (const ct of CATS) KITS[ct].rows.forEach((r, ri) => { if (grid[ct][ri][step]) r.play(off, t, m) })
      }
      const rendered = await off.startRendering()
      let blob, name
      if (fmt === 'mp3') {
        const { Mp3Encoder } = await import('@breezystack/lamejs')
        blob = encodeMP3(rendered, sr, kbps, Mp3Encoder); name = 'beat.mp3'
      } else {
        blob = new Blob([encodeWAV(rendered)], { type: 'audio/wav' }); name = 'beat.wav'
      }
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob); a.download = name; a.click()
      URL.revokeObjectURL(a.href)
    } catch { /* rendering unsupported */ }
    setRendering(false)
  }

  const rates = fmt === 'mp3' ? MP3_RATES : WAV_RATES
  const changeFmt = (f) => { setFmt(f); if (f === 'mp3' && rate > 48000) setRate(48000) }

  // Close the download popup on an outside click.
  useEffect(() => {
    if (!showMenu) return
    const onDown = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false) }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [showMenu])

  const color = KITS[cat].color
  const btn = { padding: '9px 16px', borderRadius: 8, cursor: 'pointer', border: '1px solid rgba(255,255,255,0.18)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: 13, fontWeight: 600 }
  const mini = { ...btn, padding: '6px 12px', minWidth: 34 }
  const sel = { padding: '7px 8px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.18)', background: '#1b1b21', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: 1180, height: '100%', margin: '0 auto' }}>
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: 'clamp(10px, 2.4vh, 20px)', height: '100%' }}>
      {/* Top: category tabs + BPM */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {CATS.map(id => (
            <button key={id} onClick={() => setCat(id)} style={{
              width: 82, height: 42, borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600,
              border: cat === id ? 'none' : '1px solid rgba(255,255,255,0.25)',
              background: cat === id ? KITS[id].color : 'transparent',
              color: cat === id ? '#292929' : '#fff', transition: 'all 0.2s',
            }}>{KITS[id].name}</button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#fff' }}>
          <button style={mini} onClick={() => setBpm(b => Math.max(60, b - 5))}>−</button>
          <span style={{ ...mini, textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>{bpm}</span>
          <button style={mini} onClick={() => setBpm(b => Math.min(200, b + 5))}>+</button>
          <span style={{ fontSize: 12, opacity: 0.6, fontWeight: 700, marginLeft: 4 }}>BPM</span>
        </div>
      </div>

      {/* Grid */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', overflowX: 'auto' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(6px, 1.4vh, 12px)', margin: '0 auto', width: 'fit-content' }}>
          {KITS[cat].rows.map((r, ri) => (
            <div key={ri} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ width: 58, flexShrink: 0, textAlign: 'right', fontSize: 12, fontWeight: 700, color: '#fff', opacity: 0.8 }}>{r.label}</span>
              <div style={{ display: 'flex', gap: 'clamp(4px, 0.7vw, 8px)' }}>
                {grid[cat][ri].map((on, i) => (
                  <button key={i} onClick={() => toggle(ri, i)} aria-label={`${r.label} step ${i + 1}`} style={{
                    width: 'clamp(28px, 4.4vw, 46px)', aspectRatio: '1 / 1', borderRadius: 8, cursor: 'pointer',
                    border: `1px solid ${curStep === i ? '#fff' : (i % 4 === 0 ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.14)')}`,
                    background: on ? color : (curStep === i ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.04)'),
                    boxShadow: on ? `0 0 14px ${color}88` : 'none', transition: 'background 0.08s, border-color 0.08s',
                  }} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom: transport · volume · loops · download */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 14 }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <button style={{ ...btn, display: 'inline-flex', alignItems: 'center', gap: 6 }} onClick={() => (playing ? stop() : start())}>
            {playing ? '■ Stop' : '▶ Play'}
          </button>
          <button style={btn} onClick={() => setGrid(emptyGrid())}>Clear</button>
          <button style={btn} onClick={() => setGrid(demoGrid())}>Demo</button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#fff' }}>
          <span style={{ fontSize: 12, opacity: 0.7, fontWeight: 700 }}>Vol:</span>
          <input type="range" min={0} max={1} step={0.01} value={vol} onChange={e => setVol(Number(e.target.value))} style={{ accentColor: color, width: 120 }} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button style={mini} onClick={() => setLoops(l => Math.max(1, l - 1))}>−</button>
          <span style={{ ...mini, textAlign: 'center' }}>{loops} loop{loops > 1 ? 's' : ''}</span>
          <button style={mini} onClick={() => setLoops(l => Math.min(8, l + 1))}>+</button>

          {/* Download → opens an options popup above the button */}
          <div ref={menuRef} style={{ position: 'relative', marginLeft: 6 }}>
            <button onClick={() => setShowMenu(v => !v)} style={{ ...btn, background: '#2f7d4f', borderColor: '#2f7d4f' }}>
              ⭳ Download
            </button>

            <AnimatePresence>
              {showMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                  style={{
                    position: 'absolute', bottom: 'calc(100% + 12px)', right: 0, width: 234,
                    background: '#17171d', border: '1px solid rgba(255,255,255,0.14)', borderRadius: 14,
                    padding: 14, boxShadow: '0 18px 44px rgba(0,0,0,0.55)', zIndex: 10,
                    display: 'flex', flexDirection: 'column', gap: 12,
                  }}
                >
                  {[
                    ['Format', (
                      <select value={fmt} onChange={e => changeFmt(e.target.value)} style={{ ...sel, width: 120 }} aria-label="Format">
                        <option value="wav">WAV</option>
                        <option value="mp3">MP3</option>
                      </select>
                    )],
                    ['Quality', (
                      <select value={rate} onChange={e => setRate(Number(e.target.value))} style={{ ...sel, width: 120 }} aria-label="Sample rate">
                        {rates.map(r => <option key={r} value={r}>{khzLabel(r)}</option>)}
                      </select>
                    )],
                    ...(fmt === 'mp3' ? [['Bitrate', (
                      <select value={kbps} onChange={e => setKbps(Number(e.target.value))} style={{ ...sel, width: 120 }} aria-label="Bitrate">
                        {[128, 192, 320].map(b => <option key={b} value={b}>{b} kbps</option>)}
                      </select>
                    )]] : []),
                  ].map(([label, control]) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                      <span style={{ fontSize: 12, color: '#fff', opacity: 0.7, fontWeight: 600 }}>{label}</span>
                      {control}
                    </div>
                  ))}

                  <button
                    onClick={() => { setShowMenu(false); download() }}
                    disabled={rendering}
                    style={{ ...btn, background: '#2f7d4f', borderColor: '#2f7d4f', width: '100%', textAlign: 'center', opacity: rendering ? 0.6 : 1, marginTop: 2 }}
                  >
                    {rendering ? 'Rendering…' : `⭳ Download ${fmt.toUpperCase()}`}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
      </div>
    </div>
  )
}

export default function BeatMakerLauncher() {
  const [open, setOpen] = useState(false)
  const [hintOn, dismissBeatHint] = useHint('beat')

  const openIt = async () => {
    dismissBeatHint()
    setOpen(true)
    try { await document.documentElement.requestFullscreen?.() } catch { /* CSS overlay fallback */ }
    try { await window.screen?.orientation?.lock?.('landscape') } catch { /* unsupported (iOS) */ }
  }
  const closeIt = useCallback(async () => {
    try { window.screen?.orientation?.unlock?.() } catch { /* noop */ }
    try { if (document.fullscreenElement) await document.exitFullscreen?.() } catch { /* noop */ }
    setOpen(false)
  }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') closeIt() }
    const onFs = () => { if (!document.fullscreenElement) setOpen(false) }
    document.addEventListener('keydown', onKey)
    document.addEventListener('fullscreenchange', onFs)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('fullscreenchange', onFs)
      document.body.style.overflow = prev
    }
  }, [open, closeIt])

  return (
    <>
      <style>{`
        .bm-launch{position:relative;overflow:hidden;display:inline-flex;align-items:center;gap:16px;
          padding:9px 24px 9px 18px;border-radius:12px;cursor:pointer;
          border:1px solid rgba(34,211,238,.5);background:#0b0a12;
          box-shadow:0 0 22px rgba(34,211,238,.22),inset 0 0 22px rgba(34,211,238,.06);
          transition:box-shadow .35s ease,border-color .35s ease}
        .bm-launch:hover{border-color:rgba(255,255,255,.45);box-shadow:0 0 36px rgba(139,92,246,.55)}
        .bm-oil{position:absolute;inset:0;opacity:0;transition:opacity .4s ease;
          background:linear-gradient(115deg,#22d3ee,#8b5cf6,#ec4899,#f59e0b,#34d399,#22d3ee);
          background-size:320% 320%;animation:bm-flow 6s linear infinite}
        .bm-launch:hover .bm-oil{opacity:.9}
        .bm-bars{position:relative;z-index:1;display:flex;align-items:center;gap:3.5px;height:30px}
        .bm-bars b{width:4px;border-radius:3px;height:8px;
          background:linear-gradient(180deg,#67e8f9,#0891b2);animation:bm-wv 1.1s ease-in-out infinite}
        .bm-launch:hover .bm-bars b{background:linear-gradient(180deg,#fff,rgba(255,255,255,.75))}
        .bm-bars b:nth-child(1){animation-duration:.9s}
        .bm-bars b:nth-child(2){animation-delay:.15s}
        .bm-bars b:nth-child(3){animation-delay:.3s;animation-duration:.8s}
        .bm-bars b:nth-child(4){animation-delay:.1s}
        .bm-bars b:nth-child(5){animation-delay:.35s;animation-duration:1s}
        .bm-bars b:nth-child(6){animation-delay:.2s}
        .bm-bars b:nth-child(7){animation-delay:.05s;animation-duration:.85s}
        .bm-text{position:relative;z-index:1;display:flex;flex-direction:column;line-height:1.05;
          font-weight:800;letter-spacing:.16em;font-size:1rem}
        .bm-text .t1{color:#e6feff}
        .bm-text .t2{color:#22d3ee}
        .bm-launch:hover .bm-text .t1,.bm-launch:hover .bm-text .t2{color:#fff}
        @keyframes bm-flow{0%{background-position:0% 50%}100%{background-position:320% 50%}}
        @keyframes bm-wv{0%,100%{height:7px}50%{height:30px}}
        @media (prefers-reduced-motion:reduce){.bm-oil,.bm-bars b{animation:none}}
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24, position: 'relative' }}>
        <InteractiveHint
          show={hintOn}
          label="🎹 Tap to make a beat"
          style={{ bottom: 'calc(100% + 10px)', left: '50%', transform: 'translateX(-50%)' }}
        />
        <motion.button className="bm-launch" onClick={openIt} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} aria-label="Open Beat Maker">
          <span className="bm-oil" aria-hidden="true" />
          <span className="bm-bars" aria-hidden="true"><b /><b /><b /><b /><b /><b /><b /></span>
          <span className="bm-text">
            <span className="t1">BEAT</span>
            <span className="t2">MAKER</span>
          </span>
        </motion.button>
      </div>

      {createPortal(
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
              style={{
                position: 'fixed', inset: 0, zIndex: 3000,
                background: 'radial-gradient(120% 120% at 50% 0%, #1a1822 0%, #0a0a0d 78%)',
                display: 'flex', flexDirection: 'column', padding: 'clamp(16px, 3vw, 34px)',
              }}
            >
              <Sequencer />
              <button
                onClick={closeIt} aria-label="Close Beat Maker"
                style={{
                  position: 'absolute', top: 'clamp(12px, 2.4vw, 22px)', right: 'clamp(12px, 2.4vw, 22px)',
                  width: 42, height: 42, borderRadius: '50%', cursor: 'pointer',
                  border: '1px solid rgba(255,255,255,0.4)', background: 'rgba(0,0,0,0.4)', color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)', zIndex: 5,
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  )
}
