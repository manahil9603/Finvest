'use client'

/**
 * Root-level error boundary.
 * Catches errors that originate in the root layout itself.
 * Must include its own <html> and <body> because the root layout
 * is unavailable when this renders.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body style={{ background: '#0F0F0F', color: '#F9FAFB', fontFamily: 'system-ui, sans-serif', margin: 0 }}>
        <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
          <div style={{ textAlign: 'center', maxWidth: '480px' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '1.5rem' }}>💥</div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 900, marginBottom: '0.75rem' }}>
              Critical error
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '2rem' }}>
              Something went seriously wrong with Finvest. Our team has been notified.
              {error.digest && (
                <span style={{ display: 'block', marginTop: '0.5rem', fontFamily: 'monospace', fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)' }}>
                  Error ID: {error.digest}
                </span>
              )}
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                onClick={reset}
                style={{ padding: '0.75rem 1.5rem', borderRadius: '0.75rem', background: 'linear-gradient(135deg,#6B21A8,#8B5CF6)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem' }}
              >
                Try again
              </button>
              <a
                href="/"
                style={{ padding: '0.75rem 1.5rem', borderRadius: '0.75rem', background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.15)', textDecoration: 'none', fontWeight: 600, fontSize: '0.875rem' }}
              >
                Go home
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
