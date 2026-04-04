import { useState, useEffect } from 'react'

export function usePageLoad() {
  const [isLoading, setIsLoading] = useState(() => {
    const hasSpaRedirect = !!sessionStorage.getItem('spa_redirect')
    const hasLoaded = !!sessionStorage.getItem('portfolio_loaded')
    const result = !hasSpaRedirect && !hasLoaded
    console.log('[usePageLoad] spa_redirect:', hasSpaRedirect, '| portfolio_loaded:', hasLoaded, '| isLoading:', result)
    return result
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
