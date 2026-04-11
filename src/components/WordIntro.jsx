import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useRef } from 'react'
import StarfieldCanvas from './StarfieldCanvas'
import cfg from '../data/config.json'

const WORDS = cfg.personal.introWords
const WORD_DELAY = 800

function useSmoothProgress(ready, totalDuration) {
  const [pct, setPct] = useState(0)
  const startRef = useRef(null)
  const rafRef = useRef(null)

  useEffect(() => {
    if (!ready) return
    startRef.current = performance.now()

    const tick = () => {
      const elapsed = performance.now() - startRef.current
      const progress = Math.min(elapsed / totalDuration, 1)
      // Ease-in-out for smooth feel
      const eased = progress < 0.5
        ? 2 * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 2) / 2
      setPct(Math.round(eased * 100))
      if (progress < 1) rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [ready, totalDuration])

  return pct
}

export default function WordIntro({ isVisible, onComplete }) {
  const [index, setIndex] = useState(-1) // -1 = waiting for page ready
  const [ready, setReady] = useState(false)
  const timerRef = useRef(null)
  // Total duration = words * delay + buffer for last word exit
  const smoothPct = useSmoothProgress(ready, WORDS.length * WORD_DELAY + 400)

  // Wait for page to fully load before starting
  useEffect(() => {
    if (!isVisible || ready) return

    let started = false
    function start() {
      if (started) return
      started = true
      setReady(true)
      setIndex(0)
    }

    if (document.readyState === 'complete') {
      const t = setTimeout(start, 300)
      return () => clearTimeout(t)
    }

    const onLoad = () => setTimeout(start, 300)
    window.addEventListener('load', onLoad)
    const fallback = setTimeout(start, 1500)

    return () => {
      window.removeEventListener('load', onLoad)
      clearTimeout(fallback)
    }
  }, [isVisible, ready])

  // Advance words once ready
  useEffect(() => {
    if (!ready || !isVisible) return

    timerRef.current = setInterval(() => {
      setIndex(prev => {
        const next = prev + 1
        if (next >= WORDS.length) {
          clearInterval(timerRef.current)
          setTimeout(onComplete, 600)
          return prev
        }
        return next
      })
    }, WORD_DELAY)

    return () => clearInterval(timerRef.current)
  }, [ready, isVisible, onComplete])

  if (!isVisible) return null

  return (
    <>
      <StarfieldCanvas active={isVisible} />
      <div style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(22,20,26,0.85)',
        pointerEvents: 'all',
      }}>
        <AnimatePresence mode="wait">
          {index >= 0 && (
            <motion.div
              key={`word-${index}`}
              initial={{ opacity: 0, scale: 0.3, filter: 'blur(12px)' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 1.6, filter: 'blur(8px)' }}
              transition={{
                duration: 0.4,
                ease: [0.16, 1, 0.3, 1],
                exit: { duration: 0.35, ease: [0.4, 0, 1, 1] },
              }}
              style={{
                fontFamily: "'Sekuya', sans-serif",
                fontSize: 'clamp(3rem, 10vw, 8rem)',
                fontWeight: 700,
                color: '#f3f0ff',
                textShadow: '0 0 40px rgba(167,139,250,0.6), 0 0 80px rgba(124,58,237,0.3)',
                letterSpacing: '0.02em',
                userSelect: 'none',
              }}
            >
              {WORDS[index]}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Progress bar + percentage */}
        {index >= 0 && (
          <div style={{
            position: 'absolute', bottom: '8vh', left: '50%', transform: 'translateX(-50%)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
            width: 'min(280px, 70vw)',
          }}>
            <div style={{
              width: '100%', height: 3, background: 'rgba(167,139,250,0.15)',
              borderRadius: 99, overflow: 'hidden',
            }}>
              <div style={{
                  height: '100%', borderRadius: 99,
                  background: 'linear-gradient(90deg, #7c3aed, #a78bfa)',
                  boxShadow: '0 0 8px rgba(167,139,250,0.5)',
                  width: `${smoothPct}%`,
                  transition: 'width 0.1s linear',
                }}
              />
            </div>
            <span style={{
              fontFamily: 'var(--mono)', fontSize: '0.68rem',
              color: 'rgba(167,139,250,0.6)', letterSpacing: '0.1em',
            }}>
              {smoothPct}%
            </span>
          </div>
        )}
      </div>
    </>
  )
}
