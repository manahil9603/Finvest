'use client'

import { Suspense, useState, FormEvent } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Disclaimer } from '@/components/layout/Disclaimer'
import { getPasswordStrength } from '@/lib/validation'

function EyeIcon({ off }: { off?: boolean }) {
  return off ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <line x1="1" y1="1" x2="23" y2="23" />
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function ResetPasswordForm() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const token        = searchParams.get('token') ?? ''

  const [password, setPassword]             = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPw, setShowPw]                 = useState(false)
  const [showCpw, setShowCpw]               = useState(false)
  const [error, setError]                   = useState('')
  const [loading, setLoading]               = useState(false)

  const strength = password ? getPasswordStrength(password) : null

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (!token) {
      setError('Invalid reset link. Request a new one from the forgot password page.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
      setError('Password must include uppercase, lowercase, and a number.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body:    JSON.stringify({ token, password, confirmPassword }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Reset failed')
        return
      }
      router.push(data.redirect ?? '/login')
      router.refresh()
    } catch {
      setError('Network error — please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="text-center">
        <p className="text-fg-2 text-sm mb-6" role="alert">
          This reset link is missing or invalid.
        </p>
        <Link href="/forgot-password" className="font-semibold" style={{ color: 'rgb(139,92,246)' }}>
          Request a new reset link
        </Link>
      </div>
    )
  }

  return (
    <>
      {error && (
        <div className="mb-5 px-4 py-3 rounded-2xl text-sm"
             style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#FCA5A5' }}
             role="alert">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <div>
          <label htmlFor="password" className="label">New password</label>
          <div className="relative">
            <input
              id="password"
              type={showPw ? 'text' : 'password'}
              className="input pr-11"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              required
              disabled={loading}
            />
            <button type="button" onClick={() => setShowPw(!showPw)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-fg-3 p-1"
                    tabIndex={-1} aria-label={showPw ? 'Hide password' : 'Show password'}>
              <EyeIcon off={showPw} />
            </button>
          </div>
          {strength && password && (
            <p className="mt-1.5 text-xs" style={{ color: strength.color }}>
              Strength: {strength.label}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="confirmPassword" className="label">Confirm new password</label>
          <div className="relative">
            <input
              id="confirmPassword"
              type={showCpw ? 'text' : 'password'}
              className="input pr-11"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              required
              disabled={loading}
            />
            <button type="button" onClick={() => setShowCpw(!showCpw)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-fg-3 p-1"
                    tabIndex={-1} aria-label={showCpw ? 'Hide password' : 'Show password'}>
              <EyeIcon off={showCpw} />
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !password || !confirmPassword}
          className="w-full py-3 rounded-2xl font-semibold text-sm text-white disabled:opacity-50"
          style={{
            background: 'linear-gradient(135deg, #6B21A8, #8B5CF6)',
            boxShadow: '0 4px 15px rgba(107,33,168,0.4)',
          }}
        >
          {loading ? 'Updating…' : 'Update password'}
        </button>
      </form>
    </>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-dvh flex flex-col">
      <Disclaimer />
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <Link href="/" className="inline-flex items-center gap-2.5 mb-8">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                   style={{ background: 'linear-gradient(135deg, #6B21A8, #8B5CF6)' }}>
                <span className="font-black text-white text-lg">F</span>
              </div>
              <span className="font-display font-black text-2xl tracking-tight text-foreground">Finvest</span>
            </Link>
            <h1 className="font-display font-black text-3xl text-foreground mb-1">Set a new password</h1>
            <p className="text-fg-2 text-sm">Choose a strong password for your account.</p>
          </div>

          <Suspense fallback={<p className="text-center text-fg-3 text-sm">Loading…</p>}>
            <ResetPasswordForm />
          </Suspense>

          <p className="text-center text-sm text-fg-2 mt-8">
            <Link href="/login" className="font-semibold" style={{ color: 'rgb(139,92,246)' }}>
              ← Back to sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
