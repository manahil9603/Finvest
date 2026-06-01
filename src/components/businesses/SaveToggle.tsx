'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/useToast'

interface SaveToggleProps {
  businessId:    string
  initialSaved:  boolean
  isOwn:         boolean
  isLoggedIn:    boolean
  /** Large = profile page variant; small = card variant */
  variant?:      'large' | 'icon'
}

export function SaveToggle({
  businessId,
  initialSaved,
  isOwn,
  isLoggedIn,
  variant = 'large',
}: SaveToggleProps) {
  const [saved,   setSaved]   = useState(initialSaved)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { success, info, error: showError } = useToast()

  if (isOwn) return null

  const toggle = async () => {
    if (!isLoggedIn) {
      info('Sign in required', 'Create a free account to save businesses.')
      router.push('/login')
      return
    }
    setLoading(true)
    try {
      const method = saved ? 'DELETE' : 'POST'
      const res    = await fetch(`/api/users/save/${businessId}`, { method })
      const data   = await res.json()
      if (!res.ok) { showError('Error', data.error); return }
      setSaved(data.data.saved)
      if (data.data.saved) success('Saved!', 'Added to your watchlist.')
      else                 info('Removed', 'Removed from your watchlist.')
    } catch {
      showError('Network error', 'Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (variant === 'icon') {
    return (
      <button
        onClick={toggle}
        disabled={loading}
        aria-label={saved ? 'Remove from saved' : 'Save business'}
        className="w-10 h-10 flex items-center justify-center rounded-2xl transition-all duration-200 disabled:opacity-50"
        style={
          saved
            ? { background: 'rgba(139,92,246,0.18)', color: '#A78BFA', border: '1px solid rgba(139,92,246,0.35)' }
            : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.1)' }
        }
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
        </svg>
      </button>
    )
  }

  // Large variant — full-width button for sidebar
  return (
    <button
      onClick={toggle}
      disabled={loading}
      className="w-full flex items-center justify-center gap-2.5 py-3 rounded-2xl text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-50 disabled:translate-y-0"
      style={
        saved
          ? { background: 'rgba(139,92,246,0.15)', color: '#A78BFA', border: '1px solid rgba(139,92,246,0.35)' }
          : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.1)' }
      }
      aria-label={saved ? 'Remove from watchlist' : 'Save to watchlist'}
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
      </svg>
      {loading ? 'Saving…' : saved ? 'Saved to Watchlist' : 'Save to Watchlist'}
    </button>
  )
}
