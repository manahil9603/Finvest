'use client'

import { useEffect } from 'react'

/** Scrolls to the listed businesses section 4s after the home page loads. */
export function HomeAutoScroll() {
  useEffect(() => {
    const timer = window.setTimeout(() => {
      document.getElementById('listed-businesses')?.scrollIntoView({
        behavior: 'smooth',
        block:    'start',
      })
    }, 4000)

    return () => window.clearTimeout(timer)
  }, [])

  return null
}
