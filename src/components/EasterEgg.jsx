import { useState, useEffect, useCallback } from 'react'
import { AnimatePresence } from 'framer-motion'
import { DESIGNS, STORAGE_KEY, getPositionStyle } from './ToastDesignPicker'

const MESSAGES = {
  name:        "Hey, you found me! 😄",
  doubleClick: "Whoa, curious one aren't you? 🕵️",
  secret:      "You know the password 🔐 Welcome, insider!",
}

export default function EasterEgg() {
  const [toast, setToast] = useState(null)
  const keyBuffer = { current: '' }

  const trigger = useCallback((type) => {
    setToast({ msg: MESSAGES[type], id: Date.now() })
    setTimeout(() => setToast(null), 4500)
  }, [])

  /* Name click via custom event from Home.jsx */
  useEffect(() => {
    const handler = () => trigger('name')
    window.addEventListener('easter-egg', handler)
    return () => window.removeEventListener('easter-egg', handler)
  }, [trigger])

  /* Double-click background */
  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
      // Ignore double-clicks on SVG/map elements (country clicks on the map)
      if (e.target.closest('svg')) return
      trigger('doubleClick')
    }
    window.addEventListener('dblclick', handler)
    return () => window.removeEventListener('dblclick', handler)
  }, [trigger])

  /* Type "siva" anywhere */
  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
      keyBuffer.current = (keyBuffer.current + e.key).slice(-4).toLowerCase()
      if (keyBuffer.current === 'siva') {
        keyBuffer.current = ''
        trigger('secret')
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [trigger])

  const designId = parseInt(localStorage.getItem(STORAGE_KEY) || '17')
  const design = DESIGNS.find(d => d.id === designId) || DESIGNS[16]
  const { Component, pos } = design

  return (
    <div style={getPositionStyle(pos)}>
      <AnimatePresence>
        {toast && (
          <Component
            key={toast.id}
            message={toast.msg}
            onDone={() => setToast(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
