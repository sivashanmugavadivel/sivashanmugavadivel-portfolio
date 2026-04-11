import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useConfetti } from '../hooks/useConfetti'

const TYPES = ['Suggestion', 'Bug', 'Compliment', 'Other']

const brown = '#78350f'
const yellow = '#fef08a'

export default function FeedbackPanel({ open, onClose }) {
  const { fire: fireConfetti, canvas: confettiCanvas } = useConfetti()
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [type, setType] = useState('')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState('idle')

  const reset = () => {
    setRating(0); setHoverRating(0); setType(''); setMessage(''); setStatus('idle')
  }

  const handleClose = () => { onClose(); setTimeout(reset, 400) }

  const handleSubmit = async e => {
    e.preventDefault()
    if (!rating || !type || !message.trim()) return
    setStatus('sending')
    try {
      const res = await fetch('https://formspree.io/f/xlgopnra', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ rating: `${rating}/5`, type, message, _subject: `Feedback: ${type}` }),
      })
      if (res.ok) {
        setStatus('success')
        fireConfetti()
        setTimeout(() => { handleClose() }, 2800)
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }
  }

  return (
    <>
    {confettiCanvas}
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={handleClose}
            style={{
              position: 'fixed', inset: 0, zIndex: 95,
              background: 'rgba(0,0,0,0.3)',
            }}
          />

          {/* Post-it Panel */}
          <motion.div
            initial={{ scale: 0.5, rotate: -8, opacity: 0 }}
            animate={{ scale: 1, rotate: -2, opacity: 1 }}
            exit={{ scale: 0.5, rotate: -8, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            style={{
              position: 'fixed',
              top: '50%', left: '50%',
              marginTop: '-220px',
              marginLeft: '-190px',
              width: '380px',
              zIndex: 96,
              background: yellow,
              borderRadius: 4,
              boxShadow: '4px 4px 0 rgba(0,0,0,0.15), 8px 8px 0 rgba(0,0,0,0.08)',
              padding: '28px 24px 24px',
            }}
          >
            {/* Tape strip */}
            <div style={{
              position: 'absolute',
              top: -10, left: '50%',
              transform: 'translateX(-50%)',
              width: 60, height: 20,
              background: 'rgba(255,255,255,0.5)',
              borderRadius: 2,
            }} />

            {/* Close X */}
            <motion.button
              onClick={handleClose}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
              style={{
                position: 'absolute', top: 14, right: 14,
                background: 'none', border: 'none',
                cursor: 'pointer', color: brown,
                fontSize: '1rem', fontWeight: 700,
                fontFamily: 'cursive', lineHeight: 1, padding: 4,
              }}
            >
              ✕
            </motion.button>

            {/* Header */}
            <div style={{
              fontFamily: 'cursive',
              fontSize: '1.5rem', fontWeight: 700,
              color: brown, marginBottom: 16,
              paddingRight: 24,
            }}>
              📝 Drop a Note!
            </div>

            {status === 'success' ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{ textAlign: 'center', padding: '20px 0', color: brown }}
              >
                <div style={{ fontFamily: 'cursive', fontSize: '1.2rem', marginBottom: 8 }}>
                  ✓ Noted! 📌 Thanks!
                </div>
                <div style={{ fontSize: '0.85rem', color: `${brown}aa` }}>
                  Closing in a moment...
                </div>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

                {/* Star rating */}
                <div>
                  <div style={{ fontFamily: 'cursive', fontSize: '0.82rem', color: brown, marginBottom: 6 }}>
                    How'd you like it?
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {[1, 2, 3, 4, 5].map(star => (
                      <motion.button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.85 }}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          padding: 0, fontSize: '1.6rem', lineHeight: 1,
                          color: (hoverRating || rating) >= star ? '#f59e0b' : '#d4d4aa',
                          transition: 'color 0.15s',
                        }}
                      >
                        ★
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Type pills */}
                <div>
                  <div style={{ fontFamily: 'cursive', fontSize: '0.82rem', color: brown, marginBottom: 6 }}>
                    What's this about?
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {TYPES.map(t => (
                      <motion.button
                        key={t}
                        type="button"
                        onClick={() => setType(t)}
                        whileTap={{ scale: 0.95 }}
                        style={{
                          padding: '4px 12px', borderRadius: 999,
                          fontSize: '0.78rem', fontWeight: 500, cursor: 'pointer',
                          fontFamily: 'cursive',
                          border: '1.5px dashed ' + brown,
                          background: type === t ? brown : 'rgba(120,53,15,0.1)',
                          color: type === t ? yellow : brown,
                          transition: 'all 0.18s',
                        }}
                      >
                        {t}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Message */}
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="write here..."
                  rows={3}
                  style={{
                    display: 'block', width: '100%', boxSizing: 'border-box',
                    padding: '8px 4px',
                    fontFamily: 'cursive', fontSize: '0.9rem',
                    color: brown, background: 'rgba(255,255,255,0.4)',
                    border: 'none', borderBottom: `1.5px dashed ${brown}`,
                    borderRadius: 0, outline: 'none', resize: 'vertical',
                  }}
                />

                {/* Submit */}
                <motion.button
                  type="submit"
                  disabled={status === 'sending' || !rating || !type || !message.trim()}
                  whileHover={!(!rating || !type || !message.trim()) ? { scale: 1.03 } : {}}
                  whileTap={!(!rating || !type || !message.trim()) ? { scale: 0.97 } : {}}
                  style={{
                    alignSelf: 'flex-start',
                    padding: '8px 20px', borderRadius: 4,
                    background: brown, color: yellow,
                    fontFamily: 'cursive', fontWeight: 700, fontSize: '0.92rem',
                    border: 'none',
                    cursor: (!rating || !type || !message.trim()) ? 'not-allowed' : 'pointer',
                    opacity: (!rating || !type || !message.trim()) ? 0.5 : 1,
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    transition: 'opacity 0.2s',
                  }}
                >
                  {status === 'sending' ? (
                    <>
                      <motion.span
                        animate={{ rotate: 360 }}
                        transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                        style={{ display: 'inline-block', width: 13, height: 13, border: `2px solid rgba(254,240,138,0.3)`, borderTopColor: yellow, borderRadius: '50%' }}
                      />
                      Dropping…
                    </>
                  ) : 'Drop it! 📌'}
                </motion.button>

                {status === 'error' && (
                  <p style={{ color: '#b45309', fontFamily: 'cursive', fontSize: '0.82rem', margin: 0 }}>
                    Oops! Something went wrong. Try again?
                  </p>
                )}
              </form>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
    </>
  )
}
