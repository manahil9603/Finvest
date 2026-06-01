'use client'

import { Suspense, useState, FormEvent, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Disclaimer } from '@/components/layout/Disclaimer'
import { useLoading } from '@/hooks/useLoading'
import { getRoleRedirect } from '@/lib/constants'

// ── Icons ─────────────────────────────────────────────────────────────────────

function EyeIcon({ off }: { off?: boolean }) {
  return off ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  )
}

// ── Helpers ─────────────────────────────────────────────────────────────────────

/** Accept only same-origin paths; blocks open redirects and empty `?redirect=`. */
function safeInternalRedirect(param: string | null): string | null {
  const s = param?.trim()
  if (!s) return null
  if (!s.startsWith('/') || s.startsWith('//')) return null
  if (s.includes('://')) return null
  return s
}

/** After login: explicit ?redirect wins, then server-provided path, then role default. */
function destinationAfterLogin(
  redirectParam: string | null,
  payload: { redirect?: unknown; data?: { role?: string } },
): string {
  const fromQuery = safeInternalRedirect(redirectParam)
  if (fromQuery) return fromQuery
  if (typeof payload.redirect === 'string' && payload.redirect.startsWith('/') && !payload.redirect.startsWith('//')) {
    return payload.redirect
  }
  const role = payload.data?.role
  if (role) return getRoleRedirect(role)
  return '/'
}

// ── Left panel (desktop) ──────────────────────────────────────────────────────

