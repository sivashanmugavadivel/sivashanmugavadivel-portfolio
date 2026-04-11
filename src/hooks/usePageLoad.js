import { useState, useEffect, useCallback } from 'react'

export function usePageLoad() {
  // Phases: wordIntro → loading → done
  const [phase, setPhase] = useState(() => {
    const wasSpaRedirected = !!sessionStorage.getItem('spa_redirected')
    const hasLoaded = !!sessionStorage.getItem('portfolio_loaded')
    if (wasSpaRedirected) {
      sessionStorage.removeItem('spa_redirected')
      return 'done'
    }
    return hasLoaded ? 'done' : 'wordIntro'
  })

  // Set by LoadingScreen when exit animation completes
  const [contentReady, setContentReady] = useState(() => {
    const hasLoaded = !!sessionStorage.getItem('portfolio_loaded')
    const wasSpa = !!sessionStorage.getItem('spa_redirected')
    return hasLoaded || wasSpa
  })

  const onWordIntroComplete = useCallback(() => {
    setPhase('loading')
  }, [])

  const onLoadingExitComplete = useCallback(() => {
    setContentReady(true)
  }, [])

  useEffect(() => {
    if (phase === 'loading') {
      const timer = setTimeout(() => {
        sessionStorage.setItem('portfolio_loaded', '1')
        setPhase('done')
      }, 3500)
      return () => clearTimeout(timer)
    }
  }, [phase])

  return {
    isWordIntro: phase === 'wordIntro',
    isLoading: phase === 'loading',
    contentReady,
    onWordIntroComplete,
    onLoadingExitComplete,
  }
}
