import { useRef, useCallback } from 'react'

/**
 * Wrap any element to give it a magnetic pull-toward-cursor effect.
 * <MagneticWrap strength={0.3}><button>Click</button></MagneticWrap>
 */
export default function MagneticWrap({ children, strength = 0.3, style }) {
  const ref = useRef(null)

  const onMouseMove = useCallback((e) => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    const dx = e.clientX - cx
    const dy = e.clientY - cy
    el.style.transform = `translate(${dx * strength}px, ${dy * strength}px)`
    el.style.transition = 'transform 0.15s ease-out'
  }, [strength])

  const onMouseLeave = useCallback(() => {
    const el = ref.current
    if (!el) return
    el.style.transform = 'translate(0, 0)'
    el.style.transition = 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
  }, [])

  return (
    <div
      ref={ref}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      style={{ display: 'inline-block', ...style }}
    >
      {children}
    </div>
  )
}
