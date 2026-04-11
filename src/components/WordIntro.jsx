import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useRef } from 'react'
import StarfieldCanvas from './StarfieldCanvas'
import cfg from '../data/config.json'

const WORDS = cfg.personal.introWords
const WORD_DELAY = 800

export default function WordIntro({ isVisible, onComplete }) {
  const [index, setIndex] = useState(-1) // -1 = waiting for page ready
  const [ready, setReady] = useState(false)
  const timerRef = useRef(null)

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
      </div>
    </>
  )
}
