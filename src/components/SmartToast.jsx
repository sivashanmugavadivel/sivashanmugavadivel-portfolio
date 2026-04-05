import { useState, useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import { getGreeting } from '../utils/timeGreeting'
import { DESIGNS, STORAGE_KEY } from './ToastDesignPicker'

const SESSION_KEY = 'smart_toast_shown'
const LOADING_DELAY = 4000

export default function SmartToast() {
  const [visible, setVisible] = useState(false)
  const [designId, setDesignId] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? parseInt(saved) : 17
  })

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY)) return
    const t = setTimeout(() => {
      setDesignId(parseInt(localStorage.getItem(STORAGE_KEY) || '17'))
      setVisible(true)
      sessionStorage.setItem(SESSION_KEY, '1')
    }, LOADING_DELAY)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (!visible) return
    const t = setTimeout(() => setVisible(false), 4500)
    return () => clearTimeout(t)
  }, [visible])

  const design = DESIGNS.find(d => d.id === designId) || DESIGNS[0]
  const { Component } = design
  const message = getGreeting() + ' Welcome!'

  return (
    <div style={{ position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)', zIndex: 9999 }}>
      <AnimatePresence>
        {visible && <Component message={message} onDone={() => setVisible(false)} />}
      </AnimatePresence>
    </div>
  )
}
