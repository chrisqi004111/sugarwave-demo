import { useState, useEffect } from 'react'

// Lightweight viewport check used to switch to mobile-friendly layouts.
// The app uses inline styles (CSS media queries can't override those), so
// components branch on this hook. Desktop (> maxWidth) is unaffected.
export function useIsMobile(maxWidth = 768) {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.innerWidth <= maxWidth,
  )
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= maxWidth)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [maxWidth])
  return isMobile
}
