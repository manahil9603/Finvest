'use client'

import { useState, FormEvent } from 'react'
import Link from 'next/link'
import { Disclaimer } from '@/components/layout/Disclaimer'

export default function ForgotPasswordPage() {
  const [email, setEmail]       = useState('')
  const [error, setError]       = useState('')
  const [success, setSuccess]   = useState('')
  const [loading, setLoading]   = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: email.trim().toLowerCase() }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Request failed')
        return
      }
      setSuccess(data.message ?? 'Check your email for reset instructions.')
    } catch {
      setError('Network error — please try again.')
    } finally {
      setLoading(false)
    }
  }

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
            <h1 className="font-display font-black text-3xl text-foreground mb-1">Forgot password?</h1>
            <p className="text-fg-2 text-sm">
              Enter your email and we&apos;ll send you a link to reset your password.
            </p>
          </div>

          {error && (
            <div className="mb-5 flex items-center gap-3 px-4 py-3 rounded-2xl text-sm"
                 style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#FCA5A5' }}
                 role="alert">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-5 px-4 py-3 rounded-2xl text-sm"
                 style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', color: '#6EE7B7' }}
                 role="status">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
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
                disabled={loading || !!success}
              />
            </div>

            <button
              type="submit"
              disabled={loading || !email || !!success}
              className="w-full py-3 rounded-2xl font-semibold text-sm text-white transition-all disabled:opacity-50"
              style={{
                background: 'linear-gradient(135deg, #6B21A8, #8B5CF6)',
                boxShadow: '0 4px 15px rgba(107,33,168,0.4)',
              }}
            >
              {loading ? 'Sending…' : 'Send reset link'}
            </button>
          </form>

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
