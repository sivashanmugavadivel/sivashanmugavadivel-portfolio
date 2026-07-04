import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion'
import cfg from '../data/config.json'
import InteractiveHint from './InteractiveHint'
import { useHint } from '../hooks/useOnboarding'

/*
 * SocialFAB — floating "follow me" button, fixed to the bottom-right corner on
 * every page. Click (or hover) the FAB and the social icons fan out in a
 * quarter-arc up-and-left with a subtle mouse-attraction parallax.
 *
 * WhatsApp is the first icon and behaves specially (inspired by the Framer
 * "WhatsApp Quick Message" component): an intro bubble invites a chat, and
 * hovering/tapping it opens a typeable box that sends the message to WhatsApp.
 */

// wa.me base link (with country code), e.g. https://wa.me/918667451118
const WA_HREF = cfg.whatsapp?.href || ''

// ── Platform definitions (order = fan order, WhatsApp first) ───────────
// depth: parallax layering (1 = near, 0.1 = far). type 'chat' = WhatsApp box.
const PLATFORMS = [
  {
    key: 'whatsapp',
    label: 'WhatsApp',
    color: '#25D366',
    depth: 1,
    type: 'chat',
    icon: (s) => (
      <svg viewBox="0 0 24 24" width={s} height={s} fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
      </svg>
    ),
  },
  {
    key: 'instagram',
    label: 'Instagram',
    tagline: '📸 Peek my world',
    color: '#E4405F',
    depth: 0.85,
    href: cfg.social.instagram?.href,
    icon: (s) => (
      <svg viewBox="0 0 24 24" width={s} height={s} fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>
    ),
  },
  {
    key: 'facebook',
    label: 'Facebook',
    tagline: "👍 Let's connect",
    color: '#1877F2',
    depth: 0.7,
    href: cfg.social.facebook?.href,
    icon: (s) => (
      <svg viewBox="0 0 24 24" width={s} height={s} fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
  {
    key: 'twitter',
    label: 'X / Twitter',
    tagline: '💬 Catch my takes',
    color: '#000000',
    depth: 0.55,
    href: cfg.social.twitter?.href,
    icon: (s) => (
      <svg viewBox="0 0 24 24" width={s} height={s} fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    key: 'linkedin',
    label: 'LinkedIn',
    tagline: "🤝 Let's network",
    color: '#0A66C2',
    depth: 0.7,
    href: cfg.social.linkedin?.href,
    icon: (s) => (
      <svg viewBox="0 0 24 24" width={s} height={s} fill="currentColor">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
  },
].filter((p) => (p.type === 'chat' ? WA_HREF : p.href)) // drop platforms with no link

// ── Geometry (bottom-right corner → fan up & to the left, 180°→270°) ──
const ARC_START = 180
const ARC_SWEEP = 90

function NavItem({ platform, index, total, isOpen, origin, spread, itemSize, iconSize, springX, springY, parallaxStrength, onActivate, isOtherHovered, onHover, onHoverEnd }) {
  const angleStep = total > 1 ? ARC_SWEEP / (total - 1) : 0
  const angle = ARC_START + angleStep * index
  const rad = (angle * Math.PI) / 180
  const targetX = Math.cos(rad) * spread
  const targetY = Math.sin(rad) * spread

  // Attraction parallax: icon eases toward the cursor from its orbit position.
  const parallaxX = useTransform(springX, (mx) => (mx - targetX) * platform.depth * parallaxStrength * 0.1)
  const parallaxY = useTransform(springY, (my) => (my - targetY) * platform.depth * parallaxStrength * 0.1)

  const scale = 0.9 + platform.depth * 0.1
  const shadow = `0 ${Math.round(platform.depth * 10)}px ${8 + platform.depth * 16}px rgba(0,0,0,${0.15 + platform.depth * 0.2})`

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          style={{
            position: 'absolute',
            left: origin - itemSize / 2,
            top: origin - itemSize / 2,
            zIndex: Math.round(platform.depth * 10) + 1,
            pointerEvents: 'auto',
          }}
          initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
          animate={{ x: targetX, y: targetY, scale, opacity: 1 }}
          exit={{ x: 0, y: 0, scale: 0, opacity: 0, transition: { type: 'spring', stiffness: 350, damping: 24, delay: (total - 1 - index) * 0.04 } }}
          transition={{ type: 'spring', stiffness: 350, damping: 24, delay: index * 0.06 }}
        >
          <motion.div
            style={{ x: parallaxX, y: parallaxY }}
            animate={{
              filter: isOtherHovered ? 'blur(1.5px) brightness(0.6)' : 'blur(0px) brightness(1)',
              opacity: isOtherHovered ? 0.65 : 1,
            }}
            transition={{ duration: 0.18, ease: 'easeInOut' }}
          >

            <motion.button
              onClick={() => onActivate(platform)}
              onMouseEnter={onHover}
              onMouseLeave={onHoverEnd}
              whileHover={{ scale: 1.12 }}
              whileTap={{ scale: 0.9 }}
              aria-label={platform.label}
              style={{
                width: itemSize, height: itemSize, borderRadius: '50%',
                background: platform.color,
                border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center',
                justifyContent: 'center', color: '#fff', boxShadow: shadow,
                transition: 'background 0.3s ease', flexShrink: 0,
              }}
            >
              {platform.icon(iconSize)}
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default function SocialFAB() {
  const containerRef = useRef(null)
  const closeTimer = useRef(null)
  const chatOpenRef = useRef(false)
  const [isOpen, setIsOpen] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [hoveredKey, setHoveredKey] = useState(null)
  const [isMobile, setIsMobile] = useState(false)
  const [fabHintOn, dismissFabHint] = useHint('fab')

  useEffect(() => { chatOpenRef.current = chatOpen }, [chatOpen])

  // Sizing / behaviour differs on mobile — isolated so desktop is never affected.
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)')
    const apply = () => setIsMobile(mq.matches)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])

  const fabSize = isMobile ? 46 : 54
  const itemSize = isMobile ? 40 : 44
  const iconSize = Math.round(itemSize * 0.45)
  const spread = isMobile ? 128 : 148
  const parallaxStrength = isMobile ? 0 : 1

  // Box big enough to contain the FAB (bottom-right) + the full fanned arc,
  // so hovering across the icons never leaves the component's hit area.
  const boxSize = spread + itemSize / 2 + fabSize / 2 + 8
  const origin = boxSize - fabSize / 2 // FAB centre (bottom-right of the box)

  const rawMouseX = useMotionValue(0)
  const rawMouseY = useMotionValue(0)
  const springX = useSpring(rawMouseX, { stiffness: 90, damping: 25 })
  const springY = useSpring(rawMouseY, { stiffness: 90, damping: 25 })

  const handleMouseMove = useCallback((e) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    rawMouseX.set(e.clientX - (rect.left + origin))
    rawMouseY.set(e.clientY - (rect.top + origin))
  }, [origin])

  useEffect(() => {
    if (isMobile) return
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [isMobile, handleMouseMove])

  // ── Hover intent — bridge the empty gap between FAB and icons ──
  const cancelClose = useCallback(() => {
    if (closeTimer.current) { clearTimeout(closeTimer.current); closeTimer.current = null }
  }, [])
  const scheduleClose = useCallback(() => {
    if (isMobile) return
    cancelClose()
    closeTimer.current = setTimeout(() => {
      if (chatOpenRef.current) return // keep open while composing a message
      setIsOpen(false)
      setHoveredKey(null)
    }, 220)
  }, [isMobile, cancelClose])

  const open = useCallback(() => { cancelClose(); dismissFabHint(); setIsOpen(true) }, [cancelClose, dismissFabHint])
  const openChat = useCallback(() => { cancelClose(); setIsOpen(true); setChatOpen(true) }, [cancelClose])
  const closeAll = useCallback(() => { cancelClose(); setChatOpen(false); setIsOpen(false); setHoveredKey(null) }, [cancelClose])
  useEffect(() => () => cancelClose(), [cancelClose])

  // Click outside / Escape closes the chat (and the fan).
  useEffect(() => {
    if (!chatOpen) return
    const onDown = (e) => { if (containerRef.current && !containerRef.current.contains(e.target)) closeAll() }
    const onKey = (e) => { if (e.key === 'Escape') closeAll() }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey) }
  }, [chatOpen, closeAll])

  const sendWhatsApp = useCallback(() => {
    const text = message.trim()
    const url = text ? `${WA_HREF}?text=${encodeURIComponent(text)}` : WA_HREF
    window.open(url, '_blank', 'noopener,noreferrer')
    setMessage('')
    closeAll()
  }, [message, closeAll])

  const handleActivate = useCallback((platform) => {
    if (platform.type === 'chat') { openChat(); return }
    window.open(platform.href, '_blank', 'noopener,noreferrer')
    if (isMobile) closeAll()
  }, [openChat, isMobile, closeAll])

  // Invite bubble sits over the WhatsApp icon while the fan is open.
  const showInvite = isOpen && !chatOpen && WA_HREF

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed', right: 28, bottom: 28,
        width: boxSize, height: boxSize, zIndex: 85,
        pointerEvents: 'none', // only the FAB + icons + popups are interactive
      }}
    >
      {/* Invite bubble — to the left of the WhatsApp icon while the fan is open */}
      <div style={{
        position: 'absolute',
        right: fabSize / 2 + spread + itemSize / 2 + 12,
        bottom: fabSize / 2,
        transform: 'translateY(50%)',
        pointerEvents: 'none', zIndex: 30,
      }}>
        <AnimatePresence>
          {showInvite && (
            <motion.div
              initial={{ opacity: 0, x: 8, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 8, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 300, damping: 22, delay: 0.12 }}
              onClick={openChat}
              style={{
                whiteSpace: 'nowrap',
                background: 'var(--card-bg)', color: 'var(--text)', border: '1px solid var(--border)',
                padding: '6px 12px', borderRadius: 16, fontSize: 12.5, fontWeight: 500,
                boxShadow: '0 6px 20px rgba(0,0,0,0.15)', cursor: 'pointer', pointerEvents: 'auto',
              }}
            >
              👋 Hello! Talk to me.
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* WhatsApp chat input — above the FAB */}
      <AnimatePresence>
        {chatOpen && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 320, damping: 24 }}
            onMouseEnter={cancelClose}
            style={{
              position: 'absolute', right: 0, bottom: 0,
              width: isMobile ? 250 : 290, display: 'flex', alignItems: 'center', gap: 8,
              background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 26,
              padding: '6px 6px 6px 8px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)', pointerEvents: 'auto',
            }}
          >
            {/* WhatsApp badge */}
            <div style={{
              width: 30, height: 30, flexShrink: 0, borderRadius: '50%', background: '#25D366',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
            }}>
              <svg viewBox="0 0 24 24" width={16} height={16} fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
              </svg>
            </div>
            <input
              autoFocus
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') sendWhatsApp() }}
              placeholder="Type a message…"
              style={{
                flex: 1, border: 'none', outline: 'none', background: 'transparent',
                color: 'var(--text)', fontSize: 14, fontFamily: 'inherit', minWidth: 0,
              }}
            />
            <motion.button
              onClick={sendWhatsApp}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.9 }}
              aria-label="Send WhatsApp message"
              style={{
                width: 38, height: 38, flexShrink: 0, borderRadius: '50%', border: 'none',
                background: '#25D366', color: '#fff', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Persistent labels — left of each icon (WhatsApp uses its invite bubble) */}
      <AnimatePresence>
        {isOpen && !chatOpen && PLATFORMS.map((platform, i) => {
          if (platform.type === 'chat') return null
          const angleStep = PLATFORMS.length > 1 ? ARC_SWEEP / (PLATFORMS.length - 1) : 0
          const rad = ((ARC_START + angleStep * i) * Math.PI) / 180
          const cx = origin + Math.cos(rad) * spread
          const cy = origin + Math.sin(rad) * spread
          // The topmost icon (LinkedIn) sits directly above the FAB — place its
          // label above the icon; all others sit to the left of their icon.
          const above = platform.key === 'linkedin'
          // Small per-icon nudges for crowded spots (X sits close to the arc).
          const ndx = platform.key === 'twitter' ? 12 : 0
          const ndy = platform.key === 'twitter' ? -10 : 0
          const pos = above
            ? { left: cx, top: cy - itemSize / 2 - 1, transform: 'translate(-100%, -100%)' }
            : { left: cx - itemSize / 2 - 10 + ndx, top: cy + ndy, transform: 'translate(-100%, -50%)' }
          return (
            <div
              key={`lbl-${platform.key}`}
              style={{ position: 'absolute', ...pos, pointerEvents: 'none', zIndex: 30 }}
            >
              <motion.div
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                transition={{ type: 'spring', stiffness: 300, damping: 24, delay: 0.12 + i * 0.03 }}
                style={{
                  whiteSpace: 'nowrap', background: 'var(--card-bg)', color: 'var(--text)',
                  border: '1px solid var(--border)', padding: '5px 11px', borderRadius: 14,
                  fontSize: 12.5, fontWeight: 500, lineHeight: 1.4,
                  boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
                }}
              >
                {platform.tagline || platform.label}
              </motion.div>
            </div>
          )
        })}
      </AnimatePresence>

      {PLATFORMS.map((platform, i) => (
        <NavItem
          key={platform.key}
          platform={platform}
          index={i}
          total={PLATFORMS.length}
          isOpen={isOpen && !chatOpen}
          origin={origin}
          spread={spread}
          itemSize={itemSize}
          iconSize={iconSize}
          springX={springX}
          springY={springY}
          parallaxStrength={parallaxStrength}
          onActivate={handleActivate}
          isOtherHovered={hoveredKey !== null && hoveredKey !== platform.key}
          onHover={() => {
            open()
            setHoveredKey(platform.key)
            if (!isMobile && platform.type === 'chat') openChat()
          }}
          onHoverEnd={() => { setHoveredKey(null); scheduleClose() }}
        />
      ))}

      {/* First-visit hint — above the closed FAB only, so it never collides
          with the fanned icons or the WhatsApp invite bubble */}
      <InteractiveHint
        show={fabHintOn && !isOpen && !chatOpen}
        label="👋 Tap to connect"
        style={{ right: 0, bottom: fabSize + 14 }}
        delay={1.2}
        autoHide={8000}
      />

      {/* Main FAB — hidden while the chat box is open */}
      <AnimatePresence initial={false}>
        {!chatOpen && (
          <motion.button
            onClick={() => { dismissFabHint(); if (isOpen) closeAll(); else setIsOpen(true) }}
            onMouseEnter={!isMobile ? open : undefined}
            onMouseLeave={!isMobile ? scheduleClose : undefined}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1, rotate: isOpen ? 45 : 0 }}
            exit={{ opacity: 0, scale: 0.6 }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 300, damping: 22 }}
            aria-label={isOpen ? 'Close social links' : 'Open social links'}
            style={{
              position: 'absolute',
              left: origin - fabSize / 2,
              top: origin - fabSize / 2,
              width: fabSize, height: fabSize,
              borderRadius: '50%', background: 'var(--accent)', border: 'none',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', zIndex: 20, boxShadow: '0 8px 24px rgba(0,0,0,0.3)', outline: 'none',
              pointerEvents: 'auto',
            }}
          >
            {/* Share / connect glyph */}
            <svg width={fabSize * 0.42} height={fabSize * 0.42} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}
