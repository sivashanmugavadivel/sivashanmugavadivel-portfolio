import { useState, useEffect } from 'react'

export function usePageLoad() {
  const [isLoading, setIsLoading] = useState(() => {
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
