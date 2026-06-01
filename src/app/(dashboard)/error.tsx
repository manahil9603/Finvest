'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[Dashboard Error]', error)
  }, [error])

  return (
    <div
      className="rounded-3xl p-10 sm:p-14 text-center"
      style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.18)' }}
      role="alert"
    >
      <div className="text-4xl mb-4">⚠️</div>
      <h2 className="font-display font-bold text-xl text-foreground mb-2">
        Failed to load this section
      </h2>
      <p className="text-fg-2 text-sm mb-1 max-w-sm mx-auto leading-relaxed">
        {error.message || 'Something went wrong. This is likely a temporary issue.'}
      </p>
      {error.digest && (
        <p className="font-mono text-[11px] text-fg-3 mb-5">ID: {error.digest}</p>
      )}
      <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
        <button
          onClick={reset}
          className="px-5 py-2.5 rounded-2xl text-sm font-semibold text-white transition-all hover:-translate-y-0.5"
          style={{ background: 'linear-gradient(135deg,#6B21A8,#8B5CF6)' }}
        >
          ↻ Retry
        </button>
        <Link
          href="/"
          className="px-5 py-2.5 rounded-2xl text-sm font-semibold text-fg-2 hover:text-foreground transition-colors"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)' }}
        >
          ← Home
        </Link>
      </div>
    </div>
  )
}
