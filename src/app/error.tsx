'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log to an error-reporting service in production
    console.error('[Finvest Error]', error)
  }, [error])

  return (
    <div className="min-h-dvh flex items-center justify-center px-4 py-16">
      <div className="text-center max-w-md">
        {/* Illustration */}
        <div
          className="w-24 h-24 rounded-3xl flex items-center justify-center text-5xl mx-auto mb-6"
          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}
        >
          ⚠️
        </div>

        <h1 className="font-display font-black text-2xl text-foreground mb-3">
          Something went wrong
        </h1>

        <p className="text-fg-2 text-sm leading-relaxed mb-2">
          {error.message || 'An unexpected error occurred. Please try again or contact support if the problem persists.'}
        </p>

        {error.digest && (
          <p className="font-mono text-[11px] text-fg-3 mb-6">
            Error ID: {error.digest}
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
          <button
            onClick={reset}
            className="px-6 py-2.5 rounded-2xl text-sm font-semibold text-white transition-all hover:-translate-y-0.5"
            style={{ background: 'linear-gradient(135deg,#6B21A8,#8B5CF6)' }}
          >
            ↻ Try again
          </button>
          <Link
            href="/"
            className="px-6 py-2.5 rounded-2xl text-sm font-semibold text-fg-2 hover:text-foreground transition-colors"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            ← Go home
          </Link>
        </div>
      </div>
    </div>
  )
}
