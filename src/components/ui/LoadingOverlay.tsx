'use client'

import { useEffect } from 'react'

const SCROLL_LOCK_CLASS = 'finvest-scroll-lock'

/**
 * Full-screen dimmed backdrop with a centered spinner (no visible text).
 * Used for route transitions and long-running client actions.
 */
export function LoadingOverlay({
  active,
  label = 'Loading',
}: {
  active: boolean
  /** Screen-reader only; not shown visually */
  label?: string
}) {
  useEffect(() => {
    if (!active) return
    document.body.classList.add(SCROLL_LOCK_CLASS)
    return () => {
      document.body.classList.remove(SCROLL_LOCK_CLASS)
      document.body.style.overflow = ''
      document.documentElement.style.overflow = ''
    }
  }, [active])

  if (!active) return null

  return (
    <div
      className="fixed inset-0 z-[9998] flex items-center justify-center"
      style={{ background: 'rgba(0, 0, 0, 0.48)' }}
      aria-live="polite"
      aria-busy="true"
      role="status"
      aria-label={label}
    >
      <span className="sr-only">{label}</span>
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center"
        style={{
          background: 'linear-gradient(135deg, #6B21A8, #8B5CF6)',
          boxShadow: '0 8px 32px rgba(107, 33, 168, 0.45)',
        }}
        aria-hidden="true"
      >
        <svg
          className="animate-spin w-7 h-7 text-white"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-90"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      </div>
    </div>
  )
}
