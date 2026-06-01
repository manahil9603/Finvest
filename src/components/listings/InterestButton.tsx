'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function InterestButton({ listingId, initialHasInterest }: { listingId: string; initialHasInterest: boolean }) {
  const [hasInterest, setHasInterest] = useState(initialHasInterest)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const toggle = async () => {
    setLoading(true)
    try {
      const method = hasInterest ? 'DELETE' : 'POST'
      const res = await fetch('/api/interests', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId }),
      })
      if (res.ok) {
        setHasInterest(!hasInterest)
        router.refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`w-full py-2.5 rounded-lg font-semibold text-sm transition-all border-2
        ${hasInterest
          ? 'border-red-300 text-red-600 hover:bg-red-50'
          : 'border-[#C8A94A] bg-[#C8A94A] text-white hover:bg-[#a8893a]'
        } disabled:opacity-50`}
    >
      {loading ? '…' : hasInterest ? '✓ Interest Shown' : '⭐ Show Interest'}
    </button>
  )
}
