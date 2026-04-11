import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

export default function LiveClock() {
  const [time, setTime] = useState(getIST())

  useEffect(() => {
    const interval = setInterval(() => setTime(getIST()), 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.5 }}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        padding: '6px 14px', borderRadius: 999,
        background: 'var(--accent-bg)',
        border: '1px solid var(--accent-border)',
        fontSize: '0.72rem', fontFamily: 'var(--mono)',
        color: 'var(--text)',
      }}
    >
      {/* Pulse dot */}
      <span style={{
        width: 6, height: 6, borderRadius: '50%',
        background: '#34d399',
        boxShadow: '0 0 6px rgba(52,211,153,0.6)',
        animation: 'clockPulse 2s ease-in-out infinite',
      }} />
      <style>{`@keyframes clockPulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(1.3)} }`}</style>

      <span style={{ color: 'var(--text-h)', fontWeight: 600 }}>{time.timeStr}</span>
      <span style={{ opacity: 0.5 }}>IST</span>
      <span style={{ opacity: 0.4 }}>·</span>
      <span style={{ opacity: 0.6 }}>India 🇮🇳</span>
    </motion.div>
  )
}

function getIST() {
  const now = new Date()
  const ist = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))
  const h = ist.getHours()
  const m = String(ist.getMinutes()).padStart(2, '0')
  const s = String(ist.getSeconds()).padStart(2, '0')
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return { timeStr: `${h12}:${m}:${s} ${ampm}` }
}
