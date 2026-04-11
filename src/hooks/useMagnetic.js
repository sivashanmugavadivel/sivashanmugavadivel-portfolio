import { useRef, useCallback } from 'react'

/**
 * Magnetic effect — element pulls slightly toward cursor when nearby.
 * Usage: const { ref, onMouseMove, onMouseLeave } = useMagnetic(strength)
 * Attach ref to the element, bind onMouseMove/onMouseLeave to it.
 */
export function useMagnetic(strength = 0.3) {
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
    el.style.transition = 'transform 0.2s ease-out'
  }, [strength])

  const onMouseLeave = useCallback(() => {
    const el = ref.current
    if (!el) return
    el.style.transform = 'translate(0, 0)'
    el.style.transition = 'transform 0.4s ease-out'
  }, [])

  return { ref, onMouseMove, onMouseLeave }
}
