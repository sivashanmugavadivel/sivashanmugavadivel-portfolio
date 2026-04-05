import { useState, useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import { getGreeting } from '../utils/timeGreeting'
import { DESIGNS, STORAGE_KEY, getPositionStyle } from './ToastDesignPicker'

const LOADING_DELAY = 4000

export default function SmartToast() {
  const [visible, setVisible] = useState(false)
  const [designId, setDesignId] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? parseInt(saved) : 17
  })

  useEffect(() => {
    const t = setTimeout(() => {
      setDesignId(parseInt(localStorage.getItem(STORAGE_KEY) || '17'))
      setVisible(true)
    }, LOADING_DELAY)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (!visible) return
    const t = setTimeout(() => setVisible(false), 4500)
    return () => clearTimeout(t)
  }, [visible])

  const design = DESIGNS.find(d => d.id === designId) || DESIGNS[16]
  const { Component, pos } = design
  const message = getGreeting() + ' Welcome!'

  return (
    <div style={getPositionStyle(pos)}>
      <AnimatePresence>
        {visible && <Component message={message} onDone={() => setVisible(false)} />}
      </AnimatePresence>
    </div>
  )
}
