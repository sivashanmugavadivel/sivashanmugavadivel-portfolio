import { useState, useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import { getGreeting } from '../utils/timeGreeting'
import { DESIGNS, STORAGE_KEY, getPositionStyle } from './ToastDesignPicker'

const LOADING_DELAY = 4000

const POSITIVE_THOUGHTS = [
  "Every day is a chance to grow a little more. 🌱",
  "Small steps forward are still progress. 🚶",
  "Your curiosity is your superpower. ✨",
  "The best time to start is always now. ⏳",
  "Great things take time — keep going. 💪",
  "Be the energy you want to attract. 🌟",
  "One good thought can change your whole day. ☀️",
  "You are capable of more than you know. 🚀",
  "Kindness costs nothing and means everything. 💙",
  "Progress, not perfection. 🎯",
]

function randomThought() {
  return POSITIVE_THOUGHTS[Math.floor(Math.random() * POSITIVE_THOUGHTS.length)]
}

export default function SmartToast() {
  const [phase, setPhase] = useState('idle') // idle | welcome | thought | done
  const [designId, setDesignId] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? parseInt(saved) : 17
  })
  const [thought] = useState(randomThought)

  useEffect(() => {
    // Show welcome after loading screen
    const t1 = setTimeout(() => {
      setDesignId(parseInt(localStorage.getItem(STORAGE_KEY) || '17'))
      setPhase('welcome')
    }, LOADING_DELAY)
    return () => clearTimeout(t1)
  }, [])

  useEffect(() => {
    if (phase === 'welcome') {
      // After 6s switch to thought
      const t = setTimeout(() => setPhase('thought'), 6000)
      return () => clearTimeout(t)
    }
    if (phase === 'thought') {
      // After 10s close
      const t = setTimeout(() => setPhase('done'), 10000)
      return () => clearTimeout(t)
    }
  }, [phase])

  const design = DESIGNS.find(d => d.id === designId) || DESIGNS[16]
  const { Component, pos } = design

  const message = phase === 'welcome'
    ? getGreeting() + ' Welcome!'
    : thought

  return (
    <div style={getPositionStyle(pos)}>
      <AnimatePresence mode="wait">
        {(phase === 'welcome' || phase === 'thought') && (
          <Component
            key={phase}
            message={message}
            onDone={() => setPhase(phase === 'welcome' ? 'thought' : 'done')}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