function LeftPanel() {
  return (
    <div
      className="hidden lg:flex flex-col justify-between p-12 relative overflow-hidden"
      style={{
        background: 'linear-gradient(145deg, #0F0F0F 0%, #1a0533 50%, #0d1f3c 100%)',
        minHeight: '100dvh',
      }}
    >
      {/* Ambient orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl pointer-events-none"
           style={{ background: 'rgba(107,33,168,0.25)' }} />
      <div className="absolute bottom-1/3 right-1/4 w-72 h-72 rounded-full blur-3xl pointer-events-none"
           style={{ background: 'rgba(16,185,129,0.12)' }} />

      {/* Logo */}
      <div className="relative z-10">
        <Link href="/" className="inline-flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
               style={{ background: 'linear-gradient(135deg, #6B21A8, #8B5CF6)' }}>
            <span className="font-black text-white text-lg">F</span>
          </div>
          <span className="font-display font-black text-2xl text-white tracking-tight">Finvest</span>
        </Link>
      </div>

      {/* Main copy */}
      <div className="relative z-10 space-y-8">
        <div>
          <h2 className="font-display font-black text-4xl leading-tight text-white mb-3">
            Pakistan&apos;s SME<br />
            <span style={{ backgroundImage: 'linear-gradient(135deg, #A78BFA, #8B5CF6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              Investment
            </span>{' '}
            Marketplace
          </h2>
          <p className="text-lg leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
            Connect with verified investors, buyers, and entrepreneurs across all 7 provinces — no middlemen, no commission.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { value: '500+', label: 'Businesses Listed' },
            { value: '7',    label: 'Provinces Covered' },
            { value: '15',   label: 'Industries' },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl p-4 text-center"
                 style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="font-display font-black text-2xl"
                   style={{ backgroundImage: 'linear-gradient(135deg, #A78BFA, #10B981)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                {s.value}
              </div>
              <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Testimonial */}
        <div className="rounded-3xl p-5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <p className="text-sm leading-relaxed italic" style={{ color: 'rgba(255,255,255,0.65)' }}>
            &ldquo;Found my Series A investor through Finvest in under two weeks. The platform is exactly what Pakistan&apos;s startup ecosystem needed.&rdquo;
          </p>
          <div className="flex items-center gap-3 mt-4">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold text-white"
                 style={{ background: 'linear-gradient(135deg, #6B21A8, #8B5CF6)' }}>A</div>
            <div>
              <p className="text-sm font-semibold text-white">Ahmed Khan</p>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Founder, TJ Mart</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom */}
      <p className="relative z-10 text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>
        🇵🇰 Built for Pakistan · Not SECP regulated
      </p>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

function LoginContent() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const redirectTo   = searchParams.get('redirect')
  const { startLoading, stopLoading } = useLoading()

  const [email,       setEmail]       = useState('')
  const [password,    setPassword]    = useState('')
  const [showPw,      setShowPw]      = useState(false)
  const [error,       setError]       = useState('')
  const [loading,     setLoading]     = useState(false)
  const [showDemo,    setShowDemo]    = useState(false)

  // If already logged in, send them away from the login screen
  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' }).then((r) => {
      if (!r.ok) return
      r.json().then((body: { data?: { role?: string } }) => {
        if (!body.data?.role) return
        const dest = destinationAfterLogin(redirectTo, { data: { role: body.data.role } })
        router.replace(dest)
      })
    })
  }, [router, redirectTo])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    startLoading()
    let navigating = false
    try {
      const res = await fetch('/api/auth/login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body:    JSON.stringify({ email: email.trim().toLowerCase(), password }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Login failed')
        return
      }

      const dest = destinationAfterLogin(redirectTo, data)
      navigating = true
      router.push(dest)
      router.refresh()
    } catch {
      setError('Network error — please try again.')
    } finally {
      setLoading(false)
      if (!navigating) stopLoading()
    }
  }

  const fillDemo = (email: string, pw: string) => {
    setEmail(email)
    setPassword(pw)
    setShowDemo(false)
  }

  return (
    <div className="min-h-dvh flex flex-col">
      <Disclaimer />
      <div className="flex-1 grid lg:grid-cols-2">
        <LeftPanel />

        {/* ── Right: Form ─────────────────────────────────── */}
        <div className="flex flex-col items-center justify-center px-6 py-12 lg:px-16">
          {/* Mobile logo */}
          <div className="lg:hidden mb-10 text-center">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                   style={{ background: 'linear-gradient(135deg, #6B21A8, #8B5CF6)' }}>
                <span className="font-black text-white text-lg">F</span>
              </div>
              <span className="font-display font-black text-2xl tracking-tight"
                    style={{ backgroundImage: 'linear-gradient(135deg, #A78BFA, #8B5CF6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                Finvest
              </span>
            </Link>
          </div>

          <div className="w-full max-w-md">
            <div className="mb-8">
              <h1 className="font-display font-black text-3xl text-foreground mb-1">
                Welcome back
              </h1>
              <p className="text-fg-2 text-sm">Sign in to your Finvest account</p>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-5 flex items-center gap-3 px-4 py-3 rounded-2xl text-sm"
                   style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#FCA5A5' }}
                   role="alert">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="shrink-0" aria-hidden="true">
                  <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              {/* Email */}
              <div>
                <label htmlFor="email" className="label">Email address</label>
                <input
                  id="email"
                  type="email"
                  className="input"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                  disabled={loading}
                />
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="password" className="label mb-0">Password</label>
                  <Link href="/forgot-password"
                        className="text-xs font-medium transition-colors"
                        style={{ color: 'rgba(139,92,246,0.8)' }}
                        tabIndex={-1}>
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    type={showPw ? 'text' : 'password'}
                    className="input pr-11"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-fg-3 hover:text-foreground transition-colors p-1"
                    aria-label={showPw ? 'Hide password' : 'Show password'}
                    tabIndex={-1}
                  >
                    <EyeIcon off={showPw} />
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || !email || !password}
                className="w-full py-3 rounded-2xl font-semibold text-sm text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: 'linear-gradient(135deg, #6B21A8, #8B5CF6)',
                  boxShadow: '0 4px 15px rgba(107,33,168,0.4)',
                }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    Signing in…
                  </span>
                ) : 'Sign in →'}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-7">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }} />
              </div>
              <div className="relative flex justify-center">
                <span className="px-3 text-xs text-fg-3 bg-background">or</span>
              </div>
            </div>

            {/* Links */}
            <p className="text-center text-sm text-fg-2">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="font-semibold transition-colors"
                    style={{ color: 'rgb(139,92,246)' }}>
                Create one free
              </Link>
            </p>

            {/* Demo accounts */}
            <div className="mt-6">
              <button
                type="button"
                onClick={() => setShowDemo(!showDemo)}
                className="w-full text-xs text-fg-3 hover:text-fg-2 py-2 transition-colors"
              >
                {showDemo ? '▲' : '▼'} Demo accounts
              </button>
              {showDemo && (
                <div className="mt-2 rounded-2xl overflow-hidden"
                     style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  {[
                    { role: 'Business Owner', email: 'ahmed@finvest.pk',    pw: 'Owner@123!' },
                    { role: 'Investor',       email: 'sara@finvest.pk',     pw: 'Investor@123!' },
                    { role: 'Buyer',          email: 'omar@finvest.pk',     pw: 'Buyer@123!' },
                    { role: 'Admin',          email: 'admin@finvest.pk',    pw: 'Admin@123!' },
                  ].map((d) => (
                    <button
                      key={d.email}
                      type="button"
                      onClick={() => fillDemo(d.email, d.pw)}
                      className="w-full flex items-center justify-between px-4 py-3 text-xs hover:bg-surface/10 transition-colors text-left"
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                    >
                      <span className="text-fg-2">{d.role}</span>
                      <span className="text-fg-3 font-mono">{d.email}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-background" />}>
      <LoginContent />
    </Suspense>
  )
}
