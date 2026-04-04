import { useState, useEffect } from 'react'

export function usePageLoad() {
  const [isLoading, setIsLoading] = useState(() => {
    const wasSpaRedirected = !!sessionStorage.getItem('spa_redirected')
    const hasLoaded = !!sessionStorage.getItem('portfolio_loaded')
    // Skip loading screen if arriving via SPA redirect (direct URL navigation on GitHub Pages)
    if (wasSpaRedirected) {
      sessionStorage.removeItem('spa_redirected')
      return false
    }
    return !hasLoaded
  })

  useEffect(() => {
    if (isLoading) {
      // Mark as loaded after intro completes (3.5s total animation)
      const timer = setTimeout(() => {
        sessionStorage.setItem('portfolio_loaded', '1')
        setIsLoading(false)
      }, 3500)
      return () => clearTimeout(timer)
    }
  }, [isLoading])

  return isLoading
}
