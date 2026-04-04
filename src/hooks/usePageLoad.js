import { useState, useEffect } from 'react'

export function usePageLoad() {
  const [isLoading, setIsLoading] = useState(() => {
    // Skip loading screen if this is a SPA redirect (direct URL navigation)
    if (sessionStorage.getItem('spa_redirect')) return false
    return !sessionStorage.getItem('portfolio_loaded')
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
