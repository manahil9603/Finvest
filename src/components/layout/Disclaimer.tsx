'use client'

import { useState } from 'react'

/** Dismissable top-of-page disclaimer banner */
export function Disclaimer() {
  const [dismissed, setDismissed] = useState(false)
  if (dismissed) return null

  return (
    <div
      role="note"
      aria-label="Legal disclaimer"
      className="legal-strip relative flex items-center justify-center gap-3 px-8 py-2.5 text-xs text-center leading-relaxed"
    >
      <span className="shrink-0" aria-hidden="true">⚠</span>
      <span>
        <strong className="font-semibold">Legal Notice: </strong>
        Finvest only facilitates connections between parties. We do not provide financial advice,
        handle funds, or guarantee any transactions or investments. Users are solely responsible
        for their own due diligence.
      </span>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="disclaimer-dismiss absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-colors"
        aria-label="Dismiss disclaimer"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>
  )
}

/** Static disclaimer for use inside the Footer — not dismissable */
export function DisclaimerFooter() {
  return (
    <div
      className="px-4 py-4 text-center text-xs leading-relaxed"
      style={{
        background: 'rgba(245,158,11,0.08)',
        borderTop: '1px solid rgba(245,158,11,0.15)',
        color: 'rgba(253,186,116,0.75)',
      }}
    >
      <span className="font-semibold text-amber-400">⚠ Legal Disclaimer: </span>
      Finvest only facilitates connections between parties. We do not provide financial advice,
      handle funds, or guarantee any transactions or investments. Users are solely responsible
      for their own due diligence. All financial figures are self-reported by listing owners
      and have not been independently verified by Finvest.
    </div>
  )
}
